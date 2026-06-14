/* Токены и базовые стили сайта (в прод-сборке всё равно попадают в общий style.css,
   но в dev-режиме без этого импорта на страницах гайда не будет CSS-переменных) */
import '../src/index.css';
import './guide.css';
import { setupGuideTelegram } from './telegram-buy.js';

/* Переключатель RU/EN: приоритет ?lang= → localStorage → русский по умолчанию */
const STORAGE_KEY = 'guide-lang';
const LANGS = ['ru', 'en'];

// Хэндл Telegram Mini App (если открыто внутри Telegram) — для обновления MainButton.
let telegram = null;

/** Текст видимой кнопки покупки для текущего языка (для нативной MainButton). */
function visibleBuyText() {
  const lang = document.documentElement.dataset.guideLang || 'ru';
  const btn =
    document.querySelector(`main[data-lang="${lang}"] [data-buy]`) ||
    document.querySelector('[data-buy]');
  return btn ? btn.textContent.trim() : '';
}

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
  // Текст нативной MainButton должен совпадать с языком страницы.
  if (telegram) telegram.refreshText(visibleBuyText());
}

document.querySelectorAll('.gp-lang__btn').forEach((btn) => {
  btn.addEventListener('click', () => applyLang(btn.dataset.setLang));
});

applyLang(resolveInitialLang());

/* Кнопка покупки ведёт в бота с deep-link ?start=guide.
   Username бота берётся из VITE_GUIDE_BOT_USERNAME (запекается при сборке).
   Если не задан — остаётся fallback-href из HTML (личка @shmidt01). */
const BOT_USERNAME = import.meta.env.VITE_GUIDE_BOT_USERNAME;
const buyButtons = document.querySelectorAll('[data-buy]');
const buyUrl = BOT_USERNAME
  ? `https://t.me/${BOT_USERNAME}?start=guide`
  : buyButtons[0]?.getAttribute('href') || null;
if (BOT_USERNAME) {
  buyButtons.forEach((a) => {
    a.href = buyUrl;
  });
}

/* Telegram Mini App: полноэкранный режим + отступ под шапку, нативные кнопки.
   MainButton показываем только на продающей странице (где есть кнопка покупки). */
telegram = setupGuideTelegram({
  buyUrl: buyButtons.length ? buyUrl : null,
  getButtonText: visibleBuyText,
});

/* Актуальная цена приходит с сервера (меняется в админке), а в HTML —
   лишь дефолт. Подставляем её в крупный ценник, кнопки покупки и MainButton. */
function updatePrice(rub) {
  const label = `${rub} ₽`;
  document.querySelectorAll('.gp-buy__price').forEach((el) => {
    el.textContent = label;
  });
  document.querySelectorAll('[data-buy]').forEach((btn) => {
    const main = btn.closest('main[data-lang]');
    const lang = main ? main.dataset.lang : 'ru';
    btn.textContent = lang === 'en' ? `Buy the guide — ${label}` : `Купить гайд — ${label}`;
  });
  if (telegram) telegram.refreshText(visibleBuyText());
}

if (buyButtons.length) {
  const priceUrl = (import.meta.env.VITE_BOOKING_API_URL || 'https://shmidt01.ru/api/booking').replace(
    /\/booking$/,
    '/guide-price',
  );
  fetch(priceUrl)
    .then((r) => r.json())
    .then((data) => {
      const rub = Number(data?.priceRub);
      if (Number.isFinite(rub) && rub > 0) updatePrice(rub);
    })
    .catch(() => {
      /* сеть недоступна — остаётся дефолтная цена из HTML */
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
