import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { Language } from '../hooks/useLanguage';

interface TextToSpeechButtonProps {
  text: string;
  language: Language;
  className?: string;
}

const languageMap = {
  de: 'de-DE',
  en: 'en-US',
  fr: 'fr-FR',
};

export const TextToSpeechButton: React.FC<TextToSpeechButtonProps> = ({
  text,
  language,
  className = '',
}) => {
  const { speak, stop, isSpeaking, isSupported } = useTextToSpeech();

  if (!isSupported) return null;

  const handleClick = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text, languageMap[language]);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-lg text-blue-800 hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${className}`}
      title={isSpeaking ? 'Stoppen' : 'Vorlesen'}
      aria-label={isSpeaking ? 'Stoppen' : 'Vorlesen'}
    >
      {isSpeaking ? (
        <VolumeX className="h-5 w-5" />
      ) : (
        <Volume2 className="h-5 w-5" />
      )}
    </button>
  );
};