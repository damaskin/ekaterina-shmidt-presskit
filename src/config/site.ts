const DEFAULT_ORIGIN = 'https://shmidt01.ru';

export function getSiteOrigin(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }

  return DEFAULT_ORIGIN;
}

export function getSiteUrl(path = '/'): string {
  const origin = getSiteOrigin();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${normalized}`;
}

export const OG_IMAGE_PATH = '/assets/portrait-hero-desktop.jpg';

export function getOgImageUrl(): string {
  return getSiteUrl(OG_IMAGE_PATH);
}
