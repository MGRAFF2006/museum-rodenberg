import type { Media, RequiredMedia } from '../types';
import { extractMediaFromMarkdown } from './markdownUtils';

export function getMediaGallery(media: Media | undefined, ...markdown: (string | undefined)[]): RequiredMedia {
  const images = new Set(media?.images || []);
  const videos = new Map((media?.videos || []).map(item => [item.url, item]));
  const audio = new Map((media?.audio || []).map(item => [item.url, item]));

  for (const content of markdown) {
    const extracted = extractMediaFromMarkdown(content || '');
    extracted.images.forEach(url => images.add(url));
    extracted.videos.forEach(item => {
      if (!videos.has(item.url)) videos.set(item.url, { ...item, description: '' });
    });
    extracted.audio.forEach(item => {
      if (!audio.has(item.url)) audio.set(item.url, { ...item, description: '' });
    });
  }

  return { images: [...images], videos: [...videos.values()], audio: [...audio.values()] };
}
