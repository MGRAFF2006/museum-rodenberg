import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { Language, useLanguage } from '../hooks/useLanguage';

interface TextToSpeechButtonProps {
  text: string;
  language: Language;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TextToSpeechButton: React.FC<TextToSpeechButtonProps> = ({
  text,
  language,
  className = '',
  size = 'md',
}) => {
  const { speak, stop, isSpeaking, isSupported, error } = useTextToSpeech();
  const { t } = useLanguage();
  const [showError, setShowError] = useState(false);

  // Show a brief error tooltip when an error occurs
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 4000);
      return () => clearTimeout(timer);
    }
    setShowError(false);
  }, [error]);

  if (!isSupported || !text) return null;

  const handleClick = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text, language);
    }
  };

  const sizeClasses = {
    sm: 'p-1.5 h-8 w-8',
    md: 'p-2 h-9 w-9',
    lg: 'p-2.5 h-10 w-10',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const hasError = error !== null;

  const errorMessage = error === 'no-voices'
    ? t('ttsNoVoices') || 'No speech voices available on this device'
    : error === 'synthesis-error'
    ? t('ttsError') || 'Speech synthesis failed'
    : '';

  return (
    <div className="relative inline-flex">
      <button
        onClick={handleClick}
        className={`
          ${sizeClasses[size]}
          inline-flex items-center justify-center
          rounded-md
          ${hasError
            ? 'text-red-500 hover:bg-red-50'
            : isSpeaking
            ? 'bg-primary-100 text-primary-700'
            : 'text-primary-600 hover:bg-primary-50'}
          transition-colors
          focus-ring-sm
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        title={hasError ? errorMessage : isSpeaking ? t('stop') : t('readAloud')}
        aria-label={hasError ? errorMessage : isSpeaking ? t('stop') : t('readAloud')}
        disabled={!text}
      >
        {hasError ? (
          <AlertTriangle className={iconSizes[size]} />
        ) : isSpeaking ? (
          <VolumeX className={iconSizes[size]} />
        ) : (
          <Volume2 className={iconSizes[size]} />
        )}
      </button>
      {showError && errorMessage && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-red-600 text-white text-xs rounded-md whitespace-nowrap shadow-lg z-50">
          {errorMessage}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-600" />
        </div>
      )}
    </div>
  );
};