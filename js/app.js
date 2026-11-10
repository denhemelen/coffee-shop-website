/* ============ Кав'ярня «Зерно» — Firebase: акаунти, кошик, товари, налаштування ============
   Підключається на всіх сторінках ПІСЛЯ js/site.js:  <script type="module" src="js/app.js"></script>
   Сайт працює і без входу: акаунт потрібен лише для збереження кошика й оформлення замовлень. */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  sendEmailVerification, sendPasswordResetEmail, multiFactor, getMultiFactorResolver,
  TotpMultiFactorGenerator, EmailAuthProvider, reauthenticateWithCredential,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, onSnapshot, collection, getDocs, addDoc, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { firebaseConfig, OWNER_EMAIL } from './firebase-config.js';

export const Z = window.Zerno;
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
auth.languageCode = 'uk';
export const db = getFirestore(app);

export const CART_MAX = 60;
export const CATEGORIES = { classic: 'Класика', alt: 'Альтернатива', sweet: 'Десерти' };
const F1 = 'foto/папка для файла index.html/';
const F2 = 'foto/кава до файла lesson.html/';
export const SITE_PHOTOS = [
  [F1 + 'еспрессо.jpg', 'Еспресо (біла чашка)'],
  [F1 + 'капучіно.jpg', 'Капучино з серцем'],
  [F1 + 'латте.jpg', 'Лате у склянці'],
  [F1 + 'латте норм.jpg', 'Два лате'],
  [F1 + 'еспрессо норм.jpg', 'Кава на зернах'],
  [F1 + 'фон.webp', "Інтер'єр кав'ярні"],
  [F2 + 'coffee-brain-caffeine-neuroscincces.webp', 'Капучино крупним планом'],
  [F2 + 'Everything_you_need_to_know_about_decaf_coffee.webp', 'Чашка на мішковині'],
  [F2 + 'кафа.jpg', 'Чашка на зернах'],
];
export const DEFAULT_PRODUCTS = [
  { name: 'Еспресо', desc: '30 мл · какао, карамель', price: 45, category: 'classic', image: F1 + 'еспрессо.jpg', featured: true },
  { name: 'Капучино', desc: '250 мл · оксамитова піна', price: 65, category: 'classic', image: F2 + 'Everything_you_need_to_know_about_decaf_coffee.webp', featured: true },
  { name: 'Лате', desc: "350 мл · м'який і вершковий", price: 70, category: 'classic', image: F1 + 'латте норм.jpg', featured: true },
  { name: 'Флет вайт', desc: '200 мл · подвійний ристрето', price: 75, category: 'classic', image: F2 + 'coffee-brain-caffeine-neuroscincces.webp' },
  { name: 'Пуровер V60', desc: 'Ефіопія · ягоди, жасмин', price: 85, category: 'alt', image: F2 + 'кафа.jpg' },
  { name: 'Колд брю', desc: '18 годин настоювання', price: 80, category: 'alt', image: F1 + 'латте.jpg' },
  { name: 'Раф лаванда', desc: 'Вершки, ваніль, лаванда', price: 90, category: 'alt', image: F1 + 'капучіно.jpg' },
  { name: 'Чізкейк Нью-Йорк', desc: 'Ягідний соус', price: 95, category: 'sweet', image: '🍰' },
  { name: 'Круасан', desc: 'Вершкове масло, щоранку', price: 55, category: 'sweet', image: '🥐' },
  { name: 'Брауні', desc: 'Темний шоколад, горіхи', price: 70, category: 'sweet', image: '🍫' },
].map((p, i) => ({ ...p, thumb: p.image, available: true, featured: !!p.featured, sort: (i + 1) * 10 }));

