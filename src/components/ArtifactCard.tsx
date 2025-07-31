import React from 'react';
import { Calendar, Ruler, MapPin, Tag } from 'lucide-react';

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

interface ArtifactCardProps {
  artifact: Artifact;
  onClick: (id: string) => void;
}

export const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact, onClick }) => {
  return (
    <div
      onClick={() => onClick(artifact.id)}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 overflow-hidden group"
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={artifact.image}
          alt={artifact.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="p-5">
        <h4 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
          {artifact.title}
        </h4>
        <p className="text-yellow-700 font-medium mb-3 text-sm">
          {artifact.period}
        </p>
        <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">
          {artifact.description}
        </p>

        {/* Meta Information */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-xs text-gray-500">
            <Ruler className="h-4 w-4 mr-2" />
            {artifact.dimensions}
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <MapPin className="h-4 w-4 mr-2" />
            {artifact.provenance}
          </div>
        </div>

        {/* Materials */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-700 mb-1">Materialien:</p>
          <p className="text-xs text-gray-600">{artifact.materials.join(', ')}</p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {artifact.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
            >
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </span>
          ))}
          {artifact.tags.length > 2 && (
            <span className="text-xs text-gray-500">
              +{artifact.tags.length - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};