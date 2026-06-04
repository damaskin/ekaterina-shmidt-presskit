# Концепт сайта — DJ Ekaterina Shmidt (Press Kit)

> Референс: [pressskit.com/dj-masala-kitty](https://pressskit.com/dj-masala-kitty)  
> Платформа референса: **wfolio** + дизайн в **Canva** (вертикальный one-page scroll, ~6 экранов)  
> Дата: 04.06.2026

---

## 1. Полный анализ референса (Masala Kitty)

### 1.1 Технология и UX

| Параметр | Реализация |
|----------|------------|
| Формат | Одностраничный **full-viewport scroll** (каждый блок ≈ 100vh) |
| Навигация | Только скролл + стрелка вниз на 1-м экране; якорное меню **нет** |
| Хостинг | pressskit.com → iframe Canva |
| Высота страницы | ~6400px, 6–7 визуальных секций |
| Мобильная версия | Вертикальный стек: кнопки платформ → hero → фото → текст |

**Сильные стороны референса:**
- За 3 секунды понятно: кто, где слушать, как забукать
- CTA «BOOKING» / «PRESSBOOK» всегда на виду на 2-м экране
- Контраст тёмных и светлых секций — чёткое разделение смыслов
- Промоутеру не нужен PDF: всё в одной ссылке

**Слабые стороны (что улучшаем у Шмидт):**
- Нет отдельного блока **Work Experience** — у вас сильная география (Maldives, KSA, India)
- Жанры спрятаны в абзац, а не в **теги** — у вас 13 стилей, их надо сканировать глазами
- Booking ведёт на email в тексте, а не в **модалку** (ваше ТЗ)
- Цвет референса (пыльная роза) **не совпадает** с вашим фирменным magenta из фото

### 1.2 Разбор экранов референса

#### Экран 1 — Hero / Cover
```
┌─────────────────────────────────────────────────────────────┐
│ [DJ PRESSKIT]                          ┌──────────────────┐│
│                                        │                  ││
│  ┌──────────┐                          │   LOGO (крупно)  ││
│  │ APPLE    │                          │                  ││
│  │ BEATPORT │     (blur DJ photo bg)   │ INTERNATIONAL DJ ││
│  │ MIXCLOUD │                          │ AND PRODUCER     ││
│  │ SPOTIFY  │                          └────────┬─────────┘│
│  │ SOUNDCLOUD│                                 ↓ scroll    │
│  │ YOUTUBE  │                          └──────────────────┘│
│  └──────────┘                          (белая рамка)       │
└─────────────────────────────────────────────────────────────┘
```
- Фон: затемнённое фото DJ за пультами (blur + overlay ~60%)
- Слева: **pill-кнопки** (border-radius 999px), цвет `#B8898E` (dusty rose), белый текст CAPS
- Справа: **белая тонкая рамка** 1px, внутри логотип + слоган
- Акцент: минимализм, «ночной» клубный вайб

#### Экран 2 — Bio + Contacts
- Фон: `#2A2A2A` + декоративные **waveform** полосы сверху/снизу
- Слева ~40%: портрет (studio/club)
- Справа: имя (serif + script), био, Instagram + Email с иконками
- Внизу по центру: **BOOKING** | **PRESSBOOK** (те же pill-кнопки)

#### Экран 3 — Musical Style
- Фон: светлый `#E8E8E8` + вертикальные линии (паттерн)
- Слева: заголовок MUSICAL STYLE + геометрический знак + текст жанров
- Справа: ч/б фото за пультами
- Переход: резкая смена dark → light

#### Экран 4 — (у референса продолжение style / bio, отдельного CV нет)

#### Экран 5 — Releases
- Фон: тёмный `#1A1A1A` + горизонтальные «рёбра»
- Заголовок **RELEASES** — огромный, белый, справа/сверху
- Сетка 3 колонки: год → название → YouTube embed → описание трека

#### Экран 6 — Technical Rider
- Фон: **film grain** + **light leak** (оранжево-красный справа)
- Заголовок TECHNICAL RIDER — крупный, muted mauve
- Список bullet, белый текст, слева 60% ширины

### 1.3 Дизайн-система референса

| Токен | Значение |
|-------|----------|
| Accent (кнопки) | `#B8898E` — dusty rose |
| Dark bg | `#1E1E1E` – `#2A2A2A` |
| Light bg | `#E5E5E5` |
| Text on dark | `#FFFFFF` |
| Text on light | `#1A1A1A` |
| Шрифт UI | Geometric sans (Montserrat / similar), CAPS для лейблов |
| Шрифт лого | Кастомный display (у вас — **SHMIDT** stencil) |
| Кнопки | Pill, padding 14px 32px, без border |
| Рамки | 1px solid white на hero |

---

## 2. Концепт сайта Ekaterina Shmidt

### 2.1 Позиционирование

**One-link DJ Press Kit** для промоутеров, booking-агентов и прессы.

Отличие от референса:
- Ваш визуал — **magenta / organic house**, не «европейская dusty rose»
- Логотип **SHMIDT** — техно-геометрия, монохром → задаёт UI-язык (углы, cuts, рамки как в лого)
- Сильный блок **резиденств и luxury venues** (Four Seasons, St.Regis, Ritz, Shangri-La, BMW)
- Релиз **Afro Kiss** на Beatport — отдельный hero в Releases

### 2.2 Бренд и цвета (адаптация под ваши материалы)

| Роль | Цвет | Обоснование |
|------|------|-------------|
| Primary accent | `#FF2D8A` → `#C2187A` gradient | Magenta с главного фото |
| Accent muted (кнопки) | `#9B4D6A` | Приглушённый для hover/secondary |
| Dark bg | `#0D0A0F` | Почти чёрный с фиолетовым подтоном |
| Dark section | `#1A1220` | Секции bio / releases |
| Light bg | `#F0EDF2` | Musical style, experience |
| Text | `#FFFFFF` / `#141014` | Контраст WCAG AA |
| Grain overlay | noise 4–6% opacity | Как rider в референсе |

**Типографика:**
- **Display / Logo:** ваш вектор SHMIDT (SVG из Google Drive)
- **Headings:** `Syne` или `Archivo Black` — техно, геометрия
- **Body:** `Inter` или `DM Sans` — читаемость био и rider
- **Labels (DJ PRESSKIT, INTERNATIONAL…):** letter-spacing `0.2em`, uppercase

### 2.3 Структура — 6 слайдов (100vh each)

```
[1 Cover] → [2 About] → [3 Styles] → [4 Experience] → [5 Releases] → [6 Rider]
     ↓ scroll-snap optional + progress dots справа (добавление к референсу)
```

---

#### Слайд 1 — COVER

**Макет:** как референс, контент по вашему ТЗ.

| Зона | Контент |
|------|---------|
| Top-left | `DJ PRESSKIT` |
| Center (в рамке) | Логотип SHMIDT — SVG, max-width 70vw |
| Below logo | `INTERNATIONAL DJ AND PRODUCER` |
| Left column | Pill-ссылки (3 шт.): **SOUNDCLOUD**, **FLAT AUDIO**, **YOUTUBE** |
| Фон | Видео-loop или фото: blur пульт / сцена + magenta gradient overlay 40% |

**Ссылки:**
- SoundCloud: https://on.soundcloud.com/lMr88mI34Xhkk1N3NS
- Flat.audio: https://flat.audio/id33527
- YouTube: https://youtube.com/@shmidt001

**Деталь бренда:** рамка вокруг лого повторяет **L-образную геометрию** из вашего логотипа (не просто прямоугольник).

---

#### Слайд 2 — ABOUT

**Макет:** split 45/55 (фото слева на desktop, сверху на mobile).

| Элемент | Реализация |
|---------|------------|
| Фото | Портрет с magenta-светом (предоставлен) — без ч/б, сохраняем цвет |
| Имя | `Ekaterina` — sans bold + `Shmidt` — крупнее, accent color |
| Био | Текст пользователя (EN) |
| Контакты | Instagram icon + @dj_shmidt, Email icon + katyshmidt01@mail.ru |
| CTA | `BOOKING` 🔗 · `PRESSBOOK` |

**BOOKING — модальное окно (ваше ТЗ):**
```
┌─────────────────────────────────┐
│  BOOKING                    [×] │
│─────────────────────────────────│
│  For bookings and inquiries:    │
│                                 │
│  📧 katyshmidt01@mail.ru        │
│     [ Copy email ] [ Open mail ]│
│                                 │
│  Include: date, venue, city,    │
│  set time, technical rider link│
└─────────────────────────────────┘
```
- `Open mail` → `mailto:katyshmidt01@mail.ru?subject=Booking%20Inquiry%20—%20Ekaterina%20Shmidt`
- Backdrop blur, закрытие Esc / click outside
- На мобиле — bottom sheet

**PRESSBOOK:** https://drive.google.com/drive/folders/1BTpAzhvlNU2HKWsj7E1EZQd4TdUc2IrX (new tab)

**Instagram:** https://www.instagram.com/dj_shmidt

**Био (копирайт):**
> Ekaterina Shmidt has been weaving stories through sound since 2013. Her sets move like landscapes — from the driving pulse of House music to the cinematic stillness of Downtempo and the deep relaxation of Chill Out. She doesn't just play tracks; she builds arcs, taking listeners from sunrise energy to late-night reflection.

---

#### Слайд 3 — MUSIC STYLE

**Отличие от референса:** не абзац, а **tag cloud / grid**.

Заголовок: `MUSIC STYLE`

Теги (pill chips, перенос строк):
`HOUSE` · `AFRO HOUSE` · `TROPICAL HOUSE` · `ORGANIC HOUSE` · `DOWNTEMPO` · `CHILL OUT` · `LOUNGE` · `AMBIENT` · `MELODIC TECHNO` · `EDM` · `INDIE DANCE` · `BOLLYWOOD` · `BOLLYTECH`

- Desktop: 4–5 колонок chips
- Hover: chip подсвечивается magenta glow
- Справа или фоном: фрагмент портрета / сцена (опционально)

*Исправление опечатки в ТЗ: AMBIENT, RELEASES.*

---

#### Слайд 4 — WORK EXPERIENCE

**Новая секция** (в референсе отсутствует) — ваше конкурентное преимущество.

Заголовок: `WORK EXPERIENCE`

**UI-паттерн:** вертикальный **timeline** (год слева, событие справа) на светлом фоне.

| Year | Event |
|------|-------|
| 2026 | Ozen Life Maadhoo, Maldives — Joy De Vivre bar *(resident DJ, 1 Apr – 1 Jul)* |
| 2025 | St. Regis, Stella rooftop, Riyadh, Saudi Arabia |
| 2025 | Ritz Carlton, Azziro, Riyadh, Saudi Arabia |
| 2025 | Ritz Carlton, Adrift Mare, Jeddah, Saudi Arabia |
| 2025 | Shangri-La, Kaia rooftop, Jeddah *(resident DJ, 1 Nov – 22 Dec)* |
| 2025 | BMW event, Jeddah *(21–22 Nov 2025)* |
| 2025 | Essence cosmetic, Jeddah *(29 Nov 2025)* |
| 2024 | Four Seasons, Aer rooftop, Mumbai, India |
| 2022–2023 | Maya Beach Club, Phuket, Thailand |
| 2020–2026 | Freelance work in India |

**Footer блока — Geography:**
`India · Russia · Saudi Arabia · Maldives · Thailand · Germany`

Визуал: тонкая линия timeline в цвете accent; для **resident** — badge `RESIDENT`.

---

#### Слайд 5 — RELEASES

**Макет:** как референс (тёмная секция), но 1–2 релиза с Beatport.

| Year | Title | Link |
|------|-------|------|
| 2025 | **Afro Kiss** | Beatport embed / card + внешняя ссылка |

URL: https://www.beatport.com/release/afro-kiss/5042392

**Карточка релиза:**
- Обложка с Beatport (oEmbed или static)
- Кнопки: `Listen on Beatport` · `Preview`
- Короткое описание (можно дописать позже)

Заголовок секции: `RELEASES` — typographic, 15vw, как у референса.

---

#### Слайд 6 — TECHNICAL RIDER

**Макет:** grain + light leak (magenta вместо orange референса).

Заголовок: `TECHNICAL RIDER`

Список (ваш текст, имя артиста):

- 2× Linked CDJ 3000/2000 NX2
- 1× DJM-900 V10/V6/NX2 Mixer (Updated Firmware)
- Large Studio Booth Monitors
- 50% Artist Fee at booking confirmation
- Balance 50% prior to event
- Cancelled event — 100% cancellation fee
- Flights booked in the name of **Miss Ekaterina Shmidt**
- Local Ground Transport (Airport – Hotel – Venue – Hotel – Airport)
- Minimum 4★ accommodation, late check-out (Double/Deluxe)
- Accommodation paid by promoter for full tour duration
- Artist F&B paid by promoter for full tour duration

**Дополнительно:** кнопка `Download PDF` (генерировать из того же контента).

---

## 3. Техническая реализация (рекомендация)

| Слой | Выбор |
|------|-------|
| Framework | **Angular 17+** standalone (по вашим правилам) |
| Стили | SCSS + CSS variables (токены выше) |
| Scroll | CSS `scroll-snap-type: y mandatory` + Intersection Observer для dots |
| Deploy | Firebase Hosting / Vercel |
| Assets | `/assets/logo.svg`, `/assets/hero-portrait.jpg` |
| SEO | title, description, og:image (портрет), json-ld MusicGroup |
| i18n | EN primary (контент уже EN); RU — фase 2 по желанию |

**Не используем Canva iframe** — делаем нативный код: быстрее, SEO, модалка booking, анимации.

---

## 4. Ассеты — чеклист

| Ассет | Источник | Статус |
|-------|----------|--------|
| Логотип SVG/PNG | [Google Drive](https://drive.google.com/drive/folders/1BTpAzhvlNU2HKWsj7E1EZQd4TdUc2IrX) | Скачать в `/assets` |
| Pressbook | Тот же Drive | Ссылка на слайде 2 |
| Портрет | Предоставлен (magenta) | ✅ в workspace |
| Фон slide 1 | Нужно: DJ/сцена или abstract | Запросить или stock |
| Beatport cover Afro Kiss | Beatport API / screenshot | При вёрстке slide 5 |
| Favicon | Из лого SHMIDT | Экспорт 32/180px |

---

## 5. Wireframe — полная страница

```
╔══════════════════════════════════════════════════════════════╗
║  SLIDE 1 · COVER · dark + magenta                            ║
╠══════════════════════════════════════════════════════════════╣
║  SLIDE 2 · ABOUT · dark · photo + bio + booking modal        ║
╠══════════════════════════════════════════════════════════════╣
║  SLIDE 3 · MUSIC STYLE · light · tag chips                   ║
╠══════════════════════════════════════════════════════════════╣
║  SLIDE 4 · WORK EXPERIENCE · light · timeline + geography    ║
╠══════════════════════════════════════════════════════════════╣
║  SLIDE 5 · RELEASES · dark · Afro Kiss / Beatport            ║
╠══════════════════════════════════════════════════════════════╣
║  SLIDE 6 · TECHNICAL RIDER · grain · bullets + download      ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 6. Следующий шаг

1. Скачать лого с Google Drive → `assets/logo.svg`
2. Сгенерировать Angular-проект с 6 slide-компонентами
3. Реализовать booking modal + pressbook link
4. Подключить реальные embed SoundCloud / YouTube / Beatport

---

*Документ подготовлен для согласования перед вёрсткой.*