export const STATUS = {
  new: ['Нове', 'st-new'],
  preparing: ['Готується', 'st-prep'],
  ready: ['Готове до видачі', 'st-ready'],
  done: ['Видано', 'st-done'],
  cancelled: ['Скасовано', 'st-cancel'],
};
export const fmtDate = (ts) => (ts?.toDate ? ts.toDate().toLocaleString('uk-UA', { dateStyle: 'medium', timeStyle: 'short' }) : 'щойно');

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- Зрозумілі помилки ---------- */
const ERRORS = {
  'auth/invalid-credential': 'Неправильна пошта або пароль.',
  'auth/wrong-password': 'Неправильний пароль.',
  'auth/user-not-found': 'Акаунта з такою поштою немає.',
  'auth/email-already-in-use': 'Акаунт з такою поштою вже існує. Спробуйте увійти.',
  'auth/invalid-email': 'Некоректна адреса пошти.',
  'auth/missing-password': 'Введіть пароль.',
  'auth/weak-password': 'Пароль занадто простий — щонайменше 8 символів.',
  'auth/too-many-requests': 'Забагато спроб. Зачекайте кілька хвилин.',
  'auth/invalid-verification-code': 'Неправильний код. Зачекайте, поки в застосунку з’явиться новий, і спробуйте ще раз.',
  'auth/missing-code': 'Введіть 6-значний код.',
  'auth/network-request-failed': "Немає з'єднання з інтернетом.",
  'auth/requires-recent-login': 'Для цієї дії підтвердьте пароль ще раз.',
  'auth/unverified-email': 'Спершу підтвердіть пошту за посиланням із листа.',
  'auth/operation-not-allowed': 'Цей спосіб входу вимкнено в налаштуваннях Firebase.',
  'auth/maximum-second-factor-count-exceeded': 'Двоетапну перевірку вже налаштовано.',
  'auth/second-factor-already-in-use': 'Двоетапну перевірку вже налаштовано.',
  'permission-denied': 'Немає доступу до цієї дії.',
  'unavailable': 'Сервер тимчасово недоступний. Спробуйте ще раз.',
};
export const errText = (e) => ERRORS[e?.code] || `Щось пішло не так${e?.code ? ` (${e.code})` : ''}.`;

/* ---------- Стан користувача ---------- */
export const state = { ready: false, user: null, isAdmin: false };
const listeners = new Set();
export const onUser = (cb) => { listeners.add(cb); if (state.ready) cb(state); return () => listeners.delete(cb); };

async function checkAdmin(user) {
  if (!user) return false;
  if (user.email === OWNER_EMAIL && user.emailVerified) return true;
  try { return (await getDoc(doc(db, 'admins', user.uid))).exists(); } catch { return false; }
}

export const hasTotp = (user = auth.currentUser) =>
  !!user && multiFactor(user).enrolledFactors.some((f) => f.factorId === TotpMultiFactorGenerator.FACTOR_ID);

/* ---------- Синхронізація кошика з Firestore ---------- */
const OWNER_KEY = 'zerno-order-owner';
let unsubCart = null;
let pushTimer = null;
let lastPushed = '';
const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* приватний режим */ } };

const cleanItems = (items) => (Array.isArray(items) ? items : []).slice(0, CART_MAX).map((i) => ({
  pid: i.pid || null,
  name: String(i.name || '').slice(0, 100),
  price: Number(i.price) || 0,
  image: typeof i.image === 'string' && i.image.length < 20000 ? i.image : '',
}));

async function startCartSync(user) {
  const ref = doc(db, 'users', user.uid);
  const prevOwner = lsGet(OWNER_KEY);
  const local = Z.cart.get();
  let remote = [];
  try {
    const snap = await getDoc(ref);
    if (snap.exists() && Array.isArray(snap.data().cart)) remote = snap.data().cart;
  } catch (e) { console.warn('Кошик:', e); }

  // Гостьовий список додаємо до акаунта; кеш цього ж акаунта замінюємо віддаленим
  const guestItems = prevOwner !== user.uid ? local : [];
  const merged = cleanItems(remote.concat(guestItems));
  lsSet(OWNER_KEY, user.uid);
  Z.cart.set(merged, { silent: true });
  lastPushed = JSON.stringify(merged);
  try {
    await setDoc(ref, { email: user.email, cart: merged, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) { console.warn('Кошик:', e); }
  if (guestItems.length) Z.toast('Ваш список збережено в акаунті');

  unsubCart = onSnapshot(ref, (s) => {
    if (s.metadata.hasPendingWrites) return;
    const c = cleanItems(s.data()?.cart);
    const j = JSON.stringify(c);
    if (j !== JSON.stringify(Z.cart.get())) { lastPushed = j; Z.cart.set(c, { silent: true }); }
  }, () => {});
}

addEventListener('zerno:cart', (e) => {
  if (!state.user) return;
  clearTimeout(pushTimer);
  const uid = state.user.uid;
  pushTimer = setTimeout(() => {
    const items = cleanItems(e.detail);
    const j = JSON.stringify(items);
    if (j === lastPushed) return;
    lastPushed = j;
    setDoc(doc(db, 'users', uid), { cart: items, updatedAt: serverTimestamp() }, { merge: true })
      .catch((err) => Z.toast(`Не вдалося зберегти кошик: ${errText(err)}`));
  }, 400);
});

function stopCartSync({ clear }) {
  if (unsubCart) { unsubCart(); unsubCart = null; }
  if (clear) { lsSet(OWNER_KEY, null); Z.cart.set([], { silent: true }); }
}

/* ---------- Кнопка акаунта в шапці ---------- */
const slot = Z.$('#account-slot');

function renderAccount() {
  if (!state.user) {
    slot.innerHTML = '<button class="account-btn" type="button" data-open-auth="login">Увійти</button>';
    return;
  }
  const email = state.user.email || '';
  slot.innerHTML = `
    <button class="account-btn is-user" type="button" aria-haspopup="menu" aria-expanded="false">
      <span class="avatar">${esc(email[0]?.toUpperCase() || '☕')}</span><span class="account-label">Акаунт</span>
    </button>
    <div class="account-menu" role="menu" hidden>
      <div class="account-email">${esc(email)}</div>
      <a role="menuitem" href="account.html">Мій акаунт</a>
      ${state.isAdmin ? '<a role="menuitem" href="admin.html">Адмін-панель</a>' : ''}
      <button role="menuitem" type="button" data-action="logout">Вийти</button>
    </div>`;
}

slot.addEventListener('click', async (e) => {
  const btn = e.target.closest('.account-btn.is-user');
  if (btn) {
    const menu = slot.querySelector('.account-menu');
    const open = menu.hidden;
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', open);
    return;
  }
  if (e.target.closest('[data-action="logout"]')) {
    await signOut(auth);
    Z.toast('Ви вийшли з акаунта');
  }
});
document.addEventListener('click', (e) => {
  const opener = e.target.closest('[data-open-auth]');
  if (opener) { e.preventDefault(); openAuth(opener.dataset.openAuth); }
  if (!e.target.closest('#account-slot')) {
    const menu = slot.querySelector('.account-menu');
    if (menu && !menu.hidden) { menu.hidden = true; slot.querySelector('.account-btn')?.setAttribute('aria-expanded', 'false'); }
  }
});

/* ---------- Вікно входу / реєстрації ---------- */
const field = (id, label, type = 'text', extra = '') =>
  `<div class="field"><input id="${id}" type="${type}" placeholder=" " ${extra}><label for="${id}">${label}</label></div>`;

document.body.insertAdjacentHTML('beforeend', `
<dialog class="modal" id="auth-dialog" aria-labelledby="auth-title">
  <button class="modal-close" type="button" aria-label="Закрити" data-close>✕</button>

  <div class="view" data-view="login">
    <div class="seg" role="tablist"><button type="button" class="is-on" data-go="login">Вхід</button><button type="button" data-go="register">Реєстрація</button></div>
    <h2 id="auth-title">З поверненням</h2>
    <p class="modal-note" data-note></p>
    <form data-form="login" novalidate>
      ${field('l-email', 'Email', 'email', 'autocomplete="email" required')}
      ${field('l-pass', 'Пароль', 'password', 'autocomplete="current-password" required')}
      <p class="form-error" role="alert"></p>
      <button class="btn" type="submit">Увійти <span class="arrow">→</span></button>
      <button class="link-btn" type="button" data-go="reset">Забули пароль?</button>
    </form>
  </div>

  <div class="view" data-view="register" hidden>
    <div class="seg" role="tablist"><button type="button" data-go="login">Вхід</button><button type="button" class="is-on" data-go="register">Реєстрація</button></div>
    <h2>Створити акаунт</h2>
    <p class="modal-note" data-note></p>
    <form data-form="register" novalidate>
      ${field('r-email', 'Email', 'email', 'autocomplete="email" required')}
      ${field('r-pass', 'Пароль (мін. 8 символів)', 'password', 'autocomplete="new-password" minlength="8" required')}
      ${field('r-pass2', 'Повторіть пароль', 'password', 'autocomplete="new-password" required')}
      <fieldset class="choice">
        <legend>Як захистити вхід?</legend>
        <label class="choice-card">
          <input type="radio" name="r-mfa" value="password" checked>
          <span><b>Лише пароль</b><small>Швидко й просто: пошта + пароль.</small></span>
        </label>
        <label class="choice-card">
          <input type="radio" name="r-mfa" value="totp">
          <span><b>Пароль + Google Authenticator</b><small>Двоетапна перевірка: при вході ще й код із застосунку.</small></span>
        </label>
      </fieldset>
      <p class="form-error" role="alert"></p>
      <button class="btn" type="submit">Створити акаунт <span class="arrow">→</span></button>
    </form>
  </div>

  <div class="view" data-view="mfa" hidden>
    <h2>Двоетапна перевірка</h2>
    <p class="modal-note">Відкрийте Google Authenticator і введіть 6-значний код для «Zerno Cafe».</p>
    <form data-form="mfa" novalidate>
      ${field('m-code', 'Код із застосунку', 'text', 'inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required')}
      <p class="form-error" role="alert"></p>
      <button class="btn" type="submit">Підтвердити <span class="arrow">→</span></button>
      <button class="link-btn" type="button" data-go="login">← Назад</button>
    </form>
  </div>

  <div class="view" data-view="verify" hidden>
    <h2>Підтвердіть пошту</h2>
    <p class="modal-note">Ми надіслали лист на <b data-email></b>. Перейдіть за посиланням у ньому (перевірте й «Спам»), а потім поверніться сюди. Без підтвердженої пошти Google Authenticator не підключити.</p>
    <p class="form-error" role="alert"></p>
    <div class="modal-actions">
      <button class="btn" type="button" data-action="verified">Я підтвердив пошту <span class="arrow">→</span></button>
      <button class="btn btn--ghost" type="button" data-action="resend">Надіслати лист ще раз</button>
      <button class="link-btn" type="button" data-close>Налаштую пізніше в акаунті</button>
    </div>
  </div>

  <div class="view" data-view="enroll" hidden>
    <h2>Google Authenticator</h2>
    <div data-enroll></div>
  </div>

  <div class="view" data-view="reset" hidden>
    <h2>Відновлення пароля</h2>
    <p class="modal-note">Надішлемо лист із посиланням для нового пароля.</p>
    <form data-form="reset" novalidate>
      ${field('p-email', 'Email', 'email', 'autocomplete="email" required')}
      <p class="form-error" role="alert"></p>
      <button class="btn" type="submit">Надіслати лист <span class="arrow">→</span></button>
      <button class="link-btn" type="button" data-go="login">← Назад до входу</button>
    </form>
  </div>
</dialog>`);

const dlg = Z.$('#auth-dialog');
let mfaResolver = null;
let afterLogin = null;

function show(view) {
  Z.$$('.view', dlg).forEach((v) => (v.hidden = v.dataset.view !== view));
  Z.$$('.form-error', dlg).forEach((e) => (e.textContent = ''));
  const first = Z.$(`.view[data-view="${view}"] input:not([type=radio])`, dlg);
  if (first) setTimeout(() => first.focus(), 50);
}

export function openAuth(view = 'login', note = '', then = null) {
  Z.$$('[data-note]', dlg).forEach((n) => { n.textContent = note; n.hidden = !note; });
  afterLogin = then;
  show(view);
  if (!dlg.open) dlg.showModal();
}
const closeAuth = () => dlg.open && dlg.close();

dlg.addEventListener('click', (e) => {
  if (e.target === dlg || e.target.closest('[data-close]')) return closeAuth();
  const go = e.target.closest('[data-go]');
  if (go) show(go.dataset.go);
});

const busy = (form, on) => {
  const b = form.querySelector('button[type=submit], .btn');
  if (b) { b.disabled = on; b.classList.toggle('is-busy', on); }
};
const setErr = (root, msg) => { const el = root.querySelector('.form-error'); if (el) el.textContent = msg; };
const val = (id) => Z.$('#' + id).value.trim();

function loggedIn(msg) {
  closeAuth();
  Z.toast(msg);
  const cb = afterLogin; afterLogin = null;
  if (cb) cb();
}

dlg.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const kind = form.dataset.form;
  setErr(form, '');
  busy(form, true);
  try {
    if (kind === 'login') {
      try {
        await signInWithEmailAndPassword(auth, val('l-email'), Z.$('#l-pass').value);
        loggedIn('Ви увійшли ☕');
      } catch (err) {
        if (err.code !== 'auth/multi-factor-auth-required') throw err;
        mfaResolver = getMultiFactorResolver(auth, err);
        Z.$('#m-code').value = '';
        show('mfa');
      }
    }

    if (kind === 'mfa') {
      const code = val('m-code');
      if (!/^\d{6}$/.test(code)) throw { code: 'auth/missing-code' };
      await resolveTotp(mfaResolver, code);
      mfaResolver = null;
      loggedIn('Ви увійшли ☕');
    }

    if (kind === 'register') {
      const email = val('r-email');
      const pass = Z.$('#r-pass').value;
      if (pass.length < 8) throw { code: 'auth/weak-password' };
      if (pass !== Z.$('#r-pass2').value) { setErr(form, 'Паролі не збігаються.'); return; }
      const wantsTotp = form.querySelector('[name="r-mfa"]:checked').value === 'totp';
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      sendEmailVerification(cred.user).catch(() => {});
      if (wantsTotp) {
        Z.$('[data-email]', dlg).textContent = email;
        show('verify');
      } else {
        loggedIn('Акаунт створено! Ми надіслали лист для підтвердження пошти.');
      }
    }

    if (kind === 'reset') {
      await sendPasswordResetEmail(auth, val('p-email'));
      setErr(form, '');
      form.querySelector('.form-error').innerHTML = '<span class="ok">Лист надіслано — перевірте пошту.</span>';
    }
  } catch (err) {
    setErr(form, errText(err));
  } finally {
    busy(form, false);
  }
});

dlg.addEventListener('click', async (e) => {
  const act = e.target.closest('[data-action]')?.dataset.action;
  if (!act) return;
  const view = Z.$('.view[data-view="verify"]', dlg);
  const user = auth.currentUser;
  if (!user) return;
  if (act === 'resend') {
    try { await sendEmailVerification(user); setErr(view, ''); Z.toast('Лист надіслано ще раз'); }
    catch (err) { setErr(view, errText(err)); }
  }
  if (act === 'verified') {
    await user.reload();
    if (!user.emailVerified) return setErr(view, 'Пошту ще не підтверджено. Перейдіть за посиланням у листі.');
    await user.getIdToken(true);
    show('enroll');
    startTotpEnroll(Z.$('[data-enroll]', dlg), {
      onDone: () => loggedIn('Готово! Двоетапну перевірку ввімкнено 🔐'),
      onCancel: closeAuth,
    });
  }
});

export async function resolveTotp(resolver, code) {
  const hint = resolver.hints.find((h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID);
  if (!hint) throw { code: 'auth/unsupported-factor' };
  return resolver.resolveSignIn(TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code));
}

/* Повторне підтвердження пароля (для чутливих дій) — з урахуванням 2FA */
export async function reauth(password, code) {
  const user = auth.currentUser;
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  } catch (err) {
    if (err.code !== 'auth/multi-factor-auth-required') throw err;
    if (!/^\d{6}$/.test(code || '')) throw { code: 'auth/missing-code' };
    await resolveTotp(getMultiFactorResolver(auth, err), code);
  }
}

/* ---------- Підключення Google Authenticator (TOTP) ---------- */
let qrLib = null;
const loadQR = () => qrLib || (qrLib = new Promise((res, rej) => {
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
  s.onload = () => res(window.QRCode);
  s.onerror = rej;
  document.head.append(s);
}));

export async function startTotpEnroll(box, { onDone, onCancel } = {}) {
  const user = auth.currentUser;
  box.innerHTML = '<p class="modal-note">Готуємо секретний ключ…</p>';
  let secret;
  try {
    const session = await multiFactor(user).getSession();
    secret = await TotpMultiFactorGenerator.generateSecret(session);
  } catch (err) {
    if (err.code === 'auth/requires-recent-login') return reauthStep(box, () => startTotpEnroll(box, { onDone, onCancel }));
    box.innerHTML = `<p class="form-error">${esc(errText(err))}</p>`;
    return;
  }
  const url = secret.generateQrCodeUrl(user.email, 'Zerno Cafe');
  box.innerHTML = `
    <ol class="steps">
      <li>Встановіть <b>Google Authenticator</b> на телефон (App Store / Google Play).</li>
      <li>Натисніть «+» → «Сканувати QR-код» і наведіть камеру:
        <div class="qr" aria-label="QR-код для Google Authenticator"></div>
        <details class="manual"><summary>Не виходить сканувати? Введіть ключ вручну</summary>
          <code class="secret"></code>
          <button class="link-btn" type="button" data-copy>Копіювати ключ</button>
        </details>
      </li>
      <li>Введіть 6-значний код, який з'явився в застосунку:</li>
    </ol>
    <form novalidate class="enroll-form">
      ${field('e-code', 'Код із застосунку', 'text', 'inputmode="numeric" autocomplete="one-time-code" maxlength="6" required')}
      <p class="form-error" role="alert"></p>
      <button class="btn" type="submit">Увімкнути перевірку <span class="arrow">→</span></button>
      ${onCancel ? '<button class="link-btn" type="button" data-cancel>Скасувати</button>' : ''}
    </form>`;
  box.querySelector('.secret').textContent = secret.secretKey.replace(/(.{4})/g, '$1 ').trim();
  box.querySelector('[data-copy]').addEventListener('click', () => {
    navigator.clipboard?.writeText(secret.secretKey).then(() => Z.toast('Ключ скопійовано'));
  });
  box.querySelector('[data-cancel]')?.addEventListener('click', onCancel);
  loadQR()
    .then((QR) => new QR(box.querySelector('.qr'), { text: url, width: 184, height: 184, colorDark: '#1f1712', colorLight: '#ffffff', correctLevel: QR.CorrectLevel.M }))
    .catch(() => { box.querySelector('.qr').textContent = 'QR-код не завантажився — введіть ключ вручну.'; box.querySelector('.manual').open = true; });

  const form = box.querySelector('.enroll-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = form.querySelector('#e-code').value.trim();
    setErr(form, '');
    if (!/^\d{6}$/.test(code)) return setErr(form, errText({ code: 'auth/missing-code' }));
    busy(form, true);
    try {
      await multiFactor(user).enroll(TotpMultiFactorGenerator.assertionForEnrollment(secret, code), 'Google Authenticator');
      onDone?.();
    } catch (err) {
      setErr(form, errText(err));
    } finally {
      busy(form, false);
    }
  });
  setTimeout(() => form.querySelector('#e-code')?.focus(), 60);
}

/* Крок «підтвердіть пароль» усередині будь-якого блоку */
export function reauthStep(box, then) {
  const needCode = hasTotp();
  box.innerHTML = `
    <p class="modal-note">З міркувань безпеки підтвердіть пароль ще раз.</p>
    <form novalidate class="reauth-form">
      ${field('ra-pass', 'Поточний пароль', 'password', 'autocomplete="current-password" required')}
      ${needCode ? field('ra-code', 'Код із Google Authenticator', 'text', 'inputmode="numeric" maxlength="6"') : ''}
      <p class="form-error" role="alert"></p>
      <button class="btn" type="submit">Підтвердити <span class="arrow">→</span></button>
    </form>`;
  const form = box.querySelector('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    busy(form, true);
    try {
      await reauth(form.querySelector('#ra-pass').value, form.querySelector('#ra-code')?.value.trim());
      then();
    } catch (err) {
      setErr(form, errText(err));
      busy(form, false);
    }
  });
  setTimeout(() => form.querySelector('#ra-pass').focus(), 60);
}

/* ---------- Товари з Firestore (меню та головна) ---------- */
// Старі/неповні записи (без категорії) на сайті не показуємо — їх видно лише в адмін-панелі
export const isValidProduct = (p) => !!p.name && typeof p.price === 'number' && p.category in CATEGORIES;
export const sortProducts = (list) => list.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || String(a.name).localeCompare(b.name, 'uk'));

async function loadProducts() {
  const snap = await getDocs(collection(db, 'products'));
  return sortProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    .filter((p) => isValidProduct(p) && p.available !== false);
}

function renderMenu(products) {
  const grid = Z.$('#menu-grid');
  grid.innerHTML = '';
  products.forEach((p) => {
    const el = document.createElement('div');
    el.className = 'menu-item';
    Object.assign(el.dataset, { pid: p.id, cat: p.category || 'classic', name: p.name, price: p.price, thumb: p.thumb || p.image || '' });
    el.innerHTML = `
      <div class="thumb"></div>
      <div><h3></h3><p></p></div>
      <div><span class="price"></span><button class="add" type="button">+</button></div>`;
    Z.fillThumb(el.querySelector('.thumb'), p.thumb || p.image);
    el.querySelector('h3').textContent = p.name;
    el.querySelector('p').textContent = p.desc || '';
    el.querySelector('.price').textContent = `${p.price} грн`;
    el.querySelector('.add').setAttribute('aria-label', `Додати ${p.name}`);
    grid.append(el);
  });
  Z.applyFilter();
}

function renderFeatured(products) {
  const feat = products.filter((p) => p.featured).slice(0, 6);
  if (!feat.length) return;
  const box = Z.$('#featured');
  box.innerHTML = '';
  feat.forEach((p, i) => {
    const card = document.createElement('article');
    card.className = 'card reveal';
    card.style.setProperty('--d', `${(i % 3) * 0.12}s`);
    card.innerHTML = `
      <div class="card-img"></div>
      <div class="card-body"><h3></h3><span class="price"></span></div>
      <p></p>`;
    const img = card.querySelector('.card-img');
    if (Z.isEmoji(p.image)) img.innerHTML = `<span class="emoji emoji--big">${esc(p.image)}</span>`;
    else { img.innerHTML = '<img loading="lazy">'; const im = img.querySelector('img'); im.src = p.image; im.alt = p.name; }
    card.querySelector('h3').textContent = p.name;
    card.querySelector('.price').textContent = `${p.price} грн`;
    card.querySelector('p').textContent = p.desc || '';
    box.append(card);
  });
  Z.observe(box);
}

if (Z.page === 'menu' || Z.page === 'index') {
  loadProducts()
    .then((products) => {
      if (!products.length) return; // база ще порожня — лишаємо статичне меню зі сторінки
      if (Z.page === 'menu') renderMenu(products);
      else renderFeatured(products);
    })
    .catch((e) => console.warn('Товари не завантажились, показуємо статичне меню:', e));
}

/* ---------- Налаштування сайту (оголошення, контакти, години) ---------- */
export const DEFAULT_SETTINGS = {
  announcement: '',
  address: 'вул. Хрещатик, 15, Київ',
  phone: '+38 (044) 123-45-67',
  email: 'hello@zerno.cafe',
  weekFrom: '08:00', weekTo: '21:00',
  weekendFrom: '09:00', weekendTo: '22:00',
};

function applySettings(s) {
  const bar = Z.$('#announce');
  let dismissed = null;
  try { dismissed = sessionStorage.getItem('zerno-announce-x'); } catch { /* сховище заблоковане */ }
  if (s.announcement && dismissed !== s.announcement) {
    bar.innerHTML = '<span></span><button type="button" aria-label="Закрити">✕</button>';
    bar.querySelector('span').textContent = s.announcement;
    bar.querySelector('button').onclick = () => { bar.hidden = true; try { sessionStorage.setItem('zerno-announce-x', s.announcement); } catch { /* */ } };
    bar.hidden = false;
  } else bar.hidden = true;

  if (Z.page !== 'contacts') return;
  const set = (id, text) => { const el = Z.$('#' + id); if (el) el.textContent = text; };
  set('c-address', s.address);
  set('c-phone', s.phone);
  set('c-mail', s.email);
  Z.$('#c-phone') && (Z.$('#c-phone').href = 'tel:' + String(s.phone).replace(/[^\d+]/g, ''));
  Z.$('#c-mail') && (Z.$('#c-mail').href = 'mailto:' + s.email);
  set('h-week', `${s.weekFrom} – ${s.weekTo}`);
  set('h-weekend', `${s.weekendFrom} – ${s.weekendTo}`);
  Z.updateOpenStatus({ week: [s.weekFrom, s.weekTo], weekend: [s.weekendFrom, s.weekendTo] });
}

onSnapshot(doc(db, 'settings', 'site'), (snap) => {
  if (snap.exists()) applySettings({ ...DEFAULT_SETTINGS, ...snap.data() });
}, (e) => console.warn('Налаштування:', e));

/* ---------- Сторінка «Замовлення»: оформлення ---------- */
if (Z.page === 'order') {
  const btn = Z.$('#checkout');
  const hint = Z.$('#checkout-hint');
  const updateHint = () => {
    hint.textContent = state.user
      ? 'Замовлення збережеться у вашому акаунті — статус видно на сторінці «Мій акаунт».'
      : 'Акаунт не обов’язковий для списку, але щоб оформити замовлення — увійдіть або зареєструйтеся.';
  };
  onUser(updateHint);

  const checkout = async () => {
    const items = cleanItems(Z.cart.get());
    if (!items.length) return Z.toast('Спершу додайте щось до списку');
    btn.disabled = true;
    try {
      const total = items.reduce((s, i) => s + i.price, 0);
      const note = Z.$('#order-note')?.value.trim().slice(0, 300) || '';
      const u = auth.currentUser; // state.user може ще не оновитися одразу після входу
      const ref = await addDoc(collection(db, 'orders'), {
        uid: u.uid, email: u.email, items, total, note, status: 'new', createdAt: serverTimestamp(),
      });
      Z.cart.set([]);
      dispatchEvent(new CustomEvent('zerno:cart-sync'));
      if (Z.$('#order-note')) Z.$('#order-note').value = '';
      Z.toast(`Замовлення №${ref.id.slice(0, 6).toUpperCase()} прийнято! ☕`);
    } catch (e) {
      Z.toast(`Не вдалося оформити: ${errText(e)}`);
    } finally {
      btn.disabled = false;
    }
  };

  btn.addEventListener('click', () => {
    if (auth.currentUser) return checkout();
    openAuth('login', 'Увійдіть або зареєструйтеся, щоб оформити замовлення. Ваш список збережеться.', checkout);
  });
}

/* ---------- Головний обробник стану входу ---------- */
let prevUid = null;
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Після підтвердження пошти токен міг лишитися старим — оновлюємо
    try {
      const t = await user.getIdTokenResult();
      if (user.emailVerified && !t.claims.email_verified) await user.getIdToken(true);
    } catch { /* офлайн */ }
  }
  state.user = user;
  state.isAdmin = await checkAdmin(user);
  state.ready = true;
  document.documentElement.classList.toggle('is-signed-in', !!user);

  if (user && user.uid !== prevUid) {
    stopCartSync({ clear: false });
    await startCartSync(user);
  } else if (!user) {
    // Вихід (або кеш кошика іншого акаунта) — очищаємо локальну копію
    stopCartSync({ clear: !!lsGet(OWNER_KEY) });
  }
  prevUid = user?.uid || null;

  renderAccount();
  listeners.forEach((cb) => cb(state));
});

export { doc, getDoc, setDoc, onSnapshot, collection, getDocs, addDoc, serverTimestamp, multiFactor, sendEmailVerification, TotpMultiFactorGenerator };
