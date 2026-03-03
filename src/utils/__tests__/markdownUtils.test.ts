import { describe, it, expect } from 'vitest';
import {
  extractMediaFromMarkdown,
  stripMarkdown,
  extractImagesFromMarkdown,
  MARKDOWN_REGEX,
} from '../markdownUtils';

describe('MARKDOWN_REGEX', () => {
  it('matches standard markdown images', () => {
    const text = '![Alt text](https://example.com/image.jpg)';
    const matches = [...text.matchAll(new RegExp(MARKDOWN_REGEX.IMAGE))];
    expect(matches).toHaveLength(1);
    expect(matches[0][1]).toBe('Alt text');
    expect(matches[0][2]).toBe('https://example.com/image.jpg');
  });

  it('matches custom audio media tags', () => {
    const text = '[Audio: My Song](audio:/uploads/song.mp3)';
    const matches = [...text.matchAll(new RegExp(MARKDOWN_REGEX.CUSTOM_MEDIA))];
    expect(matches).toHaveLength(1);
    expect(matches[0][1]).toBe('Audio');
    expect(matches[0][2]).toBe('My Song');
    expect(matches[0][4]).toBe('/uploads/song.mp3');
  });

  it('matches custom video media tags', () => {
    const text = '[Video: My Clip](video:/uploads/clip.mp4)';
    const matches = [...text.matchAll(new RegExp(MARKDOWN_REGEX.CUSTOM_MEDIA))];
    expect(matches).toHaveLength(1);
    expect(matches[0][1]).toBe('Video');
  });

  it('identifies embeddings (images + custom media) but not standard links', () => {
    const text = '![img](url) [Audio: title](audio:file) [normal link](http://example.com)';
    const matches = [...text.matchAll(new RegExp(MARKDOWN_REGEX.EMBEDDING))];
    expect(matches).toHaveLength(2);
  });
});

describe('extractMediaFromMarkdown', () => {
  it('returns empty arrays for empty input', () => {
    const result = extractMediaFromMarkdown('');
    expect(result.images).toEqual([]);
    expect(result.audio).toEqual([]);
    expect(result.videos).toEqual([]);
  });

  it('extracts standard image URLs', () => {
    const md = '![Photo](/uploads/photo.jpg)\n\nSome text\n\n![Another](/uploads/another.png)';
    const result = extractMediaFromMarkdown(md);
    expect(result.images).toEqual(['/uploads/photo.jpg', '/uploads/another.png']);
  });

  it('extracts audio from custom media tags', () => {
    const md = '[Audio: My Audio](audio:/uploads/audio.mp3)';
    const result = extractMediaFromMarkdown(md);
    expect(result.audio).toHaveLength(1);
    expect(result.audio[0].url).toBe('/uploads/audio.mp3');
    expect(result.audio[0].title).toBe('My Audio');
  });

  it('extracts video from custom media tags', () => {
    const md = '[Video: My Video](video:/uploads/video.mp4)';
    const result = extractMediaFromMarkdown(md);
    expect(result.videos).toHaveLength(1);
    expect(result.videos[0].url).toBe('/uploads/video.mp4');
    expect(result.videos[0].title).toBe('My Video');
  });

  it('classifies audio files by extension from image syntax', () => {
    const md = '![Audio file](/uploads/sound.mp3)';
    const result = extractMediaFromMarkdown(md);
    expect(result.audio).toHaveLength(1);
    expect(result.images).toHaveLength(0);
  });

  it('classifies video files by extension from image syntax', () => {
    const md = '![Video file](/uploads/clip.mp4)';
    const result = extractMediaFromMarkdown(md);
    expect(result.videos).toHaveLength(1);
    expect(result.images).toHaveLength(0);
  });

  it('deduplicates image URLs', () => {
    const md = '![A](/uploads/same.jpg)\n![B](/uploads/same.jpg)';
    const result = extractMediaFromMarkdown(md);
    expect(result.images).toHaveLength(1);
  });

  it('handles mixed content correctly', () => {
    const md = `# Title

![Photo](/uploads/photo.jpg)

Some text about the exhibit.

[Audio: Guide](audio:/uploads/guide.mp3)

More text.

![Another](/uploads/another.jpg)`;

    const result = extractMediaFromMarkdown(md);
    expect(result.images).toHaveLength(2);
    expect(result.audio).toHaveLength(1);
    expect(result.audio[0]).toEqual({ url: '/uploads/guide.mp3', title: 'Guide' });
    expect(result.videos).toHaveLength(0);
  });
});

describe('stripMarkdown', () => {
  it('returns empty string for empty input', () => {
    expect(stripMarkdown('')).toBe('');
  });

  it('removes image tags but keeps alt text', () => {
    expect(stripMarkdown('![Photo of museum](url)')).toBe('Photo of museum');
  });

  it('removes links but keeps text', () => {
    expect(stripMarkdown('[Click here](http://example.com)')).toBe('Click here');
  });

  it('removes bold formatting', () => {
    expect(stripMarkdown('This is **bold** text')).toBe('This is bold text');
  });

  it('removes italic formatting', () => {
    expect(stripMarkdown('This is *italic* text')).toBe('This is italic text');
  });

  it('removes headers', () => {
    expect(stripMarkdown('# Header')).toBe('Header');
    expect(stripMarkdown('## Subheader')).toBe('Subheader');
  });

  it('removes blockquotes', () => {
    expect(stripMarkdown('> Quoted text')).toBe('Quoted text');
  });

  it('removes inline code', () => {
    expect(stripMarkdown('Use `code` here')).toBe('Use code here');
  });

  it('removes code blocks', () => {
    expect(stripMarkdown('```\ncode block\n```')).toBe('');
  });

  it('handles complex markdown', () => {
    const md = `# Museum Guide

This is **important** information about the *exhibit*.

![Photo](/uploads/photo.jpg)

> A historical quote

Visit [our website](http://museum.example.com) for more.`;

    const result = stripMarkdown(md);
    expect(result).not.toContain('#');
    expect(result).not.toContain('**');
    expect(result).not.toContain('*');
    expect(result).not.toContain('![');
    expect(result).not.toContain('>');
    expect(result).toContain('Museum Guide');
    expect(result).toContain('important');
    expect(result).toContain('our website');
  });
});

describe('extractImagesFromMarkdown', () => {
  it('returns only image URLs (backward compatibility)', () => {
    const md = '![Photo](/uploads/photo.jpg)\n[Audio: Song](audio:song.mp3)';
    const result = extractImagesFromMarkdown(md);
    expect(result).toEqual(['/uploads/photo.jpg']);
  });
});
