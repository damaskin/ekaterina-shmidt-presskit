/* Токены и базовые стили сайта (в прод-сборке всё равно попадают в общий style.css,
   но в dev-режиме без этого импорта на страницах гайда не будет CSS-переменных) */
import '../src/index.css';
import './guide.css';

/* Переключатель RU/EN: приоритет ?lang= → localStorage → русский по умолчанию */
const STORAGE_KEY = 'guide-lang';
const LANGS = ['ru', 'en'];

function resolveInitialLang() {
  const fromQuery = new URLSearchParams(window.location.search).get('lang');
  if (LANGS.includes(fromQuery)) return fromQuery;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (LANGS.includes(stored)) return stored;
  } catch {
    /* приватный режим — игнорируем */
  }
  return 'ru';
}

function applyLang(lang) {
  const html = document.documentElement;
  html.dataset.guideLang = lang;
  html.lang = lang;
  document.querySelectorAll('.gp-lang__btn').forEach((btn) => {
    btn.classList.toggle('gp-lang__btn--active', btn.dataset.setLang === lang);
  });
  const title = html.dataset[lang === 'ru' ? 'titleRu' : 'titleEn'];
  if (title) document.title = title;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* приватный режим — игнорируем */
  }
}

document.querySelectorAll('.gp-lang__btn').forEach((btn) => {
  btn.addEventListener('click', () => applyLang(btn.dataset.setLang));
});

applyLang(resolveInitialLang());

/* Кнопка покупки ведёт в бота с deep-link ?start=guide.
   Username бота берётся из VITE_GUIDE_BOT_USERNAME (запекается при сборке).
   Если не задан — остаётся fallback-href из HTML (личка @shmidt01). */
const BOT_USERNAME = import.meta.env.VITE_GUIDE_BOT_USERNAME;
if (BOT_USERNAME) {
  const botUrl = `https://t.me/${BOT_USERNAME}?start=guide`;
  document.querySelectorAll('[data-buy]').forEach((a) => {
    a.href = botUrl;
  });
}

/* Плавное появление секций при скролле — прогрессивное улучшение:
   без работающего IntersectionObserver контент просто остаётся видимым */
const revealEls = document.querySelectorAll('.gp-reveal');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('gp-anim');
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12 },
  );
  revealEls.forEach((el) => io.observe(el));
  /* Страховка: если observer так и не сработал (встроенные браузеры,
     фоновые вкладки) — показываем всё через 2.5 с */
  setTimeout(() => {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }, 2500);
}
