import React from 'react';
import { ArrowLeft, Calendar, MapPin, User, Tag as TagIcon, Play, BookOpen, Sparkles } from 'lucide-react';
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
    (exhibition.media.images && exhibition.media.images.length > 0) ||
    (exhibition.media.videos && exhibition.media.videos.length > 0) ||
    (exhibition.media.audio && exhibition.media.audio.length > 0)
  );

  const hasDetailedContent = exhibition.detailedContent && exhibition.detailedContent[currentLanguage];


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
              {t('backToExhibitions', currentLanguage)}
            </span>
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative min-h-[16rem] md:min-h-[24rem] overflow-hidden bg-neutral-200">
        <img
          src={exhibition.image}
          alt={exhibition.title}
          className="w-full h-full object-cover absolute inset-0"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-end">
          <div className="container-max max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 md:pb-8 pt-16 md:pt-24 w-full">
            <h1 className="text-heading-xl md:text-display font-serif font-bold text-white mb-2 md:mb-3">
              {exhibition.title}
            </h1>
            {exhibition.subtitle && (
              <p className="text-body-lg text-primary-100 mb-2 md:mb-4">
                {exhibition.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-max max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-8 md:py-10">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">

            {/* About Exhibition */}
            <section className="card-lg p-5 md:p-6">
              <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-neutral-200">
                <h2 className="text-heading-lg font-serif font-bold text-neutral-900">
                  {t('aboutExhibition', currentLanguage)}
                </h2>
                {exhibition.description && (
                  <TextToSpeechButton
                    text={exhibition.description}
                    language={currentLanguage}
                    size="md"
                  />
                )}
              </div>
              <p className="text-body-lg leading-relaxed text-neutral-700 mb-4">
                {exhibition.description}
              </p>
              {hasDetailedContent && (
                <button
                  onClick={() => {
                    if (isMobile && onDetailedContentClick) {
                      onDetailedContentClick('exhibition', exhibition.id);
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
                          exhibition.media!.images || [],
                          exhibition.media!.videos || [],
                          exhibition.media!.audio || []
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
                  {exhibition.media!.images && exhibition.media!.images.slice(0, 8).map((image, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-md overflow-hidden bg-neutral-100 group cursor-pointer"
                      onClick={() => {
                        if (isMobile && onMediaViewerClick) {
                          onMediaViewerClick(
                            exhibition.media!.images || [],
                            exhibition.media!.videos || [],
                            exhibition.media!.audio || []
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

            {/* Artifacts Section */}
            <section className="card-lg p-5 md:p-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-200">
                <Sparkles className="h-6 w-6 text-accent-600" />
                <h2 className="text-heading-lg font-serif font-bold text-neutral-900">
                  {t('artifacts', currentLanguage)}
                </h2>
              </div>
              <div className="grid-responsive">
                {artifacts.map((artifact) => (
                  <ArtifactCard
                    key={artifact.id}
                    artifact={artifact}
                    onClick={onArtifactClick}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card-lg p-5 md:p-6 sticky top-24">
              <h3 className="text-heading font-serif font-bold text-neutral-900 mb-4 pb-4 border-b border-neutral-200">
                {t('exhibitionDetails', currentLanguage)}
              </h3>
              
              <div className="space-y-4 break-words">
                {/* Date Range */}
                {exhibition.dateRange && (
                  <div>
                    <div className="metadata mb-3">
                      <Calendar className="metadata-icon" />
                      <p className="text-caption font-semibold text-neutral-900">
                        {t('period', currentLanguage)}
                      </p>
                    </div>
                    <p className="text-body-sm text-neutral-600 ml-6 break-words">
                      {exhibition.dateRange}
                    </p>
                  </div>
                )}
                
                {/* Location */}
                {exhibition.location && (
                  <div>
                    <div className="metadata mb-3">
                      <MapPin className="metadata-icon" />
                      <p className="text-caption font-semibold text-neutral-900">
                        {t('location', currentLanguage)}
                      </p>
                    </div>
                    <p className="text-body-sm text-neutral-600 ml-6 break-words">
                      {exhibition.location}
                    </p>
                  </div>
                )}
                
                {/* Curator */}
                {exhibition.curator && (
                  <div>
                    <div className="metadata mb-3">
                      <User className="metadata-icon" />
                      <p className="text-caption font-semibold text-neutral-900">
                        {t('curator', currentLanguage)}
                      </p>
                    </div>
                    <p className="text-body-sm text-neutral-600 ml-6 break-words">
                      {exhibition.curator}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {exhibition.tags && exhibition.tags.length > 0 && (
                  <div className="pt-6 border-t border-neutral-200">
                    <h4 className="text-caption font-semibold text-neutral-900 mb-3">
                      {t('themes', currentLanguage)}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {exhibition.tags.map((tag) => (
                        <span key={tag} className="tag">
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
          images={exhibition.media!.images || []}
          videos={exhibition.media!.videos || []}
          audio={exhibition.media!.audio || []}
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