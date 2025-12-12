import React from 'react';
import { ArrowLeft, Calendar, Ruler, MapPin, Palette, Info, Tag as TagIcon, Play, BookOpen } from 'lucide-react';
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
  period?: string;
  description: string;
  image: string;
  materials?: string[];
  dimensions?: string;
  provenance?: string;
  significance?: string;
  tags?: string[];
  media?: {
    images?: string[];
    videos?: Array<{ url: string; title: string; description: string }>;
    audio?: Array<{ url: string; title: string; description: string }>;
  };
  detailedContent?: {
    [key: string]: string;
  };
  exhibition?: string;
  [key: string]: unknown;
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
    (artifact.media.images && artifact.media.images.length > 0) ||
    (artifact.media.videos && artifact.media.videos.length > 0) ||
    (artifact.media.audio && artifact.media.audio.length > 0)
  );

  const hasDetailedContent = artifact.detailedContent && artifact.detailedContent[currentLanguage];

  return (
    <div className="bg-neutral-50 min-h-screen">
      {/* Navigation Bar */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="container-max max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={onBack}
            className="flex items-center py-4 text-primary-600 hover:text-primary-700 transition-colors focus-ring-sm"
            aria-label="Zurück"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="text-body font-medium">
              {exhibitionTitle ? `${t('backTo', currentLanguage)} ${exhibitionTitle}` : t('backToExhibitions', currentLanguage)}
            </span>
          </button>
        </div>
      </div>

      {/* Hero Section with Banner */}
      <div className="relative min-h-[16rem] md:min-h-[24rem] overflow-hidden bg-neutral-200">
        <img
          src={artifact.image}
          alt={artifact.title}
          className="w-full h-full object-cover absolute inset-0"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-end">
          <div className="container-max max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 md:pb-8 pt-16 md:pt-24 w-full">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-heading-xl md:text-display font-serif font-bold text-white mb-2 md:mb-3">
                  {artifact.title}
                </h1>
                {artifact.period && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-accent-300" />
                    <p className="text-heading-sm font-semibold text-accent-300">
                      {artifact.period}
                    </p>
                  </div>
                )}
              </div>
              {artifact.description && (
                <TextToSpeechButton
                  text={artifact.description}
                  language={currentLanguage}
                  size="lg"
                  className="bg-white/20 backdrop-blur text-white hover:bg-white/30"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-max max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-8 md:py-10">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">

            {/* Description Card */}
            <section className="card-lg p-5 md:p-6">
              <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-neutral-200">
                <h2 className="text-heading-lg font-serif font-bold text-neutral-900">
                  {t('description', currentLanguage)}
                </h2>
                {artifact.description && (
                  <TextToSpeechButton
                    text={artifact.description}
                    language={currentLanguage}
                    size="md"
                  />
                )}
              </div>
              <p className="text-body-lg leading-relaxed text-neutral-700 mb-4">
                {artifact.description}
              </p>
              {hasDetailedContent && (
                <button
                  onClick={() => {
                    if (isMobile && onDetailedContentClick) {
                      onDetailedContentClick('artifact', artifact.id);
                    } else {
                      setIsDetailedContentOpen(true);
                    }
                  }}
                  className="btn btn-primary"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  {t('readMore', currentLanguage)}
                </button>
              )}
            </section>

            {/* Significance Card */}
            {artifact.significance && (
              <section className="card-lg p-5 md:p-6">
                <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-neutral-200">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <h2 className="text-heading-lg font-serif font-bold text-neutral-900">
                      {t('historicalSignificance', currentLanguage)}
                    </h2>
                  </div>
                  <TextToSpeechButton
                    text={artifact.significance}
                    language={currentLanguage}
                    size="md"
                  />
                </div>
                <p className="text-body-lg leading-relaxed text-neutral-700">
                  {artifact.significance}
                </p>
              </section>
            )}

            {/* Media Section */}
            {hasMedia && (
              <section className="card-lg p-5 md:p-6">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-200">
                  <h2 className="text-heading-lg font-serif font-bold text-neutral-900">
                    {t('media', currentLanguage)}
                  </h2>
                  <button
                    onClick={() => {
                      if (isMobile && onMediaViewerClick) {
                        onMediaViewerClick(
                          artifact.media!.images || [],
                          artifact.media!.videos || [],
                          artifact.media!.audio || []
                        );
                      } else {
                        setIsMediaViewerOpen(true);
                      }
                    }}
                    className="btn btn-accent btn-sm"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {t('viewMedia', currentLanguage)}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {artifact.media!.images && artifact.media!.images.slice(0, 8).map((image, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-md overflow-hidden bg-neutral-100 group cursor-pointer"
                      onClick={() => {
                        if (isMobile && onMediaViewerClick) {
                          onMediaViewerClick(
                            artifact.media!.images || [],
                            artifact.media!.videos || [],
                            artifact.media!.audio || []
                          );
                        } else {
                          setIsMediaViewerOpen(true);
                        }
                      }}
                    >
                      <img
                        src={image}
                        alt={`Media ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Details Card */}
            <div className="card-lg p-5 md:p-6 sticky top-24">
              <h3 className="text-heading font-serif font-bold text-neutral-900 mb-4 pb-4 border-b border-neutral-200">
                {t('details', currentLanguage)}
              </h3>
              
              <div className="space-y-4 break-words">
                {/* Materials */}
                {artifact.materials && artifact.materials.length > 0 && (
                  <div>
                    <div className="metadata mb-3">
                      <Palette className="metadata-icon" />
                      <p className="text-caption font-semibold text-neutral-900">
                        {t('materials', currentLanguage)}
                      </p>
                    </div>
                    <p className="text-body-sm text-neutral-600 ml-6 break-words">
                      {artifact.materials.join(', ')}
                    </p>
                  </div>
                )}
                
                {/* Dimensions */}
                {artifact.dimensions && (
                  <div>
                    <div className="metadata mb-3">
                      <Ruler className="metadata-icon" />
                      <p className="text-caption font-semibold text-neutral-900">
                        {t('dimensions', currentLanguage)}
                      </p>
                    </div>
                    <p className="text-body-sm text-neutral-600 ml-6 break-words">
                      {artifact.dimensions}
                    </p>
                  </div>
                )}
                
                {/* Provenance */}
                {artifact.provenance && (
                  <div>
                    <div className="metadata mb-3">
                      <MapPin className="metadata-icon" />
                      <p className="text-caption font-semibold text-neutral-900">
                        {t('provenance', currentLanguage)}
                      </p>
                    </div>
                    <p className="text-body-sm text-neutral-600 ml-6 break-words">
                      {artifact.provenance}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {artifact.tags && artifact.tags.length > 0 && (
                  <div className="pt-6 border-t border-neutral-200">
                    <h4 className="text-caption font-semibold text-neutral-900 mb-3">
                      {t('themes', currentLanguage)}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {artifact.tags.map((tag) => (
                        <span key={tag} className="tag tag-accent">
                          <TagIcon className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {hasMedia && !isMobile && (
        <MediaViewer
          images={artifact.media!.images || []}
          videos={artifact.media!.videos || []}
          audio={artifact.media!.audio || []}
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