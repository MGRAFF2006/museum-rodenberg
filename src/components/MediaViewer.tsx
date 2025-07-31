import React, { useState } from 'react';
import { X, Play, Pause, Volume2, Image as ImageIcon, Video, Music } from 'lucide-react';
import { t } from '../utils/translations';

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
}

export const MediaViewer: React.FC<MediaViewerProps> = ({
  images,
  videos,
  audio,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'audio'>('images');
  const [selectedImage, setSelectedImage] = useState(0);

  if (!isOpen) return null;

  const hasImages = images.length > 0;
  const hasVideos = videos.length > 0;
  const hasAudio = audio.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-0 md:p-4">
      <div className="bg-white md:rounded-xl shadow-2xl w-full h-full md:max-w-4xl md:w-full md:max-h-[90vh] md:h-auto overflow-hidden flex flex-col">
        <div className="p-4 md:p-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">{t('media', 'de')}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
            {hasImages && (
              <button
                onClick={() => setActiveTab('images')}
                className={`flex items-center px-2 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  activeTab === 'images'
                    ? 'bg-white text-blue-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">{t('images', 'de')} ({images.length})</span>
                <span className="md:hidden">({images.length})</span>
              </button>
            )}
            {hasVideos && (
              <button
                onClick={() => setActiveTab('videos')}
                className={`flex items-center px-2 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  activeTab === 'videos'
                    ? 'bg-white text-blue-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Video className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">{t('videos', 'de')} ({videos.length})</span>
                <span className="md:hidden">({videos.length})</span>
              </button>
            )}
            {hasAudio && (
              <button
                onClick={() => setActiveTab('audio')}
                className={`flex items-center px-2 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  activeTab === 'audio'
                    ? 'bg-white text-blue-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Music className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">{t('audio', 'de')} ({audio.length})</span>
                <span className="md:hidden">({audio.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 pt-0">
            {activeTab === 'images' && hasImages && (
              <div className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={images[selectedImage]}
                    alt={`${t('images', 'de')} ${selectedImage + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {images.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-12 md:w-16 h-12 md:h-16 rounded-lg overflow-hidden border-2 ${
                          selectedImage === index ? 'border-blue-500' : 'border-gray-200'
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
              <div className="space-y-4">
                {videos.map((video, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">{video.title}</h4>
                    <p className="text-gray-600 text-xs md:text-sm mb-3">{video.description}</p>
                    <video
                      controls
                      className="w-full rounded-lg"
                      preload="metadata"
                    >
                      <source src={video.url} type="video/mp4" />
                      {t('videoNotSupported', 'de')}
                    </video>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'audio' && hasAudio && (
              <div className="space-y-4">
                {audio.map((audioItem, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">{audioItem.title}</h4>
                    <p className="text-gray-600 text-xs md:text-sm mb-3">{audioItem.description}</p>
                    <audio
                      controls
                      className="w-full"
                      preload="metadata"
                    >
                      <source src={audioItem.url} type="audio/wav" />
                      <source src={audioItem.url} type="audio/mp3" />
                      {t('audioNotSupported', 'de')}
                    </audio>
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