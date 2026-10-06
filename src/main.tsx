import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from './contexts/LanguageContext';
import { ContentProvider } from './contexts/ContentContext';
import { TextToSpeechProvider } from './hooks/useTextToSpeech';
import App from './App.tsx';

// Self-hosted fonts via @fontsource (no external requests)
import '@fontsource-variable/cormorant-garamond';
import '@fontsource-variable/lexend';

import './index.css';

// Connect to self-hosted Convex backend.
// In Docker, museum container connects to convex-backend service.
// In dev, connect to localhost:3210.
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || `${window.location.origin}/convex`;
console.log('[museum] Convex URL:', CONVEX_URL);
const convex = new ConvexReactClient(CONVEX_URL);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ConvexProvider client={convex}>
        <BrowserRouter>
        <LanguageProvider>
          <ContentProvider>
            <TextToSpeechProvider>
              <App />
            </TextToSpeechProvider>
          </ContentProvider>
        </LanguageProvider>
        </BrowserRouter>
      </ConvexProvider>
    </ErrorBoundary>
  </StrictMode>
);
