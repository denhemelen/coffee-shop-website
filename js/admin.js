/* ============ Адмін-панель: товари, замовлення, налаштування, адміністратори ============ */
import {
  Z, db, state, onUser, esc, errText, CATEGORIES, SITE_PHOTOS, DEFAULT_PRODUCTS, DEFAULT_SETTINGS, sortProducts, isValidProduct, STATUS, fmtDate,
} from './app.js';
import { OWNER_EMAIL } from './firebase-config.js';
import {
  collection, doc, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, writeBatch, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

const root = Z.$('#admin-root');
let unsubs = [];
const stopAll = () => { unsubs.forEach((u) => u()); unsubs = []; };

onUser(({ user, isAdmin }) => {
  stopAll();
  if (!user) {
    root.innerHTML = `<div class="panel empty-panel"><span class="cup">🔒</span><h2>Потрібен вхід</h2>
      <p class="muted">Адмін-панель доступна лише адміністраторам.</p>
      <button class="btn" type="button" data-open-auth="login">Увійти <span class="arrow">→</span></button></div>`;
    return;
  }
  if (!isAdmin) {
    root.innerHTML = `<div class="panel empty-panel"><span class="cup">⛔</span><h2>Немає доступу</h2>
      <p class="muted">Акаунт ${esc(user.email)} не є адміністратором.${user.email === OWNER_EMAIL && !user.emailVerified ? ' Підтвердьте пошту — і доступ з’явиться.' : ''}</p>
      <a class="btn btn--ghost" href="index.html">На головну</a></div>`;
    return;
  }
  renderPanel();
});

/* ---------- Каркас із вкладками ---------- */
function renderPanel() {
  root.innerHTML = `
    <div class="tabs admin-tabs" role="tablist">
      <span class="tab-pill" aria-hidden="true"></span>
      <button class="tab" role="tab" aria-selected="true" data-tab="products">Товари</button>
      <button class="tab" role="tab" aria-selected="false" data-tab="orders">Замовлення <span class="count" data-new-count hidden></span></button>
      <button class="tab" role="tab" aria-selected="false" data-tab="settings">Налаштування</button>
      <button class="tab" role="tab" aria-selected="false" data-tab="admins">Адміністратори</button>
    </div>
    <section data-pane="products"></section>
    <section data-pane="orders" hidden></section>
    <section data-pane="settings" hidden></section>
    <section data-pane="admins" hidden></section>`;

  const pill = root.querySelector('.tab-pill');
  const move = (t) => Object.assign(pill.style, { left: t.offsetLeft + 'px', top: t.offsetTop + 'px', width: t.offsetWidth + 'px', height: t.offsetHeight + 'px' });
  const select = (name) => {
    root.querySelectorAll('.tab').forEach((t) => { t.setAttribute('aria-selected', t.dataset.tab === name); if (t.dataset.tab === name) move(t); });
    root.querySelectorAll('[data-pane]').forEach((p) => (p.hidden = p.dataset.pane !== name));
    history.replaceState(null, '', '#' + name);
  };
  root.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => select(t.dataset.tab)));
  addEventListener('resize', () => { const t = root.querySelector('.tab[aria-selected="true"]'); t && move(t); });

  productsPane(root.querySelector('[data-pane="products"]'));
  ordersPane(root.querySelector('[data-pane="orders"]'));
  settingsPane(root.querySelector('[data-pane="settings"]'));
  adminsPane(root.querySelector('[data-pane="admins"]'));

  const start = location.hash.slice(1);
  requestAnimationFrame(() => select(['products', 'orders', 'settings', 'admins'].includes(start) ? start : 'products'));
}

