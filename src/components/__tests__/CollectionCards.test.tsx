import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ArtifactCard } from '../ArtifactCard';
import { ExhibitionCard } from '../ExhibitionCard';

vi.mock('../../hooks/useLanguage', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
const item = { id: 'museum-object', qrCode: 'QR', title: 'Museum object', description: 'Local history', image: '/photo.jpg' };

describe('collection card keyboard navigation', () => {
  it.each(['artifact', 'exhibition'] as const)('focuses and opens an %s with Tab and Enter', async type => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(type === 'artifact'
      ? <ArtifactCard artifact={item} onClick={onClick} />
      : <ExhibitionCard exhibition={item} onClick={onClick} />);
    const link = screen.getByRole('link', { name: item.title });
    expect(link).toHaveAttribute('href', `/${type}/${item.id}`);
    await user.tab();
    expect(link).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledWith(item.id);
  });

  it.each(['artifact', 'exhibition'] as const)('preserves native modified-click link behavior for an %s', type => {
    const onClick = vi.fn();
    render(type === 'artifact'
      ? <ArtifactCard artifact={item} onClick={onClick} />
      : <ExhibitionCard exhibition={item} onClick={onClick} />);
    const link = screen.getByRole('link', { name: item.title });
    expect(fireEvent.click(link, { ctrlKey: true })).toBe(true);
    expect(onClick).not.toHaveBeenCalled();
    expect(link).toHaveClass('focus-ring-sm');
  });
});
