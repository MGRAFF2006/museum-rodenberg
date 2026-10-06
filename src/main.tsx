import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from './contexts/LanguageContext';
import { ContentProvider } from './contexts/ContentContext';
import { TextToSpeechProvider } from './hooks/useTextToSpeech';
import App from './App.tsx';
import { resolveConvexUrl } from './utils/convexUrl';

// Self-hosted fonts via @fontsource (no external requests)
import '@fontsource-variable/cormorant-garamond';
import '@fontsource-variable/lexend';

import './index.css';

// Connect to self-hosted Convex backend.
// Relative proxy URLs follow the visitor's origin, including LAN and HTTPS hosts.
const CONVEX_URL = resolveConvexUrl(import.meta.env.VITE_CONVEX_URL, window.location.origin);
console.log('[museum] Convex URL:', CONVEX_URL);
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
