/**
 * Conversion utilities for transforming Convex DB records into the legacy
 * JSON shape that getTranslatedContent / editor forms expect.
 *
 * Shared between ContentContext (public) and admin editor hooks.
 */

// ── Convex record types ──────────────────────────────────────────

export type ConvexExhibition = {
  _id: string;
  slug: string;
  qrCode: string;
  image: string;
  dateRange?: string;
  location?: string;
  curator?: string;
  organizer?: string;
  sponsor?: string;
  tags?: string[];
  enabledAttributes?: string[];
  isFeatured: boolean;
  artifactSlugs: string[];
  translations: Array<{
    language: string;
    title: string;
    subtitle?: string;
    description: string;
    detailedContent?: string;
  }>;
  media: Array<{
    mediaType: string;
    url: string;
    title?: string;
    description?: string;
    sortOrder: number;
  }>;
};

export type ConvexArtifact = {
  _id: string;
  slug: string;
  qrCode: string;
  exhibitionSlug?: string;
  image: string;
  materials?: string[];
  dimensions?: string;
  provenance?: string;
  tags?: string[];
  enabledAttributes?: string[];
  translations: Array<{
    language: string;
    title: string;
    period?: string;
    artist?: string;
    description: string;
    significance?: string;
    detailedContent?: string;
  }>;
  media: Array<{
    mediaType: string;
    url: string;
    title?: string;
    description?: string;
    sortOrder: number;
  }>;
};

export type ConvexAsset = {
  _id: string;
  assetId: string;
  name: string;
  alt: string;
  url: string;
  type: 'image' | 'audio' | 'video' | 'other';
};

// ── Media reconstruction helper ──────────────────────────────────

function reconstructMedia(media: ConvexExhibition['media'] | ConvexArtifact['media']) {
  const images: string[] = [];
  const videos: Array<{ url: string; title: string; description: string }> = [];
  const audio: Array<{ url: string; title: string; description: string }> = [];

  const sorted = [...media].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const m of sorted) {
    if (m.mediaType === 'image') {
      images.push(m.url);
    } else if (m.mediaType === 'video') {
      videos.push({ url: m.url, title: m.title || '', description: m.description || '' });
    } else if (m.mediaType === 'audio') {
      audio.push({ url: m.url, title: m.title || '', description: m.description || '' });
    }
  }
  return { images, videos, audio };
}

// ── Converters ───────────────────────────────────────────────────

/**
 * Convert a Convex exhibition + its translations/media into the old
 * JSON shape that `getTranslatedContent` expects.
 */
export function convexExhibitionToRaw(ex: ConvexExhibition): Record<string, unknown> {
  const translations: Record<string, Record<string, string>> = {};
  const detailedContent: Record<string, string> = {};

  for (const t of ex.translations) {
    translations[t.language] = {
      title: t.title,
      ...(t.subtitle ? { subtitle: t.subtitle } : {}),
      description: t.description,
    };
    if (t.detailedContent) {
      detailedContent[t.language] = t.detailedContent;
    }
  }

  return {
    id: ex.slug,
    qrCode: ex.qrCode,
    image: ex.image,
    dateRange: ex.dateRange,
    location: ex.location,
    curator: ex.curator,
    organizer: ex.organizer,
    sponsor: ex.sponsor,
    tags: ex.tags,
    enabledAttributes: ex.enabledAttributes,
    artifacts: ex.artifactSlugs,
    translations,
    detailedContent: Object.keys(detailedContent).length > 0 ? detailedContent : undefined,
    media: reconstructMedia(ex.media),
  };
}

/**
 * Convert a Convex artifact + its translations/media into the old
 * JSON shape that `getTranslatedContent` expects.
 */
export function convexArtifactToRaw(art: ConvexArtifact): Record<string, unknown> {
  const translations: Record<string, Record<string, string>> = {};
  const detailedContent: Record<string, string> = {};

  for (const t of art.translations) {
    const langObj: Record<string, string> = {
      title: t.title,
      description: t.description,
    };
    if (t.period) langObj.period = t.period;
    if (t.artist) langObj.artist = t.artist;
    if (t.significance) langObj.significance = t.significance;
    translations[t.language] = langObj;
    if (t.detailedContent) {
      detailedContent[t.language] = t.detailedContent;
    }
  }

  return {
    id: art.slug,
    qrCode: art.qrCode,
    exhibition: art.exhibitionSlug,
    image: art.image,
    materials: art.materials,
    dimensions: art.dimensions,
    provenance: art.provenance,
    tags: art.tags,
    enabledAttributes: art.enabledAttributes,
    translations,
    detailedContent: Object.keys(detailedContent).length > 0 ? detailedContent : undefined,
    media: reconstructMedia(art.media),
  };
}
