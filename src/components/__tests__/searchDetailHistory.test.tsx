import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from '../../App';

vi.mock('convex/react', () => ({ useQuery: () => null }));

vi.mock('../../hooks/useLanguage', () => ({ useLanguage: () => ({ currentLanguage: 'de', t: (key: string) => key }) }));
vi.mock('../TextToSpeechButton', () => ({ TextToSpeechButton: () => null }));
vi.mock('../AccessibilityPanel', () => ({ AccessibilityPanel: () => null }));
vi.mock('../../hooks/useContentData', () => ({
  useContentData: () => ({
    exhibitions: [], artifacts: [{ id: 'object', title: 'Rodenberg', description: 'Local history', image: '/photo.jpg' }],
    getArtifactById: () => ({ id: 'start', qrCode: 'QR', title: 'Starting artifact', description: 'History', image: '/photo.jpg' }), getExhibitionById: () => undefined,
    getArtifactsByExhibition: () => [], findByQRCode: () => ({ type: null, item: null }),
  }),
}));

function BrowserHistory() {
  const location = useLocation();
  const navigate = useNavigate();
  return <>
    <output data-testid="location">{location.pathname}{location.search}</output>
    <button onClick={() => navigate(-1)}>Browser Back</button>
  </>;
}

describe('collection search navigation', () => {
  it('uses one search history entry while typing and returns to the original page in one Back', async () => {
    render(<MemoryRouter initialEntries={['/artifact/start']}><App /><BrowserHistory /></MemoryRouter>);
    const input = screen.getAllByRole('textbox')[0];
    for (const value of ['R', 'Ro', 'Rodenberg']) fireEvent.change(input, { target: { value } });
    expect(screen.getByTestId('location')).toHaveTextContent('/search?q=Rodenberg');
    await screen.findByText('Rodenberg', { selector: 'h3' });
    fireEvent.click(screen.getByRole('button', { name: 'Browser Back' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/artifact/start');
  });

  it('finds padded queries and clearing search returns home without adding another search entry', async () => {
    render(<MemoryRouter initialEntries={['/']}><App /><BrowserHistory /></MemoryRouter>);
    const input = screen.getAllByRole('textbox')[0];
    fireEvent.change(input, { target: { value: ' Rodenberg ' } });
    await screen.findByText('Rodenberg', { selector: 'h3' });
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
    fireEvent.click(screen.getByRole('button', { name: 'Browser Back' }));
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
  });
});
