import { useState } from 'react';
import { Routes, Route, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { ExhibitionDetail } from './components/ExhibitionDetail';
import { ArtifactDetail } from './components/ArtifactDetail';
import { SearchResults } from './components/SearchResults';
import { MobileMenu } from './components/MobileMenu';
import { QRScanner } from './components/QRScanner';
import { DetailedContentPage } from './components/DetailedContentPage';
import { MediaViewerPage } from './components/MediaViewerPage';
import { AccessibilityPanel } from './components/AccessibilityPanel';
import { useLanguage } from './hooks/useLanguage';
import { useContentData } from './hooks/useContentData';
import { useSearch } from './hooks/useSearch';
import { t } from './utils/translations';
import type { Language } from './contexts/LanguageContext';

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const { currentLanguage, changeLanguage } = useLanguage();
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
      alert(t('qrCodeNotRecognized', currentLanguage));
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
        currentLanguage={currentLanguage}
        onLanguageChange={changeLanguage}
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
      
      <QRScanner
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScan={handleQRScan}
      />
      
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              exhibitions={exhibitions}
              featuredId={featuredExhibitionId}
              onExhibitionClick={(id) => navigate(`/exhibition/${id}`)}
              currentLanguage={currentLanguage}
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
              currentLanguage={currentLanguage}
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
              currentLanguage={currentLanguage}
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
              currentLanguage={currentLanguage}
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
              currentLanguage={currentLanguage}
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
              currentLanguage={currentLanguage}
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
              currentLanguage={currentLanguage}
            />
          }
        />
      </Routes>
      
      <AccessibilityPanel currentLanguage={currentLanguage} />
    </div>
  );
}

// Route components
interface ExhibitionRouteProps {
  getExhibitionById: (id: string) => any;
  getArtifactsByExhibition: (id: string) => any[];
  navigate: any;
  currentLanguage: Language;
}

function ExhibitionRoute({ getExhibitionById, getArtifactsByExhibition, navigate, currentLanguage }: ExhibitionRouteProps) {
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
      currentLanguage={currentLanguage}
    />
  );
}

interface ArtifactRouteProps {
  getArtifactById: (id: string) => any;
  getExhibitionById: (id: string) => any;
  navigate: any;
  currentLanguage: Language;
}

function ArtifactRoute({ getArtifactById, getExhibitionById, navigate, currentLanguage }: ArtifactRouteProps) {
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
      currentLanguage={currentLanguage}
    />
  );
}

interface DetailedContentRouteProps {
  type: 'exhibition' | 'artifact';
  getExhibitionById?: (id: string) => any;
  getArtifactById?: (id: string) => any;
  navigate: any;
  currentLanguage: Language;
}

function DetailedContentRoute({ type, getExhibitionById, getArtifactById, navigate, currentLanguage }: DetailedContentRouteProps) {
  const { id } = useParams();
  if (!id) return <div>Content not found</div>;
  
  const item = type === 'exhibition' 
    ? getExhibitionById?.(id)
    : getArtifactById?.(id);
    
  if (!item || !item.detailedContent) return <div>Content not found</div>;
  
  return (
    <DetailedContentPage
      title={item.title}
      content={item.detailedContent[currentLanguage]}
      onBack={() => navigate(`/${type}/${id}`)}
      onMediaClick={() => navigate(`/${type}/${id}/media`)}
      currentLanguage={currentLanguage}
    />
  );
}

interface MediaViewerRouteProps {
  type: 'exhibition' | 'artifact';
  getExhibitionById?: (id: string) => any;
  getArtifactById?: (id: string) => any;
  navigate: any;
  currentLanguage: Language;
}

function MediaViewerRoute({ type, getExhibitionById, getArtifactById, navigate, currentLanguage }: MediaViewerRouteProps) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') as 'images' | 'videos' | 'audio' | undefined;
  
  if (!id) return <div>Media not found</div>;
  
  const item = type === 'exhibition' 
    ? getExhibitionById?.(id)
    : getArtifactById?.(id);
    
  if (!item || !item.media) return <div>Media not found</div>;
  
  return (
    <MediaViewerPage
      images={item.media.images}
      videos={item.media.videos}
      audio={item.media.audio}
      onBack={() => navigate(`/${type}/${id}`)}
      currentLanguage={currentLanguage}
      initialTab={initialTab}
    />
  );
}

export default App;