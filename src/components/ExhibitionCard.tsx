import React from 'react';
import { Calendar, MapPin, User, Tag } from 'lucide-react';

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
      className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 overflow-hidden group ${
        featured ? 'ring-2 ring-yellow-400' : ''
      }`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={exhibition.image}
          alt={exhibition.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {featured && (
          <div className="absolute top-4 left-4 bg-yellow-400 text-black px-3 py-1 rounded-full text-xs md:text-sm font-semibold shadow-lg">
            Hauptausstellung
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {exhibition.title}
        </h3>
        <p className="text-blue-700 font-medium mb-3 text-sm">
          {exhibition.subtitle}
        </p>
        <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">
          {exhibition.description}
        </p>

        {/* Meta Information */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-4 w-4 mr-2" />
            {exhibition.dateRange}
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <MapPin className="h-4 w-4 mr-2" />
            {exhibition.location}
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <User className="h-4 w-4 mr-2" />
            {exhibition.curator}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {exhibition.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </span>
          ))}
          {exhibition.tags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{exhibition.tags.length - 3} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
};