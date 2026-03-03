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
  [key: string]: Translation | undefined;
}

export interface MediaItem {
  url: string;
  title: string;
  description: string;
}

export interface Asset {
  id: string;
  name: string;
  alt: string;
  url: string;
  type: 'image' | 'audio' | 'video' | 'other';
}

export interface Media {
  images?: string[];
  videos?: MediaItem[];
  audio?: MediaItem[];
}

/** Media shape with all fields required (used by DetailedContentModal / MediaViewer) */
export interface RequiredMedia {
  images: string[];
  videos: MediaItem[];
  audio: MediaItem[];
}

export interface DetailedContent {
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
  organizer?: string;
  sponsor?: string;
  tags?: string[];
  enabledAttributes?: string[];
  translations?: Translations;
  isTranslationMissing?: boolean;
  _hashes?: Record<string, string>;
  [key: string]: unknown;
}

// Runtime Artifact type after getTranslatedContent transformation
export interface Artifact {
  id: string;
  qrCode: string;
  title: string;
  artist?: string;
  period?: string;
  description: string;
  image: string;
  materials?: string[];
  dimensions?: string;
  provenance?: string;
  significance?: string;
  dateCreated?: string;
  condition?: string;
  tags?: string[];
  enabledAttributes?: string[];
  media?: Media;
  exhibition?: string;
  detailedContent?: DetailedContent;
  translations?: Translations;
  isTranslationMissing?: boolean;
  _hashes?: Record<string, string>;
  [key: string]: unknown;
}

// ── Raw JSON wrapper types (shape of the imported .json files) ────

/** Shape of exhibitions.json */
export interface RawExhibitionsData {
  featured: string;
  exhibitions: Record<string, Record<string, unknown>>;
}

/** Shape of artifacts.json */
export interface RawArtifactsData {
  artifacts: Record<string, Record<string, unknown>>;
}

/** Shape of assets.json */
export interface RawAssetsData {
  assets: Record<string, Asset>;
}

// ── Shared entity record used for editor form data ──────────────

/** Loosely-typed record used in editor forms and bulk operations. */
export interface EntityRecord {
  id?: string;
  translations?: Record<string, Record<string, string>>;
  detailedContent?: Record<string, string>;
  _hashes?: Record<string, string>;
  media?: RequiredMedia;
  enabledAttributes?: string[];
  image?: string;
  [key: string]: unknown;
}

export type Language = 'de' | 'en' | 'fr' | 'es' | 'it' | 'nl' | 'pl';

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
