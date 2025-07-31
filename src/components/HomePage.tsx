import React from 'react';
import { ExhibitionCard } from './ExhibitionCard';
import { BookOpen, Star } from 'lucide-react';
import { Language } from '../hooks/useLanguage';
import { t } from '../utils/translations';

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

interface HomePageProps {
  exhibitions: Exhibition[];
  featuredId: string;
  onExhibitionClick: (id: string) => void;
  currentLanguage?: Language;
}

export const HomePage: React.FC<HomePageProps> = ({
  exhibitions,
  featuredId,
  onExhibitionClick,
  currentLanguage = 'de',
}) => {
  const featuredExhibition = exhibitions.find(ex => ex.id === featuredId);
  const otherExhibitions = exhibitions.filter(ex => ex.id !== featuredId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-6 text-yellow-400" />
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t('museumTitle', currentLanguage)}
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-blue-100 mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed">
            {t('museumSubtitle', currentLanguage)}
          </p>
          <div className="flex items-center justify-center text-yellow-400 text-sm md:text-base">
            <Star className="h-5 w-5 mr-2" />
            <span className="text-lg">{t('collectionsInfo', currentLanguage)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Exhibition */}
        {featuredExhibition && (
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <Star className="h-6 w-6 text-yellow-500 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">{t('mainExhibition', currentLanguage)}</h2>
            </div>
            <div className="max-w-4xl">
              <ExhibitionCard
                exhibition={featuredExhibition}
                onClick={onExhibitionClick}
                featured={true}
              />
            </div>
          </div>
        )}

        {/* All Exhibitions */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">{t('allExhibitions', currentLanguage)}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[featuredExhibition, ...otherExhibitions].filter(Boolean).map((exhibition) => (
              <ExhibitionCard
                key={exhibition.id}
                exhibition={exhibition}
                onClick={onExhibitionClick}
                featured={exhibition.id === featuredId}
              />
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-800 mb-2">{exhibitions.length}</div>
              <div className="text-gray-600">{t('currentExhibitions', currentLanguage)}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-800 mb-2">25+</div>
              <div className="text-gray-600">{t('specialArtifacts', currentLanguage)}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-800 mb-2">800+</div>
              <div className="text-gray-600">{t('yearsHistory', currentLanguage)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};