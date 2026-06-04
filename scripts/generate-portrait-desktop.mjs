/**
 * Десктоп-баннер About: полный портрет слева + дополненное пространство справа.
 * npm run assets:portrait-desktop
 */
import fs from 'fs';
import sharp from 'sharp';

const src = 'assets/portrait-hero.jpg';
const out = 'assets/portrait-hero-desktop.jpg';
const publicOut = 'public/assets/portrait-hero-desktop.jpg';

const CANVAS_W = 1920;
const CANVAS_H = 1080;

const srcMeta = await sharp(src).metadata();
const srcW = srcMeta.width ?? 682;
const srcH = srcMeta.height ?? 1024;
const portraitW = Math.round((srcW / srcH) * CANVAS_H);
const portraitBuf = await sharp(src)
  .resize(portraitW, CANVAS_H, { fit: 'fill' })
  .toBuffer();

const rightW = CANVAS_W - portraitW;

if (rightW <= 0) {
  throw new Error('Portrait wider than canvas — adjust CANVAS_W');
}

// Правая часть: размытое продолжение края портрета + лёгкий градиент
const stripWidth = Math.min(140, Math.max(40, portraitW - 1));
const extension = await sharp(portraitBuf)
  .extract({
    left: portraitW - stripWidth,
    top: 0,
    width: stripWidth,
    height: CANVAS_H,
  })
  .resize(rightW, CANVAS_H, { fit: 'fill' })
  .blur(28)
  .modulate({ brightness: 0.85, saturation: 1.15 })
  .toBuffer();

// База: тёмный фон в тон портрета
const base = await sharp({
  create: {
    width: CANVAS_W,
    height: CANVAS_H,
    channels: 3,
    background: { r: 18, g: 10, b: 22 },
  },
})
  .jpeg()
  .toBuffer();

const gradientSvg = `
<svg width="${rightW}" height="${CANVAS_H}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:rgb(40,12,32);stop-opacity:0.85" />
      <stop offset="55%" style="stop-color:rgb(22,10,20);stop-opacity:0.95" />
      <stop offset="100%" style="stop-color:rgb(13,10,15);stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)" />
</svg>`;

const gradientOverlay = await sharp(Buffer.from(gradientSvg))
  .png()
  .toBuffer();

const rightPanel = await sharp(extension)
  .composite([{ input: gradientOverlay, blend: 'over' }])
  .toBuffer();

// Стык: мягкий градиент на правом краю портрета
const seamW = 120;
const seamSvg = `
<svg width="${seamW}" height="${CANVAS_H}">
  <defs>
    <linearGradient id="s" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:rgb(0,0,0);stop-opacity:0" />
      <stop offset="100%" style="stop-color:rgb(0,0,0);stop-opacity:0.55" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#s)" />
</svg>`;

const seam = await sharp(Buffer.from(seamSvg)).png().toBuffer();

await sharp(base)
  .composite([
    { input: rightPanel, left: portraitW, top: 0 },
    { input: portraitBuf, left: 0, top: 0 },
    { input: seam, left: Math.max(0, portraitW - seamW), top: 0, blend: 'over' },
  ])
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(out);

fs.mkdirSync('public/assets', { recursive: true });
fs.copyFileSync(out, publicOut);

const meta = await sharp(out).metadata();
console.log(
  `OK ${meta.width}x${meta.height} (portrait ${portraitW}px left, fill ${rightW}px right)`,
);
