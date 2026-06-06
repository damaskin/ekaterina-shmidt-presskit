import { useEffect, useRef, type RefObject } from 'react';

type AudioGraph = {
  ctx: AudioContext;
  analyser: AnalyserNode;
};

type Props = {
  audioRef: RefObject<HTMLAudioElement | null>;
  active: boolean;
};

const BAR_COUNT = 52;

function drawBars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  heights: number[],
) {
  const gap = 2;
  const barW = Math.max(1, (w - gap * (heights.length - 1)) / heights.length);

  for (let i = 0; i < heights.length; i++) {
    const level = Math.min(1, Math.max(0, heights[i] ?? 0));
    const barH = Math.max(3, level * h * 0.88);
    const x = i * (barW + gap);
    const y = h - barH;

    const grad = ctx.createLinearGradient(0, y, 0, h);
    grad.addColorStop(0, 'rgb(255 45 138)');
    grad.addColorStop(0.5, 'rgb(255 45 138 / 55%)');
    grad.addColorStop(1, 'rgb(194 24 122 / 12%)');
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.35 + level * 0.5;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, 999);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

export default function AudioPlayerViz({ audioRef, active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphRef = useRef<AudioGraph | null>(null);
  const rafRef = useRef(0);
  const freqRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      void graphRef.current?.ctx.close();
      graphRef.current = null;
      freqRef.current = null;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    let running = true;

    const ensureGraph = async () => {
      if (graphRef.current) {
        if (graphRef.current.ctx.state === 'suspended') {
          await graphRef.current.ctx.resume();
        }
        return graphRef.current;
      }

      const audio = audioRef.current;
      if (!audio) return null;

      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.78;
      analyser.minDecibels = -88;
      analyser.maxDecibels = -22;

      try {
        const source = ctx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(ctx.destination);
      } catch {
        await ctx.close();
        return null;
      }

      graphRef.current = { ctx, analyser };
      freqRef.current = new Uint8Array(analyser.frequencyBinCount);
      await ctx.resume();
      return graphRef.current;
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const idleHeights = (time: number) => {
      const t = time * 0.001;
      return Array.from({ length: BAR_COUNT }, (_, i) => {
        const wave =
          Math.sin(t * 1.35 + i * 0.42) * 0.5 +
          Math.sin(t * 2.1 + i * 0.18) * 0.5;
        return 0.1 + (wave + 1) * 0.07;
      });
    };

    const liveHeights = (graph: AudioGraph) => {
      const freq = freqRef.current;
      if (!freq) return idleHeights(performance.now());

      graph.analyser.getByteFrequencyData(freq as Uint8Array<ArrayBuffer>);
      const step = Math.max(1, Math.floor(freq.length / BAR_COUNT));

      return Array.from({ length: BAR_COUNT }, (_, i) => {
        let sum = 0;
        const start = i * step;
        for (let j = 0; j < step; j++) sum += freq[start + j] ?? 0;
        return sum / step / 255;
      });
    };

    const frame = (time: number) => {
      if (!running) return;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx2d.clearRect(0, 0, w, h);

      if (reducedMotion) {
        drawBars(ctx2d, w, h, idleHeights(0));
      } else if (active && graphRef.current) {
        drawBars(ctx2d, w, h, liveHeights(graphRef.current));
      } else {
        if (active) void ensureGraph();
        drawBars(ctx2d, w, h, idleHeights(time));
      }

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [active, audioRef]);

  return <canvas ref={canvasRef} className="audio-player__viz" aria-hidden="true" />;
}
