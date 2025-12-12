import React from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { TextToSpeechButton } from './TextToSpeechButton';
import { Language } from '../hooks/useLanguage';
import { t } from '../utils/translations';

interface DetailedContentPageProps {
  title: string;
  content: string;
  onBack: () => void;
  onMediaClick?: (type: 'image' | 'video' | 'audio', url: string, title?: string) => void;
  currentLanguage: Language;
}

export const DetailedContentPage: React.FC<DetailedContentPageProps> = ({
  title,
  content,
  onBack,
  onMediaClick,
  currentLanguage,
}) => {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center text-primary-800 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              {t('back', currentLanguage)}
            </button>
            <TextToSpeechButton
              text={content.replace(/[#*\[\]()]/g, '')}
              language={currentLanguage}
            />
          </div>
        </div>
      </div>

      {/* Title Banner */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 mr-4" />
            <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <MarkdownRenderer 
            content={content} 
            onMediaClick={onMediaClick}
          />
        </div>
        
        {/* Bottom spacing for mobile */}
        <div className="h-8 md:h-0"></div>
      </div>
    </div>
  );
};