import React, { useState } from 'react';
import { X, BookOpen, Play } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MediaViewer } from './MediaViewer';
import { TextToSpeechButton } from './TextToSpeechButton';
import { Language } from '../hooks/useLanguage';
import { t } from '../utils/translations';

interface DetailedContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  media?: {
    images: string[];
    videos: Array<{ url: string; title: string; description: string }>;
    audio: Array<{ url: string; title: string; description: string }>;
  };
  currentLanguage: Language;
}

export const DetailedContentModal: React.FC<DetailedContentModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  media,
  currentLanguage,
}) => {
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState<'image' | 'video' | 'audio'>('image');
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string>('');

  if (!isOpen) return null;

  const handleMediaClick = (type: 'image' | 'video' | 'audio', url: string, title?: string) => {
    setSelectedMediaType(type);
    setSelectedMediaUrl(url);
    setIsMediaViewerOpen(true);
  };

  const hasMedia = media && (
    media.images.length > 0 ||
    media.videos.length > 0 ||
    media.audio.length > 0
  );

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-0 md:p-4">
      <div className="bg-white md:rounded-xl shadow-2xl w-full h-full md:max-w-4xl md:w-full md:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="h-6 w-6 text-blue-800 mr-3" />
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 truncate">{title}</h2>
            </div>
            <div className="flex items-center space-x-2">
              <TextToSpeechButton
                text={content.replace(/[#*\[\]()]/g, '')} // Remove markdown formatting for TTS
                language={currentLanguage}
              />
              {hasMedia && (
                <button
                  onClick={() => setIsMediaViewerOpen(true)}
                  className="hidden md:flex items-center px-3 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {t('media', currentLanguage)}
                </button>
              )}
              {hasMedia && (
                <button
                  onClick={() => setIsMediaViewerOpen(true)}
                  className="md:hidden p-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title={t('media', currentLanguage)}
                >
                  <Play className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <MarkdownRenderer 
              content={content} 
              onMediaClick={handleMediaClick}
            />
          </div>
        </div>
      </div>

      {/* Media Viewer */}
      {hasMedia && (
        <MediaViewer
          images={media!.images}
          videos={media!.videos}
          audio={media!.audio}
          isOpen={isMediaViewerOpen}
          onClose={() => setIsMediaViewerOpen(false)}
        />
      )}
    </div>
  );
};