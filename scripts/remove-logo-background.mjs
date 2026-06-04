/**
 * Убирает чёрный фон у логотипа, сохраняет оригинал.
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

const THRESHOLD = 48;
const SOFT = 36;

async function removeBlackBackground(inputPath) {
  const dir = inputPath.replace(/[^/\\]+$/, '');
  const backupPath = `${dir}logo-reference.original.png`;

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(inputPath, backupPath);
    console.log(`Backup: ${backupPath}`);
  }

  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const pixels = new Uint8Array(data);

  for (let i = 0; i < pixels.length; i += channels) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const max = Math.max(r, g, b);

    if (max <= THRESHOLD) {
      pixels[i + 3] = 0;
      continue;
    }

    if (max <= THRESHOLD + SOFT) {
      const t = (max - THRESHOLD) / SOFT;
      pixels[i + 3] = Math.round(pixels[i + 3] * t);
    }
  }

  await sharp(pixels, { raw: { width, height, channels } })
    .png({ compressionLevel: 9 })
    .toFile(inputPath);

  console.log(`Updated: ${inputPath}`);
}

for (const path of paths) {
  await removeBlackBackground(path);
}

console.log('Done. Restore: copy logo-reference.original.png → logo-reference.png');
