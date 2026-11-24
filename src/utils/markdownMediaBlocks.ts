import type { Element, ElementContent, Root } from 'hast';
import { defaultUrlTransform } from 'react-markdown';
import { getMediaType } from './markdownUtils';

export function mediaUrlTransform(url: string, key: string): string {
  const media = /^(audio|video|image):(.+)$/i.exec(url);
  if (!media || key !== 'href') return defaultUrlTransform(url);
  // Custom wrappers do not bypass react-markdown's safety check for their
  // underlying URL (including nested javascript:, data: and custom schemes).
  return defaultUrlTransform(media[2]) ? url : '';
}

/** Links the renderer turns into inline gallery buttons: an accepted image:/video:/audio: href. */
function isGalleryLink(href: unknown): boolean {
  return typeof href === 'string' && /^(audio|video|image):/i.test(href) && mediaUrlTransform(href, 'href') !== '';
}

// `inner` records the split contents of a link lifted out of a paragraph, so
// formatting around the link can still be applied to its text.
type Part = { media: boolean; nodes: ElementContent[]; inner?: Part[] };

// Formatting that renders nothing visible when it wraps only whitespace.
const FORMATTING = new Set(['em', 'strong', 'del', 'span']);
const HEADING = /^h[1-6]$/;
// Tight list items and table cells hold phrasing content without a paragraph.
const UNWRAPPED_PHRASING_CONTAINERS = new Set(['li', 'td', 'th']);
const PHRASING = new Set(['a', ...FORMATTING]);

function append(parts: Part[], part: Part) {
  const previous = parts[parts.length - 1];
  if (previous?.media === part.media && !part.media) previous.nodes.push(...part.nodes);
  else parts.push(part);
}

/** Apply an inline element such as emphasis to a fragment, keeping media outside it. */
function wrap(element: Element, part: Part): Part {
  if (!part.media) return { media: false, nodes: [{ ...element, children: part.nodes }] };
  if (!part.inner) return part;
  const inner = part.inner.map((innerPart) => wrap(element, innerPart));
  const link = part.nodes[0] as Element;
  return { media: true, inner, nodes: [{ ...link, children: inner.flatMap((innerPart) => innerPart.nodes) }] };
}

function splitMedia(node: ElementContent): Part[] {
  if (node.type !== 'element') return [{ media: false, nodes: [node] }];
  if (node.tagName === 'img') return [{ media: true, nodes: [node] }];
  // Accepted gallery links render as inline buttons; keep them in place. A
  // rejected one renders as an ordinary link, so its media is lifted as usual.
  if (node.tagName === 'a' && isGalleryLink(node.properties?.href)) {
    return [{ media: false, nodes: [node] }];
  }
  const parts: Part[] = [];
  for (const child of node.children) {
    for (const part of splitMedia(child)) append(parts, part);
  }
  if (!parts.some((part) => part.media)) return [{ media: false, nodes: [node] }];
  // Links may contain flow content. Lift the whole link out of the paragraph so
  // its complete label stays one link and one keyboard focus stop.
  if (node.tagName === 'a') {
    return [{ media: true, inner: parts, nodes: [{ ...node, children: parts.flatMap((part) => part.nodes) }] }];
  }
  // Emphasis and other phrasing elements must stay around text only.
  return parts.map((part) => wrap(node, part));
}

/** True for whitespace, or formatting around only whitespace, e.g. `<em> </em>`. */
function isBlank(node: ElementContent): boolean {
  if (node.type === 'text') return !node.value.trim();
  if (node.type === 'comment') return true;
  return node.type === 'element' && FORMATTING.has(node.tagName) && node.children.every(isBlank);
}

/** Video and audio render with playback controls, which are interactive content. */
function isPlayer(node: Element): boolean {
  const src = node.properties?.src;
  return typeof src === 'string' && getMediaType(mediaUrlTransform(src, 'src')) !== 'image';
}

/** A nested link, such as a GFM footnote reference (`sup > a`). */
function holdsLink(node: Element): boolean {
  return node.tagName === 'a'
    || (node.tagName === 'sup' && node.children.some((child) => child.type === 'element' && child.tagName === 'a'));
}

