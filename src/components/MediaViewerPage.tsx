import React, { useState, useEffect } from 'react';
import { ArrowLeft, Image as ImageIcon, Video, Music } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { AudioPlayer } from './AudioPlayer';
import { availableMediaTab, mediaSelection, withSelectedMedia } from '../utils/mediaGallery';

interface MediaItem {
  url: string;
  title: string;
  description: string;
}

interface MediaViewerPageProps {
  images: string[];
  videos: MediaItem[];
  audio: MediaItem[];
  onBack: () => void;
  initialTab?: string | null;
  initialUrl?: string | null;
}

export const MediaViewerPage: React.FC<MediaViewerPageProps> = ({
  images: galleryImages,
  videos: galleryVideos,
  audio: galleryAudio,
  onBack,
  initialTab = 'images',
  initialUrl = null,
}) => {
  const { t } = useLanguage();
  const { images, videos, audio } = withSelectedMedia({ images: galleryImages, videos: galleryVideos, audio: galleryAudio }, mediaSelection(initialTab, initialUrl));
  const [preferredTab, setActiveTab] = useState(initialTab);
  const activeTab = availableMediaTab(preferredTab, { images, videos, audio });
  const [selectedUrl, setSelectedUrl] = useState(initialUrl);
  const selectedImage = Math.max(0, images.indexOf(selectedUrl ?? ''));

  useEffect(() => {
    setActiveTab(initialTab);
    setSelectedUrl(initialUrl);
  }, [initialTab, initialUrl]);

  useEffect(() => {
    if (initialUrl) {
      const element = document.getElementById(`media-${encodeURIComponent(initialUrl)}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [initialUrl, activeTab]);

  const hasImages = images.length > 0;
  const hasVideos = videos.length > 0;
  const hasAudio = audio.length > 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center text-primary-800 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t('back')}
          </button>
        </div>
      </div>

      {/* Title Banner */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold">{t('media')}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex space-x-1 py-4">
            {hasImages && (
              <button
                onClick={() => setActiveTab('images')}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'images'
                    ? 'bg-primary-100 text-primary-800'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                {t('images')} ({images.length})
              </button>
            )}
            {hasVideos && (
              <button
                onClick={() => setActiveTab('videos')}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'videos'
                    ? 'bg-primary-100 text-primary-800'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <Video className="h-4 w-4 mr-2" />
                {t('videos')} ({videos.length})
              </button>
            )}
            {hasAudio && (
              <button
                onClick={() => setActiveTab('audio')}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'audio'
                    ? 'bg-primary-100 text-primary-800'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <Music className="h-4 w-4 mr-2" />
                {t('audio')} ({audio.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'images' && hasImages && (
          <div className="space-y-6">
            <div className="bg-neutral-900 rounded-xl shadow-xl overflow-hidden flex items-center justify-center min-h-[400px] md:min-h-[600px] max-h-[80vh] relative shadow-inner">
              <img
                src={images[selectedImage]}
                alt={`${t('image')} ${selectedImage + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            {images.length > 1 && (
              <div className="bg-white rounded-xl shadow-md p-4 border border-neutral-100">
                <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedUrl(image)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index ? 'border-primary-500 ring-2 ring-primary-200' : 'border-neutral-200 hover:border-neutral-300 hover:scale-105'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'videos' && hasVideos && (
          <div className="space-y-8">
            {videos.map((video, index) => (
              <div key={index} id={`media-${encodeURIComponent(video.url)}`} className={`bg-white rounded-xl shadow-lg p-6 border border-neutral-100 transition-all ${initialUrl === video.url ? 'ring-2 ring-primary-500' : ''}`}>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">{video.title}</h3>
                {video.description && <p className="text-neutral-600 text-sm mb-6 leading-relaxed">{video.description}</p>}
                <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-inner">
                  <video
                    controls
                    className="w-full h-full"
                    preload="metadata"
                  >
                    <source src={video.url} />
                    {t('videoNotSupported')}
                  </video>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'audio' && hasAudio && (
          <div className="space-y-8">
            {audio.map((audioItem, index) => (
              <div key={index} id={`media-${encodeURIComponent(audioItem.url)}`} className={`bg-white rounded-xl shadow-lg p-6 border border-neutral-100 transition-all ${initialUrl === audioItem.url ? 'ring-2 ring-primary-500' : ''}`}>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">{audioItem.title}</h3>
                {audioItem.description && <p className="text-neutral-600 text-sm mb-6 leading-relaxed">{audioItem.description}</p>}
                <AudioPlayer url={audioItem.url} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
