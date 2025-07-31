import React, { useState } from 'react';
import { ArrowLeft, Image as ImageIcon, Video, Music } from 'lucide-react';
import { Language } from '../hooks/useLanguage';
import { t } from '../utils/translations';

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
  currentLanguage: Language;
  initialTab?: 'images' | 'videos' | 'audio';
}

export const MediaViewerPage: React.FC<MediaViewerPageProps> = ({
  images,
  videos,
  audio,
  onBack,
  currentLanguage,
  initialTab = 'images',
}) => {
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'audio'>(initialTab);
  const [selectedImage, setSelectedImage] = useState(0);

  const hasImages = images.length > 0;
  const hasVideos = videos.length > 0;
  const hasAudio = audio.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center text-blue-800 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t('back', currentLanguage)}
          </button>
        </div>
      </div>

      {/* Title Banner */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold">{t('media', currentLanguage)}</h1>
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
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                {t('images', currentLanguage)} ({images.length})
              </button>
            )}
            {hasVideos && (
              <button
                onClick={() => setActiveTab('videos')}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'videos'
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Video className="h-4 w-4 mr-2" />
                {t('videos', currentLanguage)} ({videos.length})
              </button>
            )}
            {hasAudio && (
              <button
                onClick={() => setActiveTab('audio')}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'audio'
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Music className="h-4 w-4 mr-2" />
                {t('audio', currentLanguage)} ({audio.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'images' && hasImages && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <img
                src={images[selectedImage]}
                alt={`${t('image', currentLanguage)} ${selectedImage + 1}`}
                className="w-full h-64 md:h-96 object-contain bg-gray-50"
              />
            </div>
            {images.length > 1 && (
              <div className="bg-white rounded-lg shadow-lg p-3 md:p-4">
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2 md:gap-3">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index ? 'border-blue-500' : 'border-gray-200'
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
          <div className="space-y-6">
            {videos.map((video, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{video.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{video.description}</p>
                <video
                  controls
                  className="w-full rounded-lg"
                  preload="metadata"
                >
                  <source src={video.url} type="video/mp4" />
                  {t('videoNotSupported', currentLanguage)}
                </video>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'audio' && hasAudio && (
          <div className="space-y-6">
            {audio.map((audioItem, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{audioItem.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{audioItem.description}</p>
                <audio
                  controls
                  className="w-full"
                  preload="metadata"
                >
                  <source src={audioItem.url} type="audio/wav" />
                  <source src={audioItem.url} type="audio/mp3" />
                  {t('audioNotSupported', currentLanguage)}
                </audio>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};