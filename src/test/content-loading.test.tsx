import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getFunctionName } from 'convex/server';
import { useQuery } from 'convex/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { ContentProvider, useContent } from '../contexts/ContentContext';

vi.mock('convex/react', () => ({ useQuery: vi.fn() }));
vi.mock('../hooks/useLanguage', () => ({ useLanguage: () => ({ currentLanguage: 'de' }) }));

const exhibition = {
  _id: 'exhibition-id', slug: 'history', qrCode: 'history', image: '',
  isFeatured: true, artifactSlugs: [], media: [],
  translations: [
    { language: 'de', title: 'History', description: 'Summary', detailedContent: 'Full German history' },
    { language: 'en', title: 'History', description: 'Summary', detailedContent: 'Full English history' },
  ],
};

function Probe() {
  const { exhibitions, getRawExhibitionById, isLoading } = useContent();
  if (isLoading) return <p>Loading</p>;
  return <>
    <p>{exhibitions[0]?.detailedContent?.de}</p>
    <p>{JSON.stringify(getRawExhibitionById('history')?.detailedContent)}</p>
  </>;
}

beforeEach(() => {
  vi.mocked(useQuery).mockImplementation((reference, args = undefined) => {
    if (args === 'skip') return undefined;
    switch (getFunctionName(reference)) {
      case 'exhibitions:listForLanguage': return [{ ...exhibition, translations: [{ language: 'de', title: 'History', description: 'Summary' }] }];
      case 'exhibitions:getBySlug': return exhibition;
      case 'exhibitions:list': return [exhibition];
      case 'exhibitions:getFeatured': return 'history';
      default: return [];
    }
  });
});

it('fetches full content for a direct visitor detail URL while keeping list payloads small', () => {
  render(<MemoryRouter initialEntries={['/exhibition/history/details']}><ContentProvider><Probe /></ContentProvider></MemoryRouter>);
  expect(screen.getByText('Full German history')).toBeInTheDocument();
  expect(vi.mocked(useQuery).mock.calls.some(([ref, args]) => getFunctionName(ref) === 'exhibitions:getBySlug'
    && typeof args === 'object' && args.slug === 'history')).toBe(true);
});

it('preserves long-form content and all languages for admin bulk translation', () => {
  render(<MemoryRouter initialEntries={['/admin']}><ContentProvider><Probe /></ContentProvider></MemoryRouter>);
  expect(screen.getByText(/Full English history/)).toBeInTheDocument();
  expect(vi.mocked(useQuery).mock.calls.some(([ref, args]) => getFunctionName(ref) === 'exhibitions:listForLanguage'
    && args === 'skip')).toBe(true);
});
