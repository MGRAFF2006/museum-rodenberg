import React, { useState } from 'react';
import { Trash2, Image as ImageIcon, Copy, Check, FileAudio, FileVideo, File as FileIcon, Edit2, Save, X } from 'lucide-react';
import { useAssets } from '../../hooks/useAssets';
import { useLanguage } from '../../hooks/useLanguage';
import { Asset } from '../../types';
import { authFetch } from '../../utils/auth';

export const MediaLibrary: React.FC = () => {
  const { assets, isLoading, saveAsset, deleteAsset } = useAssets();
  const { t } = useLanguage();
  const [copied, setCopied] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Asset>>({});

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const startEditing = (asset: Asset) => {
    setEditingId(asset.id);
    setEditForm(asset);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async () => {
    if (editingId && editForm.id) {
      const success = await saveAsset(editForm as Asset);
      if (success) {
        setEditingId(null);
      }
    }
  };

  const getFileIcon = (asset: Asset) => {
    const { url, type } = asset;
    if (type === 'image') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-neutral-100">
          <img src={url} alt={asset.alt} className="max-w-full max-h-full object-contain" />
        </div>
      );
    }
    if (type === 'audio') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50 text-blue-600 p-2">
          <FileAudio className="h-8 w-8 mb-1" />
          <span className="text-[10px] text-center break-all px-1 font-medium">{asset.name}</span>
        </div>
      );
    }
    if (type === 'video') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-purple-50 text-purple-600 p-2">
          <FileVideo className="h-8 w-8 mb-1" />
          <span className="text-[10px] text-center break-all px-1 font-medium">{asset.name}</span>
        </div>
      );
    }
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-50 text-neutral-600 p-2">
        <FileIcon className="h-8 w-8 mb-1" />
        <span className="text-[10px] text-center break-all px-1 font-medium">{asset.name}</span>
      </div>
    );
  };

  return (
    <section className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center">
          <ImageIcon className="h-5 w-5 mr-2 text-primary-600" />
          {t('mediaLibrary')}
        </h2>
        <button
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '*/*';
            input.multiple = true;
            input.onchange = async () => {
              if (input.files && input.files.length > 0) {
                const formData = new FormData();
                for (let i = 0; i < input.files.length; i++) {
                  formData.append('file', input.files[i]);
                }
                try {
                  const response = await authFetch('/api/upload-media', {
                    method: 'POST',
                    body: formData,
                  });
                  const result = await response.json();
                  // Save each uploaded asset's metadata to Convex
                  if (result.assets && Array.isArray(result.assets)) {
                    for (const asset of result.assets) {
                      await saveAsset({
                        id: asset.id,
                        name: asset.name,
                        alt: asset.alt,
                        url: asset.url,
                        type: asset.type,
                      });
                    }
                  }
                } catch (error) {
                  console.error('Upload failed:', error);
                }
              }
            };
            input.click();
          }}
          className="btn btn-secondary btn-sm bg-neutral-100 hover:bg-neutral-200"
        >
          {t('uploadNew')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {assets.map((asset) => (
          <div key={asset.id} className="group flex flex-col bg-white rounded-lg overflow-hidden border border-neutral-200 hover:shadow-md transition-shadow">
            <div className="relative aspect-video bg-neutral-100 border-b border-neutral-100">
              {getFileIcon(asset)}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => copyToClipboard(asset.id)}
                  className="p-2 bg-white rounded-full text-neutral-900 hover:bg-primary-50 transition-colors"
                  title={t('copyId')}
                >
                  {copied === asset.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => startEditing(asset)}
                  className="p-2 bg-white rounded-full text-primary-600 hover:bg-primary-50 transition-colors"
                  title={t('editMetadata')}
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(t('deleteFileConfirm'))) {
                      deleteAsset(asset);
                    }
                  }}
                  className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
                  title={t('delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="p-3">
              {editingId === asset.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    className="w-full text-sm border rounded px-2 py-1"
                    value={editForm.name || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('name')}
                    autoFocus
                  />
                  <input
                    type="text"
                    className="w-full text-sm border rounded px-2 py-1"
                    value={editForm.alt || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, alt: e.target.value }))}
                    placeholder={t('altText')}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={cancelEditing} className="p-1 text-neutral-500 hover:text-neutral-700">
                      <X className="h-4 w-4" />
                    </button>
                    <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-700">
                      <Save className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-sm font-bold text-neutral-900 truncate" title={asset.name}>
                    {asset.name}
                  </h3>
                  <p className="text-xs text-neutral-500 truncate mt-1">
                    ID: {asset.id}
                  </p>
                  {asset.alt && asset.alt !== asset.name && (
                    <p className="text-xs text-neutral-400 italic truncate mt-0.5">
                      {t('altText')}: {asset.alt}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {assets.length === 0 && !isLoading && (
          <div className="col-span-full py-12 text-center text-neutral-500 italic border-2 border-dashed border-neutral-100 rounded-xl">
            {t('noAssetsFound')}
          </div>
        )}
      </div>
    </section>
  );
};
