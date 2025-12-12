import React from 'react';
import { ExhibitionCard } from './ExhibitionCard';
import { BookOpen, Star, Sparkles, Users } from 'lucide-react';
import { Language } from '../hooks/useLanguage';
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
    <div className="bg-neutral-50 min-h-screen">
      {/* Hero Section */}
      <div className="hero-section py-12 md:py-16 lg:py-20">
        <div className="hero-overlay absolute inset-0" />
        <div className="container-max max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="mb-4 flex justify-center">
            <BookOpen className="h-12 w-12 md:h-16 md:w-16 text-accent-300" />
          </div>
          <h1 className="text-display-lg md:text-display text-white mb-3 md:mb-4">
            {t('museumTitle', currentLanguage)}
          </h1>
          <p className="text-body-lg md:text-heading-sm text-primary-100 mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed">
            {t('museumSubtitle', currentLanguage)}
          </p>
          <div className="flex items-center justify-center text-accent-300 text-body font-semibold">
            <Star className="h-5 w-5 mr-2" />
            <span>{t('collectionsInfo', currentLanguage)}</span>
          </div>
        </div>
      </div>

      <div className="container-max max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Featured Exhibition Section */}
        {featuredExhibition && (
          <section className="py-8 md:py-10 border-b border-neutral-200">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="h-6 w-6 text-accent-600" />
              <h2 className="text-heading-xl font-serif font-bold text-neutral-900">
                {t('mainExhibition', currentLanguage)}
              </h2>
            </div>
            <div className="max-w-4xl">
              <ExhibitionCard
                exhibition={featuredExhibition}
                onClick={onExhibitionClick}
                featured={true}
              />
            </div>
          </section>
        )}

        {/* All Exhibitions Section */}
        <section className="py-8 md:py-10 border-b border-neutral-200">
          <h2 className="text-heading-xl font-serif font-bold text-neutral-900 mb-6">
            {t('allExhibitions', currentLanguage)}
          </h2>
          <div className="grid-responsive">
            {exhibitions.map((exhibition) => (
              <ExhibitionCard
                key={exhibition.id}
                exhibition={exhibition}
                onClick={onExhibitionClick}
                featured={exhibition.id === featuredId}
              />
            ))}
          </div>
        </section>

        {/* Quick Stats Section */}
        <section className="py-8 md:py-10">
          <div className="card-lg p-6 md:p-8">
            <h3 className="text-heading-lg font-serif font-bold text-neutral-900 mb-6 text-center">
              Zahlen & Fakten
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {/* Stat 1 */}
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="h-14 w-14 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Star className="h-7 w-7 text-primary-600" />
                  </div>
                </div>
                <div className="text-heading-xl font-bold text-primary-600 mb-2">
                  {exhibitions.length}
                </div>
                <p className="text-body text-neutral-600">
                  {t('currentExhibitions', currentLanguage)}
                </p>
              </div>

              {/* Stat 2 */}
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="h-14 w-14 rounded-lg bg-accent-100 flex items-center justify-center">
                    <Sparkles className="h-7 w-7 text-accent-600" />
                  </div>
                </div>
                <div className="text-heading-xl font-bold text-accent-600 mb-2">
                  25+
                </div>
                <p className="text-body text-neutral-600">
                  {t('specialArtifacts', currentLanguage)}
                </p>
              </div>

              {/* Stat 3 */}
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="h-14 w-14 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Users className="h-7 w-7 text-primary-600" />
                  </div>
                </div>
                <div className="text-heading-xl font-bold text-primary-600 mb-2">
                  800+
                </div>
                <p className="text-body text-neutral-600">
                  {t('yearsHistory', currentLanguage)}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};