import React from 'react';
import { ArrowLeft, Calendar, Ruler, MapPin, Palette, Info, Tag, Play, BookOpen } from 'lucide-react';
import { MediaViewer } from './MediaViewer';
import { DetailedContentModal } from './DetailedContentModal';
import { TextToSpeechButton } from './TextToSpeechButton';
import { useIsMobile } from '../hooks/useIsMobile';
import { Language } from '../hooks/useLanguage';
import { t } from '../utils/translations';
import { useState } from 'react';

interface Artifact {
  id: string;
  title: string;
  period: string;
  description: string;
  image: string;
  materials: string[];
  dimensions: string;
  provenance: string;
  significance: string;
  tags: string[];
  media?: {
    images: string[];
    videos: Array<{ url: string; title: string; description: string }>;
    audio: Array<{ url: string; title: string; description: string }>;
  };
  detailedContent?: {
    [key: string]: string;
  };
}

interface ArtifactDetailProps {
  artifact: Artifact;
  onBack: () => void;
  exhibitionTitle?: string;
  onDetailedContentClick?: (title: string, content: string, media?: any) => void;
  onMediaViewerClick?: (images: string[], videos: any[], audio: any[]) => void;
  currentLanguage?: Language;
}

export const ArtifactDetail: React.FC<ArtifactDetailProps> = ({
  artifact,
  onBack,
  exhibitionTitle,
  onDetailedContentClick,
  onMediaViewerClick,
  currentLanguage = 'de',
}) => {
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const [isDetailedContentOpen, setIsDetailedContentOpen] = useState(false);
  const isMobile = useIsMobile();

  const hasMedia = artifact.media && (
    artifact.media.images.length > 0 ||
    artifact.media.videos.length > 0 ||
    artifact.media.audio.length > 0
  );

  const hasDetailedContent = artifact.detailedContent && artifact.detailedContent[currentLanguage];

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
            {exhibitionTitle ? `${t('backTo', currentLanguage)} ${exhibitionTitle}` : t('backToExhibitions', currentLanguage)}
          </button>
        </div>
      </div>

      {/* Hero Section with Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={artifact.image}
          alt={artifact.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {artifact.title}
            </h1>
            <p className="text-xl text-yellow-300 font-semibold">
              {artifact.period}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">

            {/* Description */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-2xl font-bold text-gray-900">{t('description', currentLanguage)}</h2>
                <div className="flex items-center space-x-2">
                  <TextToSpeechButton
                    text={artifact.description}
                    language={currentLanguage}
                  />
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                {artifact.description}
              </p>
              {hasDetailedContent && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      if (isMobile && onDetailedContentClick) {
                        onDetailedContentClick('artifact', artifact.id);
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
              <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{t('media', currentLanguage)}</h2>
                  <button
                    onClick={() => {
                      if (isMobile && onMediaViewerClick) {
                        onMediaViewerClick('artifact', artifact.id);
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
                  {artifact.media!.images.slice(0, 6).map((image, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden">
                      <img
                        src={image}
                        alt={`Media ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => {
                          if (isMobile && onMediaViewerClick) {
                            onMediaViewerClick('artifact', artifact.id);
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

            {/* Significance */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
              <div className="flex items-center mb-3">
                <Info className="h-5 w-5 text-blue-800 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">{t('historicalSignificance', currentLanguage)}</h2>
                <TextToSpeechButton
                  text={artifact.significance}
                  language={currentLanguage}
                  className="ml-auto"
                />
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                {artifact.significance}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Details */}
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('details', currentLanguage)}</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Palette className="h-5 w-5 text-blue-800 mr-3 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t('materials', currentLanguage)}</p>
                    <p className="text-gray-600 text-sm">{artifact.materials.join(', ')}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Ruler className="h-5 w-5 text-blue-800 mr-3 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t('dimensions', currentLanguage)}</p>
                    <p className="text-gray-600 text-sm">{artifact.dimensions}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-blue-800 mr-3 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t('provenance', currentLanguage)}</p>
                    <p className="text-gray-600 text-sm">{artifact.provenance}</p>
                  </div>
                </div>
              </div>


              {/* Tags */}
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 text-sm mb-3">{t('themes', currentLanguage)}</h4>
                <div className="flex flex-wrap gap-2">
                  {artifact.tags.map((tag) => (
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
          images={artifact.media!.images}
          videos={artifact.media!.videos}
          audio={artifact.media!.audio}
          isOpen={isMediaViewerOpen}
          onClose={() => setIsMediaViewerOpen(false)}
        />
      )}
      
      {hasDetailedContent && !isMobile && (
        <DetailedContentModal
          isOpen={isDetailedContentOpen}
          onClose={() => setIsDetailedContentOpen(false)}
          title={artifact.title}
          content={artifact.detailedContent![currentLanguage]}
          media={artifact.media}
          currentLanguage={currentLanguage}
        />
      )}
    </div>
  );
};