"use strict";

/* =========================================================
   Kundalik ishlar jadvali
   Guruhlar: 0 = E-M, 1 = E-I, 2 = K-M, 3 = K-I
   Ma'lumot brauzerning localStorage'ida saqlanadi.
   ========================================================= */

const STORAGE_KEY = "kundalik_ishlar_v1";
const DEFAULT_ROWS = 3;
const TOP = ["E", "E", "K", "K"];
const SUB = ["M", "I", "M", "I"];
const TICK = "✔";
const KUNLAR = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const FLY_MS = 550;

const jadval = document.getElementById("jadval");
const holat = document.getElementById("holat");
const arxiv = document.getElementById("arxiv");
const arxivRoyxat = document.getElementById("arxivRoyxat");
const arxivSoni = document.getElementById("arxivSoni");
const btn = {
  prev: document.getElementById("btnPrev"),
  confirm: document.getElementById("btnConfirm"),
  plus: document.getElementById("btnPlus"),
  done: document.getElementById("btnDone"),
  clear: document.getElementById("btnClear"),
  clearDone: document.getElementById("btnClearDone"),
  next: document.getElementById("btnNext"),
};

let busy = false;

/* ---------- Sana yordamchilari ---------- */
function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function addDays(key, n) {
  const [y, m, d] = key.split("-").map(Number);
  return toKey(new Date(y, m - 1, d + n));
}
function showDate(key) {
  const [y, m, d] = key.split("-");
  return `${d}.${m}.${y}`;
}
function weekday(key) {
  const [y, m, d] = key.split("-").map(Number);
  return KUNLAR[new Date(y, m - 1, d).getDay()];
}
const todayKey = () => toKey(new Date());
const isPast = (key) => key < todayKey();

function dayBadge(key) {
  const t = todayKey();
  if (key === t) return "Bugun";
  if (key === addDays(t, 1)) return "Ertaga";
  if (key === addDays(t, -1)) return "Kecha";
  return key > t ? "Kelgusi kun" : "O'tgan kun";
}

/* ---------- Saqlash / yuklash ---------- */
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (s && s.days) return s;
  } catch (e) { /* e'tiborsiz */ }
  return { days: {} };
}
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    setHolat("Saqlab bo'lmadi (brauzer xotirasi yopiq).");
  }
}

const state = loadState();
let current = todayKey();

/* Kun ma'lumoti: g[guruh] = [{text, done}], c[guruh] = [matn] (arxiv) */
function getDay(key) {
  let day = state.days[key];
  if (!day) {
    day = { g: [[], [], [], []], c: [[], [], [], []] };
    if (!isPast(key)) {
      for (let i = 0; i < 4; i++) {
        for (let k = 0; k < DEFAULT_ROWS; k++) day.g[i].push({ text: "", done: false });
      }
      state.days[key] = day;
      saveState();
    }
  }
  return day;
}

/* Ko'rsatiladigan qatorlar (o'tgan kunda arxiv + qolganlar) */
function viewItems(key) {
  const day = getDay(key);
  const out = [];
  for (let i = 0; i < 4; i++) {
    let items = day.g[i].map((x) => ({ ...x }));
    if (isPast(key)) {
      const archived = (day.c[i] || []).map((t) => ({ text: t, done: true }));
      items = archived.concat(items);
    }
    if (items.length === 0) items.push({ text: "", done: false });
    out.push(items);
  }
  return out;
}

/* ---------- Chizish ---------- */
function makeBadge(letter) {
  const span = document.createElement("span");
  span.className = "belgi " + letter;
  span.textContent = letter;
  return span;
}

