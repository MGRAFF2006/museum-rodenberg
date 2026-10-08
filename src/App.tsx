import { useState, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useSearchParams, useParams, NavigateFunction } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { MobileMenu } from './components/MobileMenu';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { convexArtifactToRaw, convexExhibitionToRaw } from './utils/convexConverters';
import { getTranslatedContent } from './utils/translationUtils';

// Lazy-loaded detail pages (pulls in markdown-vendor chunk only when needed)
const ExhibitionDetail = lazy(() => import('./components/ExhibitionDetail').then(m => ({ default: m.ExhibitionDetail })));
const ArtifactDetail = lazy(() => import('./components/ArtifactDetail').then(m => ({ default: m.ArtifactDetail })));
import { useLanguage } from './hooks/useLanguage';
import { useContentData } from './hooks/useContentData';
import { useSearch } from './hooks/useSearch';
import type { Artifact, Exhibition } from './types';
import { getMediaGallery, mediaViewerSearch } from './utils/mediaGallery';

// Lazy-loaded routes (not needed on initial page load)
const SearchResults = lazy(() => import('./components/SearchResults').then(m => ({ default: m.SearchResults })));
const QRScanner = lazy(() => import('./components/QRScanner').then(m => ({ default: m.QRScanner })));
const DetailedContentPage = lazy(() => import('./components/DetailedContentPage').then(m => ({ default: m.DetailedContentPage })));
const MediaViewerPage = lazy(() => import('./components/MediaViewerPage').then(m => ({ default: m.MediaViewerPage })));
const AccessibilityPanel = lazy(() => import('./components/AccessibilityPanel').then(m => ({ default: m.AccessibilityPanel })));
const Admin = lazy(() => import('./components/Admin/Admin').then(m => ({ default: m.Admin })));

const LazyFallback = () => (
  <div role="status" aria-label="Loading content" className="min-h-[50vh] flex items-center justify-center">
    <div className="inline-block h-8 w-8 border-4 border-primary-200 border-t-primary-700 rounded-full animate-spin" />
  </div>
);

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const {
    exhibitions,
    artifacts,
    getExhibitionById,
    getArtifactsByExhibition,
    findByQRCode,
    featuredExhibitionId,
  } = useContentData();

  const searchResults = useSearch(searchQuery, exhibitions, artifacts);

  // QR Code handling
  const handleQRScan = (qrCode: string) => {
    const result = findByQRCode(qrCode);
    
    if (result.type === 'artifact' && result.item) {
      navigate(`/artifact/${result.item.id}`);
    } else if (result.type === 'exhibition' && result.item) {
      navigate(`/exhibition/${result.item.id}`);
    } else {
      // QR code not found - TODO: Replace with toast notification
      alert(t('qrCodeNotRecognized'));
    }
    setIsQRScannerOpen(false);
  };

  const handleSearchChange = (query: string) => {
    if (query.trim()) {
      setSearchParams({ q: query });
      navigate(`/search?q=${encodeURIComponent(query)}`);
    } else {
      setSearchParams({});
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onHomeClick={() => navigate('/')}
        onQRScanToggle={() => setIsQRScannerOpen(!isQRScannerOpen)}
        onMenuToggle={() => setIsMobileMenuOpen(true)}
      />
      
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onHomeClick={() => {
          setIsMobileMenuOpen(false);
          navigate('/');
        }}
        exhibitions={exhibitions}
        onExhibitionClick={(id) => {
          setIsMobileMenuOpen(false);
          navigate(`/exhibition/${id}`);
        }}
      />
      
      {isQRScannerOpen && (
        <Suspense fallback={<LazyFallback />}>
          <QRScanner
            isOpen={isQRScannerOpen}
            onClose={() => setIsQRScannerOpen(false)}
            onScan={handleQRScan}
          />
        </Suspense>
      )}
      
      <Suspense fallback={<LazyFallback />}>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              exhibitions={exhibitions}
              featuredId={featuredExhibitionId}
              onExhibitionClick={(id) => navigate(`/exhibition/${id}`)}
            />
          }
        />
        
        <Route
          path="/exhibition/:id"
          element={
            <ExhibitionRoute
              getArtifactsByExhibition={getArtifactsByExhibition}
              navigate={navigate}
            />
          }
        />
        
        <Route
          path="/artifact/:id"
          element={
            <ArtifactRoute
              getExhibitionById={getExhibitionById}
              navigate={navigate}
            />
          }
        />
        
        <Route
          path="/search"
          element={
            <SearchResults
              query={searchQuery}
              exhibitions={searchResults.exhibitions}
              artifacts={searchResults.artifacts}
              onExhibitionClick={(id) => navigate(`/exhibition/${id}`)}
              onArtifactClick={(id) => navigate(`/artifact/${id}`)}
              onBack={() => navigate('/')}
            />
          }
        />
        
        <Route
          path="/exhibition/:id/details"
          element={
            <DetailedContentRoute
              type="exhibition"
              navigate={navigate}
            />
          }
        />
        
        <Route
          path="/artifact/:id/details"
          element={
            <DetailedContentRoute
              type="artifact"
              navigate={navigate}
            />
          }
        />
        
        <Route
          path="/exhibition/:id/media"
          element={
            <MediaViewerRoute
              type="exhibition"
              navigate={navigate}
            />
          }
        />
        
        <Route
          path="/artifact/:id/media"
          element={
            <MediaViewerRoute
              type="artifact"
              navigate={navigate}
            />
          }
        />
        
        <Route path="/admin" element={<Admin />} />
        
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                <h1 className="text-6xl font-bold text-primary-800 mb-4">404</h1>
                <p className="text-xl text-neutral-700 mb-2">{t('contentNotFound')}</p>
                <p className="text-neutral-500 mb-6">{t('noResultsText')}</p>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-primary-800 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {t('backToExhibitions')}
                </button>
              </div>
            </div>
          }
        />
      </Routes>
      </Suspense>
      
      <Suspense fallback={null}>
        <AccessibilityPanel />
      </Suspense>
    </div>
  );
}

