/* ============ Сторінка «Мій акаунт» ============ */
import {
  Z, auth, db, state, onUser, esc, errText, hasTotp, startTotpEnroll, reauthStep, reauth, openAuth, STATUS, fmtDate,
} from './app.js';
import { multiFactor, sendEmailVerification, updatePassword, signOut } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import { collection, query, where, onSnapshot } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

const root = Z.$('#account-root');
let unsubOrders = null;

function renderGuest() {
  root.innerHTML = `
    <div class="panel empty-panel reveal">
      <span class="cup">☕</span>
      <h2>Ви ще не увійшли</h2>
      <p class="muted">Акаунт не обов'язковий, але з ним ваш список зберігається на будь-якому пристрої, а замовлення — в історії.</p>
      <div class="modal-actions row">
        <button class="btn" type="button" data-open-auth="login">Увійти <span class="arrow">→</span></button>
        <button class="btn btn--ghost" type="button" data-open-auth="register">Зареєструватися</button>
      </div>
    </div>`;
  Z.observe(root);
}

function renderUser(user) {
  root.innerHTML = `
    <div class="account-grid">
      <div class="stack">
        <section class="panel reveal" id="sec-profile">
          <h2>Профіль</h2>
          <p class="kv"><span>Email</span><b></b></p>
          <p class="kv"><span>Пошта</span><span data-verified></span></p>
          ${state.isAdmin ? '<a class="btn btn--ghost" href="admin.html">Відкрити адмін-панель <span class="arrow">→</span></a>' : ''}
        </section>

        <section class="panel reveal" id="sec-2fa" style="--d:.08s">
          <h2>Двоетапна перевірка</h2>
          <div data-2fa></div>
        </section>

        <section class="panel reveal" id="sec-pass" style="--d:.16s">
          <h2>Змінити пароль</h2>
          <form novalidate data-pass>
            <div class="field"><input id="cp-old" type="password" placeholder=" " autocomplete="current-password"><label for="cp-old">Поточний пароль</label></div>
            ${hasTotp(user) ? '<div class="field"><input id="cp-code" type="text" inputmode="numeric" maxlength="6" placeholder=" "><label for="cp-code">Код із Google Authenticator</label></div>' : ''}
            <div class="field"><input id="cp-new" type="password" placeholder=" " autocomplete="new-password"><label for="cp-new">Новий пароль (мін. 8)</label></div>
            <p class="form-error" role="alert"></p>
            <button class="btn" type="submit">Зберегти пароль <span class="arrow">→</span></button>
          </form>
        </section>

        <button class="btn btn--ghost" type="button" data-logout>Вийти з акаунта</button>
      </div>

      <section class="panel reveal" style="--d:.1s">
        <h2>Мої замовлення</h2>
        <div class="orders" data-orders><p class="muted">Завантаження…</p></div>
      </section>
    </div>`;

  root.querySelector('.kv b').textContent = user.email;
  renderVerified(user);
  render2fa(user);

  root.querySelector('[data-logout]').addEventListener('click', async () => { await signOut(auth); Z.toast('Ви вийшли з акаунта'); });

  const pf = root.querySelector('[data-pass]');
  pf.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = pf.querySelector('.form-error');
    err.textContent = '';
    const next = pf.querySelector('#cp-new').value;
    if (next.length < 8) return (err.textContent = errText({ code: 'auth/weak-password' }));
    try {
      await reauth(pf.querySelector('#cp-old').value, pf.querySelector('#cp-code')?.value.trim());
      await updatePassword(auth.currentUser, next);
      pf.reset();
      Z.toast('Пароль змінено 🔐');
    } catch (ex) { err.textContent = errText(ex); }
  });

  // Історія замовлень (сортуємо на клієнті — не потрібен складений індекс)
  unsubOrders?.();
  unsubOrders = onSnapshot(query(collection(db, 'orders'), where('uid', '==', user.uid)), (snap) => {
    const box = root.querySelector('[data-orders]');
    if (!box) return;
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds ?? Infinity) - (a.createdAt?.seconds ?? Infinity));
    if (!list.length) {
      box.innerHTML = '<div class="order-empty"><span class="cup">🧾</span>Замовлень поки немає. <a href="menu.html" style="color:var(--accent)">До меню →</a></div>';
      return;
    }
    box.innerHTML = list.map((o) => {
      const [label, cls] = STATUS[o.status] || [o.status, ''];
      const items = (o.items || []).map((i) => esc(i.name)).join(', ');
      return `<article class="order-card">
        <header><b>№${esc(o.id.slice(0, 6).toUpperCase())}</b><span class="status ${cls}">${esc(label)}</span></header>
        <p class="muted small">${esc(fmtDate(o.createdAt))}</p>
        <p>${items}</p>
        ${o.note ? `<p class="muted small">Коментар: ${esc(o.note)}</p>` : ''}
        <footer><span>${(o.items || []).length} поз.</span><b>${esc(o.total)} грн</b></footer>
      </article>`;
    }).join('');
  }, (e) => { const box = root.querySelector('[data-orders]'); if (box) box.innerHTML = `<p class="form-error">${esc(errText(e))}</p>`; });

  Z.observe(root);
}

