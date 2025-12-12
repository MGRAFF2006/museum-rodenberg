import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { Language } from '../hooks/useLanguage';

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
  const { speak, stop, isSpeaking, isSupported } = useTextToSpeech();

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

  return (
    <button
      onClick={handleClick}
      className={`
        ${sizeClasses[size]}
        inline-flex items-center justify-center
        rounded-md
        ${isSpeaking ? 'bg-primary-100 text-primary-700' : 'text-primary-600 hover:bg-primary-50'}
        transition-colors
        focus-ring-sm
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={isSpeaking ? 'Stoppen' : 'Vorlesen'}
      aria-label={isSpeaking ? 'Vorlesen stoppen' : 'Vorlesen starten'}
      disabled={!text}
    >
      {isSpeaking ? (
        <VolumeX className={iconSizes[size]} />
      ) : (
        <Volume2 className={iconSizes[size]} />
      )}
    </button>
  );
};