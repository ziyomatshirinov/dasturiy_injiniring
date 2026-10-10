(() => {
  'use strict';

  const STORAGE_KEY = 'b3-daily-planner';
  const DEFAULT_ROWS_PER_GROUP = 3;
  const STATUS_ACTIVE = 'Bajarilmoqda';
  const STATUS_DONE = 'Bajarilgan';

  const SECTIONS = [
    { key: 'day', label: 'Kunduzgi', tbodyId: 'morningTasks' },
    { key: 'evening', label: 'Kechki', tbodyId: 'eveningTasks' },
  ];

  const GROUPS = [
    { key: 'required', label: 'Majburiy' },
    { key: 'optional', label: 'Ixtiyoriy' },
  ];

  const WEEKDAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

  const els = {
    prev: document.getElementById('previousDay'),
    next: document.getElementById('nextDay'),
    title: document.getElementById('dayTitle'),
    date: document.getElementById('dayDate'),
    confirm: document.getElementById('confirmTasks'),
    add: document.getElementById('addTaskRow'),
    clearDone: document.getElementById('deleteCompletedTasks'),
    note: document.querySelector('.planner-note'),
    bodies: Object.fromEntries(SECTIONS.map((s) => [s.key, document.getElementById(s.tbodyId)])),
  };

  let store = loadStore();
  let todayKey = toKey(new Date());
  let viewKey = todayKey;

  /* ---------- Sana ---------- */

  function toKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function fromKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function shiftKey(key, days) {
    const date = fromKey(key);
    date.setDate(date.getDate() + days);
    return toKey(date);
  }

  function dayMode(key) {
    if (key < todayKey) return 'past';
    if (key === todayKey) return 'today';
    return 'future';
  }

  function formatDate(key) {
    const date = fromKey(key);
    return `${WEEKDAYS[date.getDay()]}, ${date.getDate()}-${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }

  function dayTitle(key) {
    const mode = dayMode(key);
    if (mode === 'today') return 'Bugungi vazifalar';
    if (key === shiftKey(todayKey, -1)) return 'Kechagi vazifalar';
    if (key === shiftKey(todayKey, 1)) return 'Ertangi vazifalar';
    return mode === 'past' ? 'O‘tgan kun vazifalari' : 'Kelgusi kun vazifalari';
  }

  /* ---------- Saqlash (localStorage) ---------- */

  function loadStore() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (!data || typeof data !== 'object') return {};
      for (const key of Object.keys(data)) {
        data[key] = Array.isArray(data[key]) ? data[key].map(normalizeTask).filter(Boolean) : [];
      }
      return data;
    } catch {
      return {};
    }
  }

  function saveStore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      /* localStorage yopiq bo'lsa, ma'lumot faqat sahifa ochiqligida saqlanadi */
    }
  }

  function normalizeTask(t) {
    if (!t || typeof t !== 'object') return null;
    return {
      id: String(t.id || newId()),
      section: t.section === 'evening' ? 'evening' : 'day',
      group: t.group === 'optional' ? 'optional' : 'required',
      text: typeof t.text === 'string' ? t.text : '',
      confirmed: Boolean(t.confirmed),
      done: Boolean(t.done),
      cleared: Boolean(t.cleared),
    };
  }

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function createTask(section, group) {
    return { id: newId(), section, group, text: '', confirmed: false, done: false, cleared: false };
  }

  function getTasks(key) {
    if (!Array.isArray(store[key])) {
      if (dayMode(key) === 'past') return [];
      const tasks = [];
      for (const s of SECTIONS) {
        for (const g of GROUPS) {
          for (let i = 0; i < DEFAULT_ROWS_PER_GROUP; i++) tasks.push(createTask(s.key, g.key));
        }
      }
      store[key] = tasks;
    }
    return store[key];
  }

  function isDayConfirmed(tasks) {
    return tasks.some((t) => t.confirmed);
  }

  function visibleTasks(tasks, mode) {
    if (mode === 'past') return tasks.filter((t) => t.text.trim() !== '');
    return tasks.filter((t) => !t.cleared);
  }

  /* ---------- Chizish ---------- */

  function render() {
    const mode = dayMode(viewKey);
    const tasks = getTasks(viewKey);
    const shown = visibleTasks(tasks, mode);
    const confirmed = isDayConfirmed(tasks);
    const hasPending = tasks.some((t) => !t.confirmed);

    els.title.textContent = dayTitle(viewKey);
    els.date.dateTime = viewKey;
    els.date.textContent = formatDate(viewKey);

    for (const section of SECTIONS) {
      const tbody = els.bodies[section.key];
      tbody.replaceChildren();
      for (const group of GROUPS) {
        tbody.append(groupRow(group.label));
        const list = shown.filter((t) => t.section === section.key && t.group === group.key);
        if (list.length === 0) tbody.append(emptyRow());
        list.forEach((task, i) => tbody.append(taskRow(task, i, section, group, mode)));
      }
    }

    setEnabled(els.confirm, mode !== 'past' && hasPending);
    setEnabled(els.add, mode !== 'past' && !confirmed);
    setEnabled(els.clearDone, mode === 'today' && confirmed);
  }

  function groupRow(label) {
    const tr = document.createElement('tr');
    tr.className = 'task-group';
    const th = document.createElement('th');
    th.colSpan = 3;
    th.textContent = label;
    tr.append(th);
    return tr;
  }

  function emptyRow() {
    const tr = document.createElement('tr');
    tr.className = 'task-empty';
    const td = document.createElement('td');
    td.colSpan = 3;
    td.textContent = 'Vazifa yo‘q';
    td.style.color = 'var(--placeholder)';
    td.style.fontSize = '14px';
    tr.append(td);
    return tr;
  }

  function taskRow(task, index, section, group, mode) {
    const locked = mode === 'past' || task.confirmed;
    const showDone = mode === 'past' && task.done;
    const name = `${section.label} ${group.label.toLowerCase()} ${index + 1}-vazifa`;

    const tr = document.createElement('tr');
    tr.className = 'task-row';
    tr.dataset.id = task.id;
    tr.classList.toggle('is-confirmed', locked);
    tr.classList.toggle('is-done', showDone);

    const checkCell = document.createElement('td');
    checkCell.className = 'check-column';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.done;
    checkbox.disabled = !(mode === 'today' && task.confirmed);
    checkbox.setAttribute('aria-label', `${name}ni belgilash`);
    checkCell.append(checkbox);

    const textCell = document.createElement('td');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-input';
    input.value = task.text;
    input.placeholder = `${index + 1}-vazifa...`;
    input.readOnly = locked;
    input.tabIndex = locked ? -1 : 0;
    input.setAttribute('aria-label', name);
    textCell.append(input);

    const statusCell = document.createElement('td');
    statusCell.className = 'status-cell';
    statusCell.textContent = showDone ? STATUS_DONE : STATUS_ACTIVE;

    tr.append(checkCell, textCell, statusCell);
    return tr;
  }

  function setEnabled(button, enabled) {
    button.disabled = !enabled;
    button.style.opacity = enabled ? '' : '0.45';
    button.style.cursor = enabled ? '' : 'not-allowed';
  }

  function findTask(element) {
    const row = element.closest('.task-row');
    if (!row) return null;
    return getTasks(viewKey).find((t) => t.id === row.dataset.id) || null;
  }

  function focusFirstEmpty() {
    const input = [...document.querySelectorAll('.task-input')].find((i) => !i.readOnly && i.value.trim() === '');
    if (input) input.focus();
  }

  /* ---------- Amallar ---------- */

  function onTextInput(event) {
    if (!event.target.classList.contains('task-input')) return;
    const task = findTask(event.target);
    if (!task || task.confirmed || dayMode(viewKey) === 'past') return;
    task.text = event.target.value;
    saveStore();
  }

  function onCheckboxChange(event) {
    const checkbox = event.target;
    if (!checkbox.classList.contains('task-checkbox')) return;
    const task = findTask(checkbox);
    if (!task) return;
    if (dayMode(viewKey) !== 'today' || !task.confirmed) {
      checkbox.checked = task.done;
      return;
    }
    task.done = checkbox.checked;
    saveStore();
  }

  function confirmTasks() {
    if (dayMode(viewKey) === 'past') return;
    const tasks = getTasks(viewKey);
    const hasFilled = tasks.some((t) => t.confirmed || t.text.trim() !== '');
    if (!hasFilled) {
      focusFirstEmpty();
      return;
    }
    const kept = tasks.filter((t) => t.confirmed || t.text.trim() !== '');
    for (const t of kept) {
      if (!t.confirmed) {
        t.text = t.text.trim();
        t.confirmed = true;
      }
    }
    store[viewKey] = kept;
    saveStore();
    render();
  }

  function addRows() {
    if (dayMode(viewKey) === 'past') return;
    const tasks = getTasks(viewKey);
    if (isDayConfirmed(tasks)) return;
    let firstNewId = null;

    for (const s of SECTIONS) {
      for (const g of GROUPS) {
        const list = tasks.filter((t) => t.section === s.key && t.group === g.key && !t.cleared);
        const allFilled = list.length > 0 && list.every((t) => t.text.trim() !== '');
        if (!allFilled) continue;
        const task = createTask(s.key, g.key);
        tasks.push(task);
        firstNewId = firstNewId || task.id;
      }
    }

    if (!firstNewId) {
      focusFirstEmpty();
      return;
    }
    saveStore();
    render();
    const input = document.querySelector(`.task-row[data-id="${firstNewId}"] .task-input`);
    if (input) input.focus();
  }

  function clearDoneTasks() {
    if (dayMode(viewKey) !== 'today') return;
    let changed = false;
    for (const t of getTasks(viewKey)) {
      if (t.done && !t.cleared) {
        t.cleared = true;
        changed = true;
      }
    }
    if (!changed) return;
    saveStore();
    render();
  }

  function goToDay(offset) {
    viewKey = shiftKey(viewKey, offset);
    render();
  }

  function checkDayChange() {
    const now = toKey(new Date());
    if (now === todayKey) return;
    if (viewKey === todayKey) viewKey = now;
    todayKey = now;
    render();
  }

  /* ---------- Ishga tushirish ---------- */

  if (els.note) els.note.hidden = true;

  for (const tbody of Object.values(els.bodies)) {
    tbody.addEventListener('input', onTextInput);
    tbody.addEventListener('change', onCheckboxChange);
  }
  els.prev.addEventListener('click', () => goToDay(-1));
  els.next.addEventListener('click', () => goToDay(1));
  els.confirm.addEventListener('click', confirmTasks);
  els.add.addEventListener('click', addRows);
  els.clearDone.addEventListener('click', clearDoneTasks);

  setInterval(checkDayChange, 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkDayChange();
  });

  render();
})();
