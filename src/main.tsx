import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from './contexts/LanguageContext';
import { ContentProvider } from './contexts/ContentContext';
import { TextToSpeechProvider } from './hooks/useTextToSpeech';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <ContentProvider>
          <TextToSpeechProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </TextToSpeechProvider>
        </ContentProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>
);