/**
 * Remove what a link must not contain: nested links, interactive players and,
 * inside headings, any media block. Media leave their alt text behind so the
 * link keeps its full label. Removed nodes are collected in `moved`.
 */
function detachFromLink(nodes: ElementContent[], inHeading: boolean, moved: ElementContent[]): ElementContent[] {
  return nodes.flatMap((node): ElementContent[] => {
    if (node.type !== 'element') return [node];
    if (node.tagName === 'img' && (inHeading || isPlayer(node))) {
      moved.push(node);
      const alt = node.properties?.alt;
      return typeof alt === 'string' && alt ? [{ type: 'text', value: alt }] : [];
    }
    if (holdsLink(node)) {
      moved.push(node);
      return [];
    }
    return [{ ...node, children: detachFromLink(node.children, inHeading, moved) }];
  });
}

/** Keep one link with its label and place the detached content right after it. */
function separateLink(link: Element, inHeading: boolean): ElementContent[] | undefined {
  const moved: ElementContent[] = [];
  let children = detachFromLink(link.children, inHeading, moved);
  if (!moved.length) return undefined;
  if (children.every(isBlank)) {
    // A link without any label text would have no accessible name; show its destination.
    const href = mediaUrlTransform(String(link.properties?.href ?? ''), 'href');
    if (!href) return moved;
    children = [{ type: 'text', value: href }];
  }
  return [{ ...link, children }, ...moved];
}

function splitParagraph(paragraph: Element): ElementContent[] | undefined {
  const parts: Part[] = [];
  for (const node of paragraph.children) {
    for (const part of splitMedia(node)) append(parts, part);
  }
  if (!parts.some((part) => part.media)) return undefined;
  return parts.flatMap((part) => {
    if (part.media) return part.nodes;
    if (part.nodes.every(isBlank)) return [];
    return [{ ...paragraph, children: part.nodes }];
  });
}

/** Headings hold phrasing content only, so media follow the heading text. */
function liftFromHeading(heading: Element): ElementContent[] | undefined {
  const parts = heading.children.flatMap(splitMedia);
  if (!parts.some((part) => part.media)) return undefined;
  const text = parts.filter((part) => !part.media).flatMap((part) => part.nodes);
  const media = parts.filter((part) => part.media).flatMap((part) => part.nodes);
  // Leave out a heading that would be empty rather than render it without a name.
  return text.every(isBlank) ? media : [{ ...heading, children: text }, ...media];
}

/** List items and table cells may contain media blocks, but not inside emphasis. */
function splitPhrasingChildren(container: Element): ElementContent[] | undefined {
  let changed = false;
  const children = container.children.flatMap((node) => {
    if (node.type !== 'element' || !PHRASING.has(node.tagName)) return [node];
    const parts = splitMedia(node);
    if (!parts.some((part) => part.media)) return [node];
    changed = true;
    return parts.flatMap((part) => part.nodes);
  });
  return changed ? [{ ...container, children }] : undefined;
}

function rewrite(node: Element, inHeading: boolean): ElementContent[] | undefined {
  if (node.tagName === 'a') return isGalleryLink(node.properties?.href) ? undefined : separateLink(node, inHeading);
  if (node.tagName === 'p') return splitParagraph(node);
  if (HEADING.test(node.tagName)) return liftFromHeading(node);
  if (UNWRAPPED_PHRASING_CONTAINERS.has(node.tagName)) return splitPhrasingChildren(node);
  return undefined;
}

/**
 * Custom image renderers produce block players and captions. Keep them out of
 * paragraphs, headings and phrasing formatting, and keep interactive content
 * (players, nested links) out of links, so server HTML parses into the same
 * tree React renders.
 */
export function markdownMediaBlocks() {
  return function transform(tree: Root) {
    function visit(parent: Root | Element, inHeading: boolean) {
      for (let index = 0; index < parent.children.length; index++) {
        const child = parent.children[index];
        if (child.type !== 'element') continue;
        // Children first, so links are already separated when their container splits.
        visit(child, inHeading || HEADING.test(child.tagName));
        const replacement = rewrite(child, inHeading);
        if (!replacement) continue;
        parent.children.splice(index, 1, ...replacement);
        index += replacement.length - 1;
      }
    }
    visit(tree, false);
  };
}
