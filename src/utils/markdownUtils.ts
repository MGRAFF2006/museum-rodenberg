import { markdownMediaNodes, plainMarkdownText } from './markdownParsing.js';

/** Legacy exported patterns; live parsing uses the CommonMark syntax tree. */
export const MARKDOWN_REGEX = {
  // Standard markdown images: ![alt](url)
  IMAGE: /!\[(.*?)\]\((.*?)\)/g,
  
  // Custom media tags: [Audio: Title](audio:url) or [Video: Title](video:url)
  CUSTOM_MEDIA: /\[(Image|Audio|Video):\s*(.*?)\]\((image|audio|video):(.*?)\)/gi,
  
  // Standard links: [text](url)
  LINK: /\[(.*?)\]\((.*?)\)/g,
  
  // Embeddings (things that should not be translated as a whole)
  // This includes images and custom media tags, but NOT standard links
  EMBEDDING: /(!\[.*?\]\(.*?\)|\[(?:Image|Audio|Video):\s*.*?\]\((?:image|audio|video):.*?\))/gi
};

/**
 * Extracts all media URLs from a markdown string.
 * Returns an object with arrays for each media type.
 */
export const extractMediaFromMarkdown = (markdown: string) => {
  const result = {
    images: [] as string[],
    audio: [] as Array<{ url: string; title: string }>,
    videos: [] as Array<{ url: string; title: string }>
  };

  if (!markdown) return result;
  
  for (const node of markdownMediaNodes(markdown)) {
    const prefix = /^(image|audio|video):/i.exec(node.url);
    if (node.type === 'link' && !prefix) continue;
    const url = prefix ? node.url.slice(prefix[0].length) : node.url;
    const extension = url.split(/[?#]/, 1)[0].split('.').pop()?.toLowerCase();
    const type = prefix?.[1].toLowerCase() ??
      (['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(extension || '') ? 'video' :
      ['mp3', 'wav', 'aac', 'm4a', 'flac'].includes(extension || '') ? 'audio' : 'image');
    const title = node.type === 'link' ? node.title.replace(/^(Image|Audio|Video):\s*/i, '') : node.title;
    if (type === 'image') result.images.push(url);
    if (type === 'audio') result.audio.push({ url, title: title || url.split('/').pop() || 'Audio' });
    if (type === 'video') result.videos.push({ url, title: title || url.split('/').pop() || 'Video' });
  }
  
  // Remove duplicates based on URL
  result.images = Array.from(new Set(result.images));
  
  const uniqueAudio = new Map<string, string>();
  result.audio.forEach(item => {
    if (!uniqueAudio.has(item.url) || (item.title !== item.url.split('/').pop())) {
      uniqueAudio.set(item.url, item.title);
    }
  });
  result.audio = Array.from(uniqueAudio.entries()).map(([url, title]) => ({ url, title }));

  const uniqueVideos = new Map<string, string>();
  result.videos.forEach(item => {
    if (!uniqueVideos.has(item.url) || (item.title !== item.url.split('/').pop())) {
      uniqueVideos.set(item.url, item.title);
    }
  });
  result.videos = Array.from(uniqueVideos.entries()).map(([url, title]) => ({ url, title }));
  
  return result;
};

/**
 * Strips markdown formatting for plain text use (e.g. TTS).
 */
export const stripMarkdown = (markdown: string): string => {
  return markdown ? plainMarkdownText(markdown) : '';
};

/**
 * Extracts all image URLs from a markdown string.
 * Maintained for backward compatibility.
 */
export const extractImagesFromMarkdown = (markdown: string): string[] => {
  return extractMediaFromMarkdown(markdown).images;
};
