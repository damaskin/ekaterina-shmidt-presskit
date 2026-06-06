import fs from 'node:fs';
import sharp from 'sharp';

const src =
  process.argv[2] ??
  'C:/Users/damas/.cursor/projects/d-MyWorks-ekaterinaShmidt/assets/c__Users_damas_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_7c0401a1-2537-4b28-bec8-ec7149d44c86-c3129e09-e7bf-4462-8891-e09a28018a4b.png';

const outPaths = ['public/assets/logo-reference.png', 'assets/logo-reference.png'];

const { data, info } = await sharp(src)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;

for (let i = 0; i < data.length; i += channels) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;

  if (lum > 210) {
    data[i + 3] = 0;
    continue;
  }

  const alpha = Math.min(255, Math.round(((210 - lum) / 210) * 255));
  data[i] = 255;
  data[i + 1] = 255;
  data[i + 2] = 255;
  data[i + 3] = alpha;
}

const radius = Math.round(Math.min(width, height) * 0.06);
const roundedMask = Buffer.from(
  `<svg width="${width}" height="${height}"><rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="white"/></svg>`,
);

const buf = await sharp(data, { raw: { width, height, channels: 4 } })
  .composite([{ input: roundedMask, blend: 'dest-in' }])
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toBuffer();

for (const path of outPaths) {
  fs.writeFileSync(path, buf);
}

console.log(`Logo saved: ${outPaths.join(', ')} (${width}x${height}, r=${radius})`);
