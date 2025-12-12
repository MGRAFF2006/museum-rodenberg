import React from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { ExhibitionCard } from './ExhibitionCard';
import { ArtifactCard } from './ArtifactCard';
import { useLanguage } from '../hooks/useLanguage';
import { t } from '../utils/translations';

interface Exhibition {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  dateRange?: string;
  location?: string;
  curator?: string;
  tags?: string[];
  [key: string]: unknown;
}

interface Artifact {
  id: string;
  title: string;
  period?: string;
  description: string;
  image: string;
  materials?: string[];
  dimensions?: string;
  provenance?: string;
  significance?: string;
  tags?: string[];
  [key: string]: unknown;
}

interface SearchResultsProps {
  query: string;
  exhibitions: Exhibition[];
  artifacts: Artifact[];
  onExhibitionClick: (id: string) => void;
  onArtifactClick: (id: string) => void;
  onBack: () => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  exhibitions,
  artifacts,
  onExhibitionClick,
  onArtifactClick,
  onBack,
}) => {
  const totalResults = exhibitions.length + artifacts.length;
  const { currentLanguage } = useLanguage();

  return (
    <div className="bg-neutral-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container-max max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6 flex-col md:flex-row gap-4">
            <button
              onClick={onBack}
              className="flex items-center text-primary-600 hover:text-primary-700 transition-colors focus-ring-sm order-2 md:order-1"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="text-body font-medium">
                {t('backToExhibitions', currentLanguage)}
              </span>
            </button>
            
            <div className="flex items-center text-primary-700 order-1 md:order-2">
              <Search className="h-5 w-5 mr-2" />
              <span className="text-body font-semibold">
                {totalResults} {totalResults !== 1 ? t('searchResultsPlural', currentLanguage) : t('searchResults', currentLanguage)} "{query}"
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container-max max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {totalResults === 0 ? (
          <div className="flex items-center justify-center py-16 md:py-24">
            <div className="card-lg p-8 md:p-12 max-w-md w-full text-center">
              <div className="mb-6 flex justify-center">
                <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center">
                  <Search className="h-8 w-8 text-neutral-400" />
                </div>
              </div>
              <h2 className="text-heading font-serif font-bold text-neutral-900 mb-3">
                {t('noResults', currentLanguage)}
              </h2>
              <p className="text-body text-neutral-600">
                {t('noResultsText', currentLanguage)}
              </p>
            </div>
          </div>
        ) : (
          <div className="section-lg space-y-12">
            {/* Exhibitions Results */}
            {exhibitions.length > 0 && (
              <section>
                <h2 className="text-heading-lg font-serif font-bold text-neutral-900 mb-8">
                  {t('exhibitions', currentLanguage)} <span className="text-primary-600">({exhibitions.length})</span>
                </h2>
                <div className="grid-responsive">
                  {exhibitions.map((exhibition) => (
                    <ExhibitionCard
                      key={exhibition.id}
                      exhibition={exhibition}
                      onClick={onExhibitionClick}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Artifacts Results */}
            {artifacts.length > 0 && (
              <section className={exhibitions.length > 0 ? 'pt-8 border-t border-neutral-200' : ''}>
                <h2 className="text-heading-lg font-serif font-bold text-neutral-900 mb-8">
                  {t('artifacts', currentLanguage)} <span className="text-primary-600">({artifacts.length})</span>
                </h2>
                <div className="grid-responsive">
                  {artifacts.map((artifact) => (
                    <ArtifactCard
                      key={artifact.id}
                      artifact={artifact}
                      onClick={onArtifactClick}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};