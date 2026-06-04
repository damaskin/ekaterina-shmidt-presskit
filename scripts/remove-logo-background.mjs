/**
 * Чёрный/тёмный → прозрачный, белый текст остаётся.
 * Источник: logo-reference.original.png (или текущий png).
 * npm run assets:logo-transparent
 */
import fs from 'fs';
import sharp from 'sharp';

const paths = [
  'public/assets/logo-reference.png',
  'assets/logo-reference.png',
].filter((p) => fs.existsSync(p));

if (paths.length === 0) {
  throw new Error('logo-reference.png not found');
}

/** Ниже — полностью прозрачно */
const LUM_CUT = 72;
/** Мягкий край антиалиасинга */
const LUM_FEATHER = 48;

function luminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

async function processLogo(outputPath) {
  const dir = outputPath.replace(/[^/\\]+$/, '');
  const backupPath = `${dir}logo-reference.original.png`;
  const sourcePath = fs.existsSync(backupPath) ? backupPath : outputPath;

  if (!fs.existsSync(backupPath) && sourcePath === outputPath) {
    fs.copyFileSync(outputPath, backupPath);
    console.log(`Backup: ${backupPath}`);
  }

  const { data, info } = await sharp(sourcePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const pixels = new Uint8Array(data);

  for (let i = 0; i < pixels.length; i += channels) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const lum = luminance(r, g, b);

    if (lum <= LUM_CUT) {
      pixels[i + 3] = 0;
      continue;
    }

    if (lum <= LUM_CUT + LUM_FEATHER) {
      const t = (lum - LUM_CUT) / LUM_FEATHER;
      const alpha = Math.round(255 * t * t);
      pixels[i] = 255;
      pixels[i + 1] = 255;
      pixels[i + 2] = 255;
      pixels[i + 3] = alpha;
      continue;
    }

    pixels[i] = 255;
    pixels[i + 1] = 255;
    pixels[i + 2] = 255;
    pixels[i + 3] = 255;
  }

  await sharp(pixels, { raw: { width, height, channels } })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`Processed: ${outputPath} (from ${sourcePath})`);
}

for (const path of paths) {
  await processLogo(path);
}

console.log('Done. Restore: copy logo-reference.original.png → logo-reference.png');