/* opts: { rows: {"g:k": true}, done: {"g:idx": true} } */
function render(opts) {
  const o = opts || {};
  const fresh = o.rows || {};
  const past = isPast(current);
  const items = viewItems(current);
  const counts = items.map((a) => a.length);

  jadval.innerHTML = "";
  jadval.classList.toggle("otgan", past);

  // 1-qator: Sana
  const head = document.createElement("tr");
  const th = document.createElement("th");
  th.className = "bosh";
  th.colSpan = 4;
  th.innerHTML =
    '<div class="bosh-ichi"><div>' +
    '<div class="sana">Sana: ' + showDate(current) + "</div>" +
    '<div class="kun">' + weekday(current) + "</div></div>" +
    '<span class="nishon">' + dayBadge(current) + "</span></div>";
  head.appendChild(th);
  jadval.appendChild(head);

  // Guruhlar
  for (let gi = 0; gi < 4; gi++) {
    items[gi].forEach((item, k) => {
      const tr = document.createElement("tr");
      const cls = [gi < 2 ? "blok-e" : "blok-k"];
      if (past) cls.push(item.done ? "bajarilgan" : "bajarilmagan");
      else if (item.done) cls.push("belgilangan");
      if (fresh[gi + ":" + k]) cls.push("yangi");
      tr.className = cls.join(" ");

      if (gi % 2 === 0 && k === 0) {
        const td = document.createElement("td");
        td.className = "guruh katta";
        td.rowSpan = counts[gi] + counts[gi + 1];
        td.appendChild(makeBadge(TOP[gi]));
        tr.appendChild(td);
      }
      if (k === 0) {
        const td = document.createElement("td");
        td.className = "guruh kichik";
        td.rowSpan = counts[gi];
        td.appendChild(makeBadge(SUB[gi]));
        tr.appendChild(td);
      }

      // Ish matni
      const tdIsh = document.createElement("td");
      tdIsh.className = "ish";
      const box = document.createElement("div");
      box.className = "ish-ichi";
      const num = document.createElement("span");
      num.className = "raqam";
      num.textContent = (k + 1) + ".";
      const input = document.createElement("input");
      input.type = "text";
      input.value = item.text;
      input.readOnly = past;
      input.dataset.g = gi;
      input.dataset.k = k;
      input.setAttribute("aria-label", `${TOP[gi]}-${SUB[gi]} ${k + 1}-ish`);
      if (!past) {
        input.addEventListener("input", () => {
          getDay(current).g[gi][k].text = input.value;
          saveState();
        });
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const all = [...jadval.querySelectorAll("input")];
            const nxt = all[all.indexOf(input) + 1];
            if (nxt) nxt.focus();
          }
        });
      }
      box.append(num, input);
      tdIsh.appendChild(box);
      tr.appendChild(tdIsh);

      // Belgi
      const tdTick = document.createElement("td");
      tdTick.className = "tick";
      const tb = document.createElement("span");
      tb.className = "tickbox";
      tb.textContent = TICK;
      tdTick.appendChild(tb);
      if (!past) {
        tdTick.addEventListener("click", () => {
          if (busy) return;
          const it = getDay(current).g[gi][k];
          it.done = !it.done;
          tr.classList.toggle("belgilangan", it.done);
          saveState();
        });
      }
      tr.appendChild(tdTick);

      jadval.appendChild(tr);
    });
  }

  renderArchive(o.done || {});

  // Tugmalar holati
  [btn.confirm, btn.plus, btn.done, btn.clear].forEach((b) => (b.disabled = past));
  setHolat(past
    ? "O'tgan kun: faqat ko'rish. Yashil - bajarilgan, qizil - bajarilmagan."
    : "Belgi qo'yish uchun o'ng tomondagi doirani bosing.");
}

/* "Bajarilgan ishlar" bo'limi (faqat bugungi va kelgusi kunlar uchun) */
function renderArchive(freshDone) {
  if (isPast(current)) {
    arxiv.hidden = true;
    return;
  }
  arxiv.hidden = false;
  const day = getDay(current);
  arxivRoyxat.innerHTML = "";
  let total = 0;

  for (let gi = 0; gi < 4; gi++) {
    (day.c[gi] || []).forEach((text, idx) => {
      total++;
      const li = document.createElement("li");
      if (freshDone[gi + ":" + idx]) li.className = "yangi";

      const tag = document.createElement("span");
      tag.className = "guruh-nom";
      tag.textContent = TOP[gi] + "-" + SUB[gi];

      const t = document.createElement("span");
      t.className = "matn";
      t.textContent = text;

      const undo = document.createElement("button");
      undo.className = "qaytar";
      undo.type = "button";
      undo.title = "Jadvalga qaytarish";
      undo.setAttribute("aria-label", "Jadvalga qaytarish");
      undo.textContent = "↩";
      undo.addEventListener("click", () => restoreItem(gi, idx));

      li.append(tag, t, undo);
      arxivRoyxat.appendChild(li);
    });
  }

  if (total === 0) {
    const li = document.createElement("li");
    li.className = "bosh-yoq";
    li.textContent = "Hali bajarilgan ish yo'q. Ishni belgilab, \"Bajarildi\" ni bosing.";
    arxivRoyxat.appendChild(li);
  }
  arxivSoni.textContent = total;
  btn.clearDone.disabled = total === 0;
}

function restoreItem(gi, idx) {
  if (busy || isPast(current)) return;
  const day = getDay(current);
  const text = day.c[gi].splice(idx, 1)[0];
  const blank = day.g[gi].findIndex((x) => x.text.trim() === "");
  if (blank >= 0) day.g[gi][blank] = { text, done: false };
  else day.g[gi].push({ text, done: false });
  saveState();
  render();
  setHolat("Ish jadvalga qaytarildi: " + TOP[gi] + "-" + SUB[gi]);
}

let undoTimer = null;

/* Xabar chiqaradi. undoFn berilsa, "Bekor qilish" tugmasi ham chiqadi (8 soniya) */
function setHolat(text, undoFn) {
  clearTimeout(undoTimer);
  holat.textContent = text;
  if (undoFn) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "bekor";
    b.textContent = "Bekor qilish";
    b.addEventListener("click", () => {
      clearTimeout(undoTimer);
      undoFn();
    });
    holat.appendChild(b);
    undoTimer = setTimeout(() => b.remove(), 8000);
  }
}

