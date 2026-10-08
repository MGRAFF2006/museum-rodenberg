import { fromMarkdown } from 'mdast-util-from-markdown';

function parse(content) {
  // Capture the CommonMark tokenizer's destination bounds, rather than trying
  // to rediscover balanced parentheses or escaped delimiters with regexes.
  function destination(token) {
    const url = this.resume();
    const node = this.stack[this.stack.length - 1];
    node.url = url;
    node.data = { ...node.data, destination: { start: token.start.offset, end: token.end.offset } };
  }
  const tree = fromMarkdown(content, { mdastExtensions: [{ exit: {
    resourceDestinationString: destination, definitionDestinationString: destination,
  } }] });
  const nodes = [];
  function visit(node) {
    nodes.push(node);
    for (const child of node.children ?? []) visit(child);
  }
  visit(tree);
  const definitions = new Map();
  for (const node of nodes) {
    if (node.type === 'definition' && !definitions.has(node.identifier)) definitions.set(node.identifier, node);
  }
  return { tree, nodes, definitions };
}

const bounds = (node) => ({ start: node.position.start.offset, end: node.position.end.offset });
const plainText = (node) => node.value ?? node.alt ?? (node.children ?? []).map(plainText).join('');
const opaqueTypes = new Set(['code', 'inlineCode', 'definition', 'imageReference', 'linkReference']);
const customMedia = /^(image|audio|video):/i;
const containsImage = (node) => node.type === 'image' || node.type === 'imageReference' || (node.children ?? []).some(containsImage);

function nonOverlapping(ranges) {
  const result = [];
  for (const range of ranges.sort((a, b) => a.start - b.start || b.end - a.end)) {
    if (!result.length || range.start >= result[result.length - 1].end) result.push(range);
  }
  return result;
}

function patchSource(content, patches) {
  for (const patch of nonOverlapping(patches).reverse()) {
    content = content.slice(0, patch.start) + patch.replacement + content.slice(patch.end);
  }
  return content;
}

/** Return real image/custom-link nodes, including resolved reference links. */
export function markdownMediaNodes(content) {
  const { nodes, definitions } = parse(content);
  return nodes.flatMap(node => {
    const type = node.type === 'imageReference' ? 'image' : node.type === 'linkReference' ? 'link' : node.type;
    const url = node.url ?? definitions.get(node.identifier)?.url;
    return (type === 'image' || type === 'link') && url
      ? [{ type, url, title: plainText(node), ...bounds(node) }] : [];
  });
}

/** Resolve IDs by patching only destinations; keep other source syntax intact. */
export function resolveMarkdownAssetReferences(content, resolveAsset) {
  if (!content.includes('[')) return content;
  const { nodes, definitions } = parse(content);
  const patches = [];
  for (const node of nodes) {
    const url = node.url ?? definitions.get(node.identifier)?.url;
    if (!url) continue;
    const prefix = customMedia.exec(url)?.[0] ?? '';
    const asset = resolveAsset(url.slice(prefix.length));
    if (!asset) continue;
    if (node.data?.destination) {
      // CommonMark destination escaping preserves parentheses, literal entities
      // and spaces without changing the URL observed by the renderer.
      const resolved = (prefix + asset.url).replace(/\\/g, '\\\\').replace(/[()]/g, '\\$&').replace(/&/g, '&amp;').replace(/[\s<>]/g, encodeURIComponent);
      patches.push({ ...node.data.destination, replacement: resolved });
    }
    if ((node.type === 'image' || node.type === 'imageReference') && !node.alt && content.slice(node.position.start.offset, node.position.start.offset + 3) === '![]') {
      const alt = asset.alt.replace(/[\\\[\]]/g, '\\$&').replace(/&/g, '&amp;').replace(/\r/g, '&#13;').replace(/\n/g, '&#10;');
      patches.push({ start: node.position.start.offset + 2, end: node.position.start.offset + 2, replacement: alt });
    }
  }
  return patchSource(content, patches);
}

/** Preserve managed embeddings, code and references as exact source blocks. */
export function splitMarkdownSource(content) {
  const { nodes, definitions } = parse(content);
  const ranges = nonOverlapping(nodes.filter(node => {
    const url = node.url ?? definitions.get(node.identifier)?.url;
    return opaqueTypes.has(node.type) || node.type === 'image' || (node.type === 'link' && (customMedia.test(url ?? '') || containsImage(node)));
  }).map(bounds));
  const blocks = [];
  let end = 0;
  for (const range of ranges) {
    if (range.start > end) blocks.push({ type: 'text', content: content.slice(end, range.start) });
    blocks.push({ type: 'embedding', content: content.slice(range.start, range.end) });
    end = range.end;
  }
  if (end < content.length) blocks.push({ type: 'text', content: content.slice(end) });
  return blocks;
}

export function plainMarkdownText(content) {
  const { tree } = parse(content);
  const blockContainers = new Set(['root', 'blockquote', 'list', 'listItem']);
  function text(node) {
    if (node.type === 'code' || node.type === 'definition' || node.type === 'thematicBreak') return '';
    if (node.type === 'break') return '\n';
    return node.value ?? node.alt ?? (node.children ?? []).map(text).filter(Boolean).join(blockContainers.has(node.type) ? '\n\n' : '');
  }
  return text(tree).trim();
}

/** Hide complete parsed destinations and opaque syntax from a translator. */
export function protectMarkdownDestinations(content, namespace) {
  const { nodes } = parse(content);
  const ranges = [];
  for (const node of nodes) {
    if (opaqueTypes.has(node.type)) ranges.push(bounds(node));
    else if (node.data?.destination) ranges.push(node.data.destination);
    else if (node.type === 'link' && content[node.position.start.offset] === '<') ranges.push(bounds(node));
  }
  const destinations = [];
  const patches = nonOverlapping(ranges).map(range => {
    const index = destinations.push(content.slice(range.start, range.end)) - 1;
    return { ...range, replacement: `__${namespace}_${index}__` };
  });
  return { text: patchSource(content, patches), destinations };
}

export function restoreMarkdownDestinations(content, destinations, namespace) {
  return content.replace(new RegExp(`__\\s*${namespace}\\s*_\\s*(\\d+)\\s*__`, 'gi'),
    (match, index) => destinations[Number(index)] ?? match);
}