/* ================= ТОВАРИ ================= */
function productsPane(pane) {
  pane.innerHTML = `
    <div class="admin-bar">
      <div><h2 class="h3">Товари</h2><p class="muted small" data-summary></p></div>
      <div class="admin-bar-actions">
        <button class="btn btn--ghost" type="button" data-seed hidden>Імпортувати стандартне меню</button>
        <button class="btn" type="button" data-new>＋ Новий товар</button>
      </div>
    </div>
    <div class="admin-list" data-list><p class="muted">Завантаження…</p></div>
    <dialog class="modal modal--wide" data-editor></dialog>`;

  const list = pane.querySelector('[data-list]');
  const editor = pane.querySelector('[data-editor]');
  let products = [];

  unsubs.push(onSnapshot(collection(db, 'products'), (snap) => {
    products = sortProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    pane.querySelector('[data-seed]').hidden = products.some(isValidProduct);
    const hidden = products.filter((p) => p.available === false).length;
    pane.querySelector('[data-summary]').textContent = products.length
      ? `${products.length} позицій${hidden ? ` · ${hidden} приховано` : ''} · зміни одразу видно на сайті`
      : 'Поки порожньо. Сайт показує стандартне меню — імпортуйте його, щоб редагувати.';
    renderList();
  }, (e) => (list.innerHTML = `<p class="form-error">${esc(errText(e))}</p>`)));

  function renderList() {
    if (!products.length) { list.innerHTML = '<div class="order-empty"><span class="cup">📋</span>Товарів у базі ще немає.</div>'; return; }
    list.innerHTML = '';
    products.forEach((p) => {
      const row = document.createElement('div');
      row.className = 'admin-row' + (p.available === false ? ' is-off' : '');
      row.innerHTML = `
        <div class="thumb"></div>
        <div class="admin-row-main">
          <b></b>
          <span class="muted small">${isValidProduct(p) ? esc(CATEGORIES[p.category]) : '<span class="tag tag--off">старий тестовий запис — не показується на сайті, відредагуйте або видаліть</span>'}${p.featured ? ' · <span class="tag">на головній</span>' : ''}${p.available === false ? ' · <span class="tag tag--off">приховано</span>' : ''}</span>
        </div>
        <span class="price">${esc(p.price)} грн</span>
        <div class="row-actions">
          <button class="icon-btn" type="button" data-act="toggle" title="${p.available === false ? 'Показати на сайті' : 'Сховати з сайту'}">${p.available === false ? '👁‍🗨' : '👁'}</button>
          <button class="icon-btn" type="button" data-act="edit" title="Редагувати">✎</button>
          <button class="icon-btn danger" type="button" data-act="delete" title="Видалити">🗑</button>
        </div>`;
      Z.fillThumb(row.querySelector('.thumb'), p.thumb || p.image);
      row.querySelector('b').textContent = p.name;
      row.addEventListener('click', async (e) => {
        const act = e.target.closest('[data-act]')?.dataset.act;
        try {
          if (act === 'edit') openEditor(p);
          if (act === 'toggle') await updateDoc(doc(db, 'products', p.id), { available: p.available === false, updatedAt: serverTimestamp() });
          if (act === 'delete' && confirm(`Видалити «${p.name}»? Це не можна скасувати.`)) {
            await deleteDoc(doc(db, 'products', p.id));
            Z.toast('Товар видалено');
          }
        } catch (ex) { Z.toast(errText(ex)); }
      });
      list.append(row);
    });
  }

  pane.querySelector('[data-new]').addEventListener('click', () => openEditor(null));

  pane.querySelector('[data-seed]').addEventListener('click', async (e) => {
    e.target.disabled = true;
    try {
      const batch = writeBatch(db);
      DEFAULT_PRODUCTS.forEach((p) => batch.set(doc(collection(db, 'products')), { ...p, updatedAt: serverTimestamp() }));
      await batch.commit();
      Z.toast('Стандартне меню імпортовано — тепер його можна редагувати');
    } catch (ex) { Z.toast(errText(ex)); e.target.disabled = false; }
  });

  /* ----- Редактор товару ----- */
  function openEditor(p) {
    const isNew = !p;
    const data = p || { name: '', desc: '', price: '', category: 'classic', image: SITE_PHOTOS[0][0], thumb: SITE_PHOTOS[0][0], featured: false, available: true, sort: (products.at(-1)?.sort ?? 0) + 10 };
    const srcKind = Z.isEmoji(data.image) ? 'emoji'
      : data.image?.startsWith('data:') ? 'upload'
      : SITE_PHOTOS.some(([v]) => v === data.image) ? 'photo' : 'url';
    let image = data.image || '';
    let thumb = data.thumb || data.image || '';

    editor.innerHTML = `
      <button class="modal-close" type="button" aria-label="Закрити" data-close>✕</button>
      <h2>${isNew ? 'Новий товар' : 'Редагувати товар'}</h2>
      <form novalidate class="editor-grid">
        <div>
          <div class="field"><input id="p-name" placeholder=" " maxlength="80" required><label for="p-name">Назва</label></div>
          <div class="field"><input id="p-desc" placeholder=" " maxlength="120"><label for="p-desc">Короткий опис (об'єм, смак)</label></div>
          <div class="two">
            <div class="field"><input id="p-price" type="number" min="0" step="1" placeholder=" " required><label for="p-price">Ціна, грн</label></div>
            <div class="field"><select id="p-cat">${Object.entries(CATEGORIES).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select><label for="p-cat">Категорія</label></div>
          </div>
          <div class="field"><input id="p-sort" type="number" step="1" placeholder=" "><label for="p-sort">Порядок у списку (менше — вище)</label></div>
          <label class="check"><input type="checkbox" id="p-avail"> Показувати на сайті</label>
          <label class="check"><input type="checkbox" id="p-feat"> Показувати на головній («Три чашки…»)</label>
        </div>
        <div>
          <p class="label">Зображення</p>
          <div class="seg seg--small" data-src>
            <button type="button" data-k="photo">Фото сайту</button><button type="button" data-k="upload">Завантажити</button><button type="button" data-k="url">Посилання</button><button type="button" data-k="emoji">Емодзі</button>
          </div>
          <div data-k-pane="photo"><div class="field"><select id="p-photo">${SITE_PHOTOS.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select><label for="p-photo">Фото</label></div></div>
          <div data-k-pane="upload"><label class="file-drop"><input type="file" id="p-file" accept="image/*"><span>Оберіть файл (JPG, PNG, WebP) — його буде стиснуто</span></label></div>
          <div data-k-pane="url"><div class="field"><input id="p-url" type="url" placeholder=" "><label for="p-url">https://…/photo.jpg</label></div></div>
          <div data-k-pane="emoji"><div class="field"><input id="p-emoji" maxlength="8" placeholder=" "><label for="p-emoji">Емодзі, напр. 🍰</label></div></div>
          <div class="preview"><div class="preview-img"></div></div>
        </div>
        <div class="editor-foot">
          <p class="form-error" role="alert"></p>
          <button class="btn btn--ghost" type="button" data-close>Скасувати</button>
          <button class="btn" type="submit">${isNew ? 'Додати товар' : 'Зберегти'} <span class="arrow">→</span></button>
        </div>
      </form>`;

    const $e = (s) => editor.querySelector(s);
    $e('#p-name').value = data.name;
    $e('#p-desc').value = data.desc || '';
    $e('#p-price').value = data.price;
    $e('#p-cat').value = data.category || 'classic';
    $e('#p-sort').value = data.sort ?? '';
    $e('#p-avail').checked = data.available !== false;
    $e('#p-feat').checked = !!data.featured;
    if (srcKind === 'photo') $e('#p-photo').value = image;
    if (srcKind === 'url') $e('#p-url').value = image;
    if (srcKind === 'emoji') $e('#p-emoji').value = image;

    const preview = () => {
      const box = $e('.preview-img');
      if (Z.isEmoji(image)) box.innerHTML = `<span class="emoji emoji--big">${esc(image)}</span>`;
      else if (image) { box.innerHTML = '<img alt="Попередній перегляд">'; box.querySelector('img').src = image; }
      else box.innerHTML = '<span class="muted small">Немає зображення</span>';
    };
    const setKind = (k) => {
      editor.querySelectorAll('[data-src] button').forEach((b) => b.classList.toggle('is-on', b.dataset.k === k));
      editor.querySelectorAll('[data-k-pane]').forEach((x) => (x.hidden = x.dataset.kPane !== k));
      if (k === 'photo') { image = thumb = $e('#p-photo').value; }
      if (k === 'url') { image = thumb = $e('#p-url').value.trim(); }
      if (k === 'emoji') { image = thumb = $e('#p-emoji').value.trim(); }
      preview();
    };
    editor.querySelector('[data-src]').addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) setKind(b.dataset.k); });
    $e('#p-photo').addEventListener('change', () => setKind('photo'));
    $e('#p-url').addEventListener('input', () => setKind('url'));
    $e('#p-emoji').addEventListener('input', () => setKind('emoji'));
    $e('#p-file').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        image = await shrink(file, 640, 0.8, 250000);
        thumb = await shrink(file, 128, 0.7, 15000);
        preview();
      } catch { Z.toast('Не вдалося прочитати зображення'); }
    });
    setKind(srcKind);

    editor.addEventListener('click', (e) => { if (e.target === editor || e.target.closest('[data-close]')) editor.close(); });
    $e('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = $e('.form-error');
      err.textContent = '';
      const name = $e('#p-name').value.trim();
      const price = Number($e('#p-price').value);
      if (!name) return (err.textContent = 'Вкажіть назву.');
      if (!(price >= 0) || $e('#p-price').value === '') return (err.textContent = 'Вкажіть ціну.');
      const payload = {
        name, price,
        desc: $e('#p-desc').value.trim(),
        category: $e('#p-cat').value,
        sort: Number($e('#p-sort').value) || 0,
        available: $e('#p-avail').checked,
        featured: $e('#p-feat').checked,
        image, thumb,
        updatedAt: serverTimestamp(),
      };
      const btn = $e('button[type=submit]');
      btn.disabled = true;
      try {
        if (isNew) await addDoc(collection(db, 'products'), payload);
        else await setDoc(doc(db, 'products', p.id), payload);
        editor.close();
        Z.toast(isNew ? 'Товар додано' : 'Зміни збережено');
      } catch (ex) { err.textContent = errText(ex); }
      finally { btn.disabled = false; }
    });
    editor.showModal();
    setTimeout(() => $e('#p-name').focus(), 50);
  }
}

/* Стискає зображення до maxPx і повертає JPEG data-URL, що вміщується в limit символів */
async function shrink(file, maxPx, quality, limit) {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, maxPx / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  let q = quality;
  let url = c.toDataURL('image/jpeg', q);
  while (url.length > limit && q > 0.3) { q -= 0.1; url = c.toDataURL('image/jpeg', q); }
  if (url.length > limit) throw new Error('too big');
  return url;
}

/* ================= ЗАМОВЛЕННЯ ================= */
function ordersPane(pane) {
  pane.innerHTML = `
    <div class="admin-bar">
      <div><h2 class="h3">Замовлення</h2><p class="muted small">Оновлюються в реальному часі.</p></div>
      <div class="field field--inline"><select id="o-filter"><option value="active">Активні</option><option value="all">Усі</option>${Object.entries(STATUS).map(([v, [l]]) => `<option value="${v}">${l}</option>`).join('')}</select><label for="o-filter">Показати</label></div>
    </div>
    <div class="orders orders--admin" data-list><p class="muted">Завантаження…</p></div>`;

  const list = pane.querySelector('[data-list]');
  const filter = pane.querySelector('#o-filter');
  let orders = [];

  unsubs.push(onSnapshot(collection(db, 'orders'), (snap) => {
    orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds ?? Infinity) - (a.createdAt?.seconds ?? Infinity));
    const n = orders.filter((o) => o.status === 'new').length;
    const badge = root.querySelector('[data-new-count]');
    if (badge) { badge.textContent = n; badge.hidden = !n; }
    render();
  }, (e) => (list.innerHTML = `<p class="form-error">${esc(errText(e))}</p>`)));

  filter.addEventListener('change', render);

  function render() {
    const f = filter.value;
    const shown = orders.filter((o) => f === 'all' || (f === 'active' ? ['new', 'preparing', 'ready'].includes(o.status) : o.status === f));
    if (!shown.length) { list.innerHTML = '<div class="order-empty"><span class="cup">🧾</span>Тут поки порожньо.</div>'; return; }
    list.innerHTML = shown.map((o) => `
      <article class="order-card" data-id="${esc(o.id)}">
        <header><b>№${esc(o.id.slice(0, 6).toUpperCase())}</b>
          <select class="status-select" aria-label="Статус">${Object.entries(STATUS).map(([v, [l]]) => `<option value="${v}"${v === o.status ? ' selected' : ''}>${l}</option>`).join('')}</select>
        </header>
        <p class="muted small">${esc(fmtDate(o.createdAt))} · ${esc(o.email || '')}</p>
        <ul class="order-lines">${(o.items || []).map((i) => `<li><span>${esc(i.name)}</span><span>${esc(i.price)} грн</span></li>`).join('')}</ul>
        ${o.note ? `<p class="small">💬 ${esc(o.note)}</p>` : ''}
        <footer><button class="link-btn danger" type="button" data-del>Видалити</button><b>${esc(o.total)} грн</b></footer>
      </article>`).join('');
  }

  list.addEventListener('change', async (e) => {
    const sel = e.target.closest('.status-select');
    if (!sel) return;
    const id = sel.closest('[data-id]').dataset.id;
    try { await updateDoc(doc(db, 'orders', id), { status: sel.value, updatedAt: serverTimestamp() }); Z.toast('Статус оновлено'); }
    catch (ex) { Z.toast(errText(ex)); }
  });
  list.addEventListener('click', async (e) => {
    if (!e.target.closest('[data-del]')) return;
    const id = e.target.closest('[data-id]').dataset.id;
    if (!confirm('Видалити це замовлення назавжди?')) return;
    try { await deleteDoc(doc(db, 'orders', id)); Z.toast('Замовлення видалено'); } catch (ex) { Z.toast(errText(ex)); }
  });
}

/* ================= НАЛАШТУВАННЯ САЙТУ ================= */
function settingsPane(pane) {
  const f = (id, label, type = 'text') => `<div class="field"><input id="${id}" type="${type}" placeholder=" "><label for="${id}">${label}</label></div>`;
  pane.innerHTML = `
    <div class="admin-bar"><div><h2 class="h3">Налаштування сайту</h2><p class="muted small">Зміни застосовуються на всіх сторінках одразу після збереження.</p></div></div>
    <form class="panel settings-grid" novalidate>
      <div class="span-2">
        <p class="label">Оголошення вгорі сайту</p>
        <div class="field"><input id="s-announcement" placeholder=" " maxlength="160"><label for="s-announcement">Напр. «−20% на лате до неділі» (порожньо — сховати)</label></div>
      </div>
      <div><p class="label">Контакти</p>${f('s-address', 'Адреса')}${f('s-phone', 'Телефон', 'tel')}${f('s-email', 'Email', 'email')}</div>
      <div><p class="label">Години роботи</p>
        <div class="two">${f('s-weekFrom', 'Пн–Пт з', 'time')}${f('s-weekTo', 'Пн–Пт до', 'time')}</div>
        <div class="two">${f('s-weekendFrom', 'Сб–Нд з', 'time')}${f('s-weekendTo', 'Сб–Нд до', 'time')}</div>
      </div>
      <div class="span-2 editor-foot"><p class="form-error" role="alert"></p><button class="btn" type="submit">Зберегти налаштування <span class="arrow">→</span></button></div>
    </form>`;
  const form = pane.querySelector('form');
  const keys = Object.keys(DEFAULT_SETTINGS);
  getDoc(doc(db, 'settings', 'site')).then((s) => {
    const data = { ...DEFAULT_SETTINGS, ...(s.exists() ? s.data() : {}) };
    keys.forEach((k) => { const el = form.querySelector('#s-' + k); if (el) el.value = data[k] ?? ''; });
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {};
    keys.forEach((k) => (payload[k] = form.querySelector('#s-' + k).value.trim()));
    payload.updatedAt = serverTimestamp();
    try { await setDoc(doc(db, 'settings', 'site'), payload, { merge: true }); Z.toast('Налаштування збережено'); }
    catch (ex) { form.querySelector('.form-error').textContent = errText(ex); }
  });
}

