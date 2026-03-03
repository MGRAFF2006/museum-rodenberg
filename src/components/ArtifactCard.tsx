import React from 'react';
import { Calendar, Ruler, MapPin, Tag as TagIcon } from 'lucide-react';
import { Artifact } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { stripMarkdown } from '../utils/markdownUtils';

interface ArtifactCardProps {
  artifact: Artifact;
  onClick: (id: string) => void;
  featured?: boolean;
}

export const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact, onClick, featured = false }) => {
  const { t } = useLanguage();
  return (
    <div
      onClick={() => onClick(artifact.id)}
      className={`${featured ? 'card-featured' : 'card-interactive'} overflow-hidden group h-full flex flex-col`}
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
            <span className="badge badge-accent">{t('featured')}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 md:p-5 flex flex-col gap-3 flex-grow">
        {/* Period Badge */}
        {artifact.period && (
          <div className="metadata">
            <Calendar className="metadata-icon" />
            <span className="text-caption font-semibold text-accent-600">
              {artifact.period}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-heading-sm font-semibold text-neutral-900 line-clamp-2">
          {artifact.title}
        </h3>

        {/* Description */}
        <p className="text-body-sm text-neutral-600 line-clamp-3">
          {stripMarkdown(artifact.description)}
        </p>

        {/* Meta Information */}
        {(artifact.dimensions || artifact.provenance) && (
          <div className="space-y-1.5 pt-3 border-t border-neutral-200">
            {artifact.dimensions && (
              <div className="metadata">
                <Ruler className="metadata-icon" />
                <span className="text-caption text-neutral-600">{artifact.dimensions}</span>
              </div>
            )}
            {artifact.provenance && (
              <div className="metadata">
                <MapPin className="metadata-icon" />
                <span className="text-caption text-neutral-600">{artifact.provenance}</span>
              </div>
            )}
          </div>
        )}

        {/* Materials */}
        {artifact.materials && artifact.materials.length > 0 && (
          <div className="pt-3 border-t border-neutral-200">
            <p className="text-caption font-semibold text-neutral-700 mb-1">{t('materials')}:</p>
            <p className="text-caption text-neutral-600 line-clamp-2">
              {artifact.materials.join(', ')}
            </p>
          </div>
        )}

        {/* Tags */}
        {artifact.tags && artifact.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-3 mt-auto">
            {artifact.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="tag tag-neutral text-[10px]">
                <TagIcon className="h-2.5 w-2.5 mr-1" />
                {tag}
              </span>
            ))}
            {artifact.tags.length > 2 && (
              <span className="text-[10px] text-neutral-500 px-1 py-0.5">
                +{artifact.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
