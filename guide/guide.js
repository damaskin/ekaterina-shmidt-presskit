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

/* Кнопка покупки.
   В TMA (открыт внутри Telegram): MainButton ведёт в бота через openTelegramLink.
   В браузере: открывается панель с Telegram Login Widget + оплата на сайте. */
const BOT_USERNAME = import.meta.env.VITE_GUIDE_BOT_USERNAME;
const buyButtons = document.querySelectorAll('[data-buy]');
const buyUrl = BOT_USERNAME ? `https://t.me/${BOT_USERNAME}?start=guide` : null;
const API_BASE = (import.meta.env.VITE_BOOKING_API_URL || 'https://shmidt01.ru/api/booking')
  .replace(/\/booking$/, '');

// ─── Purchase panel ─────────────────────────────────────────
const panel = document.getElementById('purchase-panel');
let tgUser = null;
let requireEmailForPurchase = true;

function openPurchasePanel() {
  if (!panel) return;
  panel.removeAttribute('aria-hidden');
  document.body.style.overflow = 'hidden';
  tgUser = null;
  showPanelStep('tg');
  mountTelegramWidget();
}

function closePurchasePanel() {
  if (!panel) return;
  panel.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function showPanelStep(name) {
  ['tg', 'email', 'loading'].forEach((id) => {
    const el = document.getElementById(`step-${id}`);
    if (el) el.hidden = id !== name;
  });
}

function showPurchaseError(msg) {
  const el = document.getElementById('purchase-error');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
}

function mountTelegramWidget() {
  const mount = document.getElementById('tg-widget-mount');
  if (!mount) return;
  mount.innerHTML = '';
  if (!BOT_USERNAME) {
    mount.innerHTML =
      '<p style="color:rgba(255,255,255,.5);font-size:.85rem;text-align:center">Бот не настроен. Напишите @shmidt01.</p>';
    return;
  }
  window.__tgAuthCb = (user) => {
    tgUser = user;
    const nameEl = document.getElementById('tg-user-name');
    if (nameEl) nameEl.textContent = user.first_name || 'друг';
    const emailWrap = document.getElementById('email-field-wrap');
    if (emailWrap) emailWrap.hidden = !requireEmailForPurchase;
    showPanelStep('email');
  };
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://telegram.org/js/telegram-widget.js?22';
  script.setAttribute('data-telegram-login', BOT_USERNAME);
  script.setAttribute('data-size', 'large');
  script.setAttribute('data-radius', '8');
  script.setAttribute('data-request-access', 'write');
  script.setAttribute('data-onauth', '__tgAuthCb(user)');
  mount.appendChild(script);
}

buyButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const isTma = document.documentElement.classList.contains('tg-webapp');
    if (isTma && buyUrl) {
      const tgApp = window.Telegram?.WebApp;
      if (tgApp?.openTelegramLink) tgApp.openTelegramLink(buyUrl);
      else window.location.href = buyUrl;
    } else {
      openPurchasePanel();
    }
  });
});

document.getElementById('panel-backdrop')?.addEventListener('click', closePurchasePanel);
document.getElementById('panel-cancel')?.addEventListener('click', closePurchasePanel);
document.getElementById('step-back')?.addEventListener('click', () => {
  tgUser = null;
  showPanelStep('tg');
  mountTelegramWidget();
});

document.getElementById('purchase-pay-btn')?.addEventListener('click', async () => {
  const errorEl = document.getElementById('purchase-error');
  if (errorEl) errorEl.hidden = true;

  const email = requireEmailForPurchase
    ? (document.getElementById('purchase-email')?.value?.trim() || '')
    : null;

  if (requireEmailForPurchase && !email) {
    showPurchaseError('Введите email для чека');
    return;
  }

  showPanelStep('loading');

  try {
    const res = await fetch(`${API_BASE}/guide-buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tg_auth: tgUser, email }),
    });
    const data = await res.json();
    if (data.confirmationUrl) {
      window.location.href = data.confirmationUrl;
    } else {
      showPanelStep('email');
      showPurchaseError(data.error || 'Ошибка при создании платежа. Попробуйте позже.');
    }
  } catch {
    showPanelStep('email');
    showPurchaseError('Нет связи с сервером. Попробуйте позже.');
  }
});

// ?paid=1 — показываем баннер после возврата с ЮKassa
if (new URLSearchParams(window.location.search).get('paid') === '1') {
  const banner = document.createElement('div');
  banner.className = 'gp-paid-banner';
  banner.innerHTML =
    '✅ Оплата прошла! Гайд скоро придёт в <strong>@dj_shmidt_bot</strong>. Если вы его ещё не открывали — <a href="https://t.me/dj_shmidt_bot" target="_blank" style="color:inherit">откройте сейчас</a>.';
  const firstPage = document.querySelector('.gp-page');
  if (firstPage) firstPage.prepend(banner);
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
  fetch(`${API_BASE}/guide-price`)
    .then((r) => r.json())
    .then((data) => {
      const rub = Number(data?.priceRub);
      if (Number.isFinite(rub) && rub > 0) {
        updatePrice(rub);
        const payBtn = document.getElementById('purchase-pay-btn');
        if (payBtn) payBtn.textContent = `Оплатить ${rub.toLocaleString('ru-RU')} ₽`;
      }
      if (typeof data?.requireEmail === 'boolean') {
        requireEmailForPurchase = data.requireEmail;
      }
    })
    .catch(() => {
      /* сеть недоступна — остаётся дефолт */
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
