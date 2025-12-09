import React from 'react';
import { ArrowLeft, Calendar, MapPin, User, Tag, Image, Play, BookOpen } from 'lucide-react';
import { ArtifactCard } from './ArtifactCard';
import { MediaViewer } from './MediaViewer';
import { DetailedContentModal } from './DetailedContentModal';
import { TextToSpeechButton } from './TextToSpeechButton';
import { useIsMobile } from '../hooks/useIsMobile';
import { Language } from '../hooks/useLanguage';
import { t } from '../utils/translations';
import { useState } from 'react';

interface Exhibition {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  dateRange?: string;
  location?: string;
  curator?: string;
  tags?: string[];
  artifacts?: string[];
  media?: {
    images: string[];
    videos: Array<{ url: string; title: string; description: string }>;
    audio: Array<{ url: string; title: string; description: string }>;
  };
  detailedContent?: {
    [key: string]: string;
  };
  [key: string]: unknown;
}

interface Artifact {
  id: string;
  title: string;
  period?: string;
  description: string;
  image: string;
  materials?: string[];
  dimensions?: string;
  provenance?: string;
  significance?: string;
  tags?: string[];
  [key: string]: unknown;
}

interface ExhibitionDetailProps {
  exhibition: Exhibition;
  artifacts: Artifact[];
  onBack: () => void;
  onArtifactClick: (id: string) => void;
  onDetailedContentClick?: (title: string, content: string, media?: any) => void;
  onMediaViewerClick?: (images: string[], videos: any[], audio: any[]) => void;
  currentLanguage?: Language;
}

export const ExhibitionDetail: React.FC<ExhibitionDetailProps> = ({
  exhibition,
  artifacts,
  onBack,
  onArtifactClick,
  onDetailedContentClick,
  onMediaViewerClick,
  currentLanguage = 'de',
}) => {
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const [isDetailedContentOpen, setIsDetailedContentOpen] = useState(false);
  const isMobile = useIsMobile();

  const hasMedia = exhibition.media && (
    exhibition.media.images.length > 0 ||
    exhibition.media.videos.length > 0 ||
    exhibition.media.audio.length > 0
  );

  const hasDetailedContent = exhibition.detailedContent && exhibition.detailedContent[currentLanguage];


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={onBack}
            className="flex items-center py-4 text-blue-800 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t('backToExhibitions', currentLanguage)}
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={exhibition.image}
          alt={exhibition.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {exhibition.title}
            </h1>
            <p className="text-xl text-gray-200 mb-4">
              {exhibition.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{t('aboutExhibition', currentLanguage)}</h2>
                <div className="flex items-center space-x-2">
                  <TextToSpeechButton
                    text={exhibition.description}
                    language={currentLanguage}
                  />
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                {exhibition.description}
              </p>
              {hasDetailedContent && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      if (isMobile && onDetailedContentClick) {
                        onDetailedContentClick('exhibition', exhibition.id);
                      } else {
                        setIsDetailedContentOpen(true);
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    {t('readMore', currentLanguage)}
                  </button>
                </div>
              )}
            </div>

            {/* Media Section */}
            {hasMedia && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{t('media', currentLanguage)}</h2>
                  <button
                    onClick={() => {
                      if (isMobile && onMediaViewerClick) {
                        onMediaViewerClick(exhibition.media!.images, exhibition.media!.videos, exhibition.media!.audio);
                      } else {
                        setIsMediaViewerOpen(true);
                      }
                    }}
                    className="flex items-center px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {t('media', currentLanguage)}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {exhibition.media!.images.slice(0, 4).map((image, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden">
                      <img
                        src={image}
                        alt={`Media ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => {
                          if (isMobile && onMediaViewerClick) {
                            onMediaViewerClick('exhibition', exhibition.id);
                          } else {
                            setIsMediaViewerOpen(true);
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Artifacts Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-6">
                <Image className="h-6 w-6 mr-3 text-blue-800" />
                <h2 className="text-2xl font-bold text-gray-900">{t('specialArtifacts', currentLanguage)}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {artifacts.map((artifact) => (
                  <ArtifactCard
                    key={artifact.id}
                    artifact={artifact}
                    onClick={onArtifactClick}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('exhibitionDetails', currentLanguage)}</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-blue-800 mr-3 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t('period', currentLanguage)}</p>
                    <p className="text-gray-600 text-sm">{exhibition.dateRange}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-blue-800 mr-3 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t('location', currentLanguage)}</p>
                    <p className="text-gray-600 text-sm">{exhibition.location}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <User className="h-5 w-5 text-blue-800 mr-3 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t('curator', currentLanguage)}</p>
                    <p className="text-gray-600 text-sm">{exhibition.curator}</p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 text-sm mb-3">{t('themes', currentLanguage)}</h4>
                <div className="flex flex-wrap gap-2">
                  {exhibition.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {hasMedia && !isMobile && (
        <MediaViewer
          images={exhibition.media!.images}
          videos={exhibition.media!.videos}
          audio={exhibition.media!.audio}
          isOpen={isMediaViewerOpen}
          onClose={() => setIsMediaViewerOpen(false)}
        />
      )}
      
      {hasDetailedContent && !isMobile && (
        <DetailedContentModal
          isOpen={isDetailedContentOpen}
          onClose={() => setIsDetailedContentOpen(false)}
          title={exhibition.title}
          content={exhibition.detailedContent![currentLanguage]}
          media={exhibition.media}
          currentLanguage={currentLanguage}
        />
      )}
    </div>
  );
};