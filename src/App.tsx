import { useState, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useSearchParams, useParams, NavigateFunction } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { ExhibitionDetail } from './components/ExhibitionDetail';
import { ArtifactDetail } from './components/ArtifactDetail';
import { MobileMenu } from './components/MobileMenu';
import { useLanguage } from './hooks/useLanguage';
import { useContentData } from './hooks/useContentData';
import { useSearch } from './hooks/useSearch';
import type { Artifact, Exhibition } from './types';

// Lazy-loaded routes (not needed on initial page load)
const SearchResults = lazy(() => import('./components/SearchResults').then(m => ({ default: m.SearchResults })));
const QRScanner = lazy(() => import('./components/QRScanner').then(m => ({ default: m.QRScanner })));
const DetailedContentPage = lazy(() => import('./components/DetailedContentPage').then(m => ({ default: m.DetailedContentPage })));
const MediaViewerPage = lazy(() => import('./components/MediaViewerPage').then(m => ({ default: m.MediaViewerPage })));
const AccessibilityPanel = lazy(() => import('./components/AccessibilityPanel').then(m => ({ default: m.AccessibilityPanel })));
const Admin = lazy(() => import('./components/Admin/Admin').then(m => ({ default: m.Admin })));

const LazyFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
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
    getArtifactById,
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
              getExhibitionById={getExhibitionById}
              getArtifactsByExhibition={getArtifactsByExhibition}
              navigate={navigate}
            />
          }
        />
        
        <Route
          path="/artifact/:id"
          element={
            <ArtifactRoute
              getArtifactById={getArtifactById}
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
              getExhibitionById={getExhibitionById}
              navigate={navigate}
            />
          }
        />
        
        <Route
          path="/artifact/:id/details"
          element={
            <DetailedContentRoute
              type="artifact"
              getArtifactById={getArtifactById}
              navigate={navigate}
            />
          }
        />
        
        <Route
          path="/exhibition/:id/media"
          element={
            <MediaViewerRoute
              type="exhibition"
              getExhibitionById={getExhibitionById}
              navigate={navigate}
            />
          }
        />
        
        <Route
          path="/artifact/:id/media"
          element={
            <MediaViewerRoute
              type="artifact"
              getArtifactById={getArtifactById}
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
interface ExhibitionRouteProps {
  getExhibitionById: (id: string) => Exhibition | undefined;
  getArtifactsByExhibition: (id: string) => Artifact[];
  navigate: NavigateFunction;
}

function ExhibitionRoute({ getExhibitionById, getArtifactsByExhibition, navigate }: ExhibitionRouteProps) {
  const { id } = useParams();
  if (!id) return <div>Exhibition not found</div>;
  
  const exhibition = getExhibitionById(id);
  if (!exhibition) return <div>Exhibition not found</div>;
  
  const exhibitionArtifacts = getArtifactsByExhibition(id);
  
  return (
    <ExhibitionDetail
      exhibition={exhibition}
      artifacts={exhibitionArtifacts}
      onBack={() => navigate('/')}
      onArtifactClick={(artId) => navigate(`/artifact/${artId}`)}
      onDetailedContentClick={() => navigate(`/exhibition/${id}/details`)}
      onMediaViewerClick={() => navigate(`/exhibition/${id}/media`)}
    />
  );
}

interface ArtifactRouteProps {
  getArtifactById: (id: string) => Artifact | undefined;
  getExhibitionById: (id: string) => Exhibition | undefined;
  navigate: NavigateFunction;
}

function ArtifactRoute({ getArtifactById, getExhibitionById, navigate }: ArtifactRouteProps) {
  const { id } = useParams();
  if (!id) return <div>Artifact not found</div>;
  
  const artifact = getArtifactById(id);
  if (!artifact) return <div>Artifact not found</div>;
  
  const exhibition = artifact.exhibition ? getExhibitionById(artifact.exhibition) : null;
  
  return (
    <ArtifactDetail
      artifact={artifact}
      onBack={() => artifact.exhibition ? navigate(`/exhibition/${artifact.exhibition}`) : navigate('/')}
      exhibitionTitle={exhibition?.title}
      onDetailedContentClick={() => navigate(`/artifact/${id}/details`)}
      onMediaViewerClick={() => navigate(`/artifact/${id}/media`)}
    />
  );
}

interface DetailedContentRouteProps {
  type: 'exhibition' | 'artifact';
  getExhibitionById?: (id: string) => Exhibition | undefined;
  getArtifactById?: (id: string) => Artifact | undefined;
  navigate: NavigateFunction;
}

function DetailedContentRoute({ type, getExhibitionById, getArtifactById, navigate }: DetailedContentRouteProps) {
  const { id } = useParams();
  const { currentLanguage } = useLanguage();
  if (!id) return <div>Content not found</div>;
  
  const item = type === 'exhibition' 
    ? getExhibitionById?.(id)
    : getArtifactById?.(id);
    
  if (!item || !item.detailedContent) return <div>Content not found</div>;
  
  return (
    <DetailedContentPage
      title={item.title}
      content={item.detailedContent[currentLanguage] || item.detailedContent['de'] || ''}
      onBack={() => navigate(`/${type}/${id}`)}
      onMediaClick={(mediaType, url) => {
        const tabMap = { 'image': 'images', 'video': 'videos', 'audio': 'audio' };
        navigate(`/${type}/${id}/media?tab=${tabMap[mediaType]}&url=${encodeURIComponent(url)}`);
      }}
    />
  );
}

interface MediaViewerRouteProps {
  type: 'exhibition' | 'artifact';
  getExhibitionById?: (id: string) => Exhibition | undefined;
  getArtifactById?: (id: string) => Artifact | undefined;
  navigate: NavigateFunction;
}

function MediaViewerRoute({ type, getExhibitionById, getArtifactById, navigate }: MediaViewerRouteProps) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') as 'images' | 'videos' | 'audio' | undefined;
  const initialUrl = searchParams.get('url');
  
  if (!id) return <div>Media not found</div>;
  
  const item = type === 'exhibition' 
    ? getExhibitionById?.(id)
    : getArtifactById?.(id);
    
  if (!item || !item.media) return <div>Media not found</div>;
  
  return (
    <MediaViewerPage
      images={item.media.images || []}
      videos={item.media.videos || []}
      audio={item.media.audio || []}
      onBack={() => navigate(`/${type}/${id}`)}
      initialTab={initialTab}
      initialUrl={initialUrl}
    />
  );
}

export default App;