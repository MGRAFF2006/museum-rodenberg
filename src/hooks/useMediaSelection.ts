import { useEffect, useState } from 'react';
import type { RequiredMedia } from '../types';

export type MediaTab = 'images' | 'videos' | 'audio';

export function useMediaSelection(media: RequiredMedia, initialTab?: MediaTab | null, initialUrl?: string | null) {
  const [requestedTab, setActiveTab] = useState(initialTab);
  const [imageUrl, setImageUrl] = useState(initialUrl);

  useEffect(() => {
    setActiveTab(initialTab);
    setImageUrl(initialUrl);
  }, [initialTab, initialUrl]);

  const tabs: MediaTab[] = ['images', 'videos', 'audio'];
  const activeTab = requestedTab && media[requestedTab]?.length
    ? requestedTab
    : tabs.find(tab => media[tab].length > 0);
  const selectedImage = Math.max(0, media.images.indexOf(imageUrl || ''));

  return {
    activeTab,
    setActiveTab,
    selectedImage,
    selectImage: (index: number) => setImageUrl(media.images[index]),
  };
}
