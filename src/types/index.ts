// Shared type definitions for the Museum Rodenberg application

export interface Translation {
  title?: string;
  subtitle?: string;
  period?: string;
  description?: string;
  significance?: string;
  [key: string]: string | undefined;
}

export interface Translations {
  de: Translation;
  en: Translation;
  fr: Translation;
}

export interface MediaItem {
  url: string;
  title: string;
  description: string;
}

export interface Media {
  images: string[];
  videos: MediaItem[];
  audio: MediaItem[];
}

export interface DetailedContent {
  de?: string;
  en?: string;
  fr?: string;
  [key: string]: string | undefined;
}

// Runtime Exhibition type after getTranslatedContent transformation
export interface Exhibition {
  id: string;
  qrCode: string;
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  artifacts?: string[];
  media?: Media;
  detailedContent?: DetailedContent;
  dateRange?: string;
  location?: string;
  curator?: string;
  tags?: string[];
  translations?: Translations;
  [key: string]: unknown;
}

// Runtime Artifact type after getTranslatedContent transformation
export interface Artifact {
  id: string;
  qrCode: string;
  title: string;
  period?: string;
  description: string;
  image: string;
  materials?: string[];
  dimensions?: string;
  provenance?: string;
  significance?: string;
  tags?: string[];
  media?: Media;
  exhibition?: string;
  detailedContent?: DetailedContent;
  translations?: Translations;
  [key: string]: unknown;
}

export type Language = 'de' | 'en' | 'fr';

export type ViewType = 'home' | 'exhibition' | 'artifact' | 'search' | 'detailed-content' | 'media-viewer';

export interface ViewState {
  type: ViewType;
  id?: string;
  contentType?: 'exhibition' | 'artifact';
  mediaType?: 'images' | 'videos' | 'audio';
}

export interface ArtifactCardProps {
  artifact: Artifact;
  onClick: () => void;
}

export interface ExhibitionCardProps {
  exhibition: Exhibition;
  onClick: () => void;
}

export interface ArtifactDetailProps {
  artifact: Artifact;
  onBack: () => void;
  onDetailedContentClick: () => void;
  onMediaViewerClick?: (images: string[], videos: MediaItem[], audio: MediaItem[]) => void;
}

export interface ExhibitionDetailProps {
  exhibition: Exhibition;
  artifacts: Artifact[];
  onBack: () => void;
  onArtifactClick: (artifactId: string) => void;
  onDetailedContentClick: () => void;
  onMediaViewerClick?: (images: string[], videos: MediaItem[], audio: MediaItem[]) => void;
}

export interface DetailedContentPageProps {
  content: string;
  title: string;
  onBack: () => void;
  onMediaViewerClick?: (mediaId: string, mediaType: 'images' | 'videos' | 'audio') => void;
}

export interface MediaViewerPageProps {
  images: string[];
  videos: MediaItem[];
  audio: MediaItem[];
  initialType?: 'images' | 'videos' | 'audio';
  onBack: () => void;
}

export interface SearchResultsProps {
  query: string;
  exhibitions: Exhibition[];
  artifacts: Artifact[];
  onExhibitionClick: (exhibitionId: string) => void;
  onArtifactClick: (artifactId: string) => void;
  onBack: () => void;
}
