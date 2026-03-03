import React, { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, Video, Music } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { AudioPlayer } from './AudioPlayer';

interface MediaItem {
  url: string;
  title: string;
  description: string;
}

interface MediaViewerProps {
  images: string[];
  videos: MediaItem[];
  audio: MediaItem[];
  isOpen: boolean;
  onClose: () => void;
  initialItem?: { type: 'image' | 'video' | 'audio'; url: string };
}

export const MediaViewer: React.FC<MediaViewerProps> = ({
  images,
  videos,
  audio,
  isOpen,
  onClose,
  initialItem
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'audio'>('images');
  const [selectedImage, setSelectedImage] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (isOpen && initialItem) {
      if (initialItem.type === 'image') {
        setActiveTab('images');
        const index = images.indexOf(initialItem.url);
        if (index !== -1) setSelectedImage(index);
      } else if (initialItem.type === 'video') {
        setActiveTab('videos');
      } else if (initialItem.type === 'audio') {
        setActiveTab('audio');
      }

      // Small delay to allow tab switching and rendering before scrolling
      setTimeout(() => {
        const ref = itemRefs.current.get(initialItem.url);
        if (ref) {
          ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
          ref.classList.add('ring-2', 'ring-primary-500', 'ring-offset-2');
          setTimeout(() => {
            ref.classList.remove('ring-2', 'ring-primary-500', 'ring-offset-2');
          }, 3000);
        }
      }, 100);
    }
  }, [isOpen, initialItem, images]);

  if (!isOpen) return null;

  const hasImages = images.length > 0;
  const hasVideos = videos.length > 0;
  const hasAudio = audio.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-0 md:p-4">
      <div className="bg-white md:rounded-xl shadow-2xl w-full h-full md:max-w-4xl md:w-full md:max-h-[90vh] md:h-auto overflow-hidden flex flex-col">
        <div className="p-4 md:p-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold text-neutral-900">{t('media')}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-neutral-100 rounded-lg p-1">
            {hasImages && (
              <button
                onClick={() => setActiveTab('images')}
                className={`flex items-center px-2 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  activeTab === 'images'
                    ? 'bg-white text-primary-800 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">{t('images')} ({images.length})</span>
                <span className="md:hidden">({images.length})</span>
              </button>
            )}
            {hasVideos && (
              <button
                onClick={() => setActiveTab('videos')}
                className={`flex items-center px-2 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  activeTab === 'videos'
                    ? 'bg-white text-primary-800 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Video className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">{t('videos')} ({videos.length})</span>
                <span className="md:hidden">({videos.length})</span>
              </button>
            )}
            {hasAudio && (
              <button
                onClick={() => setActiveTab('audio')}
                className={`flex items-center px-2 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  activeTab === 'audio'
                    ? 'bg-white text-primary-800 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Music className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">{t('audio')} ({audio.length})</span>
                <span className="md:hidden">({audio.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
          <div className="p-4 md:p-6 pt-0">
            {activeTab === 'images' && hasImages && (
              <div className="space-y-4">
                <div className="bg-neutral-900 rounded-lg overflow-hidden flex items-center justify-center min-h-[300px] max-h-[60vh] relative group shadow-inner">
                  <img
                    src={images[selectedImage]}
                    alt={`${t('images')} ${selectedImage + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                {images.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === index ? 'border-primary-500 ring-2 ring-primary-200' : 'border-neutral-200 hover:border-neutral-300 hover:scale-105'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'videos' && hasVideos && (
              <div className="space-y-6">
                {videos.map((video, index) => (
                  <div 
                    key={index} 
                    className="bg-neutral-50 rounded-xl p-4 md:p-6 border border-neutral-100 transition-all duration-500 shadow-sm"
                    ref={el => { if (el) itemRefs.current.set(video.url, el); }}
                  >
                    <h4 className="font-bold text-neutral-900 mb-2 text-base md:text-lg">{video.title}</h4>
                    {video.description && <p className="text-neutral-600 text-sm mb-4 leading-relaxed">{video.description}</p>}
                    <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                      <video
                        controls
                        className="w-full h-full"
                        preload="metadata"
                        src={video.url}
                      >
                        {t('videoNotSupported')}
                      </video>
                    </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'audio' && hasAudio && (
            <div className="space-y-6">
              {audio.map((audioItem, index) => (
                <div 
                  key={index} 
                  className="bg-neutral-50 rounded-xl p-4 md:p-6 border border-neutral-100 transition-all duration-500 shadow-sm"
                  ref={el => { if (el) itemRefs.current.set(audioItem.url, el); }}
                >
                  <h4 className="font-bold text-neutral-900 mb-2 text-base md:text-lg">{audioItem.title}</h4>
                  {audioItem.description && <p className="text-neutral-600 text-sm mb-4 leading-relaxed">{audioItem.description}</p>}
                  <AudioPlayer url={audioItem.url} />
                </div>
              ))}
            </div>
          )}

          </div>
        </div>
      </div>
    </div>
  );
};
