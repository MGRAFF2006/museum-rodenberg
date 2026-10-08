export function markdownMediaNodes(content: string): Array<{
  type: 'image' | 'link'; url: string; title: string; start: number; end: number;
}>;
export function resolveMarkdownAssetReferences(content: string, resolveAsset: (id: string) => { url: string; alt: string } | undefined): string;
export function splitMarkdownSource(content: string): Array<{ type: 'text' | 'embedding'; content: string }>;
export function plainMarkdownText(content: string): string;
export function protectMarkdownDestinations(content: string, namespace: string): { text: string; destinations: string[] };
export function restoreMarkdownDestinations(content: string, destinations: string[], namespace: string): string;
