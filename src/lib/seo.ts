import { getOgImageUrl, getSiteOrigin, getSiteUrl } from '../config/site';
import { PRESSKIT } from '../data/presskit.data';
import { LOCALE_OPTIONS } from '../i18n/locales';
import type { Locale, LocaleMessages } from '../i18n/types';

const OG_LOCALE: Record<Locale, string> = {
  en: 'en_US',
  ru: 'ru_RU',
  de: 'de_DE',
  ar: 'ar_AR',
  hi: 'hi_IN',
  es: 'es_ES',
  fr: 'fr_FR',
  zh: 'zh_CN',
};

const SEO_KEYWORDS: Record<Locale, string> = {
  en: 'Ekaterina Shmidt, DJ booking, international DJ, house DJ, organic house, afro house, downtempo, female DJ, press kit, technical rider, club DJ, festival DJ',
  ru: 'Ekaterina Shmidt, DJ букинг, букинг DJ, house DJ, organic house, afro house, downtempo, женский DJ, пресс-кит, технический райдер, клубный DJ, фестивальный DJ',
  de: 'Ekaterina Shmidt, DJ Booking, internationaler DJ, House DJ, Organic House, Afro House, Downtempo, Presskit, Technical Rider',
  fr: 'Ekaterina Shmidt, booking DJ, DJ internationale, house, organic house, afro house, downtempo, press kit, rider technique',
  es: 'Ekaterina Shmidt, booking DJ, DJ internacional, house, organic house, afro house, downtempo, press kit, rider técnico',
  ar: 'Ekaterina Shmidt, حجز DJ, دي جي, house, organic house, afro house, downtempo, press kit',
  hi: 'Ekaterina Shmidt, DJ booking, international DJ, house DJ, organic house, afro house, downtempo, press kit',
  zh: 'Ekaterina Shmidt, DJ 预订, 国际 DJ, house, organic house, afro house, downtempo, 媒体资料包',
};

function upsertMeta(
  attribute: 'name' | 'property',
  key: string,
  content: string,
): void {
  let element = document.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  );

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.content = content;
}

function upsertLink(
  rel: string,
  href: string,
  extra: Record<string, string> = {},
): void {
  const selectorParts = [`link[rel="${rel}"]`, ...Object.entries(extra).map(
    ([name, value]) => `[${name}="${value}"]`,
  )];
  let element = document.querySelector<HTMLLinkElement>(selectorParts.join(''));

  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    for (const [name, value] of Object.entries(extra)) {
      element.setAttribute(name, value);
    }
    document.head.appendChild(element);
  }

  element.href = href;
}

function buildStructuredData(locale: Locale, messages: LocaleMessages) {
  const origin = getSiteOrigin();
  const image = getOgImageUrl();

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        url: `${origin}/`,
        name: messages.meta.title,
        description: messages.meta.description,
        inLanguage: locale,
        publisher: { '@id': `${origin}/#music-group` },
      },
      {
        '@type': 'MusicGroup',
        '@id': `${origin}/#music-group`,
        name: PRESSKIT.artist,
        url: `${origin}/`,
        image,
        description: messages.meta.description,
        genre: messages.styles.genres,
        email: PRESSKIT.email,
        sameAs: [
          PRESSKIT.instagram.url,
          ...PRESSKIT.platforms.map((platform) => platform.url),
          PRESSKIT.releases[0]?.url,
        ].filter(Boolean),
        subjectOf: {
          '@type': 'WebPage',
          '@id': `${origin}/#webpage`,
          url: `${origin}/?lang=${locale}`,
          name: messages.meta.title,
          description: messages.meta.description,
          inLanguage: locale,
          isPartOf: { '@id': `${origin}/#website` },
        },
      },
    ],
  };
}

export function applyDocumentSeo(locale: Locale, messages: LocaleMessages): void {
  const pageUrl = getSiteUrl(`/?lang=${locale}`);
  const canonicalUrl = getSiteUrl('/');
  const image = getOgImageUrl();
  const { title, description } = messages.meta;
  const keywords = SEO_KEYWORDS[locale];

  document.title = title;

  upsertMeta('name', 'description', description);
  upsertMeta('name', 'keywords', keywords);
  upsertMeta('name', 'author', PRESSKIT.artist);
  upsertMeta('name', 'robots', 'index, follow, max-image-preview:large');
  upsertMeta('name', 'googlebot', 'index, follow, max-image-preview:large');

  upsertLink('canonical', canonicalUrl);

  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:site_name', PRESSKIT.artist);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:url', pageUrl);
  upsertMeta('property', 'og:image', image);
  upsertMeta('property', 'og:image:alt', `${PRESSKIT.artist} — DJ press kit`);
  upsertMeta('property', 'og:locale', OG_LOCALE[locale]);

  document
    .querySelectorAll('meta[property="og:locale:alternate"]')
    .forEach((node) => node.remove());

  for (const option of LOCALE_OPTIONS) {
    if (option.code === locale) continue;
    const alternate = document.createElement('meta');
    alternate.setAttribute('property', 'og:locale:alternate');
    alternate.content = OG_LOCALE[option.code];
    document.head.appendChild(alternate);
  }

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  upsertMeta('name', 'twitter:image', image);
  upsertMeta('name', 'twitter:image:alt', `${PRESSKIT.artist} — DJ press kit`);

  document
    .querySelectorAll('link[rel="alternate"][hreflang]')
    .forEach((node) => node.remove());

  for (const option of LOCALE_OPTIONS) {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = option.code;
    link.href = getSiteUrl(`/?lang=${option.code}`);
    document.head.appendChild(link);
  }

  const xDefault = document.createElement('link');
  xDefault.rel = 'alternate';
  xDefault.hreflang = 'x-default';
  xDefault.href = canonicalUrl;
  document.head.appendChild(xDefault);

  let jsonLd = document.getElementById('seo-jsonld') as HTMLScriptElement | null;
  if (!jsonLd) {
    jsonLd = document.createElement('script');
    jsonLd.id = 'seo-jsonld';
    jsonLd.type = 'application/ld+json';
    document.head.appendChild(jsonLd);
  }

  jsonLd.textContent = JSON.stringify(buildStructuredData(locale, messages));
}
