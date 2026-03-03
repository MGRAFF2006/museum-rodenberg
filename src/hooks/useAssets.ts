import { useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Asset } from '../types';
import { authFetch } from '../utils/auth';

export const useAssets = () => {
  // Reactive asset list from Convex
  const convexAssets = useQuery(api.assets.list);
  const saveAssetMutation = useMutation(api.assets.save);
  const removeAssetMutation = useMutation(api.assets.remove);

  const isLoading = convexAssets === undefined;

  // Build the assets array and map from Convex data
  const assetsMap: Record<string, Asset> = {};
  if (convexAssets) {
    for (const a of convexAssets) {
      assetsMap[a.assetId] = {
        id: a.assetId,
        name: a.name,
        alt: a.alt,
        url: a.url,
        type: a.type,
      };
    }
  }

  // fetchAssets is now a no-op (Convex auto-updates), kept for API compat
  const fetchAssets = useCallback(async () => {
    // Convex subscriptions auto-update
  }, []);

  const saveAsset = async (asset: Asset) => {
    try {
      await saveAssetMutation({
        assetId: asset.id,
        name: asset.name,
        alt: asset.alt,
        url: asset.url,
        type: asset.type,
      });
      return true;
    } catch (error) {
      console.error('Failed to save asset:', error);
    }
    return false;
  };

  const deleteAsset = async (asset: Asset) => {
    try {
      // Delete the file from disk via Express
      const response = await authFetch(`/api/delete-image?path=${encodeURIComponent(asset.url)}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        // Remove metadata from Convex
        await removeAssetMutation({ assetId: asset.id });
        return true;
      }
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
    return false;
  };

  const resolveAsset = (idOrUrl: string): Asset | undefined => {
    if (assetsMap[idOrUrl]) return assetsMap[idOrUrl];
    // Fallback if it's already a URL
    return Object.values(assetsMap).find(a => a.url === idOrUrl);
  };

  return {
    assets: Object.values(assetsMap),
    assetsMap,
    isLoading,
    fetchAssets,
    saveAsset,
    deleteAsset,
    resolveAsset
  };
};
