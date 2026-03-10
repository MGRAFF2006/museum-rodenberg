import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLanguage } from '../hooks/useLanguage';
import { getTranslatedContent } from '../utils/translationUtils';
import {
  convexExhibitionToRaw,
  convexArtifactToRaw,
  type ConvexExhibition,
  type ConvexArtifact,
  type ConvexAsset,
} from '../utils/convexConverters';
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

// ── Provider ─────────────────────────────────────────────────────

export const ContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentLanguage } = useLanguage();

  // Language-filtered queries — only fetch current language + de fallback.
  // This sends ~1/7th the translation data vs the full list query.
  // DetailedContent is stripped server-side (only needed on detail pages).
  const convexExhibitions = useQuery(
    api.exhibitions.listForLanguage,
    { language: currentLanguage }
  ) as ConvexExhibition[] | undefined;
  const convexArtifacts = useQuery(
    api.artifacts.listForLanguage,
    { language: currentLanguage }
  ) as ConvexArtifact[] | undefined;
  const convexAssets = useQuery(api.assets.list) as ConvexAsset[] | undefined;
  const featuredSlug = useQuery(api.exhibitions.getFeatured) as string | null | undefined;

  const isLoading = convexExhibitions === undefined
    || convexArtifacts === undefined
    || convexAssets === undefined;

  // Build asset lookup maps — both by ID and by URL for O(1) resolveAsset
  const { assetsMap, urlToAsset } = useMemo(() => {
    if (!convexAssets) return { assetsMap: {} as Record<string, Asset>, urlToAsset: new Map<string, Asset>() };
    const byId: Record<string, Asset> = {};
    const byUrl = new Map<string, Asset>();
    for (const a of convexAssets) {
      const asset: Asset = {
        id: a.assetId,
        name: a.name,
        alt: a.alt,
        url: a.url,
        type: a.type,
      };
      byId[a.assetId] = asset;
      byUrl.set(a.url, asset);
    }
    return { assetsMap: byId, urlToAsset: byUrl };
  }, [convexAssets]);

  const resolveAsset = useCallback((idOrUrl: string): Asset | undefined => {
    if (!idOrUrl) return undefined;
    // O(1) lookup by asset ID
    if (assetsMap[idOrUrl]) return assetsMap[idOrUrl];
    // O(1) lookup by URL (was previously O(n) linear scan)
    return urlToAsset.get(idOrUrl);
  }, [assetsMap, urlToAsset]);

  // Build raw maps once — reused by both getRaw* functions and translated data
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

  // Translated exhibitions — reuses rawExhibitionsMap (no double conversion)
  const exhibitions = useMemo<Exhibition[]>(() => {
    const rawEntries = Object.values(rawExhibitionsMap);
    if (rawEntries.length === 0) return [];
    return rawEntries.map(raw =>
      getTranslatedContent(raw, currentLanguage, 'de', resolveAsset)
    ) as Exhibition[];
  }, [rawExhibitionsMap, currentLanguage, resolveAsset]);

  // Translated artifacts — reuses rawArtifactsMap (no double conversion)
  const artifacts = useMemo<Artifact[]>(() => {
    const rawEntries = Object.values(rawArtifactsMap);
    if (rawEntries.length === 0) return [];
    return rawEntries.map(raw =>
      getTranslatedContent(raw, currentLanguage, 'de', resolveAsset)
    ) as Artifact[];
  }, [rawArtifactsMap, currentLanguage, resolveAsset]);

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

  // getRaw* returns language-filtered data (current lang + de).
  // Admin editors that need all languages use useQuery(api.*.getBySlug) directly.
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

  // No longer blocks rendering — children render immediately with empty arrays
  // while Convex data loads. The app shell (header, navigation) appears instantly.
  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
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
