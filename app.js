/* Reja — oddiy, lokal vazifalar ilovasi (bitta foydalanuvchi, login yo'q).
   Ma'lumotlar brauzerning localStorage'ida saqlanadi. */
(function () {
  "use strict";

  const STORAGE_KEY = "reja.todo.v1";

  /* ---------- Ikonkalar ---------- */
  const svg = (inner, sw) =>
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 2) +
    '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + "</svg>";

  const ICONS = {
    check: svg('<path d="M20 6 9 17l-5-5"/>', 3),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
    trash: svg('<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
    search: svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>'),
    moon: svg('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'),
    sunrise: svg('<path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/>'),
    dashed: svg('<circle cx="12" cy="12" r="9" stroke-dasharray="3.5 3"/>'),
    calendar: svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
    inbox: svg('<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>'),
    list: svg('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
    checkCircle: svg('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>'),
    flag: svg('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>'),
    feather: svg('<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><path d="M16 8 2 22"/><path d="M17.5 15H9"/>'),
    repeat: svg('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'),
    listCheck: svg('<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8M13 12h8M13 18h8"/>'),
    note: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/>'),
    download: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>'),
    upload: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>'),
    lock: svg('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
    alert: svg('<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>'),
    chevron: svg('<path d="m9 18 6-6-6-6"/>')
  };

  /* ---------- Lug'atlar ---------- */
  const TIME = {
    morning: { label: "Ertalab", side: "Ertalabki", icon: "sunrise" },
    evening: { label: "Kechqurun", side: "Kechki", icon: "moon" },
    none: { label: "Teglanmagan", side: "Teglanmagan", icon: "dashed" }
  };
  const KIND = {
    required: { label: "Majburiy", icon: "flag" },
    optional: { label: "Ixtiyoriy", icon: "feather" },
    none: { label: "Teglanmagan", icon: "dashed" }
  };
  const TIME_ORDER = ["morning", "evening", "none"];
  const KIND_ORDER = ["required", "optional", "none"];
  const REPEAT = { none: "Yoʻq", daily: "Har kuni", weekly: "Har hafta" };

  const TIME_TAGS = { ertalab: "morning", ertalabki: "morning", tong: "morning", tonggi: "morning", kech: "evening", kechki: "evening", kechqurun: "evening", kechasi: "evening" };
  const KIND_TAGS = { majburiy: "required", shart: "required", ixtiyoriy: "optional" };
  const REPEAT_TAGS = { harkuni: "daily", kunlik: "daily", harhafta: "weekly", haftalik: "weekly" };

  const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
  const MONTHS_SHORT = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
  const WEEKDAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

  /* ---------- Yordamchilar ---------- */
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const clip = (s, n) => (s.length > (n || 40) ? s.slice(0, (n || 40) - 1) + "…" : s);
  const pad = (n) => String(n).padStart(2, "0");

  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function today() { return ymd(new Date()); }
  function parseYmd(s) { const p = s.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function addDays(s, n) { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); }
  function longDate(d) { return WEEKDAYS[d.getDay()] + ", " + d.getDate() + "-" + MONTHS[d.getMonth()]; }
  function dateLabel(s) {
    if (!s) return "";
    const t = today();
    if (s === t) return "Bugun";
    if (s === addDays(t, 1)) return "Ertaga";
    if (s === addDays(t, -1)) return "Kecha";
    const d = parseYmd(s);
    const base = d.getDate() + "-" + MONTHS_SHORT[d.getMonth()];
    return d.getFullYear() !== new Date().getFullYear() ? base + " " + d.getFullYear() : base;
  }

  /* ---------- Saqlash ---------- */
  function prefersDark() {
    try { return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches; } catch (e) { return false; }
  }

  function normalizeTask(t) {
    return {
      id: String(t.id || uid()),
      title: String(t.title || "").trim() || "Nomsiz vazifa",
      note: String(t.note || ""),
      date: /^\d{4}-\d{2}-\d{2}$/.test(t.date || "") ? t.date : "",
      time: TIME[t.time] ? t.time : "none",
      kind: KIND[t.kind] ? t.kind : "none",
      repeat: REPEAT[t.repeat] ? t.repeat : "none",
      subtasks: Array.isArray(t.subtasks)
        ? t.subtasks.filter((s) => s && s.title).map((s) => ({ id: String(s.id || uid()), title: String(s.title), done: !!s.done }))
        : [],
      done: !!t.done,
      doneAt: t.done ? Number(t.doneAt) || Date.now() : null,
      createdAt: Number(t.createdAt) || Date.now(),
      order: Number.isFinite(t.order) ? t.order : Date.now()
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && Array.isArray(d.tasks)) {
          return {
            tasks: d.tasks.filter((t) => t && typeof t === "object").map(normalizeTask),
            theme: d.theme === "dark" ? "dark" : "light",
            sort: ["manual", "required", "date"].indexOf(d.sort) >= 0 ? d.sort : "manual"
          };
        }
      }
    } catch (e) {
      console.warn("Reja: maʼlumotni oʻqib boʻlmadi", e);
    }
    return { tasks: [], theme: prefersDark() ? "dark" : "light", sort: "manual" };
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      showToast("Saqlab boʻlmadi — brauzer xotirasi toʻlgan boʻlishi mumkin", false);
    }
  }

  /* ---------- Holat ---------- */
  let data = load();
  let lastDay = today();

  const ui = {
    view: "today",
    fTime: null,
    fKind: null,
    query: "",
    selected: null,
    flashId: null,
    dragId: null,
    undo: null,
    toastTimer: null,
    add: {
      time: "none", timeManual: "none", timeTag: false,
      kind: "none", kindManual: "none", kindTag: false,
      date: "", dateManual: "", dateTag: false,
      repeat: "none"
    }
  };

  const VIEWS = {
    today: { title: "Bugun", match: (t) => !t.done && !!t.date && t.date <= today() },
    upcoming: { title: "Rejalashtirilgan", match: (t) => !t.done && !!t.date && t.date > today() },
    nodate: { title: "Muddatsiz", match: (t) => !t.done && !t.date },
    all: { title: "Barcha faol vazifalar", match: (t) => !t.done },
    done: { title: "Bajarilgan", match: (t) => t.done }
  };
  const VIEW_KEYS = ["today", "upcoming", "nodate", "all", "done"];

  const find = (id) => data.tasks.find((t) => t.id === id);
  const nextOrder = () => data.tasks.reduce((m, t) => Math.max(m, t.order), 0) + 1;
  const defaultDate = () => (ui.view === "upcoming" ? addDays(today(), 1) : ui.view === "nodate" ? "" : today());

  function snapshot() { ui.undo = JSON.stringify(data.tasks); }

  function commit() {
    save();
    render();
  }

  // Undo qilinmaydigan oddiy tahrir: eski undo nusxasini bekor qilamiz
  function editCommit() {
    ui.undo = null;
    $("#toastUndo").hidden = true;
    commit();
  }

  // Matn yozilayotganda: tafsilotlar paneli qayta chizilmaydi (fokus yo'qolmasin)
  function quietCommit() {
    ui.undo = null;
    $("#toastUndo").hidden = true;
    save();
    renderSidebar();
    renderHead();
    renderList();
  }

  /* ---------- Filtrlash va tartiblash ---------- */
  function matchesQuery(t, q) {
    if (!q) return true;
    return t.title.toLowerCase().indexOf(q) >= 0 ||
      t.note.toLowerCase().indexOf(q) >= 0 ||
      t.subtasks.some((s) => s.title.toLowerCase().indexOf(q) >= 0);
  }

  function visibleTasks() {
    const q = ui.query.trim().toLowerCase();
    return data.tasks.filter((t) =>
      VIEWS[ui.view].match(t) &&
      (!ui.fTime || t.time === ui.fTime) &&
      (!ui.fKind || t.kind === ui.fKind) &&
      matchesQuery(t, q));
  }

  function sortTasks(list) {
    const arr = list.slice();
    if (ui.view === "done") return arr.sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
    const rank = { required: 0, none: 1, optional: 2 };
    if (data.sort === "required") arr.sort((a, b) => rank[a.kind] - rank[b.kind] || a.order - b.order);
    else if (data.sort === "date") arr.sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999") || a.order - b.order);
    else arr.sort((a, b) => a.order - b.order);
    return arr;
  }

  /* ---------- Tezkor qo'shish: teglarni ajratish ---------- */
  function normWord(w) { return w.toLowerCase().replace(/[ʻʼ'`‘’]/g, ""); }

  function buildDate(d, m, y) {
    const now = new Date();
    let year = y ? (y.length === 2 ? 2000 + Number(y) : Number(y)) : now.getFullYear();
    let dt = new Date(year, Number(m) - 1, Number(d));
    if (dt.getMonth() !== Number(m) - 1 || dt.getDate() !== Number(d)) return null;
    if (!y && ymd(dt) < today()) { year += 1; dt = new Date(year, Number(m) - 1, Number(d)); }
    return ymd(dt);
  }

  function parseInput(raw) {
    const res = { time: null, kind: null, date: null, repeat: null, title: "" };
    const keep = [];
    raw.split(/\s+/).filter(Boolean).forEach((w) => {
      const lw = normWord(w);
      if (lw.charAt(0) === "#") {
        const tag = lw.slice(1);
        if (TIME_TAGS[tag]) { res.time = TIME_TAGS[tag]; return; }
        if (KIND_TAGS[tag]) { res.kind = KIND_TAGS[tag]; return; }
        if (REPEAT_TAGS[tag]) { res.repeat = REPEAT_TAGS[tag]; return; }
      }
      if (res.date === null) {
        if (lw === "bugun") { res.date = today(); return; }
        if (lw === "ertaga") { res.date = addDays(today(), 1); return; }
        if (lw === "indinga") { res.date = addDays(today(), 2); return; }
        const m = lw.match(/^(\d{1,2})[./](\d{1,2})(?:[./](\d{2}|\d{4}))?$/);
        if (m) {
          const d = buildDate(m[1], m[2], m[3]);
          if (d) { res.date = d; return; }
        }
      }
      keep.push(w);
    });
    let title = keep.join(" ").trim();
    if (title) title = title.charAt(0).toUpperCase() + title.slice(1);
    res.title = title;
    return res;
  }

  function isDateWord(w) {
    const lw = normWord(w);
    return lw === "bugun" || lw === "ertaga" || lw === "indinga" || /^\d{1,2}[./]\d{1,2}([./](\d{2}|\d{4}))?$/.test(lw);
  }

  // Foydalanuvchi tugmani bosganda, matndagi shu turdagi teglarni olib tashlaymiz
  function stripWords(test) {
    const input = $("#addInput");
    const endsWithSpace = /\s$/.test(input.value);
    const words = input.value.split(/\s+/).filter(Boolean).filter((w) => !test(w));
    input.value = words.join(" ") + (words.length && endsWithSpace ? " " : "");
  }
  const tagIn = (map) => (w) => { const lw = normWord(w); return lw.charAt(0) === "#" && !!map[lw.slice(1)]; };

  function onAddInput() {
    const p = parseInput($("#addInput").value);
    const a = ui.add;
    if (p.time) { a.time = p.time; a.timeTag = true; } else if (a.timeTag) { a.time = a.timeManual; a.timeTag = false; }
    if (p.kind) { a.kind = p.kind; a.kindTag = true; } else if (a.kindTag) { a.kind = a.kindManual; a.kindTag = false; }
    if (p.date !== null) { a.date = p.date; a.dateTag = true; } else if (a.dateTag) { a.date = a.dateManual; a.dateTag = false; }
    a.repeat = p.repeat || "none";
    renderAddBar();
  }

  function setAddTime(v) {
    const a = ui.add;
    if (a.timeTag) stripWords(tagIn(TIME_TAGS));
    a.time = v; a.timeManual = v; a.timeTag = false;
    renderAddBar();
  }
  function setAddKind(v) {
    const a = ui.add;
    if (a.kindTag) stripWords(tagIn(KIND_TAGS));
    a.kind = v; a.kindManual = v; a.kindTag = false;
    renderAddBar();
  }

  function resetAdd() {
    const a = ui.add;
    a.time = a.timeManual; a.timeTag = false;
    a.kind = a.kindManual; a.kindTag = false;
    a.date = a.dateManual; a.dateTag = false;
    a.repeat = "none";
  }

  function addTask(e) {
    e.preventDefault();
    const input = $("#addInput");
    const p = parseInput(input.value);
    if (!p.title) { input.focus(); return; }
    const a = ui.add;
    snapshot();
    const t = normalizeTask({
      id: uid(), title: p.title, date: a.date, time: a.time, kind: a.kind,
      repeat: a.repeat, createdAt: Date.now(), order: nextOrder()
    });
    data.tasks.push(t);
    input.value = "";
    resetAdd();
    ui.flashId = t.id;
    commit();
    const visible = visibleTasks().some((x) => x.id === t.id);
    if (!visible) {
      const where = !t.date ? "Muddatsiz" : t.date > today() ? "Rejalashtirilgan" : "Bugun";
      showToast("Qoʻshildi → «" + where + "»: " + clip(t.title), true);
    }
    input.focus();
  }

  /* ---------- Amallar ---------- */
  function toggleDone(id, refocus) {
    const t = find(id);
    if (!t) return;
    snapshot();
    let msg;
    if (!t.done) {
      t.done = true;
      t.doneAt = Date.now();
      msg = "Bajarildi: " + clip(t.title, 36);
      if (t.repeat !== "none") {
        const t0 = today();
        const base = t.date && t.date >= t0 ? t.date : t0;
        const next = addDays(base, t.repeat === "daily" ? 1 : 7);
        data.tasks.push(normalizeTask({
          title: t.title, note: t.note, date: next, time: t.time, kind: t.kind, repeat: t.repeat,
          subtasks: t.subtasks.map((s) => ({ title: s.title, done: false })),
          createdAt: Date.now(), order: t.order
        }));
        msg += " · keyingisi: " + dateLabel(next).toLowerCase();
      }
    } else {
      t.done = false;
      t.doneAt = null;
      msg = "Qayta faollashtirildi: " + clip(t.title, 36);
    }
    commit();
    showToast(msg, true);
    if (refocus) {
      const b = $('.task[data-id="' + id + '"] .check');
      if (b) b.focus();
    }
  }

  function deleteTask(id) {
    const t = find(id);
    if (!t) return;
    snapshot();
    data.tasks = data.tasks.filter((x) => x.id !== id);
    if (ui.selected === id) ui.selected = null;
    commit();
    showToast("Oʻchirildi: " + clip(t.title), true);
  }

  function rescheduleOverdue() {
    const t0 = today();
    const list = data.tasks.filter((t) => !t.done && t.date && t.date < t0);
    if (!list.length) return;
    snapshot();
    list.forEach((t) => { t.date = t0; });
    commit();
    showToast(list.length + " ta vazifa bugunga koʻchirildi", true);
  }

  function clearDone() {
    const n = data.tasks.filter((t) => t.done).length;
    if (!n) return;
    snapshot();
    data.tasks = data.tasks.filter((t) => !t.done);
    if (ui.selected && !find(ui.selected)) ui.selected = null;
    commit();
    showToast(n + " ta bajarilgan vazifa oʻchirildi", true);
  }

  function moveTask(id, time, ids, index) {
    const t = find(id);
    if (!t) return;
    const order = ids.slice();
    order.splice(Math.max(0, Math.min(index, order.length)), 0, id);
    const current = sortTasks(visibleTasks()).filter((x) => x.time === time).map((x) => x.id);
    if (t.time === time && current.join("|") === order.join("|")) return;

    snapshot();
    const prevTime = t.time;
    const slots = order.map((x) => find(x).order).sort((a, b) => a - b);
    order.forEach((x, i) => { find(x).order = slots[i]; });
    t.time = time;

    let note = "";
    if (prevTime === time && data.sort !== "manual") {
      data.sort = "manual";
      $("#sortSelect").value = "manual";
      note = " · tartib: qoʻlda";
    }
    commit();
    showToast((prevTime !== time ? "«" + clip(t.title, 30) + "» → " + TIME[time].label : "Tartib yangilandi") + note, true);
  }

  function undo() {
    if (!ui.undo) return;
    data.tasks = JSON.parse(ui.undo);
    ui.undo = null;
    if (ui.selected && !find(ui.selected)) ui.selected = null;
    hideToast();
    commit();
  }

  function select(id) {
    ui.selected = id;
    renderList();
    renderDetail();
  }

  function closeDetail() {
    ui.selected = null;
    renderList();
    renderDetail();
  }

  function setView(v) {
    if (!VIEWS[v]) return;
    ui.view = v;
    ui.add.dateManual = defaultDate();
    if (!ui.add.dateTag) ui.add.date = ui.add.dateManual;
    render();
    $("#main").scrollTop = 0;
  }

  function seed() {
    const t0 = today();
    let o = nextOrder();
    const S = (title, time, kind, extra) => normalizeTask(Object.assign({
      title: title, date: t0, time: time, kind: kind, createdAt: Date.now(), order: o++
    }, extra || {}));
    snapshot();
    data.tasks.push(
      S("Ertalabki mashq — 15 daqiqa", "morning", "required", { repeat: "daily" }),
      S("Kun rejasini koʻrib chiqish", "morning", "required", { repeat: "daily" }),
      S("Ingliz tili: 20 ta yangi soʻz", "morning", "optional"),
      S("Kurs ishi uchun manbalar toʻplash", "none", "required", {
        note: "Kamida ikkita xorijiy manba boʻlsin.",
        subtasks: [{ title: "Kutubxona katalogini koʻrish", done: true }, { title: "5 ta maqolani saralash" }, { title: "Iqtiboslarni yozib olish" }]
      }),
      S("Xarid roʻyxatini tuzish", "none", "none"),
      S("Kitob oʻqish — 20 bet", "evening", "optional", { repeat: "daily" }),
      S("Ertangi kunni rejalashtirish", "evening", "required", { repeat: "daily" }),
      S("Haftalik hisobotni tayyorlash", "morning", "required", { date: addDays(t0, 1) }),
      S("Eski fayllarni tartiblash", "none", "optional", { date: "" })
    );
    commit();
    showToast("Namuna vazifalar qoʻshildi", true);
  }

  /* ---------- Eksport / import ---------- */
  function exportData() {
    const payload = { app: "reja", version: 1, exportedAt: new Date().toISOString(), tasks: data.tasks };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reja-" + today() + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Zaxira nusxa yuklab olindi", false);
  }

  function importFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        const tasks = Array.isArray(obj) ? obj : obj && obj.tasks;
        if (!Array.isArray(tasks)) throw new Error("format");
        const incoming = tasks.filter((t) => t && typeof t === "object").map(normalizeTask);
        if (data.tasks.length && !window.confirm("Faylda " + incoming.length + " ta vazifa bor.\nJoriy " + data.tasks.length + " ta vazifa shular bilan almashtirilsinmi?")) return;
        snapshot();
        data.tasks = incoming;
        ui.selected = null;
        commit();
        showToast(incoming.length + " ta vazifa import qilindi", true);
      } catch (err) {
        showToast("Faylni oʻqib boʻlmadi — Reja JSON fayli emas", false);
      }
    };
    reader.readAsText(file);
  }

  /* ---------- Toast ---------- */
  function showToast(text, canUndo) {
    const el = $("#toast");
    $("#toastText").textContent = text;
    $("#toastUndo").hidden = !(canUndo && ui.undo);
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add("is-on"));
    clearTimeout(ui.toastTimer);
    ui.toastTimer = setTimeout(hideToast, 5500);
  }

  function hideToast() {
    const el = $("#toast");
    clearTimeout(ui.toastTimer);
    el.classList.remove("is-on");
    ui.undo = null;
    setTimeout(() => { if (!el.classList.contains("is-on")) el.hidden = true; }, 200);
  }

  /* ---------- Chizish ---------- */
  function render() {
    renderSidebar();
    renderHead();
    renderAddBar();
    renderList();
    renderDetail();
  }

  function setText(sel, v) { const el = $(sel); if (el) el.textContent = v; }

  function renderSidebar() {
    VIEW_KEYS.forEach((k) => {
      const c = data.tasks.filter(VIEWS[k].match).length;
      setText('[data-count-view="' + k + '"]', c || "");
    });
    $$("[data-view]").forEach((b) => {
      if (b.dataset.view === ui.view) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    const inView = data.tasks.filter(VIEWS[ui.view].match);
    TIME_ORDER.forEach((k) => setText('[data-count-time="' + k + '"]', inView.filter((t) => t.time === k).length || ""));
    KIND_ORDER.forEach((k) => setText('[data-count-kind="' + k + '"]', inView.filter((t) => t.kind === k).length || ""));
    $$("[data-filter-time]").forEach((b) => b.setAttribute("aria-pressed", String(ui.fTime === b.dataset.filterTime)));
    $$("[data-filter-kind]").forEach((b) => b.setAttribute("aria-pressed", String(ui.fKind === b.dataset.filterKind)));
    $("#themeBtn").innerHTML = data.theme === "dark" ? ICONS.sun : ICONS.moon;
  }

  function renderHead() {
    const t0 = today();
    $("#viewTitle").textContent = VIEWS[ui.view].title;
    $("#headDate").textContent = longDate(new Date());
    document.title = VIEWS[ui.view].title + " — Reja";
    $("#clearDoneBtn").hidden = !(ui.view === "done" && data.tasks.some((t) => t.done));

    // Bugungi natija
    const doneToday = (t) => t.done && t.doneAt && ymd(new Date(t.doneAt)) === t0;
    const openToday = (t) => !t.done && t.date && t.date <= t0;
    const pool = data.tasks.filter((t) => doneToday(t) || openToday(t));
    const stat = (arr) => ({ done: arr.filter((t) => t.done).length, total: arr.length });
    const all = stat(pool);
    const req = stat(pool.filter((t) => t.kind === "required"));
    const opt = stat(pool.filter((t) => t.kind === "optional"));
    const card = (label, s, cls) => {
      const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
      return '<div class="stat ' + cls + '"><div class="stat-top"><span>' + label + "</span><strong>" + s.done + " / " + s.total +
        '</strong></div><div class="bar" role="progressbar" aria-label="' + label + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct +
        '"><span style="width:' + pct + '%"></span></div></div>';
    };
    $("#stats").innerHTML = card("Bugungi natija", all, "") + card("Majburiy", req, "stat-req") + card("Ixtiyoriy", opt, "stat-opt");
    const msg = $("#statsMsg");
    if (req.total > 0 && req.done === req.total) {
      msg.innerHTML = ICONS.checkCircle + "<span>Bugungi barcha majburiy vazifalar bajarildi. Zoʻr!</span>";
      msg.hidden = false;
    } else {
      msg.hidden = true;
    }

    // Muddati o'tganlar
    const overdue = data.tasks.filter((t) => !t.done && t.date && t.date < t0).length;
    $("#overdueBanner").hidden = !(ui.view === "today" && overdue > 0);
    setText("#overdueText", overdue + " ta vazifaning muddati oʻtgan");

    // Faol filtrlar
    const chips = [];
    if (ui.fTime) chips.push('<button type="button" class="filter-chip" data-clear="time" aria-label="Kun vaqti filtrini olib tashlash">Kun vaqti: ' + TIME[ui.fTime].side + ICONS.x + "</button>");
    if (ui.fKind) chips.push('<button type="button" class="filter-chip" data-clear="kind" aria-label="Turi filtrini olib tashlash">Turi: ' + KIND[ui.fKind].label + ICONS.x + "</button>");
    if (ui.query.trim()) chips.push('<button type="button" class="filter-chip" data-clear="query" aria-label="Qidiruvni tozalash">Qidiruv: «' + esc(ui.query.trim()) + "»" + ICONS.x + "</button>");
    if (chips.length > 1) chips.push('<button type="button" class="filter-chip" data-clear="all">Hammasini tozalash' + ICONS.x + "</button>");
    const f = $("#activeFilters");
    f.innerHTML = chips.join("");
    f.hidden = !chips.length;
  }

  function renderAddBar() {
    const a = ui.add;
    $$("#addTime button[data-value]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.value === a.time)));
    $$("#addKind button[data-value]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.value === a.kind)));
    const di = $("#addDate");
    if (di.value !== a.date) di.value = a.date;
    $("#addDateWrap").classList.toggle("is-tagged", a.dateTag);
    const rep = $("#addRepeat");
    rep.hidden = a.repeat === "none";
    rep.innerHTML = a.repeat === "none" ? "" : ICONS.repeat + REPEAT[a.repeat];
  }

  function highlight(text) {
    const q = ui.query.trim();
    if (!q) return esc(text);
    const lower = text.toLowerCase();
    const ql = q.toLowerCase();
    let out = "";
    let i = 0;
    let j;
    while ((j = lower.indexOf(ql, i)) !== -1) {
      out += esc(text.slice(i, j)) + "<mark>" + esc(text.slice(j, j + q.length)) + "</mark>";
      i = j + q.length;
    }
    return out + esc(text.slice(i));
  }

  function taskRow(t) {
    const t0 = today();
    const overdue = !t.done && t.date && t.date < t0;
    const subDone = t.subtasks.filter((s) => s.done).length;
    const meta = [];
    if (t.date) meta.push('<span class="meta-item' + (overdue ? " is-overdue" : "") + '">' + ICONS.calendar + esc(dateLabel(t.date)) + "</span>");
    if (t.kind !== "none") meta.push('<span class="chip chip-' + t.kind + '">' + ICONS[KIND[t.kind].icon] + KIND[t.kind].label + "</span>");
    if (t.time !== "none" && (ui.view === "done" || ui.fTime)) meta.push('<span class="chip chip-' + t.time + '">' + ICONS[TIME[t.time].icon] + TIME[t.time].side + "</span>");
    if (t.repeat !== "none") meta.push('<span class="meta-item">' + ICONS.repeat + REPEAT[t.repeat] + "</span>");
    if (t.subtasks.length) meta.push('<span class="meta-item">' + ICONS.listCheck + subDone + "/" + t.subtasks.length + "</span>");
    if (t.note) meta.push('<span class="meta-item" title="Izoh bor">' + ICONS.note + "</span>");

    const cls = ["task"];
    if (t.done) cls.push("is-done");
    if (ui.selected === t.id) cls.push("is-selected");
    if (ui.flashId === t.id) cls.push("is-new");
    const label = (t.done ? "Bajarilmagan deb belgilash: " : "Bajarildi deb belgilash: ") + t.title;

    return '<div class="' + cls.join(" ") + '" data-id="' + esc(t.id) + '" draggable="' + (ui.view !== "done") + '">' +
      '<button type="button" class="check check-' + t.kind + '" data-action="toggle" aria-label="' + esc(label) + '"><span class="check-box">' + ICONS.check + "</span></button>" +
      '<div class="task-main" data-action="open" role="button" tabindex="0" aria-label="Ochish: ' + esc(t.title) + '">' +
      '<span class="task-title">' + highlight(t.title) + "</span>" +
      (meta.length ? '<span class="task-meta">' + meta.join("") + "</span>" : "") +
      "</div>" +
      '<button type="button" class="task-del" data-action="delete" aria-label="Oʻchirish: ' + esc(t.title) + '" title="Oʻchirish">' + ICONS.trash + "</button>" +
      "</div>";
  }

  function groupHTML(k, items) {
    const req = items.filter((t) => t.kind === "required").length;
    return '<section class="group" aria-labelledby="g-' + k + '">' +
      '<header class="group-head">' +
      '<span class="group-icon time-' + k + '">' + ICONS[TIME[k].icon] + "</span>" +
      '<h2 id="g-' + k + '">' + TIME[k].label + "</h2>" +
      '<span class="group-count">' + items.length + "</span>" +
      (req ? '<span class="group-req">' + req + " majburiy</span>" : "") +
      '<button type="button" class="icon-btn group-add" data-add-time="' + k + '" aria-label="' + TIME[k].label + ' boʻlimiga vazifa qoʻshish" title="Shu boʻlimga qoʻshish">' + ICONS.plus + "</button>" +
      "</header>" +
      '<div class="group-body" data-drop-time="' + k + '">' +
      (items.length ? items.map(taskRow).join("") : '<div class="group-empty">Vazifa yoʻq — bu yerga sudrab olib kelishingiz mumkin</div>') +
      "</div></section>";
  }

  function welcomeHTML() {
    return '<div class="welcome">' +
      '<div class="welcome-icon">' + ICONS.check + "</div>" +
      "<h2>Rejaga xush kelibsiz</h2>" +
      "<p>Vazifalarni <strong>ertalabki</strong> va <strong>kechki</strong>, <strong>majburiy</strong> va <strong>ixtiyoriy</strong> turlarga ajrating — yoki teglamasdan qoldiring. Roʻyxatdan oʻtish shart emas, hammasi shu kompyuterda saqlanadi.</p>" +
      '<div class="welcome-actions"><button type="button" class="btn-primary" data-action="focus-add">Birinchi vazifani qoʻshish</button>' +
      '<button type="button" class="btn-ghost" data-action="seed">Namuna vazifalar bilan koʻrish</button></div>' +
      '<ul class="tips">' +
      "<li><code>#ertalab</code> / <code>#kechki</code> — kun vaqti</li>" +
      "<li><code>#majburiy</code> / <code>#ixtiyoriy</code> — turi</li>" +
      "<li><code>bugun</code>, <code>ertaga</code>, <code>15.10</code> — sana</li>" +
      "<li><code>#harkuni</code> / <code>#harhafta</code> — takrorlash</li>" +
      "</ul></div>";
  }

  function renderList() {
    const el = $("#list");
    if (!data.tasks.length) {
      el.innerHTML = welcomeHTML();
      return;
    }
    const tasks = sortTasks(visibleTasks());
    const filtering = !!(ui.query.trim() || ui.fTime || ui.fKind);

    if (ui.view === "done") {
      el.innerHTML = tasks.length
        ? '<div class="group-body">' + tasks.map(taskRow).join("") + "</div>"
        : '<div class="empty">' + (filtering ? "Filtrga mos bajarilgan vazifa topilmadi." : "Hali bajarilgan vazifa yoʻq.") + "</div>";
    } else if (!tasks.length && filtering) {
      el.innerHTML = '<div class="empty">Filtrga mos vazifa topilmadi.</div>';
    } else {
      const keys = ui.fTime ? [ui.fTime] : TIME_ORDER;
      el.innerHTML = keys.map((k) => groupHTML(k, tasks.filter((t) => t.time === k))).join("");
    }
    if (ui.flashId) {
      const id = ui.flashId;
      setTimeout(() => { if (ui.flashId === id) ui.flashId = null; }, 1700);
    }
  }

  function segHTML(field, current, map, order) {
    return '<div class="seg seg-block" role="group" data-dseg="' + field + '">' +
      order.map((v) =>
        '<button type="button" data-value="' + v + '" aria-pressed="' + (v === current) + '">' +
        ICONS[map[v].icon] + "<span>" + map[v].label + "</span></button>").join("") +
      "</div>";
  }

  function renderDetail() {
    const el = $("#detail");
    const app = $("#app");
    const t = ui.selected ? find(ui.selected) : null;
    if (!t) {
      el.hidden = true;
      el.innerHTML = "";
      app.classList.remove("has-detail");
      return;
    }
    el.hidden = false;
    app.classList.add("has-detail");
    const subDone = t.subtasks.filter((s) => s.done).length;
    const pct = t.subtasks.length ? Math.round((subDone / t.subtasks.length) * 100) : 0;
    const created = new Date(t.createdAt);
    const label = (t.done ? "Bajarilmagan deb belgilash: " : "Bajarildi deb belgilash: ") + t.title;

    el.innerHTML =
      '<div class="detail-head">' +
        '<span class="detail-crumb">Vazifa <span class="status-pill' + (t.done ? " is-done" : "") + '">' + (t.done ? "Bajarilgan" : "Faol") + "</span></span>" +
        '<button type="button" class="icon-btn" data-d="close" aria-label="Panelni yopish" title="Yopish (Esc)">' + ICONS.x + "</button>" +
      "</div>" +
      '<div class="detail-title-row' + (t.done ? " is-done" : "") + '">' +
        '<button type="button" class="check check-' + t.kind + '" data-d="toggle" aria-label="' + esc(label) + '"><span class="check-box">' + ICONS.check + "</span></button>" +
        '<label for="dTitle" class="sr-only">Vazifa nomi</label>' +
        '<textarea id="dTitle" class="detail-title" rows="1">' + esc(t.title) + "</textarea>" +
      "</div>" +
      '<div class="field"><span class="field-label">Kun vaqti</span>' + segHTML("time", t.time, TIME, TIME_ORDER) + "</div>" +
      '<div class="field"><span class="field-label">Turi</span>' + segHTML("kind", t.kind, KIND, KIND_ORDER) + "</div>" +
      '<div class="field"><label class="field-label" for="dDate">Sana</label><div class="date-row">' +
        '<input type="date" id="dDate" class="input" value="' + esc(t.date) + '">' +
        '<button type="button" class="mini-btn" data-d="date-today">Bugun</button>' +
        '<button type="button" class="mini-btn" data-d="date-tomorrow">Ertaga</button>' +
        (t.date ? '<button type="button" class="mini-btn" data-d="date-clear">Muddatsiz</button>' : "") +
      "</div></div>" +
      '<div class="field"><label class="field-label" for="dRepeat">Takrorlash</label>' +
        '<select id="dRepeat" class="input">' +
        Object.keys(REPEAT).map((k) => '<option value="' + k + '"' + (t.repeat === k ? " selected" : "") + ">" + REPEAT[k] + "</option>").join("") +
        "</select></div>" +
      '<div class="field"><div class="field-head"><span class="field-label">Kichik vazifalar</span>' +
        (t.subtasks.length ? '<span class="count">' + subDone + " / " + t.subtasks.length + "</span>" : "") + "</div>" +
        (t.subtasks.length ? '<div class="sub-progress"><span style="width:' + pct + '%"></span></div>' : "") +
        '<ul class="subs">' +
        t.subtasks.map((s) =>
          '<li class="sub' + (s.done ? " is-done" : "") + '">' +
          '<button type="button" class="sub-check" data-sub-toggle="' + esc(s.id) + '" aria-label="' + esc((s.done ? "Qaytarish: " : "Bajarildi: ") + s.title) + '"><span class="box">' + ICONS.check + "</span></button>" +
          '<span class="sub-title">' + esc(s.title) + "</span>" +
          '<button type="button" class="icon-btn sub-del" data-sub-del="' + esc(s.id) + '" aria-label="Oʻchirish: ' + esc(s.title) + '">' + ICONS.x + "</button>" +
          "</li>").join("") +
        "</ul>" +
        '<form class="sub-add" id="dSubForm" autocomplete="off">' + ICONS.plus +
        '<label for="dSubInput" class="sr-only">Kichik vazifa qoʻshish</label>' +
        '<input id="dSubInput" placeholder="Kichik vazifa qoʻshish va Enter"></form>' +
      "</div>" +
      '<div class="field"><label class="field-label" for="dNote">Izoh</label>' +
        '<textarea id="dNote" class="note" placeholder="Izoh yozing…">' + esc(t.note) + "</textarea></div>" +
      '<div class="detail-foot"><span>Yaratildi: ' + created.getDate() + "-" + MONTHS[created.getMonth()] + ", " + pad(created.getHours()) + ":" + pad(created.getMinutes()) + "</span>" +
        '<button type="button" class="btn-danger" data-d="delete">' + ICONS.trash + "Oʻchirish</button></div>";

    autosize($("#dTitle"));
  }

  function autosize(ta) {
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  }

  /* ---------- Drag & drop ---------- */
  function clearDropMarks() {
    $$(".drop-before, .drop-after, .drop-end").forEach((el) => el.classList.remove("drop-before", "drop-after", "drop-end"));
  }

  function bindDrag(list) {
    list.addEventListener("dragstart", (e) => {
      const row = e.target.closest && e.target.closest(".task");
      if (!row || ui.view === "done") return;
      ui.dragId = row.dataset.id;
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", ui.dragId); } catch (err) { /* IE */ }
      requestAnimationFrame(() => row.classList.add("is-dragging"));
    });
    list.addEventListener("dragend", () => {
      ui.dragId = null;
      clearDropMarks();
      $$(".is-dragging").forEach((r) => r.classList.remove("is-dragging"));
    });
    list.addEventListener("dragover", (e) => {
      if (!ui.dragId) return;
      const body = e.target.closest(".group-body[data-drop-time]");
      if (!body) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      clearDropMarks();
      const row = e.target.closest(".task");
      if (row && row.dataset.id !== ui.dragId) {
        const r = row.getBoundingClientRect();
        row.classList.add(e.clientY < r.top + r.height / 2 ? "drop-before" : "drop-after");
      } else if (!row) {
        body.classList.add("drop-end");
      }
    });
    list.addEventListener("dragleave", (e) => {
      if (!e.relatedTarget || !list.contains(e.relatedTarget)) clearDropMarks();
    });
    list.addEventListener("drop", (e) => {
      const id = ui.dragId;
      if (!id) return;
      const body = e.target.closest(".group-body[data-drop-time]");
      if (!body) return;
      e.preventDefault();
      const allIds = $$(".task", body).map((r) => r.dataset.id);
      const ids = allIds.filter((x) => x !== id);
      const row = e.target.closest(".task");
      let index = ids.length;
      if (row && row.dataset.id !== id) {
        const r = row.getBoundingClientRect();
        const i = ids.indexOf(row.dataset.id);
        index = e.clientY < r.top + r.height / 2 ? i : i + 1;
      } else if (row) {
        index = allIds.indexOf(id);
      }
      clearDropMarks();
      ui.dragId = null;
      moveTask(id, body.dataset.dropTime, ids, index);
    });
  }

  /* ---------- Hodisalar ---------- */
  function bind() {
    // Yon panel
    $$("[data-view]").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
    $$("[data-filter-time]").forEach((b) => b.addEventListener("click", () => {
      ui.fTime = ui.fTime === b.dataset.filterTime ? null : b.dataset.filterTime;
      render();
    }));
    $$("[data-filter-kind]").forEach((b) => b.addEventListener("click", () => {
      ui.fKind = ui.fKind === b.dataset.filterKind ? null : b.dataset.filterKind;
      render();
    }));
    $("#search").addEventListener("input", (e) => {
      ui.query = e.target.value;
      renderHead();
      renderList();
    });
    $("#themeBtn").addEventListener("click", () => {
      data.theme = data.theme === "dark" ? "light" : "dark";
      applyTheme();
      save();
      renderSidebar();
    });
    $("#exportBtn").addEventListener("click", exportData);
    $("#importBtn").addEventListener("click", () => $("#importFile").click());
    $("#importFile").addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) importFile(f);
      e.target.value = "";
    });

    // Sarlavha
    $("#sortSelect").addEventListener("change", (e) => { data.sort = e.target.value; save(); renderList(); });
    $("#clearDoneBtn").addEventListener("click", clearDone);
    $("#rescheduleBtn").addEventListener("click", rescheduleOverdue);
    $("#activeFilters").addEventListener("click", (e) => {
      const b = e.target.closest("[data-clear]");
      if (!b) return;
      const c = b.dataset.clear;
      if (c === "time" || c === "all") ui.fTime = null;
      if (c === "kind" || c === "all") ui.fKind = null;
      if (c === "query" || c === "all") { ui.query = ""; $("#search").value = ""; }
      render();
    });

    // Qo'shish paneli
    $("#addForm").addEventListener("submit", addTask);
    $("#addInput").addEventListener("input", onAddInput);
    $("#addTime").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-value]");
      if (b) { setAddTime(b.dataset.value); $("#addInput").focus(); }
    });
    $("#addKind").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-value]");
      if (b) { setAddKind(b.dataset.value); $("#addInput").focus(); }
    });
    $("#addDate").addEventListener("change", (e) => {
      const a = ui.add;
      if (a.dateTag) stripWords(isDateWord);
      a.date = e.target.value || "";
      a.dateManual = a.date;
      a.dateTag = false;
      renderAddBar();
    });

    // Ro'yxat
    const list = $("#list");
    list.addEventListener("click", (e) => {
      const addBtn = e.target.closest("[data-add-time]");
      if (addBtn) { setAddTime(addBtn.dataset.addTime); $("#addInput").focus(); return; }
      const actEl = e.target.closest("[data-action]");
      if (!actEl) return;
      const action = actEl.dataset.action;
      const row = actEl.closest(".task");
      const id = row && row.dataset.id;
      if (action === "toggle") toggleDone(id, e.detail === 0);
      else if (action === "open") select(id);
      else if (action === "delete") deleteTask(id);
      else if (action === "seed") seed();
      else if (action === "focus-add") $("#addInput").focus();
    });
    list.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.matches(".task-main")) {
        e.preventDefault();
        select(e.target.closest(".task").dataset.id);
      }
    });
    bindDrag(list);

    // Tafsilotlar paneli
    const d = $("#detail");
    d.addEventListener("click", (e) => {
      const t = find(ui.selected);
      if (!t) return;
      const segBtn = e.target.closest("[data-dseg] button[data-value]");
      if (segBtn) {
        t[segBtn.parentElement.dataset.dseg] = segBtn.dataset.value;
        editCommit();
        return;
      }
      const b = e.target.closest("[data-d],[data-sub-toggle],[data-sub-del]");
      if (!b) return;
      if (b.dataset.subToggle) {
        const s = t.subtasks.find((x) => x.id === b.dataset.subToggle);
        if (s) { s.done = !s.done; editCommit(); }
        return;
      }
      if (b.dataset.subDel) {
        t.subtasks = t.subtasks.filter((x) => x.id !== b.dataset.subDel);
        editCommit();
        return;
      }
      switch (b.dataset.d) {
        case "close": closeDetail(); break;
        case "toggle": toggleDone(t.id); break;
        case "date-today": t.date = today(); editCommit(); break;
        case "date-tomorrow": t.date = addDays(today(), 1); editCommit(); break;
        case "date-clear": t.date = ""; editCommit(); break;
        case "delete": deleteTask(t.id); break;
      }
    });
    d.addEventListener("input", (e) => {
      const t = find(ui.selected);
      if (!t) return;
      if (e.target.id === "dTitle") {
        autosize(e.target);
        const v = e.target.value.replace(/\s*\n\s*/g, " ");
        if (v.trim()) { t.title = v; quietCommit(); }
      } else if (e.target.id === "dNote") {
        t.note = e.target.value;
        quietCommit();
      }
    });
    d.addEventListener("change", (e) => {
      const t = find(ui.selected);
      if (!t) return;
      if (e.target.id === "dDate") { t.date = e.target.value || ""; editCommit(); }
      else if (e.target.id === "dRepeat") { t.repeat = e.target.value; editCommit(); }
    });
    d.addEventListener("focusout", (e) => {
      if (e.target.id !== "dTitle") return;
      const t = find(ui.selected);
      if (!t) return;
      if (!e.target.value.trim()) e.target.value = t.title;
      t.title = t.title.trim();
      quietCommit();
    });
    d.addEventListener("keydown", (e) => {
      if (e.target.id === "dTitle" && e.key === "Enter") { e.preventDefault(); e.target.blur(); }
    });
    d.addEventListener("submit", (e) => {
      if (e.target.id !== "dSubForm") return;
      e.preventDefault();
      const t = find(ui.selected);
      const v = $("#dSubInput").value.trim();
      if (!t || !v) return;
      t.subtasks.push({ id: uid(), title: v, done: false });
      editCommit();
      const ni = $("#dSubInput");
      if (ni) ni.focus();
    });

    // Toast
    $("#toastUndo").addEventListener("click", undo);

    // Klaviatura
    document.addEventListener("keydown", (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable;
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); $("#search").focus(); $("#search").select(); return; }
      if (mod && e.key.toLowerCase() === "z" && !typing && ui.undo) { e.preventDefault(); undo(); return; }
      if (e.key === "Escape") {
        if (typing) { e.target.blur(); return; }
        if (ui.selected) { closeDetail(); return; }
        if (ui.query || ui.fTime || ui.fKind) {
          ui.query = ""; ui.fTime = null; ui.fKind = null; $("#search").value = "";
          render();
        }
        return;
      }
      if (typing || mod || e.altKey) return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); $("#addInput").focus(); }
      else if (e.key === "/") { e.preventDefault(); $("#search").focus(); }
      else if (/^[1-5]$/.test(e.key)) { setView(VIEW_KEYS[Number(e.key) - 1]); }
    });

    // Boshqa tabda o'zgarsa
    window.addEventListener("storage", (e) => {
      if (e.key !== STORAGE_KEY) return;
      data = load();
      applyTheme();
      if (ui.selected && !find(ui.selected)) ui.selected = null;
      render();
    });

    // Yarim tunda sana almashsa
    const checkDay = () => {
      if (today() === lastDay) return;
      lastDay = today();
      ui.add.dateManual = defaultDate();
      if (!ui.add.dateTag) ui.add.date = ui.add.dateManual;
      render();
    };
    setInterval(checkDay, 60 * 1000);
    window.addEventListener("focus", checkDay);
  }

  function applyTheme() {
    document.documentElement.setAttribute("data-theme", data.theme);
  }

  /* ---------- Ishga tushirish ---------- */
  function init() {
    $$("[data-icon]").forEach((el) => { el.innerHTML = ICONS[el.dataset.icon] || ""; });
    applyTheme();
    $("#sortSelect").value = data.sort;
    ui.add.dateManual = defaultDate();
    ui.add.date = ui.add.dateManual;
    bind();
    render();
  }

  init();
})();
