/* =========================================================
   Chat ilova: Kirish, Ro'yxatdan o'tish va Chat (bitta JS)
   Backend yo'q: hamma ma'lumot brauzerda (localStorage) saqlanadi.
   - Foydalanuvchilar va xabarlar: localStorage (barcha oynalar uchun umumiy)
   - Kirgan akkaunt: sessionStorage (har bir oynada alohida akkaunt bo'lishi mumkin)
   ========================================================= */
(() => {
  'use strict';

  /* ---------- Saqlash ---------- */
  const KEY_USERS = 'chat.users';
  const KEY_MSGS = 'chat.messages';
  const KEY_SESSION = 'chat.session';

  const $ = (id) => document.getElementById(id);

  function load(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v == null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }
  const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const getUsers = () => load(KEY_USERS, []);
  const getMessages = () => load(KEY_MSGS, []);
  const getSession = () => sessionStorage.getItem(KEY_SESSION);

  /* ---------- Parolni xeshlash ---------- */
  async function hashPassword(text) {
    const data = new TextEncoder().encode('chat-salt:' + text);
    if (window.crypto && window.crypto.subtle) {
      const buf = await window.crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    // Zaxira usul (crypto.subtle bo'lmagan muhit uchun)
    let h = 5381;
    for (const b of data) h = ((h << 5) + h + b) >>> 0;
    return 'f' + h.toString(16);
  }

  /* ---------- Demo foydalanuvchilar (sinab ko'rish uchun) ---------- */
  const BOT_REPLIES = [
    'Vaaleykum assalom! 👋',
    "Yaxshi, o'zingizda nima gap?",
    'Tushundim, rahmat!',
    'Ha, albatta 🙂',
    'Ajoyib, davom etamiz!',
    'Qiziq ekan, yana ayting.',
  ];

  async function seedDemoUsers() {
    if (getUsers().length) return;
    const hash = await hashPassword('1234');
    if (getUsers().length) return; // boshqa oyna ulgurgan bo'lsa
    save(KEY_USERS, [
      { login: 'ali', ism: 'Ali', familiya: 'Valiyev', hash, demo: true },
      { login: 'malika', ism: 'Malika', familiya: 'Karimova', hash, demo: true },
      { login: 'vali', ism: 'Vali', familiya: 'Aliyev', hash, demo: true },
    ]);
  }

  /* ---------- Yordamchi funksiyalar ---------- */
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function hueFor(login) {
    let h = 0;
    for (const ch of login) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
  }

  function paintAvatar(node, login) {
    if (!login) {
      node.textContent = '?';
      node.classList.add('empty');
      node.style.background = '';
      return;
    }
    const h = hueFor(login);
    node.classList.remove('empty');
    node.textContent = login.charAt(0);
    node.style.background = `linear-gradient(135deg, hsl(${h} 75% 58%), hsl(${(h + 40) % 360} 75% 48%))`;
  }

  function makeAvatar(login) {
    const a = el('div', 'avatar');
    paintAvatar(a, login);
    return a;
  }

  const pad = (n) => String(n).padStart(2, '0');
  const fmtTime = (ts) => {
    const d = new Date(ts);
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  };
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  function dayLabel(ts) {
    const d = new Date(ts);
    const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
    if (diff === 0) return 'Bugun';
    if (diff === 1) return 'Kecha';
    return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
  }

  function setNote(node, text, type) {
    node.textContent = text || '';
    node.className = 'note' + (type ? ' ' + type : '');
  }

  /* ---------- Oynalarni almashtirish ---------- */
  const views = {
    login: $('view-login'),
    register: $('view-register'),
    chat: $('view-chat'),
  };
  const titles = { login: 'Kirish', register: "Ro'yxatdan o'tish", chat: 'Chat' };

  function showView(name) {
    Object.entries(views).forEach(([key, node]) => node.classList.toggle('active', key === name));
    document.title = titles[name];
    const focusTarget = { login: 'loginLogin', register: 'regLogin' }[name];
    if (focusTarget) setTimeout(() => $(focusTarget).focus(), 50);
  }

  function route() {
    const me = getSession();
    if (me && getUsers().some((u) => u.login === me)) {
      showView('chat');
      initChat();
      return;
    }
    sessionStorage.removeItem(KEY_SESSION);
    const hash = location.hash.replace('#', '');
    showView(hash === 'royxat' ? 'register' : 'login');
  }
  window.addEventListener('hashchange', route);

  /* ---------- Parolni ko'rsatish / yashirish ---------- */
  document.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = $(btn.dataset.toggle);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Yashirish' : "Ko'rsatish";
    });
  });

  /* =========================================================
     1-oyna: KIRISH
     ========================================================= */
  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const note = $('loginNote');
    const login = $('loginLogin').value.trim();
    const parol = $('loginParol').value;

    if (!login || !parol) return setNote(note, "Login va parolni kiriting", 'error');

    const user = getUsers().find((u) => u.login.toLowerCase() === login.toLowerCase());
    const hash = await hashPassword(parol);
    if (!user || user.hash !== hash) return setNote(note, "Login yoki parol noto'g'ri", 'error');

    sessionStorage.setItem(KEY_SESSION, user.login);
    $('loginForm').reset();
    setNote(note, '');
    if (location.hash !== '#chat') location.hash = '#chat';
    else route();
  });

  /* =========================================================
     2-oyna: RO'YXATDAN O'TISH
     ========================================================= */
  $('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const note = $('registerNote');
    const login = $('regLogin').value.trim();
    const familiya = $('regFamiliya').value.trim();
    const ism = $('regIsm').value.trim();
    const parol = $('regParol').value;
    const parol2 = $('regParol2').value;

    if (!login || !familiya || !ism || !parol || !parol2) return setNote(note, "Barcha maydonlarni to'ldiring", 'error');
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(login)) return setNote(note, "Login 3-20 ta harf, raqam yoki _ dan iborat bo'lsin", 'error');
    if (parol.length < 4) return setNote(note, "Parol kamida 4 ta belgi bo'lsin", 'error');
    if (parol !== parol2) return setNote(note, 'Parollar mos kelmadi', 'error');

    const users = getUsers();
    if (users.some((u) => u.login.toLowerCase() === login.toLowerCase())) return setNote(note, 'Bu login band', 'error');

    users.push({ login, familiya, ism, hash: await hashPassword(parol) });
    save(KEY_USERS, users);

    $('registerForm').reset();
    setNote(note, '');
    setNote($('loginNote'), "Ro'yxatdan muvaffaqiyatli o'tdingiz! Endi kiring.", 'success');
    location.hash = '#kirish';
    setTimeout(() => { $('loginLogin').value = login; $('loginParol').focus(); }, 80);
  });

  /* =========================================================
     3-oyna: CHAT
     ========================================================= */
  let peer = null; // tanlangan suhbatdosh logini

  const sidebar = $('sidebar');
  const overlay = $('overlay');

  function setSidebar(open) {
    sidebar.classList.toggle('open', open);
    overlay.classList.toggle('show', open);
  }
  $('menuBtn').addEventListener('click', () => setSidebar(!sidebar.classList.contains('open')));
  overlay.addEventListener('click', () => setSidebar(false));

  function between(msgs, a, b) {
    return msgs.filter((m) => (m.from === a && m.to === b) || (m.from === b && m.to === a));
  }

  /* --- Chap panel: loginlar ro'yxati --- */
  function renderUsers() {
    const me = getSession();
    const q = $('userSearch').value.trim().toLowerCase();
    const msgs = getMessages();
    const list = $('userList');
    list.innerHTML = '';

    const all = getUsers().filter((u) => u.login !== me);
    $('userCount').textContent = all.length;

    const rows = all
      .filter((u) => u.login.toLowerCase().includes(q))
      .map((u) => {
        const convo = between(msgs, me, u.login);
        return {
          user: u,
          last: convo[convo.length - 1],
          unread: convo.filter((m) => m.to === me && !m.read).length,
        };
      })
      .sort((a, b) => ((b.last ? b.last.time : 0) - (a.last ? a.last.time : 0)) || a.user.login.localeCompare(b.user.login));

    if (!rows.length) {
      const li = el('li', 'list-empty', all.length ? 'Hech narsa topilmadi' : "Hozircha boshqa foydalanuvchi yo'q. Boshqa oynada ro'yxatdan o'ting.");
      list.appendChild(li);
      return;
    }

    rows.forEach(({ user, last, unread }) => {
      const li = document.createElement('li');
      const btn = el('button', 'user-item' + (user.login === peer ? ' active' : ''));
      btn.type = 'button';
      btn.title = user.ism + ' ' + user.familiya;

      const info = el('div', 'info');
      info.append(
        el('span', 'name', user.login),
        el('span', 'preview', last ? (last.from === me ? 'Siz: ' : '') + last.text : user.ism + ' ' + user.familiya)
      );

      const meta = el('div', 'meta');
      if (last) meta.appendChild(el('span', '', fmtTime(last.time)));
      if (unread) meta.appendChild(el('span', 'badge', String(unread)));

      btn.append(makeAvatar(user.login), info, meta);
      btn.addEventListener('click', () => openChat(user.login));
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  /* --- O'ng panel: xabarlar --- */
  function renderMessages() {
    const me = getSession();
    const box = $('messages');
    box.innerHTML = '';

    if (!peer) {
      box.appendChild(placeholder('Yozishmani boshlang', 'Chapdagi ro\'yxatdan loginni tanlang va xabar yozing.'));
      return;
    }

    const convo = between(getMessages(), me, peer);
    if (!convo.length) {
      box.appendChild(placeholder('Hali xabar yo\'q', 'Birinchi bo\'lib salom yozing 👋'));
      return;
    }

    let lastDay = '';
    convo.forEach((m) => {
      const label = dayLabel(m.time);
      if (label !== lastDay) {
        box.appendChild(el('div', 'day', label));
        lastDay = label;
      }
      const bubble = el('div', 'msg ' + (m.from === me ? 'mine' : 'theirs'));
      bubble.append(el('span', 'text', m.text), el('span', 'time', fmtTime(m.time)));
      box.appendChild(bubble);
    });
    box.scrollTop = box.scrollHeight;
  }

  function placeholder(title, text) {
    const wrap = el('div', 'placeholder');
    const icon = el('div', 'ph-icon');
    icon.innerHTML = '<svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor" aria-hidden="true"><path d="M5 4h14a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-7l-5 4v-4H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z"/></svg>';
    wrap.append(icon, el('strong', '', title), document.createTextNode(text));
    return wrap;
  }

  function renderHeader() {
    const user = getUsers().find((u) => u.login === peer);
    paintAvatar($('peerAvatar'), user ? user.login : null);
    $('peerName').textContent = user ? user.login : 'Suhbatni tanlang';
    $('peerFull').textContent = user ? user.ism + ' ' + user.familiya : "Chapdagi ro'yxatdan login tanlang";
    $('msgInput').disabled = !user;
    $('sendBtn').disabled = !user;
  }

  /* --- Suhbatni ochish --- */
  function markRead() {
    const me = getSession();
    const msgs = getMessages();
    let changed = false;
    msgs.forEach((m) => {
      if (m.to === me && m.from === peer && !m.read) { m.read = true; changed = true; }
    });
    if (changed) save(KEY_MSGS, msgs);
  }

  function openChat(login) {
    peer = login;
    markRead();
    renderHeader();
    renderUsers();
    renderMessages();
    setSidebar(false);
    $('msgInput').focus();
  }

  function initChat() {
    const me = getSession();
    $('meName').textContent = me;
    paintAvatar($('meAvatar'), me);
    if (peer && !getUsers().some((u) => u.login === peer)) peer = null;
    renderHeader();
    renderUsers();
    renderMessages();
  }

  /* --- Xabar yuborish --- */
  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  $('sendForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = $('msgInput').value.trim();
    const me = getSession();
    if (!text || !peer || !me) return;

    const msgs = getMessages();
    msgs.push({ id: newId(), from: me, to: peer, text, time: Date.now(), read: false });
    save(KEY_MSGS, msgs);
    $('msgInput').value = '';
    renderMessages();
    renderUsers();

    const target = getUsers().find((u) => u.login === peer);
    if (target && target.demo) botReply(me, target.login);
  });

  // Demo foydalanuvchilar yozilgan xabarga o'zi javob beradi
  function botReply(me, bot) {
    setTimeout(() => {
      const msgs = getMessages();
      const viewing = getSession() === me && peer === bot;
      msgs.push({
        id: newId(),
        from: bot,
        to: me,
        text: BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)],
        time: Date.now(),
        read: viewing,
      });
      save(KEY_MSGS, msgs);
      if (getSession() === me) {
        renderUsers();
        if (viewing) renderMessages();
      }
    }, 900 + Math.random() * 700);
  }

  /* --- Chiqish --- */
  $('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem(KEY_SESSION);
    peer = null;
    $('userSearch').value = '';
    setSidebar(false);
    if (location.hash !== '#kirish') location.hash = '#kirish';
    else route();
  });

  $('userSearch').addEventListener('input', renderUsers);

  /* --- Boshqa oynada o'zgarish bo'lsa (real vaqtga yaqin) --- */
  window.addEventListener('storage', (e) => {
    if (!getSession()) return;
    if (e.key === null || e.key === KEY_MSGS || e.key === KEY_USERS) {
      if (peer) markRead();
      renderUsers();
      renderMessages();
    }
  });

  /* ---------- Boshlash ---------- */
  seedDemoUsers().then(route);
})();
