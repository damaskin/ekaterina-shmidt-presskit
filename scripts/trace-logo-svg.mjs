import fs from 'node:fs';
import path from 'node:path';
import potrace from 'potrace';
import sharp from 'sharp';

const REF_SOURCE = 'assets/logo-reference-source.jpg';

const SOURCE =
  process.argv[2] ??
  (fs.existsSync(REF_SOURCE)
    ? REF_SOURCE
    : fs.existsSync('public/assets/logo-reference.original.png')
      ? 'public/assets/logo-reference.original.png'
      : 'public/assets/logo-reference.png');

const OUT_PATHS = ['public/assets/logo-reference.svg', 'assets/logo-reference.svg'];
const TRACE_WIDTH = 4096;

async function buildTraceBitmap() {
  const tracePath = 'public/assets/.logo-trace.png';

  await sharp(SOURCE)
    .resize(TRACE_WIDTH, null, { fit: 'inside', withoutEnlargement: false })
    .greyscale()
    .blur(5)
    .threshold(215, { grayscale: true })
    .png()
    .toFile(tracePath);

  const { width, height } = await sharp(tracePath).metadata();
  if (!width || !height) throw new Error('Failed to prepare trace bitmap');

  return { tracePath, width, height };
}

function postProcessSvg(svg, width, height) {
  const radius = Math.round(Math.min(width, height) * 0.1);
  const pill = Math.max(20, Math.round(Math.min(width, height) * 0.0105));
  const soft = Math.max(13, Math.round(pill * 0.65));

  const inner = svg
    .replace(/<\?xml[\s\S]*?\?>\s*/i, '')
    .replace(/<!DOCTYPE[\s\S]*?>\s*/i, '')
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
    .replace(/\sfill="black"/gi, ' fill="#ffffff"')
    .replace(/\sstroke="none"/gi, '')
    .trim();

  if (inner.includes('d=""')) {
    throw new Error('Trace produced empty paths');
  }

  const yValues = [...inner.matchAll(/[\s,](-?\d+(?:\.\d+)?)\s*(?:,|$)/g)]
    .map((m) => Number(m[1]))
    .filter((n) => n > 50 && n < height - 50);
  const minY = yValues.length ? Math.min(...yValues) : height;

  if (minY > height * 0.35) {
    throw new Error(`Trace looks invalid (minY=${minY}, height=${height})`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" fill="#ffffff" role="img" aria-label="SHMIDT">
  <defs>
    <clipPath id="logo-round">
      <rect width="${width}" height="${height}" rx="${radius}" ry="${radius}" />
    </clipPath>
    <filter id="logo-pill-edges" filterUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}" color-interpolation-filters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius="${pill}" result="grow" />
      <feMorphology in="grow" operator="erode" radius="${pill}" result="pill" />
      <feGaussianBlur in="pill" stdDeviation="${soft}" result="soft" />
      <feColorMatrix in="soft" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 28 -10" result="alpha" />
      <feComposite in="SourceGraphic" in2="alpha" operator="in" />
    </filter>
  </defs>
  <g clip-path="url(#logo-round)" filter="url(#logo-pill-edges)">
    ${inner}
  </g>
</svg>
`;
}

if (!fs.existsSync(SOURCE)) {
  throw new Error(`Logo source not found: ${SOURCE}`);
}

const { tracePath, width, height } = await buildTraceBitmap();

const traced = await new Promise((resolve, reject) => {
  potrace.trace(
    tracePath,
    {
      turdSize: 8,
      alphaMax: 4,
      optCurve: true,
      optTolerance: 0.55,
      color: 'black',
      background: 'transparent',
    },
    (err, svg) => {
      if (err) reject(err);
      else resolve(svg);
    },
  );
});

const finalSvg = postProcessSvg(traced, width, height);

for (const outPath of OUT_PATHS) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, finalSvg);
}

fs.unlinkSync(tracePath);

console.log(`SVG saved: ${OUT_PATHS.join(', ')} (${width}x${height}) from ${SOURCE}`);
