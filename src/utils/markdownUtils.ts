/**
 * Shared regexes for markdown parsing
 */
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
  
  // Standard markdown images
  let match;
  const imageRegex = new RegExp(MARKDOWN_REGEX.IMAGE);
  while ((match = imageRegex.exec(markdown)) !== null) {
    const alt = match[1];
    const url = match[2];
    if (url) {
      const ext = url.split('.').pop()?.toLowerCase();
      const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
      const audioExtensions = ['mp3', 'wav', 'aac', 'm4a', 'flac'];
      
      if (videoExtensions.includes(ext || '')) {
        result.videos.push({ url, title: alt || url.split('/').pop() || 'Video' });
      } else if (audioExtensions.includes(ext || '')) {
        result.audio.push({ url, title: alt || url.split('/').pop() || 'Audio' });
      } else {
        result.images.push(url);
      }
    }
  }
  
  // Custom media links
  const customMediaRegex = new RegExp(MARKDOWN_REGEX.CUSTOM_MEDIA);
  while ((match = customMediaRegex.exec(markdown)) !== null) {
    const type = match[1].toLowerCase();
    const alt = match[2];
    const url = match[4];
    
    if (url) {
      if (type === 'image') result.images.push(url);
      if (type === 'audio') result.audio.push({ url, title: alt || url.split('/').pop() || 'Audio' });
      if (type === 'video') result.videos.push({ url, title: alt || url.split('/').pop() || 'Video' });
    }
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
  if (!markdown) return '';
  
  return markdown
    // Remove image tags but keep alt text
    .replace(/!\[(.*?)\]\(.*?\)/g, '$1')
    // Remove links but keep text
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // Remove bold/italic
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove headers
    .replace(/^#+\s+/gm, '')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`(.+?)`/g, '$1')
    // Remove horizontal rules
    .replace(/^---$/gm, '')
    // Normalize newlines
    .replace(/\n{2,}/g, '\n\n')
    .trim();
};

/**
 * Extracts all image URLs from a markdown string.
 * Maintained for backward compatibility.
 */
export const extractImagesFromMarkdown = (markdown: string): string[] => {
  return extractMediaFromMarkdown(markdown).images;
};
