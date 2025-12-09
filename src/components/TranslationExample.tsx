import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useAllTranslations } from '../hooks/useAllTranslations';

/**
 * Example component showing how to use cached translations
 * 
 * This component demonstrates:
 * - Loading translations from public/translations/[lang].json
 * - Falling back to German if translation not found
 * - Handling loading state
 * 
 * For simpler UI components that don't need cached content translations,
 * use the bundled translations instead (see translations.ts)
 */
export const TranslationExampleComponent: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const { t, loading } = useAllTranslations(currentLanguage);

  if (loading) {
    return <div className="text-gray-500">Loading translations...</div>;
  }

  return (
    <div className="space-y-4">
      <h2>{t('museumTitle')}</h2>
      <p>{t('museumSubtitle')}</p>
      <p>{t('collectionsInfo')}</p>
      
      <section>
        <h3>{t('currentExhibitions')}</h3>
        <p>{t('searchPlaceholder')}</p>
      </section>
      
      <section>
        <h3>{t('accessibility')}</h3>
        <ul>
          <li>{t('fontSize')}</li>
          <li>{t('fontFamily')}</li>
          <li>{t('contrast')}</li>
        </ul>
      </section>
    </div>
  );
};

export default TranslationExampleComponent;
