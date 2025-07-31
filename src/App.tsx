import React, { useState, useMemo } from 'react';
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
import { VoiceNavigationProvider } from './components/VoiceNavigationProvider';
import { useLanguage } from './hooks/useLanguage';
import { useAccessibility } from './hooks/useAccessibility';
import { getTranslatedContent } from './utils/translations';

// Import content data
import exhibitionsData from './content/exhibitions.json';
import artifactsData from './content/artifacts.json';

type ViewType = 'home' | 'exhibition' | 'artifact' | 'search' | 'detailed-content' | 'media-viewer';

interface ViewState {
  type: ViewType;
  id?: string;
  contentType?: 'exhibition' | 'artifact';
  mediaType?: 'images' | 'videos' | 'audio';
}

function App() {
  const [currentView, setCurrentView] = useState<ViewState>({ type: 'home' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const { currentLanguage, changeLanguage } = useLanguage();
  const { settings } = useAccessibility();

  // Convert data to arrays
  const exhibitions = useMemo(() => {
    return Object.values(exhibitionsData.exhibitions).map(exhibition =>
      getTranslatedContent(exhibition, currentLanguage)
    );
  }, [currentLanguage]);
  
  const artifacts = useMemo(() => {
    return Object.values(artifactsData.artifacts).map(artifact =>
      getTranslatedContent(artifact, currentLanguage)
    );
  }, [currentLanguage]);

  // QR Code handling
  const handleQRScan = (qrCode: string) => {
    // Find artifact or exhibition by QR code
    const artifact = artifacts.find(a => a.qrCode === qrCode);
    const exhibition = exhibitions.find(e => e.qrCode === qrCode);
    
    if (artifact) {
      handleArtifactClick(artifact.id);
    } else if (exhibition) {
      handleExhibitionClick(exhibition.id);
    } else {
      // Handle unknown QR code
      alert('QR-Code nicht erkannt. Bitte versuchen Sie es erneut.');
    }
  };

  const handleQRScanToggle = () => {
    setIsQRScannerOpen(!isQRScannerOpen);
  };

  // Search functionality with translated content
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { exhibitions: [], artifacts: [] };

    const query = searchQuery.toLowerCase();
    
    const matchingExhibitions = exhibitions.filter(ex =>
      ex.title.toLowerCase().includes(query) ||
      ex.description.toLowerCase().includes(query) ||
      ex.tags.some(tag => tag.toLowerCase().includes(query)) ||
      ex.curator.toLowerCase().includes(query)
    );

    const matchingArtifacts = artifacts.filter(art =>
      art.title.toLowerCase().includes(query) ||
      art.description.toLowerCase().includes(query) ||
      art.period.toLowerCase().includes(query) ||
      art.tags.some(tag => tag.toLowerCase().includes(query)) ||
      art.materials.some(material => material.toLowerCase().includes(query))
    );

    return {
      exhibitions: matchingExhibitions,
      artifacts: matchingArtifacts
    };
  }, [searchQuery, exhibitions, artifacts]);

  // Remove old search functionality
  /*
  const exhibitions = useMemo(() => 
    Object.values(exhibitionsData.exhibitions), 
    []
  );
  
  const artifacts = useMemo(() => 
    Object.values(artifactsData.artifacts), 
    []
  );

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { exhibitions: [], artifacts: [] };

    const query = searchQuery.toLowerCase();
    
    const matchingExhibitions = exhibitions.filter(ex =>
      ex.title.toLowerCase().includes(query) ||
      ex.description.toLowerCase().includes(query) ||
      ex.tags.some(tag => tag.toLowerCase().includes(query)) ||
      ex.curator.toLowerCase().includes(query)
    );

    const matchingArtifacts = artifacts.filter(art =>
      art.title.toLowerCase().includes(query) ||
      art.description.toLowerCase().includes(query) ||
      art.period.toLowerCase().includes(query) ||
      art.tags.some(tag => tag.toLowerCase().includes(query)) ||
      art.materials.some(material => material.toLowerCase().includes(query))
    );

    return {
      exhibitions: matchingExhibitions,
      artifacts: matchingArtifacts
    };
  }, [searchQuery, exhibitions, artifacts]);
  */

  // Navigation handlers
  const handleHomeClick = () => {
    setCurrentView({ type: 'home' });
    setSearchQuery('');
  };

  const handleExhibitionClick = (id: string) => {
    setCurrentView({ type: 'exhibition', id });
    setSearchQuery('');
  };

  const handleArtifactClick = (id: string) => {
    setCurrentView({ type: 'artifact', id });
    setSearchQuery('');
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setCurrentView({ type: 'search' });
    } else {
      setCurrentView({ type: 'home' });
    }
  };

  const handleBackClick = () => {
    if (currentView.type === 'detailed-content' || currentView.type === 'media-viewer') {
      // Go back to the previous view (exhibition or artifact)
      if (currentView.contentType === 'exhibition' && currentView.id) {
        setCurrentView({ type: 'exhibition', id: currentView.id });
      } else if (currentView.contentType === 'artifact' && currentView.id) {
        setCurrentView({ type: 'artifact', id: currentView.id });
      } else {
        handleHomeClick();
      }
      return;
    }
    if (currentView.type === 'artifact' && currentView.id) {
      // Find which exhibition this artifact belongs to
      const artifact = artifacts.find(a => a.id === currentView.id);
      if (artifact && 'exhibition' in artifact) {
        setCurrentView({ type: 'exhibition', id: artifact.exhibition });
        return;
      }
    }
    handleHomeClick();
  };

  // Voice navigation handlers
  const handleSearchFocus = () => {
    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  };

  const handleReadAloud = () => {
    const ttsButton = document.querySelector('[title="Vorlesen"], [title="Read Aloud"]') as HTMLButtonElement;
    if (ttsButton) {
      ttsButton.click();
    }
  };

  const handleDetailedContentClick = (contentType: 'exhibition' | 'artifact', id: string) => {
    setCurrentView({ 
      type: 'detailed-content', 
      id, 
      contentType 
    });
  };

  const handleMediaViewerClick = (contentType: 'exhibition' | 'artifact', id: string, mediaType?: 'images' | 'videos' | 'audio') => {
    setCurrentView({ 
      type: 'media-viewer', 
      id, 
      contentType,
      mediaType 
    });
  };

  // Get current exhibition and artifact data
  const currentExhibition = currentView.id ? 
    exhibitions.find(ex => ex.id === currentView.id) : null;
  
  const currentArtifact = currentView.id ? 
    artifacts.find(art => art.id === currentView.id) : null;

  const exhibitionArtifacts = currentExhibition ? 
    artifacts.filter(art => currentExhibition.artifacts.includes(art.id)) : [];

  // Render current view
  const renderCurrentView = () => {
    switch (currentView.type) {
      case 'home':
        return (
          <HomePage
            exhibitions={exhibitions}
            featuredId={exhibitionsData.featured}
            onExhibitionClick={handleExhibitionClick}
            currentLanguage={currentLanguage}
          />
        );
      
      case 'exhibition':
        if (!currentExhibition) return <div>Exhibition not found</div>;
        return (
          <ExhibitionDetail
            exhibition={currentExhibition}
            artifacts={exhibitionArtifacts}
            onBack={handleBackClick}
            onArtifactClick={handleArtifactClick}
            onDetailedContentClick={handleDetailedContentClick}
            onMediaViewerClick={handleMediaViewerClick}
            currentLanguage={currentLanguage}
          />
        );
      
      case 'artifact':
        if (!currentArtifact) return <div>Artifact not found</div>;
        const exhibitionTitle = currentExhibition?.title;
        return (
          <ArtifactDetail
            artifact={currentArtifact}
            onBack={handleBackClick}
            exhibitionTitle={exhibitionTitle}
            onDetailedContentClick={handleDetailedContentClick}
            onMediaViewerClick={handleMediaViewerClick}
            currentLanguage={currentLanguage}
          />
        );
      
      case 'search':
        return (
          <SearchResults
            query={searchQuery}
            exhibitions={searchResults.exhibitions}
            artifacts={searchResults.artifacts}
            onExhibitionClick={handleExhibitionClick}
            onArtifactClick={handleArtifactClick}
            onBack={handleHomeClick}
          />
        );
      
      case 'detailed-content':
        if (currentView.contentType === 'exhibition') {
          if (!currentExhibition || !currentExhibition.detailedContent) return <div>Content not found</div>;
          return (
            <DetailedContentPage
              title={currentExhibition.title}
              content={currentExhibition.detailedContent[currentLanguage]}
              onBack={handleBackClick}
              onMediaClick={(type, url, title) => handleMediaViewerClick('exhibition', currentExhibition.id)}
              currentLanguage={currentLanguage}
            />
          );
        } else {
          if (!currentArtifact || !currentArtifact.detailedContent) return <div>Content not found</div>;
          return (
            <DetailedContentPage
              title={currentArtifact.title}
              content={currentArtifact.detailedContent[currentLanguage]}
              onBack={handleBackClick}
              onMediaClick={(type, url, title) => handleMediaViewerClick('artifact', currentArtifact.id)}
              currentLanguage={currentLanguage}
            />
          );
        }
      
      case 'media-viewer':
        if (currentView.contentType === 'exhibition') {
          if (!currentExhibition || !currentExhibition.media) return <div>Media not found</div>;
          return (
            <MediaViewerPage
              images={currentExhibition.media.images}
              videos={currentExhibition.media.videos}
              audio={currentExhibition.media.audio}
              onBack={handleBackClick}
              currentLanguage={currentLanguage}
              initialTab={currentView.mediaType}
            />
          );
        } else {
          if (!currentArtifact || !currentArtifact.media) return <div>Media not found</div>;
          return (
            <MediaViewerPage
              images={currentArtifact.media.images}
              videos={currentArtifact.media.videos}
              audio={currentArtifact.media.audio}
              onBack={handleBackClick}
              currentLanguage={currentLanguage}
              initialTab={currentView.mediaType}
            />
          );
        }
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onHomeClick={handleHomeClick}
        onQRScanToggle={handleQRScanToggle}
        onMenuToggle={() => setIsMobileMenuOpen(true)}
        currentLanguage={currentLanguage}
        onLanguageChange={changeLanguage}
      />
      
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onHomeClick={handleHomeClick}
        exhibitions={exhibitions}
        onExhibitionClick={handleExhibitionClick}
      />
      
      <QRScanner
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScan={handleQRScan}
      />
      
      {renderCurrentView()}
      
      <AccessibilityPanel currentLanguage={currentLanguage} />
    </div>
  );
}

export default App;