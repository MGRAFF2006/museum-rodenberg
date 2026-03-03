import { useState, useEffect, useCallback } from 'react';
import { Asset } from '../types';
import { authFetch } from '../utils/auth';

export const useAssets = () => {
  const [assets, setAssets] = useState<Record<string, Asset>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authFetch('/api/list-uploads');
      const data = await response.json();
      if (data.assets) {
        setAssets(data.assets);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const saveAsset = async (asset: Asset) => {
    try {
      const response = await authFetch('/api/save-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asset),
      });
      if (response.ok) {
        setAssets(prev => ({ ...prev, [asset.id]: asset }));
        return true;
      }
    } catch (error) {
      console.error('Failed to save asset:', error);
    }
    return false;
  };

  const deleteAsset = async (asset: Asset) => {
    try {
      const response = await authFetch(`/api/delete-image?path=${encodeURIComponent(asset.url)}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setAssets(prev => {
          const next = { ...prev };
          delete next[asset.id];
          return next;
        });
        return true;
      }
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
    return false;
  };

  const resolveAsset = (idOrUrl: string): Asset | undefined => {
    if (assets[idOrUrl]) return assets[idOrUrl];
    // Fallback if it's already a URL
    return Object.values(assets).find(a => a.url === idOrUrl);
  };

  return {
    assets: Object.values(assets),
    assetsMap: assets,
    isLoading,
    fetchAssets,
    saveAsset,
    deleteAsset,
    resolveAsset
  };
};
