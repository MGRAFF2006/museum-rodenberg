import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioPlayer } from '../AudioPlayer';

vi.mock('../../hooks/useLanguage', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
let play: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  play = vi.spyOn(HTMLMediaElement.prototype, 'play');
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('audio playback recovery', () => {
  it('shows an error and remains ready to play when the native play promise rejects', async () => {
    play.mockRejectedValue(new DOMException('Cannot decode', 'NotSupportedError'));
    render(<AudioPlayer url="/broken.mp3" />);
    fireEvent.click(screen.getByRole('button', { name: 'playAudio' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('audioPlaybackError');
    expect(screen.getByRole('button', { name: 'playAudio' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'pauseAudio' })).toBeNull();
  });

  it('allows retry and only reports playing after the native play event', async () => {
    play.mockRejectedValueOnce(new Error('Temporarily unavailable')).mockResolvedValue(undefined);
    const { container } = render(<AudioPlayer url="/recording.mp3" />);
    fireEvent.click(screen.getByRole('button', { name: 'playAudio' }));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'playAudio' }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: 'playAudio' })).toBeInTheDocument();
    fireEvent.play(container.querySelector('audio')!);
    expect(screen.getByRole('button', { name: 'pauseAudio' })).toBeInTheDocument();
    expect(play).toHaveBeenCalledTimes(2);
    fireEvent.pause(container.querySelector('audio')!);
    expect(screen.getByRole('button', { name: 'playAudio' })).toBeInTheDocument();
  });

  it('handles native source-load errors even before playback is requested', () => {
    const { container } = render(<AudioPlayer url="/missing.mp3" />);
    fireEvent.error(container.querySelector('audio')!);
    expect(screen.getByRole('alert')).toHaveTextContent('audioPlaybackError');
    expect(screen.getByRole('button', { name: 'playAudio' })).toBeInTheDocument();
  });

  it('does not apply a previous source’s pending rejection to a replacement source', async () => {
    let reject!: (reason: Error) => void;
    play.mockImplementation(() => new Promise<void>((_resolve, fail) => { reject = fail; }));
    const { rerender } = render(<AudioPlayer url="/old.mp3" />);
    fireEvent.click(screen.getByRole('button', { name: 'playAudio' }));
    rerender(<AudioPlayer url="/new.mp3" />);
    await act(async () => reject(new Error('Old playback cancelled')));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: 'playAudio' })).toBeInTheDocument();
  });
});
