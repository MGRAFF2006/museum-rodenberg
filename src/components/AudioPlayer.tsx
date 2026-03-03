import React, { useState, useRef } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, FastForward } from 'lucide-react';

interface AudioPlayerProps {
  url: string;
  title?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ url, title }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
      if (v > 0) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const skip = (amount: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + amount));
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-md w-full hover:shadow-lg transition-all group">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="metadata"
      />
      
      {title && (
        <div className="mb-4">
          <h4 className="font-bold text-neutral-900 truncate text-base group-hover:text-primary-800 transition-colors">{title}</h4>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-5">
        <div className="relative h-2 w-full bg-neutral-100 rounded-full overflow-hidden cursor-pointer group/progress">
          <div 
            className="absolute h-full bg-primary-600 rounded-full transition-all duration-100"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-bold text-neutral-500 font-mono tracking-tighter">
          <span className="bg-neutral-50 px-2 py-0.5 rounded border border-neutral-100">{formatTime(currentTime)}</span>
          <span className="bg-neutral-50 px-2 py-0.5 rounded border border-neutral-100">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => skip(-5)}
            className="p-2.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all active:scale-90"
            title="Rewind 5s"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          
          <button
            onClick={togglePlay}
            className="p-4 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-all shadow-lg active:scale-95 flex items-center justify-center hover:shadow-primary-200"
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-current translate-x-0.5" />}
          </button>

          <button
            onClick={() => skip(5)}
            className="p-2.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all active:scale-90"
            title="Forward 5s"
          >
            <RotateCw className="h-5 w-5" />
          </button>
        </div>

        {/* Speed and Volume */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="px-3 py-1.5 text-xs font-bold border border-neutral-200 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-all flex items-center gap-2 shadow-sm"
            >
              <span className="text-primary-700">{playbackSpeed}x</span>
              <FastForward className="h-3.5 w-3.5 text-neutral-400" />
            </button>
            
            {showSpeedMenu && (
              <div className="absolute bottom-full right-0 mb-3 bg-white border border-neutral-200 rounded-xl shadow-2xl z-20 overflow-hidden min-w-[100px] animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="p-2 bg-neutral-50 border-b border-neutral-100 text-[10px] uppercase tracking-wider font-bold text-neutral-400">
                  Speed
                </div>
                {speeds.map(speed => (
                  <button
                    key={speed}
                    onClick={() => changeSpeed(speed)}
                    className={`w-full px-4 py-2.5 text-xs text-left hover:bg-primary-50 transition-colors ${playbackSpeed === speed ? 'bg-primary-100 text-primary-900 font-bold' : 'text-neutral-700'}`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3 bg-neutral-50 p-1.5 rounded-lg border border-neutral-100">
            <button
              onClick={toggleMute}
              className="p-1.5 text-neutral-500 hover:text-primary-600 transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-primary-600"
            />
          </div>
          <button
            onClick={toggleMute}
            className="md:hidden p-2 text-neutral-500 hover:text-primary-600 transition-colors bg-neutral-50 rounded-lg border border-neutral-100"
          >
            {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
