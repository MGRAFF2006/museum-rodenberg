import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { getTranslatedContent } from '../utils/translationUtils';
import initialExhibitionsData from '../content/exhibitions.json';
import initialArtifactsData from '../content/artifacts.json';
import initialAssetsData from '../content/assets.json';
import type { Exhibition, Artifact, Asset, RawExhibitionsData, RawArtifactsData, RawAssetsData } from '../types';

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
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentLanguage } = useLanguage();
  const [exhibitionsRaw, setExhibitionsRaw] = useState<RawExhibitionsData>(initialExhibitionsData as RawExhibitionsData);
  const [artifactsRaw, setArtifactsRaw] = useState<RawArtifactsData>(initialArtifactsData as RawArtifactsData);
  const [assetsRaw, setAssetsRaw] = useState<RawAssetsData>(initialAssetsData as RawAssetsData);

  const refreshData = useCallback(async () => {
    try {
      // In development, we fetch the latest JSON files to reflect changes made by the admin
      const [exRes, artRes, assetRes] = await Promise.all([
        fetch('/src/content/exhibitions.json?v=' + Date.now()),
        fetch('/src/content/artifacts.json?v=' + Date.now()),
        fetch('/src/content/assets.json?v=' + Date.now())
      ]);
      
      if (exRes.ok && artRes.ok && assetRes.ok) {
        const exData: RawExhibitionsData = await exRes.json();
        const artData: RawArtifactsData = await artRes.json();
        const assetData: RawAssetsData = await assetRes.json();
        
        // Only update state if data actually changed to avoid unnecessary re-renders
        setExhibitionsRaw(prev => JSON.stringify(prev) !== JSON.stringify(exData) ? exData : prev);
        setArtifactsRaw(prev => JSON.stringify(prev) !== JSON.stringify(artData) ? artData : prev);
        setAssetsRaw(prev => JSON.stringify(prev) !== JSON.stringify(assetData) ? assetData : prev);
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }, []);

  // Polling mechanism for development
  useEffect(() => {
    const isDev = import.meta.env.DEV;
    if (isDev) {
      const interval = setInterval(refreshData, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [refreshData]);

  const resolveAsset = useCallback((idOrUrl: string): Asset | undefined => {
    if (!idOrUrl) return undefined;
    const assets = assetsRaw.assets;
    if (assets[idOrUrl]) return assets[idOrUrl];
    return Object.values(assets).find((a) => a.url === idOrUrl);
  }, [assetsRaw]);

  const exhibitions = useMemo(() => {
    return Object.values(exhibitionsRaw.exhibitions).map(exhibition =>
      getTranslatedContent(exhibition as Record<string, unknown>, currentLanguage, 'de', resolveAsset)
    ) as Exhibition[];
  }, [currentLanguage, exhibitionsRaw, resolveAsset]);
  
  const artifacts = useMemo(() => {
    return Object.values(artifactsRaw.artifacts).map(artifact =>
      getTranslatedContent(artifact as Record<string, unknown>, currentLanguage, 'de', resolveAsset)
    ) as Artifact[];
  }, [currentLanguage, artifactsRaw, resolveAsset]);

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
    return artifactsRaw.artifacts[id];
  }, [artifactsRaw]);

  const getRawExhibitionById = useCallback((id: string): Record<string, unknown> | undefined => {
    return exhibitionsRaw.exhibitions[id];
  }, [exhibitionsRaw]);

  const value = {
    exhibitions,
    artifacts,
    assets: assetsRaw.assets,
    featuredExhibitionId: exhibitionsRaw.featured,
    refreshData,
    getExhibitionById,
    getArtifactById,
    getRawArtifactById,
    getRawExhibitionById,
    getArtifactsByExhibition,
    findByQRCode,
    resolveAsset
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
