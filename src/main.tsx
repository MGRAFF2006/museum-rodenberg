import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from './contexts/LanguageContext';
import { ContentProvider } from './contexts/ContentContext';
import { TextToSpeechProvider } from './hooks/useTextToSpeech';
import App from './App.tsx';
import './index.css';

// Connect to self-hosted Convex backend.
// In Docker, museum container connects to convex-backend service.
// In dev, connect to localhost:3210.
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || 'http://127.0.0.1:3210';
const convex = new ConvexReactClient(CONVEX_URL);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ConvexProvider client={convex}>
        <LanguageProvider>
          <ContentProvider>
            <TextToSpeechProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </TextToSpeechProvider>
          </ContentProvider>
        </LanguageProvider>
      </ConvexProvider>
    </ErrorBoundary>
  </StrictMode>
);
