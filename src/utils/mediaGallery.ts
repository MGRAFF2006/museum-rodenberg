import { extractMediaFromMarkdown } from './markdownUtils';
import type { Media, RequiredMedia } from '../types';

export interface MediaSelection {
  type: 'image' | 'video' | 'audio';
  url: string;
}

const tabs = { image: 'images', video: 'videos', audio: 'audio' } as const;
export type MediaTab = typeof tabs[keyof typeof tabs];

export function mediaSelection(tab: string | null | undefined, url: string | null | undefined): MediaSelection | undefined {
  const type = tab === 'images' ? 'image' : tab === 'videos' ? 'video' : tab === 'audio' ? 'audio' : undefined;
  return type && url ? { type, url } : undefined;
}

export function mediaViewerSearch(selection?: MediaSelection): string {
  return selection ? `?${new URLSearchParams({ tab: tabs[selection.type], url: selection.url })}` : '';
}

export function withSelectedMedia(media: Media, selection?: MediaSelection): RequiredMedia {
  const gallery = { images: media.images ?? [], videos: media.videos ?? [], audio: media.audio ?? [] };
  if (!selection?.url) return gallery;
  if (selection.type === 'image') {
    if (!gallery.images.includes(selection.url)) gallery.images = [...gallery.images, selection.url];
  } else {
    const tab = tabs[selection.type];
    if (!gallery[tab].some(item => item.url === selection.url)) {
      gallery[tab] = [...gallery[tab], { url: selection.url, title: selection.url, description: '' }];
    }
  }
  return gallery;
}

export function availableMediaTab(preferred: string | null | undefined, media: RequiredMedia): MediaTab {
  if ((preferred === 'images' || preferred === 'videos' || preferred === 'audio') && media[preferred].length) return preferred;
  return media.images.length ? 'images' : media.videos.length ? 'videos' : media.audio.length ? 'audio' : 'images';
}


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
