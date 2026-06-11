import '../src/index.css';
import './admin.css';

const API = '/api/admin';

const $ = (id) => document.getElementById(id);

const STATUS_LABEL = {
  awaiting_email: 'Ждёт email',
  pending: 'Ждёт оплату',
  paid: 'Оплачено',
  delivered: 'Доставлено',
  canceled: 'Отменено',
};

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(API + path, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* пустой ответ */
  }
  return { ok: res.ok, status: res.status, data };
}

let msgTimer;
function flash(text, kind = 'ok') {
  const el = $('msg');
  el.textContent = text;
  el.className = `ad-msg ad-msg--${kind}`;
  el.hidden = false;
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => {
    el.hidden = true;
  }, 4000);
}

function showLogin() {
  $('app').hidden = true;
  $('login').hidden = false;
}

function showApp() {
  $('login').hidden = true;
  $('app').hidden = false;
}

/* ── Загрузка данных ───────────────────────────────── */

function renderCards(stats) {
  const rub = (n) => `${Math.round(Number(n) || 0).toLocaleString('ru-RU')} ₽`;
  const cards = [
    { value: stats.delivered ?? 0, label: 'Доставлено гайдов' },
    { value: rub(stats.revenue), label: 'Выручка' },
    { value: stats.paidCount ?? 0, label: 'Оплачено' },
    { value: stats.total ?? 0, label: 'Всего покупок' },
  ];
  $('cards').innerHTML = cards
    .map(
      (c) =>
        `<div class="ad-card"><div class="ad-card__value">${c.value}</div><div class="ad-card__label">${c.label}</div></div>`,
    )
    .join('');
}

function fillSettings(s) {
  $('set-price').value = s.priceRub;
  $('set-sales').checked = !!s.salesEnabled;
  $('set-email').checked = !!s.requireEmail;
  $('yk-status').textContent = s.yookassaConfigured
    ? 'ЮKassa подключена ✓'
    : '⚠️ Ключи ЮKassa не заданы — оплата не создаётся';
}

async function loadOverview() {
  const { ok, data } = await api('/overview');
  if (!ok) return;
  renderCards(data.stats);
  fillSettings(data.settings);
}

async function loadGuide() {
  const { ok, data } = await api('/guide');
  if (!ok) return;
  $('guide-body').value = data.body;
  $('guide-info').textContent = `Блоков: ${data.chunkCount} · длины: ${data.lengths.join(', ')}${data.custom ? '' : ' (текст по умолчанию)'}`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

function renderPurchases(rows) {
  const tbody = $('purchases');
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="ad-empty">Покупок нет</td></tr>';
    return;
  }
  tbody.innerHTML = rows
    .map((p) => {
      const label = STATUS_LABEL[p.status] || p.status;
      const paidAt = p.paid_at || '—';
      const amount = p.amount ? `${p.amount} ${p.currency}` : '—';
      return `<tr>
        <td><code>${p.chat_id}</code></td>
        <td><span class="ad-badge ad-badge--${p.status}">${label}</span></td>
        <td>${amount}</td>
        <td>${escapeHtml(p.email) || '—'}</td>
        <td>${paidAt}</td>
        <td><button class="ad-btn ad-btn--ghost ad-btn--mini" data-resend="${p.chat_id}">Выслать</button></td>
      </tr>`;
    })
    .join('');
}

async function loadPurchases() {
  const status = $('filter-status').value;
  const { ok, data } = await api(`/purchases${status ? `?status=${status}` : ''}`);
  if (ok) renderPurchases(data.purchases);
}

async function loadAll() {
  await Promise.all([loadOverview(), loadGuide(), loadPurchases()]);
}

/* ── Действия ──────────────────────────────────────── */

$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('login-btn');
  btn.disabled = true;
  const { ok, data } = await api('/login', { method: 'POST', body: { password: $('password').value } });
  btn.disabled = false;
  const err = $('login-error');
  if (ok) {
    authed = true;
    err.hidden = true;
    $('password').value = '';
    showApp();
    loadAll();
  } else {
    err.textContent = data.error || 'Ошибка входа';
    err.hidden = false;
  }
});

$('logout-btn').addEventListener('click', async () => {
  await api('/logout', { method: 'POST' });
  authed = false;
  showLogin();
});

$('save-settings').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  btn.disabled = true;
  const { ok, data } = await api('/settings', {
    method: 'POST',
    body: {
      priceRub: Number($('set-price').value),
      salesEnabled: $('set-sales').checked,
      requireEmail: $('set-email').checked,
    },
  });
  btn.disabled = false;
  if (ok) {
    fillSettings(data);
    flash('Настройки сохранены');
  } else {
    flash(data.error || 'Не удалось сохранить', 'err');
  }
});

$('save-guide').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  btn.disabled = true;
  const { ok, data } = await api('/guide', { method: 'POST', body: { body: $('guide-body').value } });
  btn.disabled = false;
  if (ok) {
    $('guide-info').textContent = `Блоков: ${data.chunkCount} · длины: ${data.lengths.join(', ')}`;
    flash('Текст гайда сохранён');
  } else {
    flash(data.error || 'Не удалось сохранить текст', 'err');
  }
});

$('test-send').addEventListener('click', async (e) => {
  const chatId = $('test-chat').value.trim();
  if (!chatId) return flash('Укажите chat_id', 'err');
  const btn = e.currentTarget;
  btn.disabled = true;
  const { ok, data } = await api('/test-send', { method: 'POST', body: { chat_id: Number(chatId) } });
  btn.disabled = false;
  flash(ok ? `Отправлено (${data.delivered} сообщений)` : data.error || 'Ошибка отправки', ok ? 'ok' : 'err');
});

$('refresh').addEventListener('click', loadPurchases);
$('filter-status').addEventListener('change', loadPurchases);

$('purchases').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-resend]');
  if (!btn) return;
  btn.disabled = true;
  const { ok, data } = await api('/purchases/resend', {
    method: 'POST',
    body: { chat_id: Number(btn.dataset.resend) },
  });
  btn.disabled = false;
  if (ok) {
    flash('Гайд выслан повторно');
    loadPurchases();
  } else {
    flash(data.error || 'Не удалось выслать', 'err');
  }
});

/* ── Старт: проверяем сессию ───────────────────────── */

let authed = false;

(async () => {
  const { ok } = await api('/session');
  if (authed) return;
  if (ok) {
    showApp();
    loadAll();
  } else {
    showLogin();
  }
})();
