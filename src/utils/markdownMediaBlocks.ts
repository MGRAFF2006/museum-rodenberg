import type { Element, ElementContent, Root } from 'hast';

type Part = { media: boolean; nodes: ElementContent[] };

function append(parts: Part[], part: Part) {
  const previous = parts[parts.length - 1];
  if (previous?.media === part.media && !part.media) previous.nodes.push(...part.nodes);
  else parts.push(part);
}

function splitMedia(node: ElementContent): Part[] {
  if (node.type !== 'element') return [{ media: false, nodes: [node] }];
  if (node.tagName === 'img') return [{ media: true, nodes: [node] }];
  const parts: Part[] = [];
  for (const child of node.children) {
    for (const part of splitMedia(child)) append(parts, part);
  }
  if (!parts.some((part) => part.media)) return [{ media: false, nodes: [node] }];
  return parts.map((part) => ({
    media: part.media,
    // Links may contain flow content; emphasis must stay around text only.
    nodes: part.media && node.tagName !== 'a' ? part.nodes : [{ ...node, children: part.nodes }],
  }));
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
          if (part.nodes.every((node) => node.type === 'text' && !node.value.trim())) return [];
          return [{ ...child, children: part.nodes }];
        });
        parent.children.splice(index, 1, ...replacement);
        index += replacement.length - 1;
      }
    }
    visit(tree);
  };
}
