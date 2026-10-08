import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import App from '../../App';
vi.mock('../../hooks/useLanguage', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
vi.mock('../../hooks/useContentData', () => ({ useContentData: () => ({ exhibitions: [], artifacts: [], featuredExhibitionId: '', findByQRCode: vi.fn(), getExhibitionById: vi.fn(), getArtifactById: vi.fn(), getArtifactsByExhibition: vi.fn() }) }));
vi.mock('../Header', () => ({ Header: ({ searchQuery, onSearchChange }: { searchQuery: string; onSearchChange: (s: string) => void }) => <input aria-label="Search fixture" value={searchQuery} onChange={e => onSearchChange(e.target.value)} /> }));
vi.mock('../MobileMenu', () => ({ MobileMenu: () => null }));
vi.mock('../HomePage', () => ({ HomePage: () => null }));
vi.mock('../SearchResults', () => ({ SearchResults: () => null }));
function History() {
  const location = useLocation(); const navigate = useNavigate();
  return <><output aria-label="Location fixture">{location.pathname + location.search}</output><button onClick={() => navigate(-1)}>Back fixture</button></>;
}
afterEach(cleanup);
it('replaces typing updates once and returns to the page before search with one Back', () => {
  render(<MemoryRouter initialEntries={['/previous', '/']} initialIndex={1}><App /><History /></MemoryRouter>);
  const input = screen.getByLabelText('Search fixture');
  fireEvent.change(input, { target: { value: 'C' } });
  fireEvent.change(input, { target: { value: 'Co & berg' } });
  expect(screen.getByRole('status', { name: 'Location fixture' })).toHaveTextContent('/search?q=Co+%26+berg');
  fireEvent.click(screen.getByText('Back fixture'));
  expect(screen.getByRole('status', { name: 'Location fixture' })).toHaveTextContent(/^\/$/);
  fireEvent.click(screen.getByText('Back fixture'));
  expect(screen.getByRole('status', { name: 'Location fixture' })).toHaveTextContent('/previous');
});
it('clears empty search without adding another history entry', () => {
  render(<MemoryRouter initialEntries={['/previous', '/search?q=hello']} initialIndex={1}><App /><History /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText('Search fixture'), { target: { value: '  ' } });
  expect(screen.getByRole('status', { name: 'Location fixture' }).textContent).toBe('/');
  fireEvent.click(screen.getByText('Back fixture'));
  expect(screen.getByRole('status', { name: 'Location fixture' })).toHaveTextContent('/previous');
});

it('clears a search query on an initial home URL without retaining a stale controlled value', () => {
  render(<MemoryRouter initialEntries={['/previous', '/?q=hello']} initialIndex={1}><App /><History /></MemoryRouter>);
  const input = screen.getByLabelText('Search fixture');
  expect(input).toHaveValue('hello');
  fireEvent.change(input, { target: { value: '' } });
  expect(screen.getByRole('status', { name: 'Location fixture' }).textContent).toBe('/');
  expect(input).toHaveValue('');
  fireEvent.click(screen.getByText('Back fixture'));
  expect(screen.getByRole('status', { name: 'Location fixture' })).toHaveTextContent('/previous');
});
