/** Публичные файлы из /public с учётом Vite base (GitHub Pages subpath). */
export function assetUrl(path: string): string {
  const clean = path.replace(/^\//, '');
  const encoded = clean.split('/').map(encodeURIComponent).join('/');
  return `${import.meta.env.BASE_URL}${encoded}`;
}
