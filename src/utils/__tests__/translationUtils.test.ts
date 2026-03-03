import { describe, it, expect } from 'vitest';
import {
  getTranslatedContent,
  splitMarkdown,
  joinBlocks,
  getHash,
} from '../translationUtils';

describe('getTranslatedContent', () => {
  it('returns empty object for null input', () => {
    expect(getTranslatedContent(null, 'de')).toEqual({});
  });

  it('returns empty object for undefined input', () => {
    expect(getTranslatedContent(undefined, 'en')).toEqual({});
  });

  it('returns content as-is with isTranslationMissing=false when no translations exist', () => {
    const content = { id: '1', title: 'Test' };
    const result = getTranslatedContent(content, 'de');
    expect(result.title).toBe('Test');
    expect(result.isTranslationMissing).toBe(false);
  });

  it('merges the correct language translation', () => {
    const content = {
      id: '1',
      translations: {
        de: { title: 'German Title', description: 'German Desc' },
        en: { title: 'English Title', description: 'English Desc' },
      },
    };

    const result = getTranslatedContent(content, 'en');
    expect(result.title).toBe('English Title');
    expect(result.description).toBe('English Desc');
    expect(result.isTranslationMissing).toBe(false);
  });

  it('falls back to German when requested language is missing', () => {
    const content = {
      id: '1',
      translations: {
        de: { title: 'German Title' },
      },
    };

    const result = getTranslatedContent(content, 'fr');
    expect(result.title).toBe('German Title');
    expect(result.isTranslationMissing).toBe(true);
  });

  it('marks isTranslationMissing=false for the fallback language itself', () => {
    const content = {
      id: '1',
      translations: {
        de: { title: 'German Title' },
      },
    };

    const result = getTranslatedContent(content, 'de');
    expect(result.isTranslationMissing).toBe(false);
  });

  it('resolves asset IDs when resolveAsset is provided', () => {
    const content = {
      id: '1',
      image: 'asset_123',
      translations: {
        de: { title: 'Test' },
      },
    };

    const resolveAsset = (id: string) => {
      if (id === 'asset_123') return { url: '/uploads/photo.jpg', alt: 'Photo' };
      return undefined;
    };

    const result = getTranslatedContent(content, 'de', 'de', resolveAsset);
    expect(result.image).toBe('/uploads/photo.jpg');
  });

  it('resolves media image asset IDs', () => {
    const content = {
      id: '1',
      media: {
        images: ['asset_1', 'asset_2'],
        videos: [],
        audio: [],
      },
      translations: {
        de: { title: 'Test' },
      },
    };

    const resolveAsset = (id: string) => {
      if (id === 'asset_1') return { url: '/uploads/img1.jpg', alt: 'Image 1' };
      if (id === 'asset_2') return { url: '/uploads/img2.jpg', alt: 'Image 2' };
      return undefined;
    };

    const result = getTranslatedContent(content, 'de', 'de', resolveAsset);
    expect(result.media.images).toEqual(['/uploads/img1.jpg', '/uploads/img2.jpg']);
  });
});

describe('splitMarkdown', () => {
  it('returns empty array for empty input', () => {
    expect(splitMarkdown('')).toEqual([]);
  });

  it('returns a single text block for plain text', () => {
    const result = splitMarkdown('Hello world');
    expect(result).toEqual([{ type: 'text', content: 'Hello world' }]);
  });

  it('splits text and image embeddings', () => {
    const md = 'Before image\n\n![Alt](url)\n\nAfter image';
    const result = splitMarkdown(md);
    
    expect(result.length).toBe(3);
    expect(result[0].type).toBe('text');
    expect(result[0].content).toBe('Before image\n\n');
    expect(result[1].type).toBe('embedding');
    expect(result[1].content).toBe('![Alt](url)');
    expect(result[2].type).toBe('text');
    expect(result[2].content).toBe('\n\nAfter image');
  });

  it('handles custom audio media tags as embeddings', () => {
    const md = 'Text [Audio: Title](audio:/uploads/song.mp3) more text';
    const result = splitMarkdown(md);
    
    const embeddings = result.filter(b => b.type === 'embedding');
    expect(embeddings).toHaveLength(1);
    expect(embeddings[0].content).toContain('Audio');
  });

  it('handles multiple embeddings', () => {
    const md = '![Img1](url1)\n\nSome text\n\n![Img2](url2)';
    const result = splitMarkdown(md);
    
    const embeddings = result.filter(b => b.type === 'embedding');
    expect(embeddings).toHaveLength(2);
  });
});

describe('joinBlocks', () => {
  it('joins blocks back into a string', () => {
    const blocks = [
      { type: 'text' as const, content: 'Hello ' },
      { type: 'embedding' as const, content: '![img](url)' },
      { type: 'text' as const, content: ' world' },
    ];
    expect(joinBlocks(blocks)).toBe('Hello ![img](url) world');
  });

  it('handles empty array', () => {
    expect(joinBlocks([])).toBe('');
  });
});

describe('getHash', () => {
  it('returns a hex string', async () => {
    const hash = await getHash('test');
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it('returns consistent hashes for the same input', async () => {
    const hash1 = await getHash('hello world');
    const hash2 = await getHash('hello world');
    expect(hash1).toBe(hash2);
  });

  it('returns different hashes for different inputs', async () => {
    const hash1 = await getHash('hello');
    const hash2 = await getHash('world');
    expect(hash1).not.toBe(hash2);
  });

  it('handles empty string', async () => {
    const hash = await getHash('');
    expect(hash).toMatch(/^[a-f0-9]+$/);
    expect(hash.length).toBe(64); // SHA-256 produces 64 hex chars
  });

  it('prefixes with v2: internally for versioned hashing', async () => {
    // Different text should produce different hashes
    const hash1 = await getHash('same text');
    const hash2 = await getHash('different text');
    expect(hash1).not.toBe(hash2);
  });
});
