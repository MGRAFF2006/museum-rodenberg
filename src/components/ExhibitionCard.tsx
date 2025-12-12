import React from 'react';
import { Calendar, MapPin, User, Tag as TagIcon } from 'lucide-react';

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

interface ExhibitionCardProps {
  exhibition: Exhibition;
  onClick: (id: string) => void;
  featured?: boolean;
}

export const ExhibitionCard: React.FC<ExhibitionCardProps> = ({ 
  exhibition, 
  onClick, 
  featured = false 
}) => {
  return (
    <div
      onClick={() => onClick(exhibition.id)}
      className={featured ? 'card-featured' : 'card-interactive'}
    >
      {/* Image */}
      <div className="relative w-full h-48 md:h-56 overflow-hidden bg-neutral-100 flex items-center justify-center">
        <img
          src={exhibition.image}
          alt={exhibition.title}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
        {featured && (
          <div className="absolute top-0 right-0 m-4">
            <span className="badge badge-accent">Hauptausstellung</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 md:p-5 flex flex-col gap-3">
        <div>
          <h3 className="text-heading font-semibold text-neutral-900 mb-1 line-clamp-2">
            {exhibition.title}
          </h3>
          <p className="text-body-sm font-semibold text-accent-600">
            {exhibition.subtitle}
          </p>
        </div>
        
        <p className="text-body-sm text-neutral-600 line-clamp-3">
          {exhibition.description}
        </p>

        {/* Meta Information */}
        <div className="space-y-1.5 pt-3 border-t border-neutral-200">
          <div className="metadata">
            <Calendar className="metadata-icon" />
            <span className="text-caption text-neutral-600">{exhibition.dateRange}</span>
          </div>
          <div className="metadata">
            <MapPin className="metadata-icon" />
            <span className="text-caption text-neutral-600">{exhibition.location}</span>
          </div>
          <div className="metadata">
            <User className="metadata-icon" />
            <span className="text-caption text-neutral-600">{exhibition.curator}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {exhibition.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">
              <TagIcon className="h-3 w-3 mr-1" />
              {tag}
            </span>
          ))}
          {exhibition.tags.length > 3 && (
            <span className="text-caption text-neutral-500 px-2 py-1">
              +{exhibition.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};