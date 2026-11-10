// Публічні налаштування веб-застосунку Firebase (проєкт «Coffee»).
// Ці ключі не є секретом: доступ до даних захищають правила firestore.rules.
export const firebaseConfig = {
  apiKey: 'AIzaSyDcfe3Qiuz2QOr45xX3oP3ZW-O08-f2udg',
  authDomain: 'coffee-b3e1c.firebaseapp.com',
  projectId: 'coffee-b3e1c',
  storageBucket: 'coffee-b3e1c.firebasestorage.app',
  messagingSenderId: '205271337323',
  appId: '1:205271337323:web:56fab605972410ef9d242e',
};

// Головний адміністратор. Його права закріплені й у firestore.rules —
// змінюйте в обох місцях одночасно. Інших адмінів додають в адмін-панелі.
export const OWNER_EMAIL = 'denys2017vk@gmail.com';