/* Kunning hozirgi holatini nusxalab, bekor qilish uchun funksiya qaytaradi */
function snapshotUndo(message) {
  const key = current;
  const snap = JSON.parse(JSON.stringify(getDay(key)));
  return () => {
    state.days[key] = snap;
    saveState();
    if (current === key) render();
    setHolat(message);
  };
}

/* ---------- Tugmalar ---------- */

// Tasdiqlash: bo'sh qatorlar o'chadi (guruhda kamida 1 qator qoladi)
btn.confirm.addEventListener("click", () => {
  if (busy || isPast(current)) return;
  const day = getDay(current);
  for (let i = 0; i < 4; i++) {
    day.g[i] = day.g[i].filter((x) => x.text.trim() !== "");
    if (day.g[i].length === 0) day.g[i].push({ text: "", done: false });
  }
  saveState();
  render();
  setHolat("Bo'sh qatorlar o'chirildi.");
});

// +: faqat to'lgan guruhlarga bittadan yangi qator qo'shiladi
btn.plus.addEventListener("click", () => {
  if (busy || isPast(current)) return;
  const day = getDay(current);
  const added = [];
  const fresh = {};
  for (let i = 0; i < 4; i++) {
    const full = day.g[i].length > 0 && day.g[i].every((x) => x.text.trim() !== "");
    if (full) {
      day.g[i].push({ text: "", done: false });
      added.push(i);
      fresh[i + ":" + (day.g[i].length - 1)] = true;
    }
  }
  if (added.length === 0) {
    setHolat("Hamma guruhda bo'sh qator bor, qator qo'shish shart emas.");
    return;
  }
  saveState();
  render({ rows: fresh });
  setHolat("Qator qo'shildi: " + added.map((i) => TOP[i] + "-" + SUB[i]).join(", "));
  const first = added[0];
  const target = jadval.querySelector(
    `input[data-g="${first}"][data-k="${day.g[first].length - 1}"]`
  );
  if (target) target.focus();
});

// Bajarildi: belgilangan qatorlar "Bajarilgan ishlar" bo'limiga o'tadi
btn.done.addEventListener("click", () => {
  if (busy || isPast(current)) return;
  const marked = jadval.querySelectorAll("tr.belgilangan");
  if (marked.length === 0) {
    setHolat("Avval bajarilgan ishlarni belgilang (o'ng tomondagi doira).");
    return;
  }

  busy = true;
  [btn.confirm, btn.plus, btn.done].forEach((b) => (b.disabled = true));
  marked.forEach((tr) => tr.classList.add("ketmoqda"));
  setHolat("Bajarilgan ishlar pastdagi ro'yxatga o'tmoqda...");

  setTimeout(() => {
    const day = getDay(current);
    const freshDone = {};
    let moved = 0;
    for (let i = 0; i < 4; i++) {
      day.g[i].forEach((x) => {
        if (x.done && x.text.trim() !== "") {
          day.c[i].push(x.text.trim());
          freshDone[i + ":" + (day.c[i].length - 1)] = true;
          moved++;
        }
      });
      day.g[i] = day.g[i].filter((x) => !x.done);
      if (day.g[i].length === 0) day.g[i].push({ text: "", done: false });
    }
    saveState();
    busy = false;
    render({ done: freshDone });
    setHolat(moved + " ta ish \"Bajarilgan ishlar\" ro'yxatiga o'tdi (↩ bilan qaytarish mumkin).");
    if (moved > 0 && arxiv.scrollIntoView) {
      arxiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, FLY_MS);
});

// Tozalash: jadvaldagi hamma ishlar o'chadi (bajarilganlar ro'yxati qoladi)
btn.clear.addEventListener("click", () => {
  if (busy || isPast(current)) return;
  const day = getDay(current);
  const hasData = day.g.some((a) => a.some((x) => x.text.trim() !== "" || x.done));
  if (!hasData) {
    setHolat("Jadval allaqachon bo'sh.");
    return;
  }
  const undo = snapshotUndo("Jadval qaytarildi.");
  for (let i = 0; i < 4; i++) {
    day.g[i] = [];
    for (let k = 0; k < DEFAULT_ROWS; k++) day.g[i].push({ text: "", done: false });
  }
  saveState();
  render();
  setHolat("Jadval tozalandi.", undo);
});

// Ro'yxatni tozalash: "Bajarilgan ishlar" bo'limi bo'shatiladi
btn.clearDone.addEventListener("click", () => {
  if (busy || isPast(current)) return;
  const day = getDay(current);
  if (!day.c.some((a) => a.length > 0)) return;
  const undo = snapshotUndo("Bajarilgan ishlar ro'yxati qaytarildi.");
  day.c = [[], [], [], []];
  saveState();
  render();
  setHolat("Bajarilgan ishlar ro'yxati tozalandi.", undo);
});

// >: ertangi kun ro'yxati
btn.next.addEventListener("click", () => {
  if (busy) return;
  current = addDays(current, 1);
  render();
});

// <: kechagi kun
btn.prev.addEventListener("click", () => {
  if (busy) return;
  current = addDays(current, -1);
  render();
});

render();
