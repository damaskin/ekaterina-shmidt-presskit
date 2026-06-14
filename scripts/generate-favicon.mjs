/**
 * Генерирует растровые фавиконы из public/favicon.svg:
 *   public/favicon-32.png, public/apple-touch-icon.png (180), public/favicon.ico (32, PNG-in-ICO).
 * Запуск: npm run assets:favicon
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const publicDir = join(process.cwd(), 'public');
const svg = readFileSync(join(publicDir, 'favicon.svg'));

// density повыше — чтобы SVG рендерился крупно и при ресайзе края были чёткими
const render = (size) =>
  sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();

const png32 = await render(32);
writeFileSync(join(publicDir, 'favicon-32.png'), png32);
writeFileSync(join(publicDir, 'apple-touch-icon.png'), await render(180));

// favicon.ico = контейнер ICO с одним 32×32 PNG (поддерживается всеми браузерами)
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // количество изображений

const entry = Buffer.alloc(16);
entry.writeUInt8(32, 0); // width
entry.writeUInt8(32, 1); // height
entry.writeUInt8(0, 2); // палитра не используется
entry.writeUInt8(0, 3); // reserved
entry.writeUInt16LE(1, 4); // color planes
entry.writeUInt16LE(32, 6); // бит на пиксель
entry.writeUInt32LE(png32.length, 8); // размер данных
entry.writeUInt32LE(22, 12); // смещение данных (6 + 16)

writeFileSync(join(publicDir, 'favicon.ico'), Buffer.concat([header, entry, png32]));

console.log('favicon assets generated: favicon.ico, favicon-32.png, apple-touch-icon.png');