function renderVerified(user) {
  const el = root.querySelector('[data-verified]');
  if (user.emailVerified) { el.innerHTML = '<span class="status st-ready">Підтверджена</span>'; return; }
  el.innerHTML = '<span class="status st-new">Не підтверджена</span> <button class="link-btn" type="button">Надіслати лист</button> <button class="link-btn" type="button" data-recheck>Я підтвердив</button>';
  el.querySelector('button').addEventListener('click', async () => {
    try { await sendEmailVerification(user); Z.toast('Лист надіслано — перевірте пошту'); } catch (e) { Z.toast(errText(e)); }
  });
  el.querySelector('[data-recheck]').addEventListener('click', async () => {
    await user.reload();
    if (user.emailVerified) { await user.getIdToken(true); location.reload(); }
    else Z.toast('Пошту ще не підтверджено');
  });
}

function render2fa(user) {
  const box = root.querySelector('[data-2fa]');
  const factor = multiFactor(user).enrolledFactors.find((f) => f.factorId === 'totp');
  if (factor) {
    const when = factor.enrollmentTime ? new Date(factor.enrollmentTime).toLocaleDateString('uk-UA') : '';
    box.innerHTML = `
      <p><span class="status st-ready">Увімкнено</span> Google Authenticator${when ? ` · з ${esc(when)}` : ''}</p>
      <p class="muted small">При кожному вході після пароля потрібен код із застосунку.</p>
      <button class="btn btn--ghost" type="button" data-off>Вимкнути</button>`;
    box.querySelector('[data-off]').addEventListener('click', () => {
      if (!confirm('Вимкнути двоетапну перевірку? Вхід буде лише за паролем.')) return;
      const off = async () => {
        try {
          await multiFactor(auth.currentUser).unenroll(factor);
          Z.toast('Двоетапну перевірку вимкнено');
          if (auth.currentUser) render2fa(auth.currentUser);
        } catch (e) {
          if (e.code === 'auth/requires-recent-login') return reauthStep(box, off);
          if (e.code === 'auth/user-token-expired') { Z.toast('Перевірку вимкнено. Увійдіть знову.'); openAuth('login'); return; }
          Z.toast(errText(e));
        }
      };
      off();
    });
    return;
  }
  box.innerHTML = `
    <p><span class="status st-cancel">Вимкнено</span> Вхід лише за паролем.</p>
    <p class="muted small">Увімкніть, щоб при вході ще й вводити код із Google Authenticator.</p>
    <button class="btn" type="button" data-on>Увімкнути Google Authenticator <span class="arrow">→</span></button>`;
  box.querySelector('[data-on]').addEventListener('click', async () => {
    await user.reload();
    if (!user.emailVerified) { Z.toast('Спершу підтвердіть пошту — лист можна надіслати в розділі «Профіль»'); return; }
    startTotpEnroll(box, {
      onDone: () => { Z.toast('Двоетапну перевірку ввімкнено 🔐'); render2fa(auth.currentUser); },
      onCancel: () => render2fa(user),
    });
  });
}

onUser(({ user }) => {
  unsubOrders?.(); unsubOrders = null;
  if (user) renderUser(user); else renderGuest();
});
