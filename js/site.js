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
    <header class="site-header">
      <nav class="nav wrap" aria-label="Головна навігація">
        <a class="logo" href="index.html"><span class="logo-dot"></span>Зерно</a>
        <ul class="nav-links" id="nav-links">${navItems}</ul>
        <button class="burger" aria-label="Меню" aria-expanded="false" aria-controls="nav-links"><span></span><span></span></button>
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
    toastTimer = setTimeout(() => toastEl.classList.remove('is-shown'), 2600);
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
        } else if (child.nodeName === 'BR') {
          /* залишаємо перенос */
        } else {
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

  $$('.reveal, .reveal-img, .split, [data-count]').forEach((el) => io.observe(el));

  /* ---------- Біжучий рядок: дублюємо стрічку ---------- */
  $$('.marquee').forEach((m) => {
    const track = $('.marquee-track', m);
    const clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    m.append(clone);
  });

  /* ---------- Ефекти для миші ---------- */
  if (finePointer && !reduceMotion) {
    // Курсор, що слідує
    const cursor = $('.cursor');
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; cursor.classList.add('is-active'); });
    document.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
    const loop = () => {
      cx += (x - cx) * 0.18; cy += (y - cy) * 0.18;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('mouseover', (e) => {
      cursor.classList.toggle('is-hover', !!e.target.closest('a, button, .card, select, label'));
    });

    // Магнітні кнопки
    $$('.btn').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${dx * 0.25}px, ${dy * 0.35}px)`;
      });
      btn.addEventListener('mouseleave', () => (btn.style.transform = ''));
    });

    // 3D-нахил карток
    $$('.card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg) translateY(-6px)`;
      });
      card.addEventListener('mouseleave', () => (card.style.transform = ''));
    });

    // Легкий паралакс для елементів з data-parallax
    const par = $$('[data-parallax]');
    if (par.length) {
      addEventListener('mousemove', (e) => {
        const mx = e.clientX / innerWidth - 0.5;
        const my = e.clientY / innerHeight - 0.5;
        par.forEach((el) => {
          const k = +el.dataset.parallax;
          el.style.transform = `translate(${mx * k}px, ${my * k}px)`;
        });
      });
    }
  }

  /* ---------- Перехід між сторінками (фолбек без View Transitions) ---------- */
  const hasCrossDocVT = 'PageRevealEvent' in window;
  if (!hasCrossDocVT && !reduceMotion) {
    const curtain = $('.curtain');
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname || !url.pathname.endsWith('.html')) return;
      e.preventDefault();
      curtain.classList.add('is-leaving');
      setTimeout(() => (location.href = a.href), 420);
    });
    addEventListener('pageshow', () => curtain.classList.remove('is-leaving'));
  }

  /* ---------- Кошик (спільний для меню та замовлення) ---------- */
  const STORE = 'zerno-order';
  const cart = {
    get() { try { return JSON.parse(localStorage.getItem(STORE)) || []; } catch { return []; } },
    set(items) { try { localStorage.setItem(STORE, JSON.stringify(items)); } catch { /* приватний режим */ } },
    add(item) { const items = cart.get(); items.push(item); cart.set(items); },
  };

  /* ---------- Сторінка «Меню»: фільтри ---------- */
  if (page === 'menu') {
    const tabs = $$('.tab');
    const pill = $('.tab-pill');
    const items = $$('.menu-item');

    const movePill = (tab) => {
      pill.style.left = tab.offsetLeft + 'px';
      pill.style.top = tab.offsetTop + 'px';
      pill.style.width = tab.offsetWidth + 'px';
      pill.style.height = tab.offsetHeight + 'px';
    };

    const select = (tab) => {
      tabs.forEach((t) => t.setAttribute('aria-selected', t === tab));
      movePill(tab);
      const f = tab.dataset.filter;
      let n = 0;
      items.forEach((it) => {
        const show = f === 'all' || it.dataset.cat === f;
        it.classList.toggle('is-hidden', !show);
        if (show) {
          it.classList.add('is-entering');
          const delay = n++ * 45;
          setTimeout(() => requestAnimationFrame(() => it.classList.remove('is-entering')), delay + 20);
        }
      });
    };

    tabs.forEach((t) => t.addEventListener('click', () => select(t)));
    addEventListener('resize', () => movePill($('.tab[aria-selected="true"]')));
    document.fonts.ready.then(() => movePill($('.tab[aria-selected="true"]')));
    movePill(tabs[0]);

    $$('.menu-item .add').forEach((btn) => {
      btn.addEventListener('click', () => {
        const it = btn.closest('.menu-item');
        cart.add({ name: it.dataset.name, price: +it.dataset.price, image: it.dataset.img });
        toast(`«${it.dataset.name}» додано до замовлення ☕`);
      });
    });
  }

  /* ---------- Сторінка «Замовлення»: динамічний список ---------- */
  if (page === 'order') {
    const form = $('#order-form');
    const list = $('#order-list');
    const countEl = $('#item-count');
    const totalEl = $('#total-price');
    let items = cart.get();

    const bump = (el) => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); };

    const render = () => {
      list.innerHTML = '';
      if (!items.length) {
        list.innerHTML = '<div class="order-empty"><span class="cup">☕</span>Поки що порожньо — додайте щось смачне.</div>';
      }
      items.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'order-item';
        row.innerHTML = `
          <img alt="">
          <h4></h4>
          <span class="price">${item.price} грн</span>
          <button class="remove" aria-label="Видалити">✕</button>`;
        row.querySelector('img').src = item.image;
        row.querySelector('h4').textContent = item.name;
        row.querySelector('.remove').addEventListener('click', () => {
          row.classList.add('is-removing');
          setTimeout(() => { items.splice(index, 1); save(); }, reduceMotion ? 0 : 420);
        });
        list.append(row);
      });
      countEl.textContent = items.length;
      totalEl.textContent = items.reduce((s, i) => s + i.price, 0);
      bump(countEl); bump(totalEl);
    };

    const save = () => { cart.set(items); render(); };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#item-name').value.trim();
      const price = parseFloat($('#item-price').value);
      if (!name || !(price >= 0)) return;
      items.push({ name, price, image: $('#item-image').value });
      save();
      form.reset();
      $('#item-name').focus();
    });

    $('#clear-order').addEventListener('click', () => {
      if (!items.length) return;
      items = [];
      save();
      toast('Замовлення очищено');
    });

    render();
  }

  /* ---------- Сторінка «Контакти» ---------- */
  if (page === 'contacts') {
    const status = $('#open-status');
    const now = new Date();
    const h = now.getHours() + now.getMinutes() / 60;
    const weekend = now.getDay() === 0 || now.getDay() === 6;
    const [from, to] = weekend ? [9, 22] : [8, 21];
    const open = h >= from && h < to;
    status.textContent = open ? `Зараз відчинено · до ${to}:00` : 'Зараз зачинено';
    if (!open) status.style.setProperty('--c', '#b23a2b');

    $('#contact-form').addEventListener('submit', (e) => {
      e.preventDefault();
      e.target.reset();
      toast('Дякуємо! Ми відповімо найближчим часом.');
    });
  }
})();
