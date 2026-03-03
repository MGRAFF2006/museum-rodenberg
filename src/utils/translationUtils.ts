import { Language, Translation } from '../types';
import { MARKDOWN_REGEX } from './markdownUtils';
import { authFetch } from './auth';

/** Shape of a translatable content record (exhibition or artifact). */
interface ContentRecord {
  translations?: Record<string, Translation>;
  image?: string;
  media?: {
    images?: string[];
    videos?: Array<{ url: string; title?: string; [k: string]: unknown }>;
    audio?: Array<{ url: string; title?: string; [k: string]: unknown }>;
  };
  detailedContent?: Record<string, string>;
  isTranslationMissing?: boolean;
  [key: string]: unknown;
}

export type ContentBlock = {
  type: 'text' | 'embedding';
  content: string;
};

/**
 * Merges translations into a content object based on the current language.
 * This is used for artifacts and exhibitions data which have their own translation sub-objects.
 */
export const getTranslatedContent = (
  content: ContentRecord | null | undefined,
  language: Language,
  fallbackLanguage: Language = 'de',
  resolveAsset?: (id: string) => { url: string; alt: string } | undefined
): ContentRecord => {
  if (!content) return content || {};
  
  const translations = content.translations as Record<string, Translation> | undefined;
  if (!translations) {
    return resolveAllAssets({ ...content, isTranslationMissing: false }, resolveAsset);
  }

  const hasTranslation = !!translations[language];
  const translation = translations[language] || translations[fallbackLanguage] || {};
  
  const merged = {
    ...content,
    ...translation,
    isTranslationMissing: !hasTranslation && language !== fallbackLanguage,
  };

  return resolveAllAssets(merged, resolveAsset);
};

function resolveAllAssets(content: ContentRecord, resolveAsset?: (id: string) => { url: string; alt: string } | undefined): ContentRecord {
  if (!resolveAsset) return content;

  const result: ContentRecord = { ...content };

  // Resolve main image
  if (result.image) {
    const asset = resolveAsset(result.image);
    if (asset) result.image = asset.url;
  }

  // Resolve media
  if (result.media) {
    result.media = { ...result.media };
    if (result.media.images) {
      result.media.images = result.media.images.map((img: string) => {
        const asset = resolveAsset(img);
        return asset ? asset.url : img;
      });
    }
    if (result.media.videos) {
      result.media.videos = result.media.videos.map((vid) => {
        const asset = resolveAsset(vid.url);
        return asset ? { ...vid, url: asset.url } : vid;
      });
    }
    if (result.media.audio) {
      result.media.audio = result.media.audio.map((aud) => {
        const asset = resolveAsset(aud.url);
        return asset ? { ...aud, url: asset.url } : aud;
      });
    }
  }

  // Resolve assets in markdown descriptions/significance
  ['description', 'significance'].forEach(field => {
    if (typeof result[field] === 'string') {
      result[field] = resolveMarkdownAssets(result[field], resolveAsset);
    }
  });

  // Resolve assets in detailedContent
  if (result.detailedContent) {
    const dc = { ...result.detailedContent };
    Object.keys(dc).forEach(lang => {
      if (typeof dc[lang] === 'string') {
        dc[lang] = resolveMarkdownAssets(dc[lang], resolveAsset);
      }
    });
    result.detailedContent = dc;
  }

  return result;
}

function resolveMarkdownAssets(content: string, resolveAsset: (id: string) => { url: string; alt: string } | undefined): string {
  return content.replace(/(!?\[.*?\])\((.*?)\)/g, (match: string, bracketed: string, url: string) => {
    // Handle special prefixes like audio:asset_id, video:asset_id, image:asset_id
    let id = url;
    let prefix = '';
    if (url.includes(':')) {
      const parts = url.split(':');
      if (['audio', 'video', 'image'].includes(parts[0])) {
        prefix = parts[0] + ':';
        id = parts.slice(1).join(':');
      }
    }

    const asset = resolveAsset(id);
    if (asset) {
      // If it's an image embedding (![]), use the asset's alt text if the brackets are empty
      if (match.startsWith('!') && bracketed === '![]') {
        return `![${asset.alt}](${prefix}${asset.url})`;
      }
      return `${bracketed}(${prefix}${asset.url})`;
    }
    return match;
  });
}

/**
 * Splits markdown into blocks of plain text and embeddings (images, audio, video).

 * This ensures that the managed parts of the content remain untouched during translation.
 */
export function splitMarkdown(content: string): ContentBlock[] {
  if (!content) return [];
  
  // Use shared regex from markdownUtils
  const regex = new RegExp(MARKDOWN_REGEX.EMBEDDING);
  const blocks: ContentBlock[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ 
        type: 'text', 
        content: content.substring(lastIndex, match.index) 
      });
    }
    blocks.push({ 
      type: 'embedding', 
      content: match[0] 
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    blocks.push({ 
      type: 'text', 
      content: content.substring(lastIndex) 
    });
  }

  return blocks;
}

/**
 * Joins content blocks back into a single string.
 */
export function joinBlocks(blocks: ContentBlock[]): string {
  return blocks.map(block => block.content).join('');
}

/**
 * Computes a SHA-256 hash of the content using the Web Crypto API.
 * Preserves the `v2:` prefix for continuity with the hashing scheme.
 * NOTE: Switching from MD5 to SHA-256 will cause a one-time re-translation
 * of all content since existing hashes will no longer match.
 * The generate-translations.js script uses the same algorithm (crypto.createHash('sha256')).
 */
export async function getHash(text: string): Promise<string> {
  const v2Text = 'v2:' + (text || '');
  const data = new TextEncoder().encode(v2Text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let lastCallTime = 0;
const sessionCache = new Map<string, string>();

/**
 * Translates a single field, handling markdown splitting if necessary.
 */
export async function translateField(
  text: string, 
  targetLang: string, 
  isMarkdown: boolean = false,
  onProgress?: () => void
): Promise<string> {
  if (!text) return '';
  if (!isMarkdown) {
    const result = await translateText(text, targetLang);
    onProgress?.();
    return result;
  }

  const blocks = splitMarkdown(text);
  const translatedBlocks: ContentBlock[] = [];
  
  for (const block of blocks) {
    if (block.type === 'text' && block.content.trim()) {
      const translated = await translateText(block.content, targetLang);
      onProgress?.();
      translatedBlocks.push({ ...block, content: translated });
    } else {
      translatedBlocks.push(block);
    }
  }

  return joinBlocks(translatedBlocks);
}

export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text || !text.trim()) return text;

  const cacheKey = `${text}|${targetLang}`;
  if (sessionCache.has(cacheKey)) {
    return sessionCache.get(cacheKey)!;
  }

  // Rate limit: 20/min = 1 every 3s.
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  if (timeSinceLastCall < 3100) {
    await sleep(3100 - timeSinceLastCall);
  }

  try {
    const response = await authFetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target: targetLang })
    });

    lastCallTime = Date.now();

    if (response.status === 429) {
      console.log('Rate limited. Waiting 30 seconds...');
      await sleep(30000);
      return translateText(text, targetLang);
    }

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.statusText}`);
    }

    const data = await response.json();
    const result = data.translatedText;
    
    sessionCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}
