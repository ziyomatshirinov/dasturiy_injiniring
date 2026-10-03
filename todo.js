/*
 * Kundalik todo-list
 *   E = Ertalabki,  K = Kechki
 *   M = Majburiy,   I = Ixtiyoriy
 *
 * HTML o'zgarmaydi — skript mavjud jadvalni topib, katakchalarga
 * matn maydoni va belgilash (checkbox) qo'shadi.
 * Ulash: </body> dan oldin  <script src="todo.js"></script>
 */
(function () {
  "use strict";

  var STORAGE_KEY = "kundalik-todo-v1";
  var DAILY_RESET = true; // yangi kun boshlanganda ✓ belgilar tozalanadi, vazifa matnlari qoladi

  var NAMES = { E: "Ertalabki", K: "Kechki", M: "Majburiy", I: "Ixtiyoriy" };

  var state;
  var tasks = [];   // { key, period, type, row, input, check }
  var labels = [];  // { cell, period, type }  (type = null bo'lsa — E/K umumiy yorlig'i)
  var headTitle, headProgress;

  /* ---------- Sana va saqlash ---------- */

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function prettyDate(iso) {
    var p = iso.split("-");
    return p[2] + "." + p[1] + "." + p[0];
  }

  function loadState() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) {}
    if (!s || typeof s !== "object") s = {};
    if (!s.items || typeof s.items !== "object") s.items = {};
    rollDay(s);
    return s;
  }

  // Kun almashgan bo'lsa belgilarni tozalaydi; o'zgarish bo'lsa true qaytaradi
  function rollDay(s) {
    var t = todayStr();
    if (s.date === t) return false;
    if (DAILY_RESET && s.date) {
      Object.keys(s.items).forEach(function (k) { s.items[k].done = false; });
    }
    s.date = t;
    return true;
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function item(key) {
    if (!state.items[key]) state.items[key] = { text: "", done: false };
    return state.items[key];
  }

  /* ---------- Ko'rinish ---------- */

  function injectStyles() {
    var css = [
      ".todo-input{border:0;outline:0;background:transparent;font:inherit;color:inherit;",
      "  padding:0 2px;margin-left:4px;width:calc(100% - 26px);box-sizing:border-box}",
      ".todo-input:focus{background:#fffbe6}",
      ".todo-input::placeholder{color:#bbb;font-style:italic}",
      "tr.todo-done .todo-input{text-decoration:line-through;color:#888}",
      "td.narrow{text-align:center;vertical-align:middle}",
      ".todo-check{width:16px;height:16px;margin:0;cursor:pointer}",
      ".todo-check:disabled{cursor:default;opacity:.35}",
      ".todo-head{font-weight:bold;text-align:center}",
      "td.label{cursor:default;font-weight:bold;transition:background .2s}",
      "td.label.todo-complete{background:#d9f2d9}"
    ].join("\n");
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  function refresh() {
    var filled = 0, done = 0;

    tasks.forEach(function (t) {
      var it = item(t.key);
      var hasText = it.text.trim() !== "";
      if (!hasText) it.done = false;
      t.check.disabled = !hasText;
      t.check.checked = it.done;
      t.row.classList.toggle("todo-done", it.done);
      if (hasText) { filled++; if (it.done) done++; }
    });

    // Bo'lim to'liq bajarilsa yorliq yashil bo'ladi
    labels.forEach(function (l) {
      var group = tasks.filter(function (t) {
        return t.period === l.period && (l.type === null || t.type === l.type) &&
               item(t.key).text.trim() !== "";
      });
      var complete = group.length > 0 && group.every(function (t) { return item(t.key).done; });
      l.cell.classList.toggle("todo-complete", complete);
    });

    if (headTitle) headTitle.textContent = "Kundalik reja — " + prettyDate(state.date);
    if (headProgress) {
      headProgress.textContent = done + "/" + filled;
      headProgress.title = "Bajarildi: " + done + " ta, jami: " + filled + " ta";
    }
  }

  /* ---------- Jadvalni jonlantirish ---------- */

  function build() {
    var table = document.querySelector("table");
    if (!table || !table.rows.length) return;

    state = loadState();
    injectStyles();

    // Sarlavha qatori
    var head = table.rows[0].cells;
    if (head[0]) { headTitle = head[0]; headTitle.classList.add("todo-head"); }
    if (head[1]) { headProgress = head[1]; headProgress.classList.add("todo-head"); }

    var period = null, type = null;

    for (var r = 1; r < table.rows.length; r++) {
      var row = table.rows[r];
      var itemCell = null;
      var checkCell = row.querySelector("td.narrow");

      for (var c = 0; c < row.cells.length; c++) {
        var cell = row.cells[c];
        var txt = cell.textContent.trim();

        if (cell.classList.contains("label")) {
          if (cell.rowSpan >= 6) {          // E yoki K
            period = txt; type = null;
            labels.push({ cell: cell, period: period, type: null });
          } else {                          // M yoki I
            type = txt;
            labels.push({ cell: cell, period: period, type: type });
          }
          cell.title = NAMES[txt] || txt;
        } else if (/^\d+\.$/.test(txt)) {
          itemCell = cell;
        }
      }

      if (!itemCell || !checkCell || !period || !type) continue;

      var num = itemCell.textContent.trim().replace(".", "");
      var key = period + "-" + type + "-" + num;
      addTask(key, period, type, row, itemCell, checkCell);
    }

    refresh();
    saveState();

    // Sahifa ochiq qolib, yarim tun o'tsa ham kun yangilanadi
    function checkDay() {
      if (rollDay(state)) { saveState(); refresh(); }
    }
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) checkDay();
    });
    setInterval(checkDay, 60 * 1000);
  }

  function addTask(key, period, type, row, itemCell, checkCell) {
    var it = item(key);

    var input = document.createElement("input");
    input.type = "text";
    input.className = "todo-input";
    input.value = it.text;
    input.maxLength = 120;
    input.placeholder = (NAMES[type] || type).toLowerCase() + " vazifa";
    input.title = (NAMES[period] || period) + " · " + (NAMES[type] || type);
    itemCell.appendChild(input);

    var check = document.createElement("input");
    check.type = "checkbox";
    check.className = "todo-check";
    check.setAttribute("aria-label", "Bajarildi");
    checkCell.appendChild(check);

    var task = { key: key, period: period, type: type, row: row, input: input, check: check };
    tasks.push(task);

    input.addEventListener("input", function () {
      item(key).text = input.value;
      saveState();
      refresh();
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {            // keyingi vazifaga o'tish
        e.preventDefault();
        var i = tasks.indexOf(task);
        if (tasks[i + 1]) tasks[i + 1].input.focus();
        else input.blur();
      } else if (e.key === "Escape") {
        input.blur();
      }
    });

    check.addEventListener("change", function () {
      item(key).done = check.checked;
      saveState();
      refresh();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
