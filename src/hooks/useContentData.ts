import { useMemo, useCallback } from 'react';
import { useLanguage } from './useLanguage';
import { getTranslatedContent } from '../utils/translations';
import exhibitionsData from '../content/exhibitions.json';
import artifactsData from '../content/artifacts.json';
import type { Exhibition, Artifact } from '../types';

export const useContentData = () => {
  const { currentLanguage } = useLanguage();

  const exhibitions = useMemo(() => {
    return Object.values(exhibitionsData.exhibitions).map(exhibition =>
      getTranslatedContent(exhibition, currentLanguage)
    ) as Exhibition[];
  }, [currentLanguage]);
  
  const artifacts = useMemo(() => {
    return Object.values(artifactsData.artifacts).map(artifact =>
      getTranslatedContent(artifact, currentLanguage)
    ) as Artifact[];
  }, [currentLanguage]);

  const getExhibitionById = useCallback((id: string): Exhibition | undefined => {
    return exhibitions.find(ex => ex.id === id);
  }, [exhibitions]);

  const getArtifactById = useCallback((id: string): Artifact | undefined => {
    return artifacts.find(art => art.id === id);
  }, [artifacts]);

  const getArtifactsByExhibition = useCallback((exhibitionId: string): Artifact[] => {
    const exhibition = exhibitions.find(ex => ex.id === exhibitionId);
    if (!exhibition || !exhibition.artifacts) return [];
    return artifacts.filter(art => exhibition.artifacts!.includes(art.id));
  }, [exhibitions, artifacts]);

  const findByQRCode = useCallback((qrCode: string) => {
    const artifact = artifacts.find(a => a.qrCode === qrCode);
    const exhibition = exhibitions.find(e => e.qrCode === qrCode);
    
    return {
      type: artifact ? 'artifact' : exhibition ? 'exhibition' : null,
      item: artifact || exhibition || null,
    };
  }, [artifacts, exhibitions]);

  return {
    exhibitions,
    artifacts,
    getExhibitionById,
    getArtifactById,
    getArtifactsByExhibition,
    findByQRCode,
    featuredExhibitionId: exhibitionsData.featured,
  };
};
