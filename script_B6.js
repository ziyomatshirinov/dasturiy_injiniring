(() => {
  "use strict";

  const STORAGE_KEY = "vazifalar-jadvali-v1";
  const GROUPS = ["EM", "EI", "KM", "KI"];
  const MIN_ROWS = 3;

  const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun",
                  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
  const DAYS = ["yakshanba", "dushanba", "seshanba", "chorshanba",
                "payshanba", "juma", "shanba"];

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const tbody = $("#todoTable tbody");
  const dateLabel = $("#dateLabel");
  const progress = $("#progress");
  const toast = $("#toast");

  let current = new Date();
  current.setHours(0, 0, 0, 0);
  let activeRow = null;
  let store = load();

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); return true; }
    catch { return false; }
  }

  const keyOf = d =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;


  const rowsOf = g => $$(`tr[data-group="${g}"]`, tbody);

  function createRow(group) {
    const tr = document.createElement("tr");
    tr.dataset.group = group;
    tr.innerHTML =
      `<td class="task"><span class="num"></span><input type="text" autocomplete="off"></td>` +
      `<td class="check"></td>`;
    return tr;
  }

  function updateSpans() {
    const count = {};
    GROUPS.forEach(g => (count[g] = rowsOf(g).length));
    $$("[data-span]", tbody).forEach(cell => {
      const k = cell.dataset.span;
      cell.rowSpan = k.length === 1
        ? GROUPS.filter(g => g[0] === k).reduce((s, g) => s + count[g], 0)
        : count[k];
    });
    GROUPS.forEach(g => rowsOf(g).forEach((tr, i) => {
      $(".num", tr).textContent = `${i + 1}.`;
    }));
  }

  function setRowCount(group, n) {
    let rows = rowsOf(group);
    while (rows.length < n) {
      rows[rows.length - 1].after(createRow(group));
      rows = rowsOf(group);
    }
    while (rows.length > n) {
      rows.pop().remove();
    }
  }

  function collect() {
    const day = {};
    GROUPS.forEach(g => {
      day[g] = rowsOf(g).map(tr => ({
        t: $("input", tr).value.trim(),
        d: tr.classList.contains("is-done")
      }));
    });
    return day;
  }

  function render() {
    const day = store[keyOf(current)] || {};
    GROUPS.forEach(g => {
      const items = day[g] || [];
      setRowCount(g, Math.max(MIN_ROWS, items.length));
      rowsOf(g).forEach((tr, i) => {
        const it = items[i] || { t: "", d: false };
        $("input", tr).value = it.t;
        tr.classList.toggle("is-done", !!it.d);
      });
    });
    updateSpans();
    setActive(rowsOf("EM")[0]);
    updateHeader();
  }

  function updateHeader() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.round((current - today) / 86400000);
    const tag = diff === 0 ? " (bugun)" : diff === 1 ? " (ertaga)" : diff === -1 ? " (kecha)" : "";
    dateLabel.textContent =
      `${current.getDate()}-${MONTHS[current.getMonth()]}, ${current.getFullYear()}, ` +
      `${DAYS[current.getDay()]}${tag}`;
    updateProgress();
  }

  function updateProgress() {
    const all = $$("tr[data-group]", tbody)
      .filter(tr => $("input", tr).value.trim() !== "");
    const done = all.filter(tr => tr.classList.contains("is-done")).length;
    progress.textContent = `${done}/${all.length}`;
  }

  function setActive(tr) {
    if (!tr) return;
    if (activeRow) activeRow.classList.remove("active");
    activeRow = tr;
    tr.classList.add("active");
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function changeDay(delta) {
    store[keyOf(current)] = collect();
    persist();
    current.setDate(current.getDate() + delta);
    render();
  }

  function confirmDay() {
    store[keyOf(current)] = collect();
    showToast(persist() ? "Tasdiqlandi" : "Saqlab bo'lmadi: brauzer xotirasi yopiq");
  }

  function addRow() {
    const group = (activeRow || rowsOf("EM")[0]).dataset.group;
    const rows = rowsOf(group);
    const tr = createRow(group);
    rows[rows.length - 1].after(tr);
    updateSpans();
    setActive(tr);
    $("input", tr).focus();
  }

  function toggleDone(tr = activeRow) {
    if (!tr) return;
    if ($("input", tr).value.trim() === "") {
      showToast("Avval vazifani yozing");
      $("input", tr).focus();
      return;
    }
    tr.classList.toggle("is-done");
    updateProgress();
  }

  $("#btnPrev").addEventListener("click", () => changeDay(-1));
  $("#btnNext").addEventListener("click", () => changeDay(1));
  $("#btnConfirm").addEventListener("click", confirmDay);
  $("#btnAdd").addEventListener("click", addRow);
  $("#btnDone").addEventListener("click", () => toggleDone());

  tbody.addEventListener("click", e => {
    const tr = e.target.closest("tr[data-group]");
    if (!tr) return;
    setActive(tr);
    if (e.target.closest(".check")) toggleDone(tr);
  });

  tbody.addEventListener("focusin", e => {
    const tr = e.target.closest("tr[data-group]");
    if (tr) setActive(tr);
  });

  tbody.addEventListener("input", updateProgress);

  tbody.addEventListener("keydown", e => {
    if (e.target.tagName !== "INPUT") return;
    const all = $$("tr[data-group]", tbody);
    const i = all.indexOf(e.target.closest("tr"));
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = all[i + 1];
      if (next) $("input", next).focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = all[i - 1];
      if (prev) $("input", prev).focus();
    }
  });

  render();
})();
