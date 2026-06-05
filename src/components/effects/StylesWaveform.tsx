import { useEffect, useRef } from 'react';
import { useDocumentVisible } from '../../hooks/useDocumentVisible';
import { useSectionActive } from '../../hooks/useSectionActive';
import './StylesWaveform.css';

interface BarSeed {
  phase: number;
  speed: number;
  base: number;
}

function buildSeeds(count: number): BarSeed[] {
  return Array.from({ length: count }, (_, i) => ({
    phase: (i * 0.37) % (Math.PI * 2),
    speed: 0.9 + (i % 7) * 0.11,
    base: 0.35 + ((i * 13) % 65) / 100,
  }));
}

export default function StylesWaveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const seedsRef = useRef<BarSeed[]>([]);
  const { ref, isActive } = useSectionActive<HTMLDivElement>(0.08);
  const documentVisible = useDocumentVisible();
  const shouldRun = isActive && documentVisible;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const BAR_W = 3;
    const BAR_GAP = 2;
    const TIMELINE_CYCLE = 28;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.ceil(w / (BAR_W + BAR_GAP));
      seedsRef.current = buildSeeds(count);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const draw = (time: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const centerY = h * 0.58;
      const maxBarH = h * 0.22;
      const seeds = seedsRef.current;
      const t = time * 0.001;
      const progress = (t % TIMELINE_CYCLE) / TIMELINE_CYCLE;
      const playheadX = progress * w;

      // Ось таймлинии
      ctx.strokeStyle = 'rgb(255 255 255 / 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(w, centerY);
      ctx.stroke();

      // Проигранная часть таймлинии
      const gradLine = ctx.createLinearGradient(0, 0, w, 0);
      gradLine.addColorStop(0, 'rgb(255 45 138 / 0.35)');
      gradLine.addColorStop(1, 'rgb(194 24 122 / 0.15)');
      ctx.strokeStyle = gradLine;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(playheadX, centerY);
      ctx.stroke();

      // Playhead
      ctx.fillStyle = 'rgb(255 45 138 / 0.85)';
      ctx.beginPath();
      ctx.arc(playheadX, centerY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Волна (SoundCloud-style bars)
      for (let i = 0; i < seeds.length; i++) {
        const seed = seeds[i];
        const x = i * (BAR_W + BAR_GAP);
        const wave = reducedMotion
          ? seed.base
          : seed.base *
            (0.45 +
              0.55 *
                Math.abs(
                  Math.sin(t * seed.speed + seed.phase) *
                    Math.cos(t * 0.35 + seed.phase * 0.5),
                ));

        const barH = Math.max(4, wave * maxBarH);
        const fade =
          x < playheadX ? 1 : 0.35 + 0.25 * Math.sin(i * 0.2 + t);

        const barGrad = ctx.createLinearGradient(x, centerY - barH / 2, x, centerY + barH / 2);
        barGrad.addColorStop(0, `rgba(255, 45, 138, ${0.55 * fade})`);
        barGrad.addColorStop(0.5, `rgba(255, 120, 180, ${0.75 * fade})`);
        barGrad.addColorStop(1, `rgba(194, 24, 122, ${0.5 * fade})`);

        ctx.fillStyle = barGrad;
        ctx.fillRect(x, centerY - barH / 2, BAR_W, barH);
      }

      // Лёгкое свечение у playhead
      if (!reducedMotion) {
        const glow = ctx.createRadialGradient(
          playheadX,
          centerY,
          0,
          playheadX,
          centerY,
          80,
        );
        glow.addColorStop(0, 'rgb(255 45 138 / 0.12)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(playheadX - 80, centerY - 80, 160, 160);
      }
    };

    const loop = (time: number) => {
      if (!shouldRun) return;
      draw(time);
      animRef.current = requestAnimationFrame(loop);
    };

    const start = () => {
      cancelAnimationFrame(animRef.current);
      draw(performance.now());
      if (shouldRun) animRef.current = requestAnimationFrame(loop);
    };

    start();

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [shouldRun]);

  return (
    <div ref={ref} className="slide-styles__waveform" aria-hidden="true">
      <canvas ref={canvasRef} className="slide-styles__waveform-canvas" />
    </div>
  );
}
