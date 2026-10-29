(function (root) {
  'use strict';
  const BASE = 'https://github.com/';
  const SHARED = BASE + 'psichopodobny/psichopodobny-and-uikole';
  const SOURCE = BASE + 'psichopodobny/psichopodobny/tree/main/profile-theme';
  function createView({document: doc, asset, route, preferences, onPreference, onExit, profileLogin}) {
    const cleanups = [];
    const nativeItems = new Set();
    let nativeObserver;
    function el(tag, attrs = {}, ...children) {
      const node = doc.createElement(tag);
      for (const [key, value] of Object.entries(attrs)) {
        if (key === 'class') node.className = value;
        else node.setAttribute(key, value);
      }
      for (const child of children.flat(Infinity)) {
        if (child == null) continue;
        node.append(typeof child === 'string' ? doc.createTextNode(child) : child);
      }
      return node;
    }
    const link = (text, href, cls = '') => el('a', {href, class: cls}, text);
    const tag = text => el('span', {class: 'tag'}, text);
    const label = text => el('p', {class: 'eyebrow'}, text);
    const title = (id, num, text) => el('div', {class: 'section-title'}, label(num), el('h2', {id}, text));
    const section = (id, num, name, ...children) => el('section', {class: 'section reveal', 'aria-labelledby': id}, title(id, num, name), ...children);
    const button = (text, action, attrs = {}) => {
      const node = el('button', {type: 'button', ...attrs}, text);
      node.addEventListener('click', action);
      return node;
    };
    const toggle = (key, text) => button(text, () => onPreference(key, !preferences[key]), {
      class: 'control', 'aria-pressed': String(preferences[key]), 'data-pref': key
    });
    const native = route === 'profile';
    const frame = el('div', {class: 'winter-view' + (native ? ' native-view' : ''), 'data-motion': String(preferences.motion), 'data-snow': String(preferences.snow)});
    const backgroundImage = el('img', {alt: '', class: 'forest'});
    const backdrop = el('div', {class: 'backdrop', 'aria-hidden': 'true'},
      backgroundImage,
      el('div', {class: 'veil'}), el('div', {class: 'fog'}), el('div', {class: 'cursor-light'}));
    frame.append(backdrop);
    const snow = el('div', {class: 'snow', 'aria-hidden': 'true'});
    for (let i = 0; i < 38; i++) {
      snow.append(el('i', {style: `--x:${(i * 37.27) % 100}%;--duration:${15 + i % 9}s;--delay:-${i * 1.13}s;--size:${1 + i % 3}px;--drift:${(i % 7 - 3) * 9}px`}));
    }
    frame.append(snow);
    const chrome = el('div', {class: 'topbar'},
      link(native ? 'Winter Profile' : 'p / winter', BASE + 'psichopodobny', 'wordmark'),
      native ? el('nav', {'aria-label': 'Разделы профиля'}, link('Обзор', BASE + profileLogin), link('Репозитории', BASE + profileLogin + '?tab=repositories')) : el('nav', {'aria-label': 'Разделы'}, link('Проекты', '#pc-projects'), link('Направления', '#pc-work'), link('Мы', '#pc-team')),
      el('div', {class: 'controls'}, toggle('motion', 'Движение'), toggle('snow', 'Снег'), button('Обычный GitHub ↗', onExit, {class: 'control exit'})));
    frame.append(chrome);
    if (native) {
      update(preferences);
      return {element:frame,update,activate,destroy,refreshNative};
    }
    const stack = el('div', {class: 'tags'}, ['C#', 'C++', 'Rust', 'Python'].map(tag));
    const identity = el('aside', {class: 'identity', 'aria-label': 'О профиле'},
      el('div', {class: 'portrait-ring'}, el('div', {class: 'portrait'}, el('img', {src: asset(route === 'duo' ? 'media/profile-avatar.png' : 'media/arima-tie.png'), width: route === 'duo' ? '460' : '1080', height: route === 'duo' ? '460' : '1080', alt: route === 'duo' ? 'Аватар psichopodobny' : 'Арима Кишо в очках и галстуке'}))),
      el('h1', {}, 'psichopodobny'),
      el('p', {class: 'identity-role'}, 'Разработчик / 16 лет'),
      el('p', {class: 'identity-copy'}, 'Игровой софт, автоматизация и реверс-инжиниринг.'),
      stack,
      el('div', {class: 'identity-links'}, link('Репозитории ↗', BASE + 'psichopodobny?tab=repositories'), link('Вместе с uikole ↗', SHARED)),
      el('p', {class: 'rail-note'}, 'OSINT / GEOINT / HUMINT'));
    const words = route === 'duo' ? ['psichopodobny', '& uikole'] : ['psichopodobny'];
    const heading = el('h2', {class: 'hero-title', 'aria-label': words.join(' ')});
    words.forEach((word, index) => {
      const line = el('span', {class: 'title-line', 'aria-hidden': 'true'});
      Array.from(word).forEach((char, i) => line.append(el('span', {class: 'letter', style: `--i:${i + index * 5}`}, char === ' ' ? '\u00a0' : char)));
      heading.append(line);
    });
    const hero = el('header', {class: 'hero'}, label(route === 'duo' ? 'СОВМЕСТНАЯ РАЗРАБОТКА' : 'ЛИЧНЫЙ ПРОФИЛЬ'), heading,
      el('p', {class: 'hero-copy'}, route === 'duo' ? 'Два разработчика. Общие проекты.' : 'Софт под свои задачи.'),
      el('p', {class: 'hero-detail'}, route === 'duo'
        ? 'Игровые инструменты, автоматизация, сайты и серверы. От задачи до рабочего проекта.'
        : 'Пишу игровой софт и утилиты. Разбираюсь в устройстве программ, автоматизирую рутину и собираю собственные инструменты.'),
      el('div', {class: 'hero-actions'}, link('Смотреть проекты ↓', '#pc-projects', 'primary'), link(route === 'duo' ? 'Профиль uikole ↗' : 'psichopodobny and uikole ↗', route === 'duo' ? BASE + 'uikoll' : SHARED, 'text-link')),
      el('div', {class: 'hero-rule', 'aria-hidden': 'true'}));
    const stage = el('div', {class: 'stage'}, hero);
    if (route === 'duo') stage.append(duoCard());
    function duoCard() {
      const half = (name, image, text, extra) => el('div', {class: 'duo-half ' + extra},
        el('div', {class: 'duo-art'}, el('img', {src: asset(image), alt: name === 'uikole' ? 'K-ON! в оригинальных цветах' : 'Арима Кишо', loading: 'lazy'})),
        el('div', {class: 'duo-caption'}, el('h3', {}, name), el('p', {}, text)));
      return el('div', {class: 'duo-card reveal'},
        half('psichopodobny', 'media/arima-tie.png', 'SOFTWARE / REVERSE / GEOINT', 'psicho-half'),
        half('uikole', 'media/k-on-original.jpg', 'SOFTWARE / AUTOMATION / OSINT', 'uiko-half'));
    }
    const projects = [
      ['01', 'Vortex-client', 'Клиентский проект с закрытыми исходниками.', ['PRIVATE'], null],
      ['02', 'konspektik', 'Органайзер для учёбы: расписание, конспекты, формулы и заметки. Работает офлайн, устанавливается на Android как PWA.', ['PRIVATE', 'PWA', 'JavaScript'], null],
      ['03', 'Probivochka / Fusion OSINT', 'Сбор и сопоставление открытой информации, граф связей и отчёты по результатам исследования.', ['PRIVATE', 'Python', 'OSINT'], null],
      ['04', 'DeadCode', 'Чит для Rust. Приватная разработка.', ['PRIVATE', 'Rust game'], null],
      ['05', 'Stealer', 'Утилита для скрытия от проверок на Majestic. Исходники закрыты.', ['PRIVATE', 'Majestic'], null],
      ['06', 'Winter Profile', 'Оформление любого личного GitHub-профиля: свой фон, цвет, шрифт, снег и анимация.', ['PUBLIC', 'JavaScript', 'CSS'], SOURCE]
    ];
    const projectGrid = el('div', {class: 'project-grid'}, projects.map(([num, name, description, tags, href]) => el('article', {class: 'project-card'},
      el('div', {class: 'card-top'}, label(num), el('span', {'aria-hidden': 'true'}, href ? '↗' : '•')),
      el('h3', {}, href ? link(name, href) : name), el('p', {}, description), el('div', {class: 'tags'}, tags.map(tag)))));
    stage.append(section('pc-projects', '01 / SELECTED', 'Проекты', projectGrid));
    const workRows = [
      ['Разработка', 'Читы и игровые инструменты для Minecraft и Rust. Прикладные утилиты, сайты, серверы и окружение для сервисов.'],
      ['Реверс-инжиниринг', 'Анализ бинарей и .NET-сборок, отладка, исследование памяти и логики программ. Это моё отдельное направление.'],
      ['Автоматизация', 'Обработка данных и файлов, скрипты для повторяющихся действий. Меньше ручной работы, больше контроля над результатом.'],
      ['OSINT / GEOINT / HUMINT', 'Поиск и проверка информации, работа с источниками и геопространственными данными. Сопоставление сведений и их контекста.']
    ];
    stage.append(section('pc-work', '02 / FOCUS', 'Направления', el('div', {class: 'work-list'}, workRows.map(([name, text], i) => el('article', {class: 'work-row'}, label('0' + (i + 1)), el('h3', {}, name), el('p', {}, text))))));
    const tools = [
      ['Ghidra', 'Анализ бинарей', 'https://github.com/NationalSecurityAgency/ghidra'],
      ['x64dbg', 'Отладка x86 / x64', 'https://x64dbg.com/'],
      ['dnSpyEx', '.NET и C#', 'https://github.com/dnSpyEx/dnSpy'],
      ['ILSpy', 'Декомпиляция .NET', 'https://github.com/icsharpcode/ILSpy'],
      ['ImHex', 'Бинарные данные', 'https://github.com/WerWolv/ImHex'],
      ['ReClass.NET', 'Структуры в памяти', 'https://github.com/ReClassNET/ReClass.NET']
    ];
    stage.append(section('pc-tools', '03 / TOOLBOX', 'Инструменты', el('div', {class: 'tool-grid'}, tools.map(([name, text, href]) => el('a', {class: 'tool', href}, el('strong', {}, name), el('span', {}, text), el('i', {'aria-hidden': 'true'}, '↗'))))));
    const team = el('div', {class: 'team-copy'}, label('ПАРТНЁР ПО РАЗРАБОТКЕ'),
      el('h3', {}, link('uikole ↗', BASE + 'uikoll')),
      el('p', {}, '16 лет. C#, C++, Rust и Python. Игровой софт, автоматизация, сайты, настройка серверов и OSINT / HUMINT.'),
      el('p', {}, 'Работаем над общими задачами и собственными проектами. Реверс-инжиниринг и GEOINT веду со своей стороны.'),
      link('Наша общая страница ↗', SHARED, 'text-link'));
    stage.append(section('pc-team', '04 / TOGETHER', 'Совместная работа', team));
    stage.append(el('footer', {class: 'footer'}, link('psichopodobny', BASE + 'psichopodobny'), el('span', {}, 'Winter Profile Studio / 1.3 preview'), link('Исходники ↗', SOURCE)));
    frame.append(el('div', {class: 'layout ' + (route === 'duo' ? 'layout-duo' : '')}, identity, stage));
    function update(next) {
      preferences = next;
      frame.dataset.motion = String(next.motion);
      frame.dataset.snow = String(next.snow);
      frame.dataset.background = next.background;
      frame.style.setProperty('--accent',next.accent);
      frame.style.setProperty('--profile-font',root.PCWinterOptions.fonts[next.font]);
      frame.style.setProperty('--pc-secondary',next.secondary);
      frame.style.setProperty('--pc-dim',String(next.dim/100));
      frame.style.setProperty('--pc-blur',next.blur+'px');
      const background = next.background === 'custom' && next.customBackground ? next.customBackground : asset(next.background === 'lake' ? 'media/winter-lake.png' : 'media/winter-forest.png');
      if (backgroundImage.getAttribute('src') !== background) backgroundImage.setAttribute('src',background);
      frame.querySelectorAll('[data-pref]').forEach(node => node.setAttribute('aria-pressed', String(next[node.dataset.pref])));
    }
    function refreshNative(main) {
      if (!native || !nativeObserver) return;
      main.querySelectorAll('.pinned-item-list-item, article.markdown-body h1, article.markdown-body h2, article.markdown-body h3').forEach(node => {
        if (nativeItems.has(node)) return;
        nativeItems.add(node); node.classList.add('pc-native-reveal'); nativeObserver.observe(node);
      });
    }
    function destroy() { cleanups.splice(0).forEach(fn => fn()); }
    function activate(win, main) {
      if (native && win.IntersectionObserver) {
        nativeObserver = new win.IntersectionObserver(entries => entries.forEach(entry => {
          if (entry.isIntersecting) {entry.target.classList.add('pc-native-visible');nativeObserver.unobserve(entry.target);}
        }), {threshold:.03});
        refreshNative(main);
        cleanups.push(() => {nativeObserver.disconnect();nativeItems.forEach(node => node.classList.remove('pc-native-reveal','pc-native-visible'));});
      }
      let scrollFrame = 0;
      const offset = () => {
        scrollFrame = 0;
        frame.style.setProperty('--background-top', Math.max(0, frame.getBoundingClientRect().top) + 'px');
      };
      const scroll = () => { if (!scrollFrame) scrollFrame = win.requestAnimationFrame(offset); };
      offset();
      win.addEventListener('scroll', scroll, {passive: true});
      win.addEventListener('resize', scroll, {passive: true});
      cleanups.push(() => {
        if (scrollFrame) win.cancelAnimationFrame(scrollFrame);
        win.removeEventListener('scroll', scroll);
        win.removeEventListener('resize', scroll);
      });
      let observer;
      const reveal = [...frame.querySelectorAll('.reveal')];
      if (win.IntersectionObserver) {
        frame.classList.add('reveal-ready');
        observer = new win.IntersectionObserver(entries => entries.forEach(entry => {
          if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
        }), {threshold: 0.08});
        reveal.forEach(node => observer.observe(node));
        cleanups.push(() => observer.disconnect());
      }
      let raf = 0, x = 0, y = 0, active = true;
      const draw = () => {
        raf = 0;
        if (!active) return;
        frame.style.setProperty('--cursor-x', (x * 100).toFixed(1) + '%');
        frame.style.setProperty('--cursor-y', (y * 100).toFixed(1) + '%');
        frame.style.setProperty('--parallax-x', ((x - 0.5) * 14).toFixed(2) + 'px');
        frame.style.setProperty('--parallax-y', ((y - 0.5) * 10).toFixed(2) + 'px');
      };
      const pointer = event => {
        if (!preferences.motion || event.pointerType === 'touch') return;
        x = event.clientX / win.innerWidth; y = event.clientY / win.innerHeight;
        if (!raf) raf = win.requestAnimationFrame(draw);
      };
      win.addEventListener('pointermove', pointer, {passive: true});
      const anchors = event => {
        const a = event.target.closest('a[href^="#pc-"]');
        if (!a) return;
        const target = frame.querySelector(a.getAttribute('href'));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({behavior: preferences.motion ? 'smooth' : 'auto', block: 'start'});
      };
      frame.addEventListener('click', anchors);
      cleanups.push(() => {
        active = false;
        if (raf) win.cancelAnimationFrame(raf);
        win.removeEventListener('pointermove', pointer);
        frame.removeEventListener('click', anchors);
      });
    }
    update(preferences);
    return {element: frame, update, activate, destroy, refreshNative};
  }
  root.PCWinterView = {createView};
  if (typeof module !== 'undefined') module.exports = {createView};
})(globalThis);
