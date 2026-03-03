import React, { useState } from 'react';
import { ArrowLeft, Calendar, MapPin, User, Tag as TagIcon, Play, BookOpen, Sparkles, Building2 } from 'lucide-react';
import { ArtifactCard } from './ArtifactCard';
import { MediaViewer } from './MediaViewer';
import { DetailedContentModal } from './DetailedContentModal';
import { TextToSpeechButton } from './TextToSpeechButton';
import { useIsMobile } from '../hooks/useIsMobile';
import { useLanguage } from '../hooks/useLanguage';

import { Exhibition, Artifact, MediaItem, RequiredMedia } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { TranslationWarning } from './TranslationWarning';
import { stripMarkdown } from '../utils/markdownUtils';

interface ExhibitionDetailProps {
  exhibition: Exhibition;
  artifacts: Artifact[];
  onBack: () => void;
  onArtifactClick: (id: string) => void;
  onDetailedContentClick?: (type: 'exhibition' | 'artifact', id: string) => void;
  onMediaViewerClick?: (images: string[], videos: MediaItem[], audio: MediaItem[]) => void;
}

export const ExhibitionDetail: React.FC<ExhibitionDetailProps> = ({
  exhibition,
  artifacts,
  onBack,
  onArtifactClick,
  onDetailedContentClick,
  onMediaViewerClick,
}) => {
  const { currentLanguage, t } = useLanguage();
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const [mediaViewerInitialItem, setMediaViewerInitialItem] = useState<{type: 'image' | 'video' | 'audio', url: string} | undefined>();
  const [isDetailedContentOpen, setIsDetailedContentOpen] = useState(false);
  const isMobile = useIsMobile();

  const isEnabled = (attr: string) => {
    if (!exhibition.enabledAttributes) return true; // Default to true if not set
    return exhibition.enabledAttributes.includes(attr);
  };

  const handleMediaClick = (type: 'image' | 'video' | 'audio', url: string) => {
    if (isMobile && onMediaViewerClick) {
      onMediaViewerClick(
        exhibition.media?.images || [],
        exhibition.media?.videos || [],
        exhibition.media?.audio || []
      );
    } else {
      setMediaViewerInitialItem({ type, url });
      setIsMediaViewerOpen(true);
    }
  };

  const hasMedia = isEnabled('media') && exhibition.media && (
    (exhibition.media.images && exhibition.media.images.length > 0) ||
    (exhibition.media.videos && exhibition.media.videos.length > 0) ||
    (exhibition.media.audio && exhibition.media.audio.length > 0)
  );

  const hasDetailedContent = isEnabled('detailedContent') && exhibition.detailedContent && exhibition.detailedContent[currentLanguage];


  return (
    <div className="bg-neutral-50 min-h-screen">
      {/* Navigation Bar */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="container-max max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={onBack}
            className="flex items-center py-4 text-primary-600 hover:text-primary-700 transition-colors focus-ring-sm"
            aria-label={t('back')}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="text-body font-medium">
              {t('backToExhibitions')}
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
            {isEnabled('subtitle') && exhibition.subtitle && (
              <p className="text-body-lg text-primary-100 mb-2 md:mb-4">
                {exhibition.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-max max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-8 md:pt-10">
          <TranslationWarning isMissing={!!exhibition.isTranslationMissing} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8 md:pb-10">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">

            {/* About Exhibition */}
            {isEnabled('description') && exhibition.description && (
              <section className="card-lg p-5 md:p-6">
                <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-neutral-200">
                  <h2 className="text-heading-lg font-serif font-bold text-neutral-900">
                    {t('aboutExhibition')}
                  </h2>
                  <TextToSpeechButton
                    text={stripMarkdown(exhibition.description)}
                    language={currentLanguage}
                    size="md"
                  />
                </div>
                <div className="mb-4">
                  <MarkdownRenderer content={exhibition.description} onMediaClick={handleMediaClick} />
                </div>
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
                    {t('readMore')}
                  </button>
                )}
              </section>
            )}

            {/* Media Section */}
            {hasMedia && (
              <section className="card-lg p-5 md:p-6">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-200">
                  <h2 className="text-heading-lg font-serif font-bold text-neutral-900">
                    {t('media')}
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
                    {t('viewMedia')}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Images */}
                  {exhibition.media!.images && exhibition.media!.images.slice(0, 8).map((image, index) => (
                    <div
                      key={`img-${index}`}
                      className="aspect-square rounded-md overflow-hidden bg-neutral-100 group cursor-pointer border border-neutral-200"
                      onClick={() => handleMediaClick('image', image)}
                    >
                      <img
                        src={image}
                        alt={`Media ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ))}
                  
                  {/* Videos Preview */}
                  {exhibition.media!.videos && exhibition.media!.videos.slice(0, 4).map((video, index) => (
                    <div
                      key={`vid-${index}`}
                      className="aspect-square rounded-md overflow-hidden bg-neutral-900 group cursor-pointer flex flex-col items-center justify-center relative border border-neutral-200"
                      onClick={() => handleMediaClick('video', video.url)}
                    >
                      <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity">
                         <video src={video.url} className="w-full h-full object-cover" />
                      </div>
                      <Play className="h-10 w-10 text-white z-10" />
                      <span className="text-[10px] text-white absolute bottom-1 left-1 right-1 truncate text-center z-10 bg-black/50 px-1 rounded">
                        {video.title || 'Video'}
                      </span>
                    </div>
                  ))}

                  {/* Audio Preview */}
                  {exhibition.media!.audio && exhibition.media!.audio.slice(0, 4).map((audio, index) => (
                    <div
                      key={`aud-${index}`}
                      className="aspect-square rounded-md overflow-hidden bg-primary-50 group cursor-pointer flex flex-col items-center justify-center border border-primary-100 relative"
                      onClick={() => handleMediaClick('audio', audio.url)}
                    >
                      <BookOpen className="h-10 w-10 text-primary-400" />
                      <span className="text-[10px] text-primary-700 absolute bottom-1 left-1 right-1 truncate text-center px-1">
                        {audio.title || 'Audio'}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Artifacts Section */}
            {artifacts.length > 0 && (
              <section className="card-lg p-5 md:p-6">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-200">
                  <Sparkles className="h-6 w-6 text-accent-600" />
                  <h2 className="text-heading-lg font-serif font-bold text-neutral-900">
                    {t('artifacts')}
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
            )}
      </div>

      {/* Sidebar */}
      {(
        (isEnabled('dateRange') && exhibition.dateRange) || 
        (isEnabled('location') && exhibition.location) || 
        (isEnabled('curator') && exhibition.curator) || 
        (isEnabled('organizer') && exhibition.organizer) ||
        (isEnabled('tags') && exhibition.tags?.length)
      ) ? (
        <div className="lg:col-span-1">
          <div className="card-lg p-5 md:p-6 sticky top-24">
            <h3 className="text-heading font-serif font-bold text-neutral-900 mb-4 pb-4 border-b border-neutral-200">
              {t('exhibitionDetails')}
            </h3>
            
            <div className="space-y-4 break-words">
              {/* Date Range */}
              {isEnabled('dateRange') && exhibition.dateRange && (
                <div>
                  <div className="metadata mb-3">
                    <Calendar className="metadata-icon" />
                    <p className="text-caption font-semibold text-neutral-900">
                      {t('period')}
                    </p>
                  </div>
                  <p className="text-body-sm text-neutral-600 ml-6 break-words">
                    {exhibition.dateRange}
                  </p>
                </div>
              )}
              
              {/* Location */}
              {isEnabled('location') && exhibition.location && (
                <div>
                  <div className="metadata mb-3">
                    <MapPin className="metadata-icon" />
                    <p className="text-caption font-semibold text-neutral-900">
                      {t('location')}
                    </p>
                  </div>
                  <p className="text-body-sm text-neutral-600 ml-6 break-words">
                    {exhibition.location}
                  </p>
                </div>
              )}
              
              {/* Curator */}
              {isEnabled('curator') && exhibition.curator && (
                <div>
                  <div className="metadata mb-3">
                    <User className="metadata-icon" />
                    <p className="text-caption font-semibold text-neutral-900">
                      {t('curator')}
                    </p>
                  </div>
                  <p className="text-body-sm text-neutral-600 ml-6 break-words">
                    {exhibition.curator}
                  </p>
                </div>
              )}

              {/* Organizer */}
              {isEnabled('organizer') && (exhibition.organizer || (exhibition.translations?.[currentLanguage]?.organizer)) && (
                <div>
                  <div className="metadata mb-3">
                    <Building2 className="metadata-icon" />
                    <p className="text-caption font-semibold text-neutral-900">
                      Organizer
                    </p>
                  </div>
                  <p className="text-body-sm text-neutral-600 ml-6 break-words">
                    {(exhibition.translations?.[currentLanguage]?.organizer as string) || (exhibition.organizer as string)}
                  </p>
                </div>
              )}

              {/* Tags */}
              {isEnabled('tags') && exhibition.tags && exhibition.tags.length > 0 && (
                <div className="pt-6 border-t border-neutral-200">
                  <h4 className="text-caption font-semibold text-neutral-900 mb-3">
                    {t('themes')}
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
      ) : null}
        </div>
      </div>
      
      {hasMedia && !isMobile && (
        <MediaViewer
          images={exhibition.media!.images || []}
          videos={exhibition.media!.videos || []}
          audio={exhibition.media!.audio || []}
          isOpen={isMediaViewerOpen}
          onClose={() => {
            setIsMediaViewerOpen(false);
            setMediaViewerInitialItem(undefined);
          }}
          initialItem={mediaViewerInitialItem}
        />
      )}
      
      {hasDetailedContent && !isMobile && (
        <DetailedContentModal
          isOpen={isDetailedContentOpen}
          onClose={() => setIsDetailedContentOpen(false)}
          title={exhibition.title}
          content={exhibition.detailedContent![currentLanguage] || ''}
          media={exhibition.media as RequiredMedia}
        />
      )}
    </div>
  );
};
