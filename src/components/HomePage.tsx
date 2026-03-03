import React from 'react';
import { ExhibitionCard } from './ExhibitionCard';
import { BookOpen, Star, Sparkles } from 'lucide-react';
import { Exhibition } from '../types';
import { useLanguage } from '../hooks/useLanguage';

interface HomePageProps {
  exhibitions: Exhibition[];
  featuredId: string;
  onExhibitionClick: (id: string) => void;
}


export const HomePage: React.FC<HomePageProps> = ({
  exhibitions,
  featuredId,
  onExhibitionClick,
}) => {
  const { t } = useLanguage();
  const featuredExhibition = exhibitions.find(ex => ex.id === featuredId);

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
            {t('museumTitle')}
          </h1>
          <p className="text-body-lg md:text-heading-sm text-primary-100 mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed">
            {t('museumSubtitle')}
          </p>
          <div className="flex items-center justify-center text-accent-300 text-body font-semibold">
            <Star className="h-5 w-5 mr-2" />
            <span>{t('collectionsInfo')}</span>
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
                {t('mainExhibition')}
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
        <section className="py-8 md:py-10">
          <h2 className="text-heading-xl font-serif font-bold text-neutral-900 mb-6">
            {t('allExhibitions')}
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
      </div>
    </div>
  );
};
