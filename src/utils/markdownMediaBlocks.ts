import type { Element, ElementContent, Root } from 'hast';

// `inner` records the split contents of a link lifted out of a paragraph, so
// formatting around the link can still be applied to its text.
type Part = { media: boolean; nodes: ElementContent[]; inner?: Part[] };

// Formatting that renders nothing visible when it wraps only whitespace.
const FORMATTING = new Set(['em', 'strong', 'del', 'span']);

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
  // Gallery links (image:/video:/audio:) render as inline buttons; keep them in place.
  if (node.tagName === 'a' && /^(audio|video|image):/i.test(String(node.properties?.href ?? ''))) {
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

/** Custom image renderers produce block players/captions, so lift them out of p. */
export function markdownMediaBlocks() {
  return function transform(tree: Root) {
    function visit(parent: Root | Element) {
      for (let index = 0; index < parent.children.length; index++) {
        const child = parent.children[index];
        if (child.type !== 'element') continue;
        visit(child);
        if (child.tagName !== 'p') continue;
        const parts: Part[] = [];
        for (const node of child.children) {
          for (const part of splitMedia(node)) append(parts, part);
        }
        if (!parts.some((part) => part.media)) continue;
        const replacement = parts.flatMap((part) => {
          if (part.media) return part.nodes;
          if (part.nodes.every(isBlank)) return [];
          return [{ ...child, children: part.nodes }];
        });
        parent.children.splice(index, 1, ...replacement);
        index += replacement.length - 1;
      }
    }
    visit(tree);
  };
}
