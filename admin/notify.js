/**
 * Переиспользуемый компонент уведомлений (тосты) для админки.
 * Сам создаёт контейнер, складывает тосты стопкой справа сверху,
 * авто-скрывает по таймауту, поддерживает ручное закрытие.
 *
 *   notify('Сохранено');                 // success
 *   notify('Ошибка', 'error');
 *   notifyError('Не удалось'); notifySuccess('Готово');
 */
let container = null;

function ensureContainer() {
  if (container && document.body.contains(container)) return container;
  container = document.createElement('div');
  container.className = 'ad-toasts';
  container.setAttribute('aria-live', 'polite');
  document.body.appendChild(container);
  return container;
}

export function notify(message, type = 'success', { timeout = 4000 } = {}) {
  const root = ensureContainer();

  const toast = document.createElement('div');
  toast.className = `ad-toast ad-toast--${type === 'error' ? 'error' : 'success'}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const text = document.createElement('span');
  text.className = 'ad-toast__text';
  text.textContent = message;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'ad-toast__close';
  closeBtn.setAttribute('aria-label', 'Закрыть');
  closeBtn.textContent = '×';

  toast.append(text, closeBtn);
  root.appendChild(toast);

  // Вход через setTimeout (а не rAF — тот не срабатывает в фоновой вкладке).
  setTimeout(() => toast.classList.add('ad-toast--in'), 10);

  let removed = false;
  const remove = () => {
    if (removed) return;
    removed = true;
    toast.classList.remove('ad-toast--in');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    setTimeout(() => toast.remove(), 400); // фолбэк, если transitionend не сработал
  };

  closeBtn.addEventListener('click', remove);
  if (timeout > 0) setTimeout(remove, timeout);

  return remove;
}

export const notifySuccess = (message, options) => notify(message, 'success', options);
export const notifyError = (message, options) => notify(message, 'error', options);
