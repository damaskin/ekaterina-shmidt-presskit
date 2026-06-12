/**
 * Файловое хранилище фото гайда.
 * Лежат в env.MEDIA_DIR (по умолчанию /data/guide-media) — это том Docker,
 * поэтому файлы переживают пересборку контейнера и не затрагиваются rsync.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export const MAX_MEDIA_BYTES = 8 * 1024 * 1024;

function dir(env) {
  const d = env.MEDIA_DIR || 'data/guide-media';
  mkdirSync(d, { recursive: true });
  return d;
}

export function saveMediaFile(env, filename, buffer) {
  writeFileSync(join(dir(env), filename), buffer);
}

export function readMediaFile(env, filename) {
  const path = join(dir(env), filename);
  return existsSync(path) ? readFileSync(path) : null;
}

export function removeMediaFile(env, filename) {
  const path = join(dir(env), filename);
  if (existsSync(path)) rmSync(path);
}
