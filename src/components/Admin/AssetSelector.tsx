import React, { useState } from 'react';
import { Image as ImageIcon, X, Upload, Check, FileAudio, FileVideo, File as FileIcon } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAssets } from '../../hooks/useAssets';
import { Asset } from '../../types';

export type AssetType = 'image' | 'audio' | 'video' | 'all';

interface AssetPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  assetType?: AssetType;
  selectedValue?: string;
}

export const AssetPicker: React.FC<AssetPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  assetType = 'all',
  selectedValue
}) => {
  const { assets, isLoading, fetchAssets } = useAssets();
  const { t } = useLanguage();

  const filteredAssets = assets.filter(asset => {
    if (assetType === 'all') return true;
    return asset.type === assetType;
  });

  const handleUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    
    if (assetType === 'image') input.accept = 'image/*';
    else if (assetType === 'audio') input.accept = 'audio/*';
    else if (assetType === 'video') input.accept = 'video/*';
    else input.accept = '*/*';

    input.onchange = async () => {
      if (input.files && input.files[0]) {
        const formData = new FormData();
        const endpoint = assetType === 'image' ? '/api/upload-image' : '/api/upload-media';
        const fieldName = assetType === 'image' ? 'image' : 'file';
        
        formData.append(fieldName, input.files[0]);
        
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
          });
          const data = await response.json();
          const asset = data.assets?.[0] || (data.url && { id: data.url.split('/').pop().split('.')[0] });
          if (asset) {
            await fetchAssets();
            onSelect(asset.id);
            onClose();
          }
        } catch (error) {
          console.error('Upload failed:', error);
        }
      }
    };
    input.click();
  };

  const getAssetIcon = (asset: Asset) => {
    if (asset.type === 'image') {
      return <img src={asset.url} alt={asset.alt} className="max-w-full max-h-full object-contain" />;
    }
    if (asset.type === 'audio') {
      return <FileAudio className="h-8 w-8 text-blue-500" />;
    }
    if (asset.type === 'video') {
      return <FileVideo className="h-8 w-8 text-purple-500" />;
    }
    return <FileIcon className="h-8 w-8 text-neutral-400" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-neutral-50 rounded-t-xl">
          <h3 className="font-bold text-lg flex items-center">
            {assetType === 'image' && <ImageIcon className="h-5 w-5 mr-2 text-neutral-500" />}
            {assetType === 'audio' && <FileAudio className="h-5 w-5 mr-2 text-neutral-500" />}
            {assetType === 'video' && <FileVideo className="h-5 w-5 mr-2 text-neutral-500" />}
            {assetType === 'all' && <FileIcon className="h-5 w-5 mr-2 text-neutral-500" />}
            {t('selectAsset')} ({assetType === 'all' ? t('allExhibitions') : t(assetType)})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpload}
              className="btn btn-primary btn-sm flex items-center px-3 py-1.5 rounded-md text-sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              {t('uploadNew')}
            </button>
            <button onClick={onClose} className="p-1 hover:bg-neutral-200 rounded-full transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => {
                    onSelect(asset.id);
                    onClose();
                  }}
                  className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all bg-neutral-50 flex flex-col items-center justify-center p-2 ${
                    selectedValue === asset.id || selectedValue === asset.url ? 'border-primary-600 ring-2 ring-primary-100 bg-primary-50' : 'border-neutral-200 hover:border-primary-300 hover:bg-white'
                  }`}
                >
                  {getAssetIcon(asset)}
                  <span className="text-[10px] mt-2 truncate w-full text-center text-neutral-600 group-hover:text-primary-700 font-medium">
                    {asset.name}
                  </span>
                  
                  {(selectedValue === asset.id || selectedValue === asset.url) && (
                    <div className="absolute top-1 right-1">
                      <div className="bg-primary-600 text-white rounded-full p-0.5 shadow-sm">
                        <Check className="h-3 w-3" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
              {filteredAssets.length === 0 && (
                <div className="col-span-full py-20 text-center text-neutral-500">
                  <div className="mb-2 flex justify-center">
                    <FileIcon className="h-12 w-12 text-neutral-200" />
                  </div>
                  <p className="italic">{t('noAssetsFound')}</p>
                  <button 
                    onClick={handleUpload}
                    className="mt-4 text-primary-600 hover:underline text-sm font-medium"
                  >
                    {t('uploadFirstAsset')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-neutral-50 flex justify-end rounded-b-xl">
          <button
            onClick={onClose}
            className="btn btn-secondary px-6 py-2 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-md text-sm font-medium"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

interface AssetSelectorProps {
  value: string;
  onChange: (id: string) => void;
  label?: string;
  assetType?: AssetType;
  disabled?: boolean;
}

export const AssetSelector: React.FC<AssetSelectorProps> = ({ 
  value, 
  onChange, 
  label,
  assetType = 'all',
  disabled = false
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const { resolveAsset } = useAssets();
  const { t } = useLanguage();

  const asset = resolveAsset(value);

  const getAssetIcon = (asset?: Asset) => {
    if (!asset) return <FileIcon className="h-8 w-8 text-neutral-400" />;
    if (asset.type === 'image') {
      return <img src={asset.url} alt={asset.alt} className="max-w-full max-h-full object-contain" />;
    }
    if (asset.type === 'audio') {
      return <FileAudio className="h-8 w-8 text-blue-500" />;
    }
    if (asset.type === 'video') {
      return <FileVideo className="h-8 w-8 text-purple-500" />;
    }
    return <FileIcon className="h-8 w-8 text-neutral-400" />;
  };

  const getLabelIcon = () => {
    switch (assetType) {
      case 'image': return <ImageIcon className="h-4 w-4 mr-2 text-neutral-500" />;
      case 'audio': return <FileAudio className="h-4 w-4 mr-2 text-neutral-500" />;
      case 'video': return <FileVideo className="h-4 w-4 mr-2 text-neutral-500" />;
      default: return <FileIcon className="h-4 w-4 mr-2 text-neutral-500" />;
    }
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center text-sm font-medium text-neutral-700">
        {getLabelIcon()}
        {label || t('assetLabel')}
      </label>
      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          <div className="relative flex items-center">
            <input
              type="text"
              className={`input w-full px-3 py-2 border rounded-md text-sm ${disabled ? 'bg-neutral-50 text-neutral-500 pr-3' : 'pr-10'}`}
              value={asset ? asset.name : value}
              onChange={(e) => !disabled && onChange(e.target.value)}
              placeholder={t('selectAssetPlaceholder')}
              readOnly
              onClick={() => !disabled && setShowPicker(true)}
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="absolute right-2 text-neutral-400 hover:text-primary-600 transition-colors p-1"
                title={t('selectFromLibrary')}
              >
                <ImageIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          {asset && (
            <p className="text-[10px] text-neutral-400 px-1">
              ID: {asset.id}
            </p>
          )}
        </div>
        {value && (
          <button 
            type="button"
            onClick={() => !disabled && setShowPicker(true)}
            disabled={disabled}
            className={`w-20 h-20 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 shrink-0 flex flex-col items-center justify-center p-2 transition-colors ${disabled ? 'cursor-default' : 'hover:border-primary-400'}`}
          >
            {getAssetIcon(asset)}
            {asset && asset.type !== 'image' && (
              <span className="text-[10px] mt-1 truncate w-full text-center">{asset.name}</span>
            )}
          </button>
        )}
      </div>

      <AssetPicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={onChange}
        assetType={assetType}
        selectedValue={value}
      />
    </div>
  );
};
