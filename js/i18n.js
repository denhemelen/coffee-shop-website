/* ============ Перемикач мов UA / EN ============
   Сторінки написані українською. Якщо вибрано EN, цей скрипт замінює
   тексти за словником нижче — і на старті, і коли щось додається пізніше
   (тости, вікна входу, акаунт). Підключати ПЕРЕД js/site.js. */
(() => {
  'use strict';
  const KEY = 'zerno-lang';
  let lang = 'uk';
  try { lang = localStorage.getItem(KEY) || 'uk'; } catch { /* приватний режим */ }

  /* ---------- Кнопка-перемикач (є завжди) ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('.site-header .nav');
    if (!nav) return;
    const btn = document.createElement('button');
    btn.className = 'lang-switch';
    btn.type = 'button';
    btn.textContent = lang === 'en' ? 'UA' : 'EN';
    btn.setAttribute('aria-label', lang === 'en' ? 'Українська' : 'English');
    btn.addEventListener('click', () => {
      try { localStorage.setItem(KEY, lang === 'en' ? 'uk' : 'en'); } catch { /* */ }
      location.reload();
    });
    const box = nav.querySelector('.nav-actions');
    if (box) box.prepend(btn); else nav.insertBefore(btn, nav.querySelector('.burger'));
  });

  if (lang !== 'en') return;
  document.documentElement.lang = 'en';

  const D = {
    // Загальне
    'Зерно': 'Zerno', 'Головна': 'Home', 'Меню': 'Menu', 'Про нас': 'About', 'Замовлення': 'Order', 'Контакти': 'Contacts',
    'Головна навігація': 'Main navigation', 'Соцмережі': 'Social media',
    'Зайдіть на каву —': 'Drop in for coffee —', 'ми поруч →': "we're close by →",
    'Зерно — кав\'ярня': 'Zerno — coffee house', 'Меню — Зерно': 'Menu — Zerno', 'Про нас — Зерно': 'About — Zerno',
    'Замовлення — Зерно': 'Order — Zerno', 'Контакти — Зерно': 'Contacts — Zerno', 'Мій акаунт — Зерно': 'My account — Zerno',
    'Закрити': 'Close', 'Назад': 'Back', 'Скасувати': 'Cancel', 'Підтвердити': 'Confirm', 'Видалити': 'Remove', 'Додати': 'Add',
    'Поки що порожньо — додайте щось смачне.': 'Nothing here yet — add something tasty.',
    'Замовлення очищено': 'Order cleared',

    // Головна
    'Кав\'ярня «Зерно»: свіжообсмажена кава, авторські напої та затишок у центрі міста.': 'Zerno coffee house: freshly roasted coffee, signature drinks and a cosy spot in the city centre.',
    'Кав\'ярня · з 2019': 'Coffee house · since 2019', 'Кава, що': 'Coffee that', 'пахне': 'smells', 'ранком': 'like morning',
    'Свіжообсмажене зерно, уважні бариста й тиша, в якій хочеться залишитись трохи довше.': 'Freshly roasted beans, attentive baristas and a calm you will want to stay in a little longer.',
    'Переглянути меню': 'View menu', 'Наша історія': 'Our story',
    'Капучино з латте-артом у формі серця': 'Cappuccino with heart latte art',
    'свіжа обсмажка · щодня · свіжа обсмажка · щодня ·': 'fresh roast · every day · fresh roast · every day ·',
    'Наші напої': 'Our drinks', 'Улюблене гостей': 'Guest favourites', 'Три чашки, з яких': 'Three cups', 'варто почати': 'to start with',
    'Усе меню': 'Full menu', 'Насичений смак із нотами какао.': 'Rich taste with cocoa notes.',
    'Ніжний баланс кави та молочної піни.': 'A gentle balance of coffee and milk foam.',
    'М\'який, вершковий, з легкою солодкістю.': 'Smooth, creamy, lightly sweet.',
    'Інтер\'єр кав\'ярні': 'Coffee house interior', 'Простір': 'Space', 'Місце, де час': 'A place where time', 'сповільнюється': 'slows down',
    'Тепле світло, дерево і запах щойно змеленої кави. Приходьте працювати, зустрічатися або просто помовчати.': 'Warm light, wood and the smell of freshly ground coffee. Come to work, meet friends or just enjoy the quiet.',
    'Як нас знайти': 'How to find us',

    // Напої
    'Еспресо': 'Espresso', 'Капучино': 'Cappuccino', 'Флет вайт': 'Flat white', 'Лате': 'Latte', 'Колд брю': 'Cold brew',
    'Пуровер V60': 'V60 pour-over', 'Раф лаванда': 'Lavender raf', 'Чізкейк': 'Cheesecake', 'Чізкейк Нью-Йорк': 'New York cheesecake',
    'Круасан': 'Croissant', 'Брауні': 'Brownie',
    '30 мл · какао, карамель': '30 ml · cocoa, caramel', '250 мл · оксамитова піна': '250 ml · velvety foam',
    '350 мл · м\'який і вершковий': '350 ml · smooth and creamy', '200 мл · подвійний ристрето': '200 ml · double ristretto',
    'Ефіопія · ягоди, жасмин': 'Ethiopia · berries, jasmine', '18 годин настоювання': '18-hour steep',
    'Вершки, ваніль, лаванда': 'Cream, vanilla, lavender', 'Ягідний соус': 'Berry sauce',
    'Вершкове масло, щоранку': 'Real butter, baked every morning', 'Темний шоколад, горіхи': 'Dark chocolate, nuts',

    // Меню
    'Меню кав\'ярні «Зерно»: класична кава, альтернатива та десерти.': 'Zerno menu: classic coffee, alternative brewing and desserts.',
    'Обирайте': 'Choose', 'свою': 'your', 'чашку': 'cup',
    'Натисніть «+», щоб додати позицію до замовлення.': 'Tap “+” to add an item to your order.',
    'Категорії меню': 'Menu categories', 'Усе': 'All', 'Класика': 'Classic', 'Альтернатива': 'Alternative', 'Десерти': 'Desserts',
    'У цій категорії поки нічого немає.': 'Nothing in this category yet.',

    // Про нас
    'Історія кав\'ярні «Зерно» та наші цінності.': 'The story of Zerno and our values.',
    'Маленька кав\'ярня з': 'A small coffee house with', 'великою': 'great', 'любов\'ю': 'love',
    'Дві чашки лате на дерев\'яному столі': 'Two lattes on a wooden table', 'Історія': 'Story',
    'Усе почалося з однієї кавоварки': 'It all started with one coffee machine',
    'У 2019 році ми відкрили крихітну стійку на розі вулиці. Сьогодні «Зерно» — це місце, де знають ваше ім\'я і вашу улюблену каву.': 'In 2019 we opened a tiny stand on a street corner. Today Zerno is a place where people know your name and your favourite coffee.',
    'Ми працюємо напряму з фермерами, обсмажуємо зерно невеликими партіями і щодня налаштовуємо помел, щоб кожна чашка була такою, як треба.': 'We work directly with farmers, roast in small batches and dial in the grind every day so each cup is just right.',
    'сортів зерна в ротації': 'coffees in rotation', 'чашок зварено': 'cups brewed', 'гостей повертаються': 'guests come back',
    'Цінності': 'Values', 'У що ми віримо': 'What we believe in', 'Свіжість': 'Freshness',
    'Обсмажуємо щотижня і не тримаємо зерно довше місяця.': 'We roast weekly and never keep beans longer than a month.',
    'Чесність': 'Honesty', 'Знаємо ферму кожного лоту і платимо справедливу ціну.': 'We know the farm behind every lot and pay a fair price.',
    'Затишок': 'Comfort', 'Жодного поспіху — лише ви, кава і гарна музика.': 'No rush — just you, coffee and good music.',

    // Замовлення
    'Зберіть своє замовлення в кав\'ярні «Зерно».': 'Build your order at Zerno.',
    'Ваш': 'Your', 'список': 'shopping', 'покупок': 'list', 'Додайте позиції вручну або з': 'Add items manually or from the', 'меню': 'menu',
    '— список збережеться. Увійдіть в акаунт, щоб він був доступний на будь-якому пристрої.': '— the list is saved. Sign in to access it on any device.',
    'Нова позиція': 'New item', 'Назва покупки': 'Item name', 'Вартість, грн': 'Price, UAH', 'Зображення': 'Image',
    'Позицій:': 'Items:', 'Разом:': 'Total:', 'грн': 'UAH', 'поз.': 'items',
    'Коментар до замовлення (необов\'язково)': 'Order comment (optional)', 'Оформити замовлення': 'Place order', 'Очистити': 'Clear',
    'Еспресо (біла чашка)': 'Espresso (white cup)', 'Капучино з серцем': 'Cappuccino with a heart', 'Лате у склянці': 'Latte in a glass',
    'Два лате': 'Two lattes', 'Кава на зернах': 'Coffee on beans', 'Капучино крупним планом': 'Cappuccino close-up',
    'Чашка на мішковині': 'Cup on burlap', 'Чашка на зернах': 'Cup on beans',
    'Замовлення збережеться у вашому акаунті — статус видно на сторінці «Мій акаунт».': 'The order is saved to your account — track its status on the “My account” page.',
    'Акаунт не обов\'язковий для списку, але щоб оформити замовлення — увійдіть або зареєструйтеся.': 'You don’t need an account for the list, but to place an order please sign in or sign up.',
    'Спершу додайте щось до списку': 'Add something to the list first',
    'Увійдіть або зареєструйтеся, щоб оформити замовлення. Ваш список збережеться.': 'Sign in or sign up to place your order. Your list will be kept.',
    'Ваш список збережено в акаунті': 'Your list is saved to your account',
    'Нове': 'New', 'Готується': 'Preparing', 'Готове до видачі': 'Ready for pickup', 'Видано': 'Picked up', 'Скасовано': 'Cancelled', 'щойно': 'just now',

    // Контакти
    'Адреса, години роботи та контакти кав\'ярні «Зерно».': 'Zerno address, opening hours and contacts.',
    'Скажіть': 'Say', 'привіт': 'hello', 'Адреса': 'Address', 'вул. Хрещатик, 15, Київ': '15 Khreshchatyk St, Kyiv',
    'Телефон': 'Phone', 'Пошта': 'Email', 'Години': 'Hours', 'Пн – Пт': 'Mon – Fri', 'Сб – Нд': 'Sat – Sun',
    'Напишіть нам': 'Write to us', 'Ім\'я': 'Name', 'Повідомлення': 'Message', 'Надіслати': 'Send',
    'Зараз зачинено': 'Closed now', 'Дякуємо! Ми відповімо найближчим часом.': 'Thank you! We’ll get back to you soon.',

    // Вхід і реєстрація
    'Увійти': 'Sign in', 'Мій акаунт': 'My account', 'Адмін-панель': 'Admin panel', 'Вийти': 'Sign out', 'Ви вийшли з акаунта': 'You signed out',
    'Вхід': 'Sign in', 'Реєстрація': 'Sign up', 'З поверненням': 'Welcome back', 'Пароль': 'Password', 'Забули пароль?': 'Forgot password?',
    'Створити акаунт': 'Create account', 'Пароль (мін. 8 символів)': 'Password (min. 8 characters)', 'Повторіть пароль': 'Repeat password',
    'Як захистити вхід?': 'How should we protect sign-in?', 'Лише пароль': 'Password only', 'Швидко й просто: пошта + пароль.': 'Quick and simple: email + password.',
    'Пароль + Google Authenticator': 'Password + Google Authenticator',
    'Двоетапна перевірка: при вході ще й код із застосунку.': 'Two-step verification: a code from the app is also needed to sign in.',
    'Двоетапна перевірка': 'Two-step verification',
    'Відкрийте Google Authenticator і введіть 6-значний код для «Zerno Cafe».': 'Open Google Authenticator and enter the 6-digit code for “Zerno Cafe”.',
    'Код із застосунку': 'Code from the app', 'Підтвердіть пошту': 'Confirm your email', 'Ми надіслали лист на': 'We sent an email to',
    'Перейдіть за посиланням у ньому (перевірте й «Спам»), а потім поверніться сюди. Без підтвердженої пошти Google Authenticator не підключити.': 'Follow the link in it (check Spam too), then come back here. Google Authenticator can’t be set up without a confirmed email.',
    'Я підтвердив пошту': 'I’ve confirmed my email', 'Я підтвердив': 'I’ve confirmed', 'Надіслати лист ще раз': 'Resend email',
    'Налаштую пізніше в акаунті': 'I’ll set it up later', 'Відновлення пароля': 'Password reset',
    'Надішлемо лист із посиланням для нового пароля.': 'We’ll send you a link to set a new password.', 'Надіслати лист': 'Send email', 'Назад до входу': 'Back to sign in',
    'Ви увійшли ☕': 'You’re signed in ☕', 'Паролі не збігаються.': 'Passwords don’t match.',
    'Акаунт створено! Ми надіслали лист для підтвердження пошти.': 'Account created! We sent you an email to confirm your address.',
    'Лист надіслано — перевірте пошту.': 'Email sent — check your inbox.', 'Лист надіслано — перевірте пошту': 'Email sent — check your inbox',
    'Лист надіслано ще раз': 'Email sent again', 'Пошту ще не підтверджено. Перейдіть за посиланням у листі.': 'Email not confirmed yet. Follow the link in the email.',
    'Пошту ще не підтверджено': 'Email not confirmed yet',
    'Готово! Двоетапну перевірку ввімкнено 🔐': 'Done! Two-step verification is on 🔐', 'Двоетапну перевірку ввімкнено 🔐': 'Two-step verification is on 🔐',
    'Готуємо секретний ключ…': 'Preparing the secret key…', 'Встановіть': 'Install', 'на телефон (App Store / Google Play).': 'on your phone (App Store / Google Play).',
    'Натисніть «+» → «Сканувати QR-код» і наведіть камеру:': 'Tap “+” → “Scan a QR code” and point the camera:',
    'код для Google Authenticator': 'code for Google Authenticator', 'Не виходить сканувати? Введіть ключ вручну': 'Can’t scan? Enter the key manually',
    'Копіювати ключ': 'Copy key', 'Введіть 6-значний код, який з\'явився в застосунку:': 'Enter the 6-digit code shown in the app:',
    'Увімкнути перевірку': 'Turn on verification', 'Ключ скопійовано': 'Key copied', 'QR-код не завантажився — введіть ключ вручну.': 'QR code failed to load — enter the key manually.',
    'З міркувань безпеки підтвердіть пароль ще раз.': 'For security, please confirm your password again.', 'Поточний пароль': 'Current password',
    'Код із Google Authenticator': 'Google Authenticator code',

    // Помилки
    'Неправильна пошта або пароль.': 'Wrong email or password.', 'Неправильний пароль.': 'Wrong password.',
    'Акаунта з такою поштою немає.': 'No account with this email.', 'Акаунт з такою поштою вже існує. Спробуйте увійти.': 'An account with this email already exists. Try signing in.',
    'Некоректна адреса пошти.': 'Invalid email address.', 'Введіть пароль.': 'Enter your password.',
    'Пароль занадто простий — щонайменше 8 символів.': 'Password is too weak — at least 8 characters.', 'Забагато спроб. Зачекайте кілька хвилин.': 'Too many attempts. Wait a few minutes.',
    'Неправильний код. Зачекайте, поки в застосунку з\'явиться новий, і спробуйте ще раз.': 'Wrong code. Wait for a new one in the app and try again.',
    'Введіть 6-значний код.': 'Enter the 6-digit code.', 'Немає з\'єднання з інтернетом.': 'No internet connection.',
    'Для цієї дії підтвердьте пароль ще раз.': 'Please confirm your password again for this action.',
    'Спершу підтвердіть пошту за посиланням із листа.': 'Confirm your email via the link first.',
    'Цей спосіб входу вимкнено в налаштуваннях Firebase.': 'This sign-in method is disabled in Firebase settings.',
    'Двоетапну перевірку вже налаштовано.': 'Two-step verification is already set up.', 'Немає доступу до цієї дії.': 'You don’t have access to this action.',
    'Сервер тимчасово недоступний. Спробуйте ще раз.': 'Server is temporarily unavailable. Try again.',

    // Акаунт
    'Акаунт': 'Account', 'Мій': 'My', 'акаунт': 'account', 'Завантаження…': 'Loading…', 'Ви ще не увійшли': 'You’re not signed in',
    'Акаунт не обов\'язковий, але з ним ваш список зберігається на будь-якому пристрої, а замовлення — в історії.': 'An account is optional, but with it your list syncs across devices and your orders are kept in history.',
    'Зареєструватися': 'Sign up', 'Профіль': 'Profile', 'Відкрити адмін-панель': 'Open admin panel', 'Змінити пароль': 'Change password',
    'Новий пароль (мін. 8)': 'New password (min. 8)', 'Зберегти пароль': 'Save password', 'Вийти з акаунта': 'Sign out',
    'Мої замовлення': 'My orders', 'Пароль змінено 🔐': 'Password changed 🔐', 'Замовлень поки немає.': 'No orders yet.', 'До меню →': 'To the menu →',
    'Підтверджена': 'Confirmed', 'Не підтверджена': 'Not confirmed', 'Увімкнено': 'On', 'Вимкнено': 'Off', 'Вимкнути': 'Turn off',
    'При кожному вході після пароля потрібен код із застосунку.': 'Every sign-in needs a code from the app after the password.',
    'Вимкнути двоетапну перевірку? Вхід буде лише за паролем.': 'Turn off two-step verification? Sign-in will use the password only.',
    'Двоетапну перевірку вимкнено': 'Two-step verification turned off', 'Перевірку вимкнено. Увійдіть знову.': 'Verification turned off. Please sign in again.',
    'Вхід лише за паролем.': 'Password-only sign-in.', 'Увімкніть, щоб при вході ще й вводити код із Google Authenticator.': 'Turn on to also enter a Google Authenticator code when signing in.',
    'Увімкнути Google Authenticator': 'Turn on Google Authenticator',
    'Спершу підтвердіть пошту — лист можна надіслати в розділі «Профіль»': 'Confirm your email first — you can resend the email in “Profile”',
  };

  // Тексти з підставленими значеннями: [шаблон, переклад]
  const P = [
    [/^Зараз відчинено · до (.+)$/, 'Open now · until $1'],
    [/^Замовлення №(.+?) прийнято! ☕$/, 'Order #$1 received! ☕'],
    [/^Не вдалося оформити: (.*)$/, 'Could not place the order: $1'],
    [/^Не вдалося зберегти кошик: (.*)$/, 'Could not save the cart: $1'],
    [/^Щось пішло не так(.*)$/, 'Something went wrong$1'],
    [/^Коментар: (.*)$/, 'Comment: $1'],
  ];

  const norm = (s) => s.replace(/[’ʼ]/g, "'").replace(/\s+/g, ' ').trim();
  const dict = new Map(Object.entries(D).map(([k, v]) => [norm(k), v]));

  const t = (raw) => {
    const pre = raw.match(/^[\s←.,:]*/)[0];
    if (pre.trim()) { const r = t(raw.slice(pre.length)); return r ? pre.trim() + (pre.trim() === '←' ? ' ' : ' ') + r : null; }
    const s = norm(raw);
    if (!s || !/[А-Яа-яЇїІіЄєҐґ]/.test(s)) return null;
    if (dict.has(s)) return dict.get(s);
    let m;
    if ((m = s.match(/^Додати (.+)$/))) return 'Add ' + (dict.get(m[1]) || m[1]);
    if ((m = s.match(/^«(.+)» додано до замовлення ☕$/))) return `“${dict.get(m[1]) || m[1]}” added to your order ☕`;
    for (const [re, en] of P) if (re.test(s)) return s.replace(re, en);
    const r = s.replace(/Кав'ярня «Зерно»/g, 'Zerno Coffee').replace(/(\d) грн/g, '$1 UAH');
    return r !== s ? r : null;
  };

  const ATTRS = ['placeholder', 'aria-label', 'alt', 'title'];
  const fixText = (n) => {
    const en = t(n.nodeValue);
    if (en) n.nodeValue = n.nodeValue.replace(/^(\s*)[\s\S]*?(\s*)$/, `$1${en}$2`);
  };
  const walk = (root) => {
    if (root.nodeType === 3) return fixText(root);
    if (root.nodeType !== 1 || root.closest('script,style')) return;
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; while ((n = tw.nextNode())) fixText(n);
    [root, ...root.querySelectorAll('[placeholder],[aria-label],[alt],[title]')].forEach((el) =>
      ATTRS.forEach((a) => { const v = el.getAttribute?.(a); const en = v && t(v); if (en) el.setAttribute(a, en); }));
  };

  const start = () => {
    document.title = t(document.title) || document.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = t(meta.content) || meta.content;
    walk(document.body);
    new MutationObserver((list) => list.forEach((m) => {
      if (m.type === 'characterData') fixText(m.target);
      else m.addedNodes.forEach(walk);
    })).observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  start(); // скрипт deferred: DOM уже є, а site.js ще не розбив заголовки на слова

  // Діалоги підтвердження
  const c = window.confirm.bind(window), a = window.alert.bind(window);
  window.confirm = (msg) => c(t(String(msg)) || msg);
  window.alert = (msg) => a(t(String(msg)) || msg);
})();
