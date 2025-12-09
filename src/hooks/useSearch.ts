import { useMemo } from 'react';
import type { Exhibition, Artifact } from '../types';

interface SearchResults {
  exhibitions: Exhibition[];
  artifacts: Artifact[];
}

export const useSearch = (
  query: string,
  exhibitions: Exhibition[],
  artifacts: Artifact[]
): SearchResults => {
  return useMemo(() => {
    if (!query.trim()) {
      return { exhibitions: [], artifacts: [] };
    }

    const lowerQuery = query.toLowerCase();
    
    const matchingExhibitions = exhibitions.filter(ex =>
      ex.title.toLowerCase().includes(lowerQuery) ||
      ex.description.toLowerCase().includes(lowerQuery) ||
      ex.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      ('curator' in ex && ex.curator.toLowerCase().includes(lowerQuery))
    );

    const matchingArtifacts = artifacts.filter(art =>
      art.title.toLowerCase().includes(lowerQuery) ||
      art.description.toLowerCase().includes(lowerQuery) ||
      art.period.toLowerCase().includes(lowerQuery) ||
      art.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      art.materials.some(material => material.toLowerCase().includes(lowerQuery))
    );

    return {
      exhibitions: matchingExhibitions,
      artifacts: matchingArtifacts,
    };
  }, [query, exhibitions, artifacts]);
};
