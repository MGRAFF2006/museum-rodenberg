import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSearch } from '../useSearch';
import type { Exhibition, Artifact } from '../../types';

const mockExhibitions: Exhibition[] = [
  {
    id: 'ex1',
    qrCode: 'EX1',
    title: 'Born in Rodenberg',
    description: 'Famous people from Rodenberg',
    image: '/img.jpg',
    tags: ['history', 'people'],
    curator: 'Dr. Schmidt',
  },
  {
    id: 'ex2',
    qrCode: 'EX2',
    title: 'Agriculture and Craft',
    description: 'Traditional farming and crafts',
    image: '/img2.jpg',
    tags: ['farming', 'craft'],
  },
];

const mockArtifacts: Artifact[] = [
  {
    id: 'art1',
    qrCode: 'ART1',
    title: 'Johann Anton Coberg',
    description: 'Baroque composer from Rodenberg',
    image: '/img.jpg',
    period: '1650-1708',
    tags: ['baroque', 'music'],
    materials: ['paper', 'ink'],
  },
  {
    id: 'art2',
    qrCode: 'ART2',
    title: 'Old Tractor',
    description: 'A historic tractor from the early 20th century',
    image: '/img2.jpg',
    period: '20th century',
    tags: ['farming', 'machinery'],
    materials: ['iron', 'steel', 'wood'],
  },
];

describe('useSearch', () => {
  it('returns empty results for empty query', () => {
    const { result } = renderHook(() => useSearch('', mockExhibitions, mockArtifacts));
    expect(result.current.exhibitions).toEqual([]);
    expect(result.current.artifacts).toEqual([]);
  });

  it('returns empty results for whitespace query', () => {
    const { result } = renderHook(() => useSearch('   ', mockExhibitions, mockArtifacts));
    expect(result.current.exhibitions).toEqual([]);
    expect(result.current.artifacts).toEqual([]);
  });

  it('matches exhibitions by title', () => {
    const { result } = renderHook(() => useSearch('Rodenberg', mockExhibitions, mockArtifacts));
    expect(result.current.exhibitions).toHaveLength(1);
    expect(result.current.exhibitions[0].id).toBe('ex1');
  });

  it('matches exhibitions by description', () => {
    const { result } = renderHook(() => useSearch('farming', mockExhibitions, mockArtifacts));
    expect(result.current.exhibitions).toHaveLength(1);
    expect(result.current.exhibitions[0].id).toBe('ex2');
  });

  it('matches exhibitions by tags', () => {
    const { result } = renderHook(() => useSearch('history', mockExhibitions, mockArtifacts));
    expect(result.current.exhibitions).toHaveLength(1);
    expect(result.current.exhibitions[0].id).toBe('ex1');
  });

  it('matches exhibitions by curator', () => {
    const { result } = renderHook(() => useSearch('Schmidt', mockExhibitions, mockArtifacts));
    expect(result.current.exhibitions).toHaveLength(1);
    expect(result.current.exhibitions[0].id).toBe('ex1');
  });

  it('matches artifacts by title', () => {
    const { result } = renderHook(() => useSearch('Coberg', mockExhibitions, mockArtifacts));
    expect(result.current.artifacts).toHaveLength(1);
    expect(result.current.artifacts[0].id).toBe('art1');
  });

  it('matches artifacts by description', () => {
    const { result } = renderHook(() => useSearch('Baroque', mockExhibitions, mockArtifacts));
    expect(result.current.artifacts).toHaveLength(1);
    expect(result.current.artifacts[0].id).toBe('art1');
  });

  it('matches artifacts by period', () => {
    const { result } = renderHook(() => useSearch('1650', mockExhibitions, mockArtifacts));
    expect(result.current.artifacts).toHaveLength(1);
    expect(result.current.artifacts[0].id).toBe('art1');
  });

  it('matches artifacts by tags', () => {
    const { result } = renderHook(() => useSearch('music', mockExhibitions, mockArtifacts));
    expect(result.current.artifacts).toHaveLength(1);
    expect(result.current.artifacts[0].id).toBe('art1');
  });

  it('matches artifacts by materials', () => {
    const { result } = renderHook(() => useSearch('iron', mockExhibitions, mockArtifacts));
    expect(result.current.artifacts).toHaveLength(1);
    expect(result.current.artifacts[0].id).toBe('art2');
  });

  it('is case-insensitive', () => {
    const { result } = renderHook(() => useSearch('RODENBERG', mockExhibitions, mockArtifacts));
    expect(result.current.exhibitions).toHaveLength(1);
    expect(result.current.artifacts).toHaveLength(1);
  });

  it('can match across both exhibitions and artifacts', () => {
    const { result } = renderHook(() => useSearch('farming', mockExhibitions, mockArtifacts));
    expect(result.current.exhibitions).toHaveLength(1);
    expect(result.current.artifacts).toHaveLength(1);
  });

  it('handles artifacts with undefined optional fields', () => {
    const sparse: Artifact[] = [{
      id: 'sparse',
      qrCode: 'SP',
      title: 'Sparse artifact',
      description: 'Minimal data',
      image: '/img.jpg',
    }];
    const { result } = renderHook(() => useSearch('Minimal', [], sparse));
    expect(result.current.artifacts).toHaveLength(1);
  });
});
