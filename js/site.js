/* ============ Кав'ярня «Зерно» — спільна логіка та анімації ============ */
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const page = document.body.dataset.page;

  /* ---------- Шапка й футер (спільні для всіх сторінок) ---------- */
  const links = [
    ['index', 'index.html', 'Головна'],
    ['menu', 'menu.html', 'Меню'],
    ['about', 'about.html', 'Про нас'],
    ['order', 'order.html', 'Замовлення'],
    ['contacts', 'contacts.html', 'Контакти'],
  ];
  const navItems = links
    .map(([id, href, label]) => `<li><a href="${href}"${id === page ? ' aria-current="page"' : ''}>${label}</a></li>`)
    .join('');

  document.body.insertAdjacentHTML('afterbegin', `
    <div class="announce" id="announce" hidden></div>
    <header class="site-header">
      <nav class="nav wrap" aria-label="Головна навігація">
        <a class="logo" href="index.html"><span class="logo-dot"></span>Зерно</a>
        <ul class="nav-links" id="nav-links">${navItems}</ul>
        <div class="nav-actions">
          <div class="account" id="account-slot"></div>
          <button class="burger" aria-label="Меню" aria-expanded="false" aria-controls="nav-links"><span></span><span></span></button>
        </div>
      </nav>
    </header>`);

  document.body.insertAdjacentHTML('beforeend', `
    <footer class="site-footer">
      <div class="wrap">
        <p class="footer-cta reveal">Зайдіть на каву —<br><a href="contacts.html">ми поруч →</a></p>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} Кав'ярня «Зерно»</span>
          <nav aria-label="Соцмережі">
            <a href="#">Instagram</a><a href="#">Facebook</a><a href="#">Telegram</a>
          </nav>
        </div>
      </div>
    </footer>
    <div class="toast" role="status" aria-live="polite"></div>
    <div class="curtain" aria-hidden="true"></div>
    <div class="cursor" aria-hidden="true"></div>`);

  const header = $('.site-header');
  const burger = $('.burger');

  burger.addEventListener('click', () => {
    const open = document.documentElement.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open);
  });

  const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Тост ---------- */
  const toastEl = $('.toast');
  let toastTimer;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-shown'), 2800);
  };

  /* ---------- Розбивка заголовків на слова ---------- */
  $$('.split').forEach((el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.append(' ');
            const w = document.createElement('span');
            w.className = 'w';
            w.innerHTML = `<span style="--i:${i++}"></span>`;
            w.firstChild.textContent = part;
            frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(el);
  });

  /* ---------- Поява під час скролу + лічильники ---------- */
  const countUp = (el) => {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) return (el.textContent = target + suffix);
    const start = performance.now();
    const dur = 1600;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 4))) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      if (e.target.dataset.count) countUp(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  // Спостерігати за новими елементами (у т. ч. доданими динамічно)
  const observe = (root = document) =>
    $$('.reveal:not(.is-in), .reveal-img:not(.is-in), .split:not(.is-in), [data-count]', root).forEach((el) => io.observe(el));
  observe();

  /* ---------- Біжучий рядок: дублюємо стрічку ---------- */
  $$('.marquee').forEach((m) => {
    const clone = $('.marquee-track', m).cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    m.append(clone);
  });

  /* ---------- Ефекти для миші (делегування — працює й для нових елементів) ---------- */
  if (finePointer && !reduceMotion) {
    const cursor = $('.cursor');
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    let curBtn = null, curCard = null;

    addEventListener('mousemove', (e) => {
      x = e.clientX; y = e.clientY;
      cursor.classList.add('is-active');

      // Магнітні кнопки
      const btn = e.target.closest('.btn');
      if (curBtn && curBtn !== btn) curBtn.style.transform = '';
      curBtn = btn;
      if (btn) {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
      }

      // 3D-нахил карток
      const card = e.target.closest('.card');
      if (curCard && curCard !== card) curCard.style.transform = '';
      curCard = card;
      if (card) {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg) translateY(-6px)`;
      }

      // Паралакс
      const mx = e.clientX / innerWidth - 0.5;
      const my = e.clientY / innerHeight - 0.5;
      $$('[data-parallax]').forEach((el) => {
        const k = +el.dataset.parallax;
        el.style.transform = `translate(${mx * k}px, ${my * k}px)`;
      });
    });
    document.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
    document.addEventListener('mouseover', (e) => {
      cursor.classList.toggle('is-hover', !!e.target.closest('a, button, .card, select, label'));
    });
    const loop = () => {
      cx += (x - cx) * 0.18; cy += (y - cy) * 0.18;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------- Перехід між сторінками (фолбек без View Transitions) ---------- */
  const hasCrossDocVT = 'PageRevealEvent' in window;
  if (!hasCrossDocVT && !reduceMotion) {
    const curtain = $('.curtain');
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || a.target || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname || url.hash) return;
      e.preventDefault();
      curtain.classList.add('is-leaving');
      setTimeout(() => (location.href = a.href), 420);
    });
    addEventListener('pageshow', () => curtain.classList.remove('is-leaving'));
  }

  /* ---------- Кошик ----------
     Зберігається в localStorage. Якщо користувач увійшов, js/app.js
     синхронізує його з Firestore (подія zerno:cart). */
  const STORE = 'zerno-order';
  const cart = {
    get() { try { return JSON.parse(localStorage.getItem(STORE)) || []; } catch { return []; } },
    set(items, { silent = false } = {}) {
      try { localStorage.setItem(STORE, JSON.stringify(items)); } catch { /* приватний режим */ }
      if (!silent) dispatchEvent(new CustomEvent('zerno:cart', { detail: items }));
      else dispatchEvent(new CustomEvent('zerno:cart-sync', { detail: items }));
    },
    add(item) { const items = cart.get(); items.push(item); cart.set(items); },
  };

  /* ---------- Зображення товару: шлях / URL / data-URL або емодзі ---------- */
  const isEmoji = (s) => !!s && s.length <= 8 && !/[\/.:]/.test(s);
  const thumbHTML = (src) => (isEmoji(src) ? `<span class="emoji">${src}</span>` : '<img alt="" loading="lazy">');
  const fillThumb = (el, src) => {
    el.innerHTML = src ? thumbHTML(src) : '<span class="emoji">☕</span>';
    const img = el.querySelector('img');
    if (img) img.src = src;
  };

  /* ---------- Сторінка «Меню»: фільтри ---------- */
  let applyFilter = () => {};
  if (page === 'menu') {
    const tabs = $$('.tab');
    const pill = $('.tab-pill');

    const movePill = (tab) => {
      if (!tab) return;
      pill.style.left = tab.offsetLeft + 'px';
      pill.style.top = tab.offsetTop + 'px';
      pill.style.width = tab.offsetWidth + 'px';
      pill.style.height = tab.offsetHeight + 'px';
    };

    applyFilter = () => {
      const tab = $('.tab[aria-selected="true"]');
      movePill(tab);
      const f = tab ? tab.dataset.filter : 'all';
      let n = 0;
      $$('.menu-item').forEach((it) => {
        const show = f === 'all' || it.dataset.cat === f;
        it.classList.toggle('is-hidden', !show);
        if (show) {
          it.classList.add('is-entering');
          const delay = n++ * 45;
          setTimeout(() => requestAnimationFrame(() => it.classList.remove('is-entering')), delay + 20);
        }
      });
      const empty = $('#menu-empty');
      if (empty) empty.hidden = n > 0;
    };

    tabs.forEach((t) => t.addEventListener('click', () => {
      tabs.forEach((x) => x.setAttribute('aria-selected', x === t));
      applyFilter();
    }));
    addEventListener('resize', () => movePill($('.tab[aria-selected="true"]')));
    document.fonts.ready.then(() => movePill($('.tab[aria-selected="true"]')));
    movePill(tabs[0]);

    // Делегування: працює і для товарів, завантажених із Firestore
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.menu-item .add');
      if (!btn) return;
      const it = btn.closest('.menu-item');
      cart.add({
        pid: it.dataset.pid || null,
        name: it.dataset.name,
        price: +it.dataset.price,
        image: it.dataset.thumb || it.dataset.img || '',
      });
      toast(`«${it.dataset.name}» додано до замовлення ☕`);
    });
  }

  /* ---------- Сторінка «Замовлення»: динамічний список ---------- */
  if (page === 'order') {
    const form = $('#order-form');
    const list = $('#order-list');
    const countEl = $('#item-count');
    const totalEl = $('#total-price');

    const bump = (el) => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); };

    const render = () => {
      const items = cart.get();
      list.innerHTML = '';
      if (!items.length) {
        list.innerHTML = '<div class="order-empty"><span class="cup">☕</span>Поки що порожньо — додайте щось смачне.</div>';
      }
      items.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'order-item';
        row.innerHTML = `
          <div class="order-thumb"></div>
          <h4></h4>
          <span class="price"></span>
          <button class="remove" aria-label="Видалити">✕</button>`;
        fillThumb(row.querySelector('.order-thumb'), item.image);
        row.querySelector('h4').textContent = item.name;
        row.querySelector('.price').textContent = `${item.price} грн`;
        row.querySelector('.remove').addEventListener('click', () => {
          row.classList.add('is-removing');
          setTimeout(() => {
            const next = cart.get();
            next.splice(index, 1);
            cart.set(next);
            render();
          }, reduceMotion ? 0 : 420);
        });
        list.append(row);
      });
      countEl.textContent = items.length;
      totalEl.textContent = items.reduce((s, i) => s + (+i.price || 0), 0);
      bump(countEl); bump(totalEl);
      dispatchEvent(new CustomEvent('zerno:order-render', { detail: items }));
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#item-name').value.trim();
      const price = parseFloat($('#item-price').value);
      if (!name || !(price >= 0)) return;
      cart.add({ pid: null, name, price, image: $('#item-image').value });
      render();
      form.reset();
      $('#item-name').focus();
    });

    $('#clear-order').addEventListener('click', () => {
      if (!cart.get().length) return;
      cart.set([]);
      render();
      toast('Замовлення очищено');
    });

    // Кошик оновився ззовні (вхід в акаунт, інший пристрій)
    addEventListener('zerno:cart-sync', render);
    render();
  }

  /* ---------- Години роботи: «відчинено / зачинено» ---------- */
  const hours = { week: ['08:00', '21:00'], weekend: ['09:00', '22:00'] };
  const toH = (s) => { const [h, m] = String(s).split(':').map(Number); return (h || 0) + (m || 0) / 60; };
  const updateOpenStatus = (h = hours) => {
    const status = $('#open-status');
    if (!status) return;
    const now = new Date();
    const cur = now.getHours() + now.getMinutes() / 60;
    const weekend = now.getDay() === 0 || now.getDay() === 6;
    const [from, to] = weekend ? h.weekend : h.week;
    const open = cur >= toH(from) && cur < toH(to);
    status.textContent = open ? `Зараз відчинено · до ${to}` : 'Зараз зачинено';
    status.style.setProperty('--c', open ? '#3a9a5b' : '#b23a2b');
  };

  if (page === 'contacts') {
    updateOpenStatus();
    $('#contact-form').addEventListener('submit', (e) => {
      e.preventDefault();
      e.target.reset();
      toast('Дякуємо! Ми відповімо найближчим часом.');
    });
  }

  /* ---------- API для js/app.js (Firebase) ---------- */
  window.Zerno = { $, $$, page, reduceMotion, toast, cart, observe, applyFilter, updateOpenStatus, isEmoji, fillThumb };
})();