// Route components
function usePublicItem(type: 'exhibition', id: string | undefined): Exhibition | null | undefined;
function usePublicItem(type: 'artifact', id: string | undefined): Artifact | null | undefined;
function usePublicItem(type: 'exhibition' | 'artifact', id: string | undefined): Exhibition | Artifact | null | undefined;
function usePublicItem(type: 'exhibition' | 'artifact', id: string | undefined) {
  const { currentLanguage } = useLanguage();
  const { resolveAsset } = useContentData();
  const exhibition = useQuery(api.exhibitions.getBySlug, type === 'exhibition' && id ? { slug: id } : 'skip');
  const artifact = useQuery(api.artifacts.getBySlug, type === 'artifact' && id ? { slug: id } : 'skip');
  const raw = type === 'exhibition'
    ? exhibition && convexExhibitionToRaw(exhibition)
    : artifact && convexArtifactToRaw(artifact);

  return raw ? getTranslatedContent(raw, currentLanguage, 'de', resolveAsset) as Exhibition | Artifact : raw;
}

interface ExhibitionRouteProps {
  getArtifactsByExhibition: (id: string) => Artifact[];
  navigate: NavigateFunction;
}

function ExhibitionRoute({ getArtifactsByExhibition, navigate }: ExhibitionRouteProps) {
  const { id } = useParams();
  const exhibition = usePublicItem('exhibition', id);
  if (!id) return <div>Exhibition not found</div>;
  if (exhibition === undefined) return <LazyFallback />;
  if (!exhibition) return <div>Exhibition not found</div>;
  
  const exhibitionArtifacts = getArtifactsByExhibition(id);
  
  return (
    <ExhibitionDetail
      exhibition={exhibition}
      artifacts={exhibitionArtifacts}
      onBack={() => navigate('/')}
      onArtifactClick={(artId) => navigate(`/artifact/${artId}`)}
      onDetailedContentClick={() => navigate(`/exhibition/${id}/details`)}
      onMediaViewerClick={(_images, _videos, _audio, selection) => navigate(`/exhibition/${id}/media${mediaViewerSearch(selection)}`)}
    />
  );
}

