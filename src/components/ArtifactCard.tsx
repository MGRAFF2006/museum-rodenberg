import React from 'react';
import { Calendar, Ruler, MapPin, Tag as TagIcon } from 'lucide-react';

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
  featured?: boolean;
}

export const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact, onClick, featured = false }) => {
  return (
    <div
      onClick={() => onClick(artifact.id)}
      className={`${featured ? 'card-featured' : 'card-interactive'} overflow-hidden group`}
    >
      {/* Image Container */}
      <div className="relative w-full h-44 md:h-52 overflow-hidden bg-neutral-100 flex items-center justify-center">
        <img
          src={artifact.image}
          alt={artifact.title}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
        {featured && (
          <div className="absolute top-0 right-0 m-3">
            <span className="badge badge-accent">Hervorgehoben</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 md:p-5 flex flex-col gap-3">
        {/* Period Badge */}
        <div className="metadata">
          <Calendar className="metadata-icon" />
          <span className="text-caption font-semibold text-accent-600">
            {artifact.period}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-heading-sm font-semibold text-neutral-900 line-clamp-2">
          {artifact.title}
        </h3>

        {/* Description */}
        <p className="text-body-sm text-neutral-600 line-clamp-3">
          {artifact.description}
        </p>

        {/* Meta Information */}
        <div className="space-y-1.5 pt-3 border-t border-neutral-200">
          <div className="metadata">
            <Ruler className="metadata-icon" />
            <span className="text-caption text-neutral-600">{artifact.dimensions}</span>
          </div>
          <div className="metadata">
            <MapPin className="metadata-icon" />
            <span className="text-caption text-neutral-600">{artifact.provenance}</span>
          </div>
        </div>

        {/* Materials */}
        <div className="pt-3 border-t border-neutral-200">
          <p className="text-caption font-semibold text-neutral-700 mb-1">Materialien:</p>
          <p className="text-caption text-neutral-600 line-clamp-2">
            {artifact.materials.join(', ')}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {artifact.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="tag tag-neutral">
              <TagIcon className="h-3 w-3 mr-1" />
              {tag}
            </span>
          ))}
          {artifact.tags.length > 2 && (
            <span className="text-caption text-neutral-500 px-2 py-1">
              +{artifact.tags.length - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};