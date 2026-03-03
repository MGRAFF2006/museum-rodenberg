import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLanguage } from '../hooks/useLanguage';
import { getTranslatedContent } from '../utils/translationUtils';
import type { Exhibition, Artifact, Asset, RawExhibitionsData, RawArtifactsData } from '../types';

// ── Types ────────────────────────────────────────────────────────

interface ContentContextType {
  exhibitions: Exhibition[];
  artifacts: Artifact[];
  assets: Record<string, Asset>;
  featuredExhibitionId: string;
  refreshData: () => Promise<void>;
  getExhibitionById: (id: string) => Exhibition | undefined;
  getArtifactById: (id: string) => Artifact | undefined;
  getRawArtifactById: (id: string) => Record<string, unknown> | undefined;
  getRawExhibitionById: (id: string) => Record<string, unknown> | undefined;
  getArtifactsByExhibition: (exhibitionId: string) => Artifact[];
  findByQRCode: (qrCode: string) => { type: 'artifact' | 'exhibition' | null; item: Artifact | Exhibition | null };
  resolveAsset: (idOrUrl: string) => Asset | undefined;
  isLoading: boolean;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

// ── Helpers to reconstruct old JSON shapes from Convex data ──────

type ConvexExhibition = {
  _id: string;
  slug: string;
  qrCode: string;
  image: string;
  dateRange?: string;
  location?: string;
  curator?: string;
  organizer?: string;
  sponsor?: string;
  tags?: string[];
  enabledAttributes?: string[];
  isFeatured: boolean;
  artifactSlugs: string[];
  translations: Array<{
    language: string;
    title: string;
    subtitle?: string;
    description: string;
    detailedContent?: string;
  }>;
  media: Array<{
    mediaType: string;
    url: string;
    title?: string;
    description?: string;
    sortOrder: number;
  }>;
};

type ConvexArtifact = {
  _id: string;
  slug: string;
  qrCode: string;
  exhibitionSlug?: string;
  image: string;
  materials?: string[];
  dimensions?: string;
  provenance?: string;
  tags?: string[];
  enabledAttributes?: string[];
  translations: Array<{
    language: string;
    title: string;
    period?: string;
    artist?: string;
    description: string;
    significance?: string;
    detailedContent?: string;
  }>;
  media: Array<{
    mediaType: string;
    url: string;
    title?: string;
    description?: string;
    sortOrder: number;
  }>;
};

type ConvexAsset = {
  _id: string;
  assetId: string;
  name: string;
  alt: string;
  url: string;
  type: 'image' | 'audio' | 'video' | 'other';
};

/**
 * Convert a Convex exhibition + its translations/media into the old
 * JSON shape that `getTranslatedContent` expects.
 */
function convexExhibitionToRaw(ex: ConvexExhibition): Record<string, unknown> {
  const translations: Record<string, Record<string, string>> = {};
  const detailedContent: Record<string, string> = {};

  for (const t of ex.translations) {
    translations[t.language] = {
      title: t.title,
      ...(t.subtitle ? { subtitle: t.subtitle } : {}),
      description: t.description,
    };
    if (t.detailedContent) {
      detailedContent[t.language] = t.detailedContent;
    }
  }

  // Reconstruct media in old shape
  const images: string[] = [];
  const videos: Array<{ url: string; title: string; description: string }> = [];
  const audio: Array<{ url: string; title: string; description: string }> = [];

  const sorted = [...ex.media].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const m of sorted) {
    if (m.mediaType === 'image') {
      images.push(m.url);
    } else if (m.mediaType === 'video') {
      videos.push({ url: m.url, title: m.title || '', description: m.description || '' });
    } else if (m.mediaType === 'audio') {
      audio.push({ url: m.url, title: m.title || '', description: m.description || '' });
    }
  }

  return {
    id: ex.slug,
    qrCode: ex.qrCode,
    image: ex.image,
    dateRange: ex.dateRange,
    location: ex.location,
    curator: ex.curator,
    organizer: ex.organizer,
    sponsor: ex.sponsor,
    tags: ex.tags,
    enabledAttributes: ex.enabledAttributes,
    artifacts: ex.artifactSlugs,
    translations,
    detailedContent: Object.keys(detailedContent).length > 0 ? detailedContent : undefined,
    media: { images, videos, audio },
  };
}

/**
 * Convert a Convex artifact + its translations/media into the old
 * JSON shape that `getTranslatedContent` expects.
 */
function convexArtifactToRaw(art: ConvexArtifact): Record<string, unknown> {
  const translations: Record<string, Record<string, string>> = {};
  const detailedContent: Record<string, string> = {};

  for (const t of art.translations) {
    const langObj: Record<string, string> = {
      title: t.title,
      description: t.description,
    };
    if (t.period) langObj.period = t.period;
    if (t.artist) langObj.artist = t.artist;
    if (t.significance) langObj.significance = t.significance;
    translations[t.language] = langObj;
    if (t.detailedContent) {
      detailedContent[t.language] = t.detailedContent;
    }
  }

  // Reconstruct media in old shape
  const images: string[] = [];
  const videos: Array<{ url: string; title: string; description: string }> = [];
  const audio: Array<{ url: string; title: string; description: string }> = [];

  const sorted = [...art.media].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const m of sorted) {
    if (m.mediaType === 'image') {
      images.push(m.url);
    } else if (m.mediaType === 'video') {
      videos.push({ url: m.url, title: m.title || '', description: m.description || '' });
    } else if (m.mediaType === 'audio') {
      audio.push({ url: m.url, title: m.title || '', description: m.description || '' });
    }
  }

  return {
    id: art.slug,
    qrCode: art.qrCode,
    exhibition: art.exhibitionSlug,
    image: art.image,
    materials: art.materials,
    dimensions: art.dimensions,
    provenance: art.provenance,
    tags: art.tags,
    enabledAttributes: art.enabledAttributes,
    translations,
    detailedContent: Object.keys(detailedContent).length > 0 ? detailedContent : undefined,
    media: { images, videos, audio },
  };
}

// ── Provider ─────────────────────────────────────────────────────

export const ContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentLanguage } = useLanguage();

  // Reactive Convex queries
  const convexExhibitions = useQuery(api.exhibitions.list) as ConvexExhibition[] | undefined;
  const convexArtifacts = useQuery(api.artifacts.list) as ConvexArtifact[] | undefined;
  const convexAssets = useQuery(api.assets.list) as ConvexAsset[] | undefined;
  const featuredSlug = useQuery(api.exhibitions.getFeatured) as string | null | undefined;

  const isLoading = convexExhibitions === undefined
    || convexArtifacts === undefined
    || convexAssets === undefined;

  // Build asset lookup map
  const assetsMap = useMemo<Record<string, Asset>>(() => {
    if (!convexAssets) return {};
    const map: Record<string, Asset> = {};
    for (const a of convexAssets) {
      map[a.assetId] = {
        id: a.assetId,
        name: a.name,
        alt: a.alt,
        url: a.url,
        type: a.type,
      };
    }
    return map;
  }, [convexAssets]);

  const resolveAsset = useCallback((idOrUrl: string): Asset | undefined => {
    if (!idOrUrl) return undefined;
    if (assetsMap[idOrUrl]) return assetsMap[idOrUrl];
    return Object.values(assetsMap).find((a) => a.url === idOrUrl);
  }, [assetsMap]);

  // Build raw maps for admin getRaw* functions
  const rawExhibitionsMap = useMemo<Record<string, Record<string, unknown>>>(() => {
    if (!convexExhibitions) return {};
    const map: Record<string, Record<string, unknown>> = {};
    for (const ex of convexExhibitions) {
      map[ex.slug] = convexExhibitionToRaw(ex);
    }
    return map;
  }, [convexExhibitions]);

  const rawArtifactsMap = useMemo<Record<string, Record<string, unknown>>>(() => {
    if (!convexArtifacts) return {};
    const map: Record<string, Record<string, unknown>> = {};
    for (const art of convexArtifacts) {
      map[art.slug] = convexArtifactToRaw(art);
    }
    return map;
  }, [convexArtifacts]);

  // Translated exhibitions
  const exhibitions = useMemo<Exhibition[]>(() => {
    if (!convexExhibitions) return [];
    return convexExhibitions.map(ex =>
      getTranslatedContent(convexExhibitionToRaw(ex), currentLanguage, 'de', resolveAsset)
    ) as Exhibition[];
  }, [convexExhibitions, currentLanguage, resolveAsset]);

  // Translated artifacts
  const artifacts = useMemo<Artifact[]>(() => {
    if (!convexArtifacts) return [];
    return convexArtifacts.map(art =>
      getTranslatedContent(convexArtifactToRaw(art), currentLanguage, 'de', resolveAsset)
    ) as Artifact[];
  }, [convexArtifacts, currentLanguage, resolveAsset]);

  const featuredExhibitionId = featuredSlug ?? '';

  const getExhibitionById = useCallback((id: string): Exhibition | undefined => {
    return exhibitions.find(ex => ex.id === id);
  }, [exhibitions]);

  const getArtifactById = useCallback((id: string): Artifact | undefined => {
    return artifacts.find(art => art.id === id);
  }, [artifacts]);

  const getArtifactsByExhibition = useCallback((exhibitionId: string): Artifact[] => {
    const exhibition = exhibitions.find(ex => ex.id === exhibitionId);
    const listedIds = exhibition?.artifacts || [];

    return artifacts.filter(art =>
      listedIds.includes(art.id) || art.exhibition === exhibitionId
    );
  }, [exhibitions, artifacts]);

  const findByQRCode = useCallback((qrCode: string) => {
    const artifact = artifacts.find(a => a.qrCode === qrCode);
    const exhibition = exhibitions.find(e => e.qrCode === qrCode);

    return {
      type: (artifact ? 'artifact' : exhibition ? 'exhibition' : null) as 'artifact' | 'exhibition' | null,
      item: artifact || exhibition || null,
    };
  }, [artifacts, exhibitions]);

  const getRawArtifactById = useCallback((id: string): Record<string, unknown> | undefined => {
    return rawArtifactsMap[id];
  }, [rawArtifactsMap]);

  const getRawExhibitionById = useCallback((id: string): Record<string, unknown> | undefined => {
    return rawExhibitionsMap[id];
  }, [rawExhibitionsMap]);

  // refreshData is a no-op with Convex (data is reactive)
  const refreshData = useCallback(async () => {
    // Convex subscriptions auto-update, no manual refresh needed
  }, []);

  const value: ContentContextType = {
    exhibitions,
    artifacts,
    assets: assetsMap,
    featuredExhibitionId,
    refreshData,
    getExhibitionById,
    getArtifactById,
    getRawArtifactById,
    getRawExhibitionById,
    getArtifactsByExhibition,
    findByQRCode,
    resolveAsset,
    isLoading,
  };

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};

// Re-export the types needed by the old ContentContext consumers
export type { RawExhibitionsData, RawArtifactsData };