interface ArtifactRouteProps {
  getExhibitionById: (id: string) => Exhibition | undefined;
  navigate: NavigateFunction;
}

function ArtifactRoute({ getExhibitionById, navigate }: ArtifactRouteProps) {
  const { id } = useParams();
  const artifact = usePublicItem('artifact', id);
  if (!id) return <div>Artifact not found</div>;
  if (artifact === undefined) return <LazyFallback />;
  if (!artifact) return <div>Artifact not found</div>;
  
  const exhibition = artifact.exhibition ? getExhibitionById(artifact.exhibition) : null;
  
  return (
    <ArtifactDetail
      artifact={artifact}
      onBack={() => artifact.exhibition ? navigate(`/exhibition/${artifact.exhibition}`) : navigate('/')}
      exhibitionTitle={exhibition?.title}
      onDetailedContentClick={() => navigate(`/artifact/${id}/details`)}
      onMediaViewerClick={(_images, _videos, _audio, selection) => navigate(`/artifact/${id}/media${mediaViewerSearch(selection)}`)}
    />
  );
}

interface DetailedContentRouteProps {
  type: 'exhibition' | 'artifact';
  navigate: NavigateFunction;
}

function DetailedContentRoute({ type, navigate }: DetailedContentRouteProps) {
  const { id } = useParams();
  const { currentLanguage } = useLanguage();
  const item = usePublicItem(type, id);
  if (!id) return <div>Content not found</div>;
  if (item === undefined) return <LazyFallback />;
  const content = item?.detailedContent?.[currentLanguage] || item?.detailedContent?.de;
  if (!item || !content || (item.enabledAttributes && !item.enabledAttributes.includes('detailedContent'))) {
    return <div>Content not found</div>;
  }
  
  return (
    <DetailedContentPage
      title={item.title}
      content={content}
      onBack={() => navigate(`/${type}/${id}`)}
      onMediaClick={(mediaType, url) => {
        navigate(`/${type}/${id}/media${mediaViewerSearch({ type: mediaType, url })}`);
      }}
    />
  );
}

interface MediaViewerRouteProps {
  type: 'exhibition' | 'artifact';
  navigate: NavigateFunction;
}

function MediaViewerRoute({ type, navigate }: MediaViewerRouteProps) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const initialTab = requestedTab === 'images' || requestedTab === 'videos' || requestedTab === 'audio'
    ? requestedTab : undefined;
  const initialUrl = searchParams.get('url');
  const { currentLanguage } = useLanguage();
  const { resolveAsset } = useContentData();
  // Full content is needed to include media embedded only in detailed Markdown.
  const exhibition = useQuery(api.exhibitions.getBySlug, type === 'exhibition' && id ? { slug: id } : 'skip');
  const artifact = useQuery(api.artifacts.getBySlug, type === 'artifact' && id ? { slug: id } : 'skip');
  const raw = type === 'exhibition'
    ? exhibition && convexExhibitionToRaw(exhibition)
    : artifact && convexArtifactToRaw(artifact);
  const item = raw ? getTranslatedContent(raw, currentLanguage, 'de', resolveAsset) as Exhibition | Artifact : raw;
  
  if (!id) return <div>Media not found</div>;
  if (item === undefined) return <LazyFallback />;
  if (!item) return <div>Media not found</div>;
  const isEnabled = (attribute: string) => !item.enabledAttributes || item.enabledAttributes.includes(attribute);
  const gallery = getMediaGallery(
    isEnabled('media') ? item.media : undefined,
    isEnabled('description') ? item.description : undefined,
    isEnabled('significance') ? item.significance as string | undefined : undefined,
    isEnabled('detailedContent') ? item.detailedContent?.[currentLanguage] || item.detailedContent?.de : undefined
  );
  
  return (
    <MediaViewerPage
      key={`${type}/${id}`}
      images={gallery.images}
      videos={gallery.videos}
      audio={gallery.audio}
      onBack={() => navigate(`/${type}/${id}`)}
      initialTab={initialTab}
      initialUrl={initialUrl}
    />
  );
}

export default App;