/* ================= АДМІНІСТРАТОРИ ================= */
function adminsPane(pane) {
  pane.innerHTML = `
    <div class="admin-bar"><div><h2 class="h3">Адміністратори</h2><p class="muted small">Адмін може змінювати товари, ціни, налаштування й бачити всі замовлення.</p></div></div>
    <div class="admin-list" data-list></div>
    <form class="panel add-admin" novalidate>
      <p class="label">Додати адміністратора</p>
      <p class="muted small">Людина спершу має зареєструватися на сайті.</p>
      <div class="add-admin-row">
        <div class="field"><input id="a-email" type="email" placeholder=" "><label for="a-email">Email користувача</label></div>
        <button class="btn" type="submit">Додати <span class="arrow">→</span></button>
      </div>
      <p class="form-error" role="alert"></p>
    </form>`;

  const list = pane.querySelector('[data-list]');
  unsubs.push(onSnapshot(collection(db, 'admins'), (snap) => {
    const rows = [`<div class="admin-row"><div class="thumb"><span class="emoji">👑</span></div><div class="admin-row-main"><b>${esc(OWNER_EMAIL)}</b><span class="muted small">Власник — права закріплені в правилах безпеки</span></div></div>`];
    snap.docs.filter((d) => d.data().email !== OWNER_EMAIL).forEach((d) => rows.push(`
      <div class="admin-row" data-uid="${esc(d.id)}"><div class="thumb"><span class="emoji">🛠</span></div>
        <div class="admin-row-main"><b>${esc(d.data().email || d.id)}</b><span class="muted small">Додано ${esc(fmtDate(d.data().addedAt))}</span></div>
        <div class="row-actions"><button class="icon-btn danger" type="button" data-remove title="Забрати права">✕</button></div></div>`));
    list.innerHTML = rows.join('');
  }, (e) => (list.innerHTML = `<p class="form-error">${esc(errText(e))}</p>`)));

  list.addEventListener('click', async (e) => {
    const row = e.target.closest('[data-remove]')?.closest('[data-uid]');
    if (!row) return;
    if (row.dataset.uid === state.user.uid && !confirm('Ви забираєте права адміністратора в самого себе. Продовжити?')) return;
    if (row.dataset.uid !== state.user.uid && !confirm('Забрати права адміністратора?')) return;
    try { await deleteDoc(doc(db, 'admins', row.dataset.uid)); Z.toast('Права забрано'); } catch (ex) { Z.toast(errText(ex)); }
  });

  const form = pane.querySelector('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = form.querySelector('.form-error');
    err.textContent = '';
    const email = form.querySelector('#a-email').value.trim().toLowerCase();
    if (!email) return (err.textContent = 'Вкажіть email.');
    try {
      const found = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
      if (found.empty) return (err.textContent = 'Користувача з такою поштою не знайдено. Попросіть його зареєструватися й увійти на сайт.');
      const uid = found.docs[0].id;
      await setDoc(doc(db, 'admins', uid), { email, addedAt: serverTimestamp(), addedBy: state.user.email });
      form.reset();
      Z.toast(`${email} тепер адміністратор`);
    } catch (ex) { err.textContent = errText(ex); }
  });
}
