import { useState, useCallback } from 'react';
import { EntityRecord, MediaItem } from '../types';
import { extractMediaFromMarkdown } from '../utils/markdownUtils';
import { authFetch } from '../utils/auth';
import { useAssets } from './useAssets';

export const useAssetValidation = () => {
  const { resolveAsset, isLoading } = useAssets();
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateAssets = useCallback(async (data: EntityRecord) => {
    setIsValidating(true);
    setValidationErrors([]);
    
    const paths = new Set<string>();
    
    // Add thumbnail
    if (data.image) paths.add(data.image);
    
    // Add media gallery items
    if (data.media) {
      if (Array.isArray(data.media.images)) {
        data.media.images.forEach((img: string) => img && paths.add(img));
      }
      if (Array.isArray(data.media.videos)) {
        data.media.videos.forEach((vid: MediaItem) => vid.url && paths.add(vid.url));
      }
      if (Array.isArray(data.media.audio)) {
        data.media.audio.forEach((aud: MediaItem) => aud.url && paths.add(aud.url));
      }
    }
    
    // Add from translations
    if (data.translations) {
      Object.values(data.translations).forEach((trans) => {
        // Collect all fields that might contain markdown or URLs
        const fieldsToExtract = ['description', 'significance'];
        fieldsToExtract.forEach(field => {
          if (trans[field]) {
            const media = extractMediaFromMarkdown(trans[field]);
            media.images.forEach(img => paths.add(img));
            media.videos.forEach(vid => paths.add(vid.url));
            media.audio.forEach(aud => paths.add(aud.url));
          }
        });
      });
    }
    
    // Add from detailed content
    if (data.detailedContent) {
      Object.values(data.detailedContent).forEach((content: string) => {
        if (typeof content === 'string') {
          const media = extractMediaFromMarkdown(content);
          media.images.forEach(img => paths.add(img));
          media.videos.forEach(vid => paths.add(vid.url));
          media.audio.forEach(aud => paths.add(aud.url));
        }
      });
    }

    const resolvedPaths = new Set<string>();
    const missing: string[] = [];
    for (const reference of paths) {
      const asset = resolveAsset(reference);
      if (asset) {
        resolvedPaths.add(asset.url);
      } else if (/^(?:[a-z][a-z\d+.-]*:|\/)/i.test(reference)) {
        resolvedPaths.add(reference);
      } else {
        missing.push(reference);
      }
    }
    if (missing.length > 0) {
      setValidationErrors(isLoading
        ? ['Asset library is still loading. Please try again.']
        : missing.map(reference => `Unknown asset: ${reference}`));
      setIsValidating(false);
      return false;
    }
    const pathsToValidate = Array.from(resolvedPaths).filter(p => p.startsWith('/uploads/'));
    
    if (pathsToValidate.length === 0) {
      setIsValidating(false);
      return true;
    }

    try {
      const response = await authFetch('/api/validate-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: pathsToValidate })
      });
      
      if (response.ok) {
        const { invalid } = await response.json();
        if (invalid && invalid.length > 0) {
          setValidationErrors(invalid.map((p: string) => `Missing asset: ${p}`));
          setIsValidating(false);
          return false;
        }
      } else {
        setValidationErrors(['Failed to connect to validation server']);
        setIsValidating(false);
        return false;
      }
    } catch {
      setValidationErrors(['Error during asset validation']);
      setIsValidating(false);
      return false;
    }

    setIsValidating(false);
    return true;
  }, [resolveAsset, isLoading]);

  return {
    isValidating,
    validationErrors,
    setValidationErrors,
    validateAssets
  };
};
