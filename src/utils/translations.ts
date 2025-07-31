import { Language } from '../hooks/useLanguage';

export const getTranslatedContent = (
  content: any,
  language: Language,
  fallbackLanguage: Language = 'de'
) => {
  if (!content || !content.translations) return content;

  const translation = content.translations[language] || content.translations[fallbackLanguage];
  
  return {
    ...content,
    ...translation,
  };
};

export const translations = {
  de: {
    // Navigation
    allExhibitions: 'Alle Ausstellungen',
    backToExhibitions: 'Zurück zu den Ausstellungen',
    backTo: 'Zurück zu',
    searchPlaceholder: 'Ausstellungen, Exponate suchen...',
    navigation: 'Navigation',
    
    // Content sections
    description: 'Beschreibung',
    details: 'Details',
    materials: 'Materialien',
    dimensions: 'Abmessungen',
    provenance: 'Herkunft',
    historicalSignificance: 'Historische Bedeutung',
    themes: 'Themen',
    aboutExhibition: 'Über diese Ausstellung',
    specialArtifacts: 'Besondere Exponate',
    exhibitionDetails: 'Ausstellungsdetails',
    period: 'Zeitraum',
    location: 'Standort',
    curator: 'Kurator',
    
    // Search
    searchResults: 'Ergebnis',
    searchResultsPlural: 'Ergebnisse',
    searchFor: 'für',
    noResults: 'Keine Ergebnisse gefunden',
    noResultsText: 'Versuchen Sie es mit anderen Suchbegriffen oder durchstöbern Sie unsere Ausstellungen.',
    exhibitions: 'Ausstellungen',
    artifacts: 'Exponate',
    
    // Homepage
    museumTitle: 'Museum der Stadt Rodenberg',
    museumSubtitle: 'Entdecken Sie die Geschichte Rodenbergs und der Region zwischen Deister und Weser',
    collectionsInfo: 'Sammlungen zur Stadtgeschichte, Trachten und Handwerk',
    mainExhibition: 'Hauptausstellung',
    currentExhibitions: 'Aktuelle Ausstellungen',
    specialArtifacts: 'Besondere Exponate',
    yearsHistory: 'Jahre Stadtgeschichte',
    
    // QR Scanner
    qrScanner: 'QR-Code Scanner',
    qrScannerText: 'Richten Sie Ihre Kamera auf den QR-Code eines Exponats, um direkt zu dessen Informationen zu gelangen.',
    cameraLoading: 'Kamera wird geladen...',
    cancel: 'Abbrechen',
    
    // Media
    media: 'Medien',
    images: 'Bilder',
    image: 'Bild',
    videos: 'Videos',
    audio: 'Audio',
    readMore: 'Weiterlesen',
    back: 'Zurück',
    
    // TTS
    readAloud: 'Vorlesen',
    stop: 'Stoppen',
    
    // Media support messages
    videoNotSupported: 'Ihr Browser unterstützt das Video-Element nicht.',
    audioNotSupported: 'Ihr Browser unterstützt das Audio-Element nicht.',
    
    // Accessibility
    accessibility: 'Barrierefreiheit',
    fontSize: 'Schriftgröße',
    fontFamily: 'Schriftart',
    contrast: 'Kontrast',
    voiceNavigation: 'Sprachsteuerung',
    reset: 'Zurücksetzen',
    small: 'Klein',
    medium: 'Normal',
    large: 'Groß',
    extraLarge: 'Sehr groß',
    defaultFont: 'Standard',
    dyslexiaFriendly: 'Legasthenie-freundlich',
    normalContrast: 'Normal',
    highContrast: 'Hoher Kontrast',
    enabled: 'Aktiviert',
    disabled: 'Deaktiviert',
  },
  en: {
    // Navigation
    allExhibitions: 'All Exhibitions',
    backToExhibitions: 'Back to Exhibitions',
    backTo: 'Back to',
    searchPlaceholder: 'Search exhibitions, artifacts...',
    navigation: 'Navigation',
    
    // Content sections
    description: 'Description',
    details: 'Details',
    materials: 'Materials',
    dimensions: 'Dimensions',
    provenance: 'Provenance',
    historicalSignificance: 'Historical Significance',
    themes: 'Themes',
    aboutExhibition: 'About this Exhibition',
    specialArtifacts: 'Special Artifacts',
    exhibitionDetails: 'Exhibition Details',
    period: 'Period',
    location: 'Location',
    curator: 'Curator',
    
    // Search
    searchResults: 'result',
    searchResultsPlural: 'results',
    searchFor: 'for',
    noResults: 'No results found',
    noResultsText: 'Try different search terms or browse our exhibitions.',
    exhibitions: 'Exhibitions',
    artifacts: 'Artifacts',
    
    // Homepage
    museumTitle: 'Rodenberg City Museum',
    museumSubtitle: 'Discover the history of Rodenberg and the region between Deister and Weser',
    collectionsInfo: 'Collections on city history, traditional costumes and crafts',
    mainExhibition: 'Main Exhibition',
    currentExhibitions: 'Current Exhibitions',
    specialArtifacts: 'Special Artifacts',
    yearsHistory: 'Years of History',
    
    // QR Scanner
    qrScanner: 'QR Code Scanner',
    qrScannerText: 'Point your camera at an artifact\'s QR code to go directly to its information.',
    cameraLoading: 'Camera loading...',
    cancel: 'Cancel',
    
    // Media
    media: 'Media',
    images: 'Images',
    image: 'Image',
    videos: 'Videos',
    audio: 'Audio',
    readMore: 'Read More',
    back: 'Back',
    
    // TTS
    readAloud: 'Read Aloud',
    stop: 'Stop',
    
    // Media support messages
    videoNotSupported: 'Your browser does not support the video element.',
    audioNotSupported: 'Your browser does not support the audio element.',
    
    // Accessibility
    accessibility: 'Accessibility',
    fontSize: 'Font Size',
    fontFamily: 'Font Family',
    contrast: 'Contrast',
    voiceNavigation: 'Voice Navigation',
    reset: 'Reset',
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    extraLarge: 'Extra Large',
    defaultFont: 'Default',
    dyslexiaFriendly: 'Dyslexia Friendly',
    normalContrast: 'Normal',
    highContrast: 'High Contrast',
    enabled: 'Enabled',
    disabled: 'Disabled',
  },
  fr: {
    // Navigation
    allExhibitions: 'Toutes les Expositions',
    backToExhibitions: 'Retour aux Expositions',
    backTo: 'Retour à',
    searchPlaceholder: 'Rechercher expositions, objets...',
    navigation: 'Navigation',
    
    // Content sections
    description: 'Description',
    details: 'Détails',
    materials: 'Matériaux',
    dimensions: 'Dimensions',
    provenance: 'Provenance',
    historicalSignificance: 'Importance Historique',
    themes: 'Thèmes',
    aboutExhibition: 'À propos de cette Exposition',
    specialArtifacts: 'Objets Spéciaux',
    exhibitionDetails: 'Détails de l\'Exposition',
    period: 'Période',
    location: 'Lieu',
    curator: 'Conservateur',
    
    // Search
    searchResults: 'résultat',
    searchResultsPlural: 'résultats',
    searchFor: 'pour',
    noResults: 'Aucun résultat trouvé',
    noResultsText: 'Essayez d\'autres termes de recherche ou parcourez nos expositions.',
    exhibitions: 'Expositions',
    artifacts: 'Objets',
    
    // Homepage
    museumTitle: 'Musée de la Ville de Rodenberg',
    museumSubtitle: 'Découvrez l\'histoire de Rodenberg et de la région entre Deister et Weser',
    collectionsInfo: 'Collections sur l\'histoire de la ville, les costumes traditionnels et l\'artisanat',
    mainExhibition: 'Exposition Principale',
    currentExhibitions: 'Expositions Actuelles',
    specialArtifacts: 'Objets Spéciaux',
    yearsHistory: 'Années d\'Histoire',
    
    // QR Scanner
    qrScanner: 'Scanner QR Code',
    qrScannerText: 'Pointez votre caméra sur le QR code d\'un objet pour accéder directement à ses informations.',
    cameraLoading: 'Chargement de la caméra...',
    cancel: 'Annuler',
    
    // Media
    media: 'Médias',
    images: 'Images',
    image: 'Image',
    videos: 'Vidéos',
    audio: 'Audio',
    readMore: 'Lire Plus',
    back: 'Retour',
    
    // TTS
    readAloud: 'Lire à Haute Voix',
    stop: 'Arrêter',
    
    // Media support messages
    videoNotSupported: 'Votre navigateur ne supporte pas l\'élément vidéo.',
    audioNotSupported: 'Votre navigateur ne supporte pas l\'élément audio.',
    
    // Accessibility
    accessibility: 'Accessibilité',
    fontSize: 'Taille de Police',
    fontFamily: 'Famille de Police',
    contrast: 'Contraste',
    reset: 'Réinitialiser',
    small: 'Petit',
    medium: 'Moyen',
    large: 'Grand',
    extraLarge: 'Très Grand',
    defaultFont: 'Par Défaut',
    dyslexiaFriendly: 'Dyslexie (Adapté à la Dyslexie)',
    normalContrast: 'Normal',
    highContrast: 'Contraste Élevé',
  },
};

export const t = (key: string, language: Language): string => {
  const keys = key.split('.');
  let value: any = translations[language];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
};