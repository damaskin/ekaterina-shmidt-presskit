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
  let saved = 'overview';
  try {
    saved = localStorage.getItem('admin-tab') || 'overview';
  } catch {
    /* приватный режим */
  }
  showTab(saved);
}

/* ── Табы ──────────────────────────────────────────── */

function showTab(name) {
  const known = [...document.querySelectorAll('.ad-tab-panel')].map((p) => p.dataset.panel);
  const tab = known.includes(name) ? name : 'overview';
  document.querySelectorAll('.ad-tab-panel').forEach((p) => {
    p.hidden = p.dataset.panel !== tab;
  });
  document.querySelectorAll('.ad-tab-btn').forEach((b) => {
    b.classList.toggle('ad-tab-btn--active', b.dataset.tab === tab);
  });
  try {
    localStorage.setItem('admin-tab', tab);
  } catch {
    /* приватный режим */
  }
  if (tab === 'users') loadUsers();
  if (tab === 'guide') loadMedia();
}

document.querySelectorAll('.ad-tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => showTab(btn.dataset.tab));
});

/* ── Загрузка данных ───────────────────────────────── */

function renderCards(stats, audience) {
  const rub = (n) => `${Math.round(Number(n) || 0).toLocaleString('ru-RU')} ₽`;
  const cards = [
    { value: audience?.total ?? 0, label: 'Пользователей бота' },
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
  renderCards(data.stats, data.audience);
  fillSettings(data.settings);
  const ac = $('audience-count');
  if (ac && data.audience) {
    ac.textContent = `${data.audience.reachable} получат, ${data.audience.blocked} заблокировали`;
  }
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
        <td data-label="chat_id"><code>${p.chat_id}</code></td>
        <td data-label="Статус"><span class="ad-badge ad-badge--${p.status}">${label}</span></td>
        <td data-label="Сумма">${amount}</td>
        <td data-label="Email">${escapeHtml(p.email) || '—'}</td>
        <td data-label="Оплата">${paidAt}</td>
        <td class="ad-td-action"><button class="ad-btn ad-btn--ghost ad-btn--mini" data-resend="${p.chat_id}">Выслать</button></td>
      </tr>`;
    })
    .join('');
}

async function loadPurchases() {
  const status = $('filter-status').value;
  const { ok, data } = await api(`/purchases${status ? `?status=${status}` : ''}`);
  if (ok) renderPurchases(data.purchases);
}

/* ── Пользователи ──────────────────────────────────── */

let usersCache = [];

function userName(u) {
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
  if (name) return u.username ? `${name} (@${u.username})` : name;
  return u.username ? `@${u.username}` : '—';
}

function renderUsers() {
  const q = ($('user-filter').value || '').trim().toLowerCase();
  const rows = usersCache.filter(
    (u) =>
      !q ||
      String(u.chat_id).includes(q) ||
      userName(u).toLowerCase().includes(q) ||
      String(u.username || '').toLowerCase().includes(q),
  );
  $('users-total').textContent = `(${q ? `${rows.length} из ${usersCache.length}` : usersCache.length})`;
  const tbody = $('users-list');
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="ad-empty">Нет пользователей</td></tr>';
    return;
  }
  tbody.innerHTML = rows
    .map((u) => {
      const role = u.is_owner ? 'владелец' : u.is_admin ? 'админ' : 'пользователь';
      const status = u.is_blocked
        ? '<span class="ad-badge ad-badge--canceled">заблокировал</span>'
        : '<span class="ad-badge ad-badge--delivered">активен</span>';
      return `<tr>
        <td data-label="chat_id"><code>${u.chat_id}</code></td>
        <td data-label="Имя">${escapeHtml(userName(u))}</td>
        <td data-label="Роль">${role}</td>
        <td data-label="Статус">${status}</td>
        <td data-label="Визит">${u.last_seen_at || u.registered_at || '—'}</td>
      </tr>`;
    })
    .join('');
}

async function loadUsers() {
  const { ok, data } = await api('/users');
  if (!ok) return;
  usersCache = data.users || [];
  renderUsers();
}

$('user-filter').addEventListener('input', renderUsers);
$('users-refresh').addEventListener('click', loadUsers);

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

/* Тулбар редактора: вставка разделителя блоков и Telegram-HTML тегов.
   Если есть выделение — оборачиваем его, иначе вставляем с подсказкой. */
function applyEditorAction(textarea, btn) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  let body = textarea.value.slice(start, end);
  let before = '';
  let after = '';

  if (btn.dataset.insert === 'block') {
    before = '\n---\n';
    body = '';
  } else if (btn.dataset.wrap) {
    const tag = btn.dataset.wrap;
    before = `<${tag}>`;
    after = `</${tag}>`;
    if (!body) body = tag === 'b' ? 'жирный текст' : 'курсив';
  } else if ('link' in btn.dataset) {
    before = '<a href="https://">';
    after = '</a>';
    if (!body) body = 'текст ссылки';
  }

  textarea.setRangeText(before + body + after, start, end, 'end');
  textarea.focus();
}

document.querySelectorAll('.ad-toolbar').forEach((toolbar) => {
  const textarea = $(toolbar.dataset.editor);
  if (!textarea) return;
  toolbar.querySelectorAll('.ad-chip').forEach((btn) => {
    btn.addEventListener('click', () => applyEditorAction(textarea, btn));
  });
});

/* ── Фото гайда ────────────────────────────────────── */

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function loadMedia() {
  const { ok, data } = await api('/media');
  if (!ok) return;
  const grid = $('media-grid');
  const items = data.media || [];
  if (!items.length) {
    grid.innerHTML = '<p class="ad-hint">Фото пока нет</p>';
    return;
  }
  grid.innerHTML = items
    .map(
      (m) => `<div class="ad-media-item">
        <img src="${API}/media/${m.id}" alt="" loading="lazy" />
        <div class="ad-media-item__actions">
          <button class="ad-btn ad-btn--ghost ad-btn--mini" data-media-insert="${m.id}">Вставить</button>
          <button class="ad-btn ad-btn--ghost ad-btn--mini" data-media-delete="${m.id}">Удалить</button>
        </div>
      </div>`,
    )
    .join('');
}

$('media-upload').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  e.target.value = '';
  let failed = 0;
  for (const file of files) {
    if (file.size > 8 * 1024 * 1024) {
      failed += 1;
      flash(`${file.name}: больше 8 МБ`, 'err');
      continue;
    }
    const dataUrl = await readFileAsDataURL(file);
    const { ok, data } = await api('/media', { method: 'POST', body: { name: file.name, data: dataUrl } });
    if (!ok) {
      failed += 1;
      flash(data.error || `${file.name}: не загрузилось`, 'err');
    }
  }
  if (failed < files.length) flash('Фото загружены');
  loadMedia();
});

$('media-grid').addEventListener('click', async (e) => {
  const insert = e.target.closest('[data-media-insert]');
  if (insert) {
    const ta = $('guide-body');
    const marker = `\n---\n[[photo:${insert.dataset.mediaInsert}]]\n---\n`;
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? start;
    ta.setRangeText(marker, start, end, 'end');
    ta.focus();
    flash('Маркер фото вставлен — не забудьте «Сохранить текст»');
    return;
  }
  const del = e.target.closest('[data-media-delete]');
  if (del) {
    if (!window.confirm('Удалить фото с сервера?')) return;
    const { ok, data } = await api(`/media/${del.dataset.mediaDelete}`, { method: 'DELETE' });
    if (ok) {
      flash('Фото удалено');
      loadMedia();
    } else {
      flash(data.error || 'Не удалось удалить', 'err');
    }
  }
});

async function sendGuideTo(chatId, btn, who) {
  btn.disabled = true;
  const { ok, data } = await api('/test-send', { method: 'POST', body: { chat_id: Number(chatId) } });
  btn.disabled = false;
  const target = who ? `${who} ` : '';
  flash(
    ok ? `Гайд отправлен ${target}(${data.delivered} сообщений)` : data.error || 'Ошибка отправки',
    ok ? 'ok' : 'err',
  );
}

$('test-send').addEventListener('click', (e) => {
  const chatId = $('test-chat').value.trim();
  if (!chatId) return flash('Укажите chat_id', 'err');
  sendGuideTo(chatId, e.currentTarget);
});

document.querySelectorAll('[data-send-to]').forEach((btn) => {
  btn.addEventListener('click', () => sendGuideTo(btn.dataset.sendTo, btn, btn.textContent.trim()));
});

$('broadcast-send').addEventListener('click', async (e) => {
  const text = $('broadcast-text').value.trim();
  if (!text) return flash('Текст рассылки пуст', 'err');
  if (!window.confirm('Отправить рассылку всем пользователям бота?')) return;
  const btn = e.currentTarget;
  btn.disabled = true;
  const { ok, data } = await api('/broadcast', { method: 'POST', body: { text } });
  btn.disabled = false;
  if (ok) {
    flash(`Рассылка запущена на ${data.queued} — итог придёт в Telegram`);
    $('broadcast-text').value = '';
  } else {
    flash(data.error || 'Не удалось запустить рассылку', 'err');
  }
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
