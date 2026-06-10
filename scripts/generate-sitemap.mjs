/**
 * Writes robots.txt and sitemap.xml into dist/ after build.
 * VITE_SITE_URL=https://shmidt01.ru node scripts/generate-sitemap.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const siteUrl = (process.env.VITE_SITE_URL ?? 'https://shmidt01.ru').replace(/\/$/, '');
const distDir = path.resolve(process.cwd(), 'dist');
const locales = ['en', 'ru', 'de', 'ar', 'hi', 'es', 'fr', 'zh'];
const now = new Date().toISOString().slice(0, 10);

const hreflangLinks = locales
  .map(
    (locale) =>
      `      <xhtml:link rel="alternate" hreflang="${locale}" href="${siteUrl}/?lang=${locale}" />`,
  )
  .join('\n');

/* Страница гайда переведена только на ru/en; скрытая полная версия в sitemap не попадает */
const guideLocales = ['ru', 'en'];
const guideHreflangLinks = guideLocales
  .map(
    (locale) =>
      `      <xhtml:link rel="alternate" hreflang="${locale}" href="${siteUrl}/guide/?lang=${locale}" />`,
  )
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${siteUrl}/</loc>
${hreflangLinks}
      <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}/" />
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/guide/</loc>
${guideHreflangLinks}
      <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}/guide/" />
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
`;

const robots = `User-agent: *
Allow: /

User-agent: Yandex
Allow: /

User-agent: Googlebot
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(distDir, 'robots.txt'), robots);
console.log('SEO files written to dist/: robots.txt, sitemap.xml');
