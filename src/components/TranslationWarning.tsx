import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface TranslationWarningProps {
  isMissing: boolean;
}

export const TranslationWarning: React.FC<TranslationWarningProps> = ({ isMissing }) => {
  if (!isMissing) return null;

  const { t } = useLanguage();

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-amber-700">
            {t('translationNotAvailable')}
          </p>
        </div>
      </div>
    </div>
  );
};
