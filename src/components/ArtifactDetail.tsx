import React, { useState } from 'react';
import { ArrowLeft, Calendar, Ruler, MapPin, Palette, Info, Tag as TagIcon, Play, BookOpen, User } from 'lucide-react';
import { MediaViewer } from './MediaViewer';
import { DetailedContentModal } from './DetailedContentModal';
import { TextToSpeechButton } from './TextToSpeechButton';
import { useIsMobile } from '../hooks/useIsMobile';
import { useLanguage } from '../hooks/useLanguage';
import { Artifact, MediaItem, RequiredMedia } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { TranslationWarning } from './TranslationWarning';
import { stripMarkdown } from '../utils/markdownUtils';

interface ArtifactDetailProps {
  artifact: Artifact;
  onBack: () => void;
  exhibitionTitle?: string;
  onDetailedContentClick?: (type: 'artifact' | 'exhibition', id: string) => void;
  onMediaViewerClick?: (images: string[], videos: MediaItem[], audio: MediaItem[]) => void;
}

export const ArtifactDetail: React.FC<ArtifactDetailProps> = ({
  artifact,
  onBack,
  exhibitionTitle,
  onDetailedContentClick,
  onMediaViewerClick,
}) => {
  const { currentLanguage, t } = useLanguage();
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const [mediaViewerInitialItem, setMediaViewerInitialItem] = useState<{type: 'image' | 'video' | 'audio', url: string} | undefined>();
  const [isDetailedContentOpen, setIsDetailedContentOpen] = useState(false);
  const isMobile = useIsMobile();

  const isEnabled = (attr: string) => {
    if (!artifact.enabledAttributes) return true; // Default to true if not set
    return artifact.enabledAttributes.includes(attr);
  };

  const hasMedia = isEnabled('media') && artifact.media && (
    (artifact.media.images && artifact.media.images.length > 0) ||
    (artifact.media.videos && artifact.media.videos.length > 0) ||
    (artifact.media.audio && artifact.media.audio.length > 0)
  );

  const hasDetailedContent = isEnabled('detailedContent') && artifact.detailedContent && artifact.detailedContent[currentLanguage];

  const handleMediaClick = (type: 'image' | 'video' | 'audio', url: string) => {
    if (isMobile && onMediaViewerClick) {
      onMediaViewerClick(
        artifact.media?.images || [],
        artifact.media?.videos || [],
        artifact.media?.audio || []
      );
    } else {
      setMediaViewerInitialItem({ type, url });
      setIsMediaViewerOpen(true);
    }
  };

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
              {exhibitionTitle ? `${t('backTo')} ${exhibitionTitle}` : t('backToExhibitions')}
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
                {isEnabled('period') && artifact.period && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-accent-300" />
                    <p className="text-heading-sm font-semibold text-accent-300">
                      {artifact.period}
                    </p>
                  </div>
                )}
              </div>
              {isEnabled('description') && artifact.description && (
                <TextToSpeechButton
                  text={stripMarkdown(artifact.description)}
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
        <div className="pt-8 md:pt-10">
          <TranslationWarning isMissing={!!artifact.isTranslationMissing} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8 md:pb-10">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">

            {/* Description Card */}
            {isEnabled('description') && artifact.description && (
              <section className="card-lg p-5 md:p-6">
                <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-neutral-200">
                  <h2 className="text-heading-lg font-serif font-bold text-neutral-900">
                    {t('description')}
                  </h2>
                  <TextToSpeechButton
                    text={stripMarkdown(artifact.description)}
                    language={currentLanguage}
                    size="md"
                  />
                </div>
                <div className="mb-4">
                  <MarkdownRenderer content={artifact.description} onMediaClick={handleMediaClick} />
                </div>
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
                    {t('readMore')}
                  </button>
                )}
              </section>
            )}

            {/* Significance Card */}
            {isEnabled('significance') && artifact.significance && (
              <section className="card-lg p-5 md:p-6">
                <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-neutral-200">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <h2 className="text-heading-lg font-serif font-bold text-neutral-900">
                      {t('historicalSignificance')}
                    </h2>
                  </div>
                  <TextToSpeechButton
                    text={stripMarkdown(artifact.significance)}
                    language={currentLanguage}
                    size="md"
                  />
                </div>
                <div className="mt-4">
                  <MarkdownRenderer content={artifact.significance} onMediaClick={handleMediaClick} />
                </div>
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
                    {t('viewMedia')}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Images */}
                  {artifact.media!.images && artifact.media!.images.slice(0, 8).map((image, index) => (
                    <div
                      key={`img-${index}`}
                      className="aspect-square rounded-md overflow-hidden bg-neutral-100 group cursor-pointer border border-neutral-200"
                      onClick={() => handleMediaClick('image', image)}
                    >
                      <img
                        src={image}
                        alt={`Media ${index + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ))}
                  
                  {/* Videos Preview */}
                  {artifact.media!.videos && artifact.media!.videos.slice(0, 4).map((video, index) => (
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
                  {artifact.media!.audio && artifact.media!.audio.slice(0, 4).map((audio, index) => (
                    <div
                      key={`aud-${index}`}
                      className="aspect-square rounded-md overflow-hidden bg-primary-50 group cursor-pointer flex flex-col items-center justify-center border border-primary-100"
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
          </div>

          {/* Sidebar */}
          {(
            (isEnabled('artist') && (artifact.artist || artifact.translations?.[currentLanguage]?.artist)) ||
            (isEnabled('materials') && artifact.materials?.length) || 
            (isEnabled('dimensions') && artifact.dimensions) || 
            (isEnabled('provenance') && artifact.provenance) || 
            (isEnabled('tags') && artifact.tags?.length)
          ) ? (
            <div className="lg:col-span-1">
              {/* Details Card */}
              <div className="card-lg p-5 md:p-6 sticky top-24">
                <h3 className="text-heading font-serif font-bold text-neutral-900 mb-4 pb-4 border-b border-neutral-200">
                  {t('details')}
                </h3>
                
                <div className="space-y-4 break-words">
                  {/* Artist */}
                  {isEnabled('artist') && (artifact.artist || artifact.translations?.[currentLanguage]?.artist) && (
                    <div>
                      <div className="metadata mb-3">
                        <User className="metadata-icon" />
                        <p className="text-caption font-semibold text-neutral-900">
                          Artist/Creator
                        </p>
                      </div>
                      <p className="text-body-sm text-neutral-600 ml-6 break-words">
                        {(artifact.translations?.[currentLanguage]?.artist as string) || (artifact.artist as string)}
                      </p>
                    </div>
                  )}

                  {/* Materials */}
                  {isEnabled('materials') && artifact.materials && artifact.materials.length > 0 && (
                    <div>
                      <div className="metadata mb-3">
                        <Palette className="metadata-icon" />
                        <p className="text-caption font-semibold text-neutral-900">
                          {t('materials')}
                        </p>
                      </div>
                      <p className="text-body-sm text-neutral-600 ml-6 break-words">
                        {artifact.materials.join(', ')}
                      </p>
                    </div>
                  )}
                  
                  {/* Dimensions */}
                  {isEnabled('dimensions') && artifact.dimensions && (
                    <div>
                      <div className="metadata mb-3">
                        <Ruler className="metadata-icon" />
                        <p className="text-caption font-semibold text-neutral-900">
                          {t('dimensions')}
                        </p>
                      </div>
                      <p className="text-body-sm text-neutral-600 ml-6 break-words">
                        {artifact.dimensions}
                      </p>
                    </div>
                  )}
                  
                  {/* Provenance */}
                  {isEnabled('provenance') && artifact.provenance && (
                    <div>
                      <div className="metadata mb-3">
                        <MapPin className="metadata-icon" />
                        <p className="text-caption font-semibold text-neutral-900">
                          {t('provenance')}
                        </p>
                      </div>
                      <p className="text-body-sm text-neutral-600 ml-6 break-words">
                        {artifact.provenance}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {isEnabled('tags') && artifact.tags && artifact.tags.length > 0 && (
                    <div className="pt-6 border-t border-neutral-200">
                      <h4 className="text-caption font-semibold text-neutral-900 mb-3">
                        {t('themes')}
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
          ) : null}
        </div>
      </div>
      
      {hasMedia && !isMobile && (
        <MediaViewer
          images={artifact.media!.images || []}
          videos={artifact.media!.videos || []}
          audio={artifact.media!.audio || []}
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
          title={artifact.title}
          content={artifact.detailedContent![currentLanguage] || ''}
          media={artifact.media as RequiredMedia}
        />
      )}
    </div>
  );
};
