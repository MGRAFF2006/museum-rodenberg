import React from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { ExhibitionCard } from './ExhibitionCard';
import { ArtifactCard } from './ArtifactCard';

interface Exhibition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  dateRange: string;
  location: string;
  curator: string;
  tags: string[];
}

interface Artifact {
  id: string;
  title: string;
  period: string;
  description: string;
  image: string;
  materials: string[];
  dimensions: string;
  provenance: string;
  significance: string;
  tags: string[];
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={onBack}
              className="flex items-center text-blue-800 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Zurück zu den Ausstellungen
            </button>
            
            <div className="flex items-center text-gray-600">
              <Search className="h-5 w-5 mr-2" />
              <span className="text-sm">
                {totalResults} Ergebnis{totalResults !== 1 ? 'se' : ''} für "{query}"
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {totalResults === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Keine Ergebnisse gefunden</h2>
              <p className="text-gray-600 text-sm md:text-base">
              Versuchen Sie es mit anderen Suchbegriffen oder durchstöbern Sie unsere Ausstellungen.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Exhibitions Results */}
            {exhibitions.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Ausstellungen ({exhibitions.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exhibitions.map((exhibition) => (
                    <ExhibitionCard
                      key={exhibition.id}
                      exhibition={exhibition}
                      onClick={onExhibitionClick}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Artifacts Results */}
            {artifacts.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Exponate ({artifacts.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {artifacts.map((artifact) => (
                    <ArtifactCard
                      key={artifact.id}
                      artifact={artifact}
                      onClick={onArtifactClick}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};