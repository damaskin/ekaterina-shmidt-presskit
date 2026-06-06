import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { PRESSKIT } from '../data/presskit.data';
import { useI18n } from '../context/LocaleContext';
import { useDocumentVisible } from '../hooks/useDocumentVisible';
import { assetUrl } from '../lib/assetUrl';

const { featuredTrack } = PRESSKIT;
const BAR_COUNT = 14;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioPlayer() {
  const { t } = useI18n();
  const documentVisible = useDocumentVisible();
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const wasPlayingRef = useRef(false);
  const autoplayBlockedRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const trackSrc = assetUrl(featuredTrack.src);

  const tryPlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return false;

    try {
      await audio.play();
      setIsPlaying(true);
      setAutoplayBlocked(false);
      autoplayBlockedRef.current = false;
      return true;
    } catch {
      setIsPlaying(false);
      setAutoplayBlocked(true);
      autoplayBlockedRef.current = true;
      return false;
    }
  }, []);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      await tryPlay();
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [tryPlay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.85;
    audio.loop = true;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('durationchange', onLoaded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    const startAutoplay = () => {
      void tryPlay();
    };

    if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      startAutoplay();
    } else {
      audio.addEventListener('canplay', startAutoplay, { once: true });
    }

    const unlock = () => {
      if (autoplayBlockedRef.current) void tryPlay();
    };

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('durationchange', onLoaded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [tryPlay, trackSrc]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!documentVisible) {
      wasPlayingRef.current = !audio.paused;
      audio.pause();
      return;
    }

    if (wasPlayingRef.current) {
      void tryPlay();
    }
  }, [documentVisible, tryPlay]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const seek = (clientX: number) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar || !duration) return;

    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  };

  return (
    <section
      className={`audio-player${autoplayBlocked ? ' audio-player--blocked' : ''}${isPlaying ? ' audio-player--playing' : ''}`}
      aria-label={t.player.aria}
    >
      <audio ref={audioRef} src={trackSrc} preload="auto" />

      <div className="audio-player__shell">
        <button
          type="button"
          className="audio-player__toggle"
          aria-label={isPlaying ? t.player.pause : t.player.play}
          onClick={() => void togglePlay()}
        >
          <span className="audio-player__toggle-icon" aria-hidden="true">
            {isPlaying ? '❚❚' : '▶'}
          </span>
        </button>

        <div className="audio-player__body">
          <div className="audio-player__meta">
            <div
              className="audio-player__waveform"
              aria-hidden="true"
            >
              {Array.from({ length: BAR_COUNT }, (_, i) => (
                <span
                  key={i}
                  className="audio-player__bar"
                  style={{ '--bar-i': i } as CSSProperties}
                />
              ))}
            </div>

            <div className="audio-player__info">
              <p className="audio-player__title">{featuredTrack.title}</p>
              <p className="audio-player__subtitle label-caps">
                {featuredTrack.subtitle} · {featuredTrack.artist}
              </p>
            </div>
          </div>

          <div className="audio-player__progress-row">
            <span className="audio-player__time">{formatTime(currentTime)}</span>
            <div
              ref={progressRef}
              className="audio-player__progress"
              role="slider"
              aria-label={t.player.progress}
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={currentTime}
              tabIndex={0}
              onClick={(e) => seek(e.clientX)}
              onKeyDown={(e) => {
                const audio = audioRef.current;
                if (!audio || !duration) return;
                const step = duration * 0.05;
                if (e.key === 'ArrowRight') {
                  audio.currentTime = Math.min(duration, audio.currentTime + step);
                } else if (e.key === 'ArrowLeft') {
                  audio.currentTime = Math.max(0, audio.currentTime - step);
                }
              }}
            >
              <div
                className="audio-player__progress-fill"
                style={{ width: `${progress}%` }}
              />
              <div
                className="audio-player__progress-thumb"
                style={{ left: `${progress}%` }}
              />
            </div>
            <span className="audio-player__time">{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {autoplayBlocked && (
        <button
          type="button"
          className="audio-player__hint label-caps"
          onClick={() => void tryPlay()}
        >
          {t.player.tapToPlay}
        </button>
      )}
    </section>
  );
}
