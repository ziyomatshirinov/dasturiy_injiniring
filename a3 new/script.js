/**
 * ==============================================================================
 * KUNLIK REJA VA VAZIFALAR (DAILY PLANNER) - SCRIPT.JS
 * Vanilla JavaScript (Senior Frontend Architecture)
 * 
 * Imkoniyatlar:
 * - 4 ta bo'lim (E-M, E-I, K-M, K-I) va to'g'ri dinamik rowspan boshqaruvi
 * - 5 ta asosiy tugma: [<] [Tasdiqlash] [+] [Bajarildi] [>]
 * - O'tgan kunlarda: Bajarilganlar (Yashil), Bajarilmaganlar (Qizil)
 * - Statistika va Real-time Progress Bar
 * - Vazifalarni filterlash (Barchasi, Bajarilgan, Bajarilmagan)
 * - JSON formatda Eksport va Import qilish
 * - LocalStorage orqali avtomatik doimiy saqlash
 * ==============================================================================
 */

(function () {
  'use strict';

  // --- O'ZGARUVCHILAR VA SOZLAMALAR ---
  const STORAGE_KEY = 'daily_planner_app_data_v1';
  const DEFAULT_PER_SECTION = 3;

  // Bo'limlar strukturasi va nomlanishi
  const SECTIONS_CONFIG = [
    {
      groupKey: 'E',
      groupTitle: 'E',
      groupFull: 'Ertalab',
      subtypes: [
        { code: 'M', title: 'M', full: 'Menejment / Majburiy', fullKey: 'EM' },
        { code: 'I', title: 'I', full: 'Ish / Iroda', fullKey: 'EI' }
      ]
    },
    {
      groupKey: 'K',
      groupTitle: 'K',
      groupFull: 'Kechqurun',
      subtypes: [
        { code: 'M', title: 'M', full: 'Menejment / Majburiy', fullKey: 'KM' },
        { code: 'I', title: 'I', full: 'Ish / Iroda', fullKey: 'KI' }
      ]
    }
  ];

  // Barcha ichki bo'lim kalitlari: ['EM', 'EI', 'KM', 'KI']
  const ALL_SECTION_KEYS = ['EM', 'EI', 'KM', 'KI'];

  // Global Ilova Holati (State)
  let currentDate = getTodayFormatted();
  let appData = loadAllDataFromStorage();
  let currentFilter = 'all'; // 'all' | 'completed' | 'pending'

  // DOM Elementlari
  const currentDateText = document.getElementById('currentDateText');
  const datePickerInput = document.getElementById('datePickerInput');
  const pastDayIndicator = document.getElementById('pastDayIndicator');
  const plannerTableBody = document.getElementById('plannerTableBody');
  const progressTitle = document.getElementById('progressTitle');
  const progressStatsDetail = document.getElementById('progressStatsDetail');
  const progressBarFill = document.getElementById('progressBarFill');
  const toastMessage = document.getElementById('toastMessage');

  // Tugmalar
  const btnPrevDay = document.getElementById('btnPrevDay');
  const btnNextDay = document.getElementById('btnNextDay');
  const btnPrevDayNav = document.getElementById('btnPrevDayNav');
  const btnNextDayNav = document.getElementById('btnNextDayNav');
  const btnToday = document.getElementById('btnToday');
  const btnConfirm = document.getElementById('btnConfirm');
  const btnAddRow = document.getElementById('btnAddRow');
  const btnCompleted = document.getElementById('btnCompleted');
  const btnExport = document.getElementById('btnExport');
  const btnImport = document.getElementById('btnImport');
  const importFileInput = document.getElementById('importFileInput');
  const filterButtons = document.querySelectorAll('.filter-btn');

  // --- YORDAMCHI FUNKSIYALAR ---

  /**
   * Noyob ID yaratish
   */
  function generateId() {
    return 'task_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
  }

  /**
   * Bugungi sanani YYYY-MM-DD formatida olish
   */
  function getTodayFormatted() {
    const today = new Date();
    return formatDate(today);
  }

  /**
   * Sana obyektini YYYY-MM-DD satriga aylantirish
   */
  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Sanani kunlar bo'yicha siljitish (offset: +1 yoki -1)
   */
  function shiftDate(dateStr, offsetDays) {
    const parts = dateStr.split('-');
    const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    date.setDate(date.getDate() + offsetDays);
    return formatDate(date);
  }

  /**
   * Berilgan sana o'tmishdagi (kechagi yoki undan oldingi) kunmi?
   */
  function isPastDate(dateStr) {
    const todayStr = getTodayFormatted();
    return dateStr < todayStr;
  }

  /**
   * Standart bo'sh kun ma'lumotlar strukturasini yaratish (har bir bo'limda 3 tadan bo'sh qator)
   */
  function createBlankDayData() {
    const dayData = {
      archived: [] // Bajarildi bosilganda arxivlangan vazifalar
    };
    ALL_SECTION_KEYS.forEach(key => {
      dayData[key] = [];
      for (let i = 0; i < DEFAULT_PER_SECTION; i++) {
        dayData[key].push({
          id: generateId(),
          text: '',
          done: false
        });
      }
    });
    return dayData;
  }

  /**
   * LocalStorage'dan barcha ma'lumotlarni o'qish
   */
  function loadAllDataFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('LocalStorage ma\'lumotlarini o\'qishda xatolik:', e);
    }
    return {};
  }

  /**
   * Barcha ma'lumotlarni LocalStorage'ga yozish
   */
  function saveAllDataToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    } catch (e) {
      console.error('LocalStorage\'ga yozishda xatolik:', e);
    }
  }

  /**
   * Joriy tanlangan kun ma'lumotlarini olish (agar yo'q bo'lsa standartini yaratadi)
   */
  function getCurrentDayData() {
    if (!appData[currentDate]) {
      appData[currentDate] = createBlankDayData();
      saveAllDataToStorage();
    } else {
      // Mavjud kunda barcha bo'limlar mavjudligini tekshirish
      ALL_SECTION_KEYS.forEach(key => {
        if (!Array.isArray(appData[currentDate][key])) {
          appData[currentDate][key] = [];
        }
      });
      if (!Array.isArray(appData[currentDate].archived)) {
        appData[currentDate].archived = [];
      }
    }
    return appData[currentDate];
  }

  /**
   * Qalqib chiquvchi xabar (Toast)
   */
  let toastTimer = null;
  function showToast(msg) {
    if (!toastMessage) return;
    toastMessage.textContent = msg;
    toastMessage.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastMessage.classList.remove('show');
    }, 2400);
  }

  // --- STATISTIKA VA PROGRESS BAR (AI Feature 1) ---

  function updateStatistics() {
    const dayData = getCurrentDayData();
    let totalTasks = 0;
    let completedTasks = 0;

    // Arxivlangan vazifalarni hisoblash
    if (dayData.archived && dayData.archived.length > 0) {
      completedTasks += dayData.archived.length;
      totalTasks += dayData.archived.length;
    }

    // Jadvaldagi kiritilgan vazifalarni hisoblash
    ALL_SECTION_KEYS.forEach(key => {
      const list = dayData[key] || [];
      list.forEach(task => {
        if (task.text && task.text.trim().length > 0) {
          totalTasks++;
          if (task.done) {
            completedTasks++;
          }
        }
      });
    });

    let percent = 0;
    if (totalTasks > 0) {
      percent = Math.round((completedTasks / totalTasks) * 100);
    }

    // UI'ni yangilash
    const isPast = isPastDate(currentDate);
    const labelPrefix = isPast ? 'Kunlik natija' : 'Bugungi bajarilish';
    progressTitle.textContent = `${labelPrefix}: ${percent}%`;
    progressStatsDetail.textContent = `${completedTasks} / ${totalTasks} ta vazifa bajarildi`;
    progressBarFill.style.width = `${percent}%`;

    // Foizga qarab progress bar rangini moslash (klassik qora-oq yoki o'tgan kunda natijaviy)
    if (percent === 100 && totalTasks > 0) {
      progressBarFill.style.backgroundColor = '#1b5e20'; // 100% yashil
    } else if (isPast && percent < 50 && totalTasks > 0) {
      progressBarFill.style.backgroundColor = '#c62828'; // O'tgan kunda kam bajarilgan bo'lsa qizilroq
    } else {
      progressBarFill.style.backgroundColor = '#111111'; // Standart qora
    }
  }

  // --- JADVALNI RENDER QILISH (DYNAMIC ROWSPAN VA STIL) ---

  function renderTable() {
    const dayData = getCurrentDayData();
    const isPast = isPastDate(currentDate);

    // Header va sana matnlarini yangilash
    currentDateText.textContent = currentDate;
    datePickerInput.value = currentDate;

    // O'tgan kun ko'rsatkichini ko'rsatish/yashirish
    if (isPast) {
      pastDayIndicator.classList.remove('hidden');
    } else {
      pastDayIndicator.classList.add('hidden');
    }

    // Jadval tanasini tozalash
    plannerTableBody.innerHTML = '';

    // Jadval qatorlarini chizish
    SECTIONS_CONFIG.forEach(group => {
      // Guruh ichidagi (masalan 'E') barcha qatorlarni tayyorlash
      const groupSubtypesData = [];
      let totalGroupRowCount = 0;

      group.subtypes.forEach(subtype => {
        let tasks = dayData[subtype.fullKey] || [];

        // Filtrni qo'llash
        let visibleTasks = tasks.filter(task => {
          if (currentFilter === 'all') return true;
          const hasText = task.text && task.text.trim().length > 0;
          if (currentFilter === 'completed') {
            return task.done === true;
          }
          if (currentFilter === 'pending') {
            return task.done === false && hasText;
          }
          return true;
        });

        // Agar filtr tufayli qator qolmasa, kamida 1 ta info qatori ko'rsatiladi
        const displayCount = visibleTasks.length > 0 ? visibleTasks.length : 1;
        totalGroupRowCount += displayCount;

        groupSubtypesData.push({
          subtype,
          tasks: visibleTasks,
          isEmptyState: visibleTasks.length === 0,
          originalTasks: tasks
        });
      });

      // HTML TR elementlarini yaratish
      let isFirstRowOfGroup = true;

      groupSubtypesData.forEach(subObj => {
        const subtype = subObj.subtype;
        const subRowCount = subObj.isEmptyState ? 1 : subObj.tasks.length;
        let isFirstRowOfSubtype = true;

        if (subObj.isEmptyState) {
          // Filtrda vazifalar bo'lmaganda ko'rsatiladigan 1 ta qator
          const tr = document.createElement('tr');

          // 1-ustun: Bo'lim (E yoki K)
          if (isFirstRowOfGroup) {
            const tdSection = document.createElement('td');
            tdSection.rowSpan = totalGroupRowCount;
            tdSection.className = 'cell-section';
            tdSection.textContent = group.groupTitle;
            tr.appendChild(tdSection);
            isFirstRowOfGroup = false;
          }

          // 2-ustun: Turi (M yoki I)
          const tdSubtype = document.createElement('td');
          tdSubtype.rowSpan = subRowCount;
          tdSubtype.className = 'cell-subtype';
          tdSubtype.textContent = subtype.title;
          tr.appendChild(tdSubtype);

          // 3, 4, 5-ustunlar bo'sh holat xabari
          const tdEmpty = document.createElement('td');
          tdEmpty.colSpan = 3;
          tdEmpty.className = 'empty-filter-cell';
          tdEmpty.textContent = 'Mos vazifalar yo\'q';
          tr.appendChild(tdEmpty);

          plannerTableBody.appendChild(tr);
        } else {
          // Oddiy qatorlar
          subObj.tasks.forEach((task, index) => {
            const tr = document.createElement('tr');
            tr.dataset.taskId = task.id;
            tr.dataset.sectionKey = subtype.fullKey;

            // O'tgan kun yoki joriy kundagi stil sinflari
            const hasText = task.text && task.text.trim().length > 0;
            if (isPast && hasText) {
              if (task.done) {
                tr.classList.add('row-past-done'); // YASHIL
              } else {
                tr.classList.add('row-past-missed'); // QIZIL
              }
            } else if (task.done) {
              tr.classList.add('row-completed');
            }

            // 1-ustun: Guruh (E yoki K)
            if (isFirstRowOfGroup) {
              const tdSection = document.createElement('td');
              tdSection.rowSpan = totalGroupRowCount;
              tdSection.className = 'cell-section';
              tdSection.textContent = group.groupTitle;
              tr.appendChild(tdSection);
              isFirstRowOfGroup = false;
            }

            // 2-ustun: Ichki bo'lim (M yoki I)
            if (isFirstRowOfSubtype) {
              const tdSubtype = document.createElement('td');
              tdSubtype.rowSpan = subRowCount;
              tdSubtype.className = 'cell-subtype';
              tdSubtype.textContent = subtype.title;
              tr.appendChild(tdSubtype);
              isFirstRowOfSubtype = false;
            }

            // 3-ustun: Tartib raqami (1, 2, 3...)
            const tdIndex = document.createElement('td');
            tdIndex.className = 'cell-index';
            tdIndex.textContent = index + 1;
            tr.appendChild(tdIndex);

            // 4-ustun: Vazifa kiritish input maydoni
            const tdTask = document.createElement('td');
            tdTask.className = 'cell-task';

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'task-input';
            input.value = task.text || '';
            input.placeholder = `Vazifa kiriting... (${subtype.title}-${index + 1})`;
            input.autocomplete = 'off';

            // Matn o'zgarganda saqlash
            input.addEventListener('input', (e) => {
              task.text = e.target.value;
              saveAllDataToStorage();
              updateStatistics();
            });

            // Enter bosilganda keyingi inputga fokus
            input.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const inputs = Array.from(plannerTableBody.querySelectorAll('.task-input'));
                const currentIndex = inputs.indexOf(input);
                if (currentIndex >= 0 && currentIndex < inputs.length - 1) {
                  inputs[currentIndex + 1].focus();
                }
              }
            });

            tdTask.appendChild(input);
            tr.appendChild(tdTask);

            // 5-ustun: Bajarilganlik holati (Checkbox)
            const tdStatus = document.createElement('td');
            tdStatus.className = 'cell-status';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'status-checkbox';
            checkbox.checked = Boolean(task.done);

            checkbox.addEventListener('change', (e) => {
              task.done = e.target.checked;
              saveAllDataToStorage();
              updateStatistics();

              // Qator stilini dinamik yangilash
              if (isPast) {
                renderTable(); // O'tgan kunda yashil/qizil rangni yangilash uchun qayta chizamiz
              } else {
                if (task.done) {
                  tr.classList.add('row-completed');
                } else {
                  tr.classList.remove('row-completed');
                }
              }
            });

            tdStatus.appendChild(checkbox);
            tr.appendChild(tdStatus);

            plannerTableBody.appendChild(tr);
          });
        }
      });
    });

    updateStatistics();
  }

  // --- 5 TA ASOSIY TUGMA FUNKSIONALLIGI ---

  /**
   * 1. "Tasdiqlash":
   * Bosilganda matn kiritilmagan (bo'sh) qatorlarni o'chirsin va qolgan qatorlar
   * raqamlanishini (1, 2, 3...) avtomatik qayta tartiblasin.
   */
  function handleConfirm() {
    const dayData = getCurrentDayData();
    let removedCount = 0;

    ALL_SECTION_KEYS.forEach(key => {
      const originalList = dayData[key] || [];
      const filtered = originalList.filter(task => {
        const hasText = task.text && task.text.trim().length > 0;
        if (!hasText) {
          removedCount++;
          return false;
        }
        return true;
      });

      // Agar bo'lim butunlay bo'shab qolsa, struktura buzilmasligi uchun kamida 1 ta bo'sh qator qoldiramiz
      if (filtered.length === 0) {
        filtered.push({
          id: generateId(),
          text: '',
          done: false
        });
      }

      dayData[key] = filtered;
    });

    saveAllDataToStorage();
    renderTable();
    showToast(`Bo'sh qatorlar tozalandi va tartiblandi! (${removedCount} ta bo'sh qator o'chirildi)`);
  }

  /**
   * 2. "+" (Qator qo'shish):
   * Har bir bo'limda ("E-M", "E-I", "K-M", "K-I") standart 3 tadan qator bo'lishi kerak.
   * Agar qatorlar soni 3 tadan kamaygan bo'lsa, yetmayotgan bo'limlarga yangi bo'sh qatorlarni
   * qo'shib, tartibni tiklasin. Agar allaqachon 3 ta yoki ko'p bo'lsa, har biriga 1 tadan qo'shadi.
   */
  function handleAddRow() {
    const dayData = getCurrentDayData();
    let anyRestored = false;

    // 1-qadam: Avval 3 tadan kam bo'lgan bo'limlarni tekshirish
    ALL_SECTION_KEYS.forEach(key => {
      const currentCount = dayData[key].length;
      if (currentCount < DEFAULT_PER_SECTION) {
        anyRestored = true;
        const needed = DEFAULT_PER_SECTION - currentCount;
        for (let i = 0; i < needed; i++) {
          dayData[key].push({
            id: generateId(),
            text: '',
            done: false
          });
        }
      }
    });

    // 2-qadam: Agar hamma bo'limda allaqachon 3 tadan yoki undan ko'p bo'lsa, har biriga 1 tadan yangi qator qo'shadi
    if (!anyRestored) {
      ALL_SECTION_KEYS.forEach(key => {
        dayData[key].push({
          id: generateId(),
          text: '',
          done: false
        });
      });
      showToast('Har bir bo\'limga 1 tadan yangi qator qo\'shildi!');
    } else {
      showToast('Bo\'limlar standart 3 tadan qatorga to\'ldirildi!');
    }

    saveAllDataToStorage();
    renderTable();
  }

  /**
   * 3. "Bajarildi":
   * Belgilangan (check qo'yilgan) qatorlarni jadvaldan o'chirsin/arxivlasin.
   * Jadvalning umumiy vizual strukturasi va bo'limlar birlashmasi ('rowspan') buzilmasin.
   */
  function handleCompleted() {
    const dayData = getCurrentDayData();
    let completedCount = 0;

    ALL_SECTION_KEYS.forEach(key => {
      const originalList = dayData[key] || [];
      const remaining = [];

      originalList.forEach(task => {
        if (task.done) {
          completedCount++;
          // Arxivga qo'shish
          dayData.archived.push({
            ...task,
            sectionKey: key,
            archivedAt: new Date().toISOString()
          });
        } else {
          remaining.push(task);
        }
      });

      // Agar bo'lim butunlay bo'shab qolsa, struktura buzilmasligi uchun kamida 1 ta bo'sh qator qoldiramiz
      if (remaining.length === 0) {
        remaining.push({
          id: generateId(),
          text: '',
          done: false
        });
      }

      dayData[key] = remaining;
    });

    if (completedCount === 0) {
      showToast('Hech qanday bajarilgan vazifa belgilanmagan!');
      return;
    }

    saveAllDataToStorage();
    renderTable();
    showToast(`${completedCount} ta bajarilgan vazifa arxivlandi!`);
  }

  /**
   * 4. ">" (Keyingi kun):
   * Sanani 1 kunga oldinga sursin va ertangi kun uchun yangi bo'sh jadval ochsin (yoki saqlangan reja).
   */
  function handleNextDay() {
    currentDate = shiftDate(currentDate, 1);
    renderTable();
    showToast(`Sana: ${currentDate}`);
  }

  /**
   * 5. "<" (Oldingi kun):
   * Sanani 1 kunga orqaga sursin va kechagi kun natijalarini ko'rsatsin.
   * Kechagi kunda bajarilgan vazifalar YASHIL, bajarilmaganlar esa QIZIL rang bilan ajratib ko'rsatilsin.
   */
  function handlePrevDay() {
    currentDate = shiftDate(currentDate, -1);
    renderTable();
    showToast(`Sana: ${currentDate} natijalari`);
  }

  /**
   * Bugungi kunga qaytish
   */
  function handleGoToday() {
    currentDate = getTodayFormatted();
    renderTable();
    showToast('Bugungi kunga o\'tildi');
  }

  // --- FILTRLAR VA ZAXIRALASH (AI Features 2 & 3) ---

  // Filtr tugmalari
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTable();
    });
  });

  // JSON Eksport qilish
  function handleExport() {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `kunlik-reja-backup-${currentDate}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Ma\'lumotlar muvaffaqiyatli yuklab olindi!');
    } catch (e) {
      console.error('Eksportda xatolik:', e);
      alert('Eksport jarayonida xatolik yuz berdi!');
    }
  }

  // JSON Import qilish
  function handleImportClick() {
    if (importFileInput) {
      importFileInput.value = '';
      importFileInput.click();
    }
  }

  function handleImportFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const parsed = JSON.parse(event.target.result);
        if (typeof parsed !== 'object' || parsed === null) {
          throw new Error('Noto\'g\'ri fayl formati');
        }

        // Ma'lumotlarni birlashtirish yoki yangilash
        appData = { ...appData, ...parsed };
        saveAllDataToStorage();
        renderTable();
        showToast('Ma\'lumotlar muvaffaqiyatli import qilindi!');
      } catch (err) {
        console.error('Import xatosi:', err);
        alert('Xatolik: Yuklangan fayl yaroqli JSON formati emas!');
      }
    };
    reader.readAsText(file);
  }

  // --- HODISALARNI BIRIKTIRISH (EVENT LISTENERS) ---

  function setupEventListeners() {
    // Navigatsiya tugmalari
    btnPrevDay.addEventListener('click', handlePrevDay);
    btnNextDay.addEventListener('click', handleNextDay);
    btnPrevDayNav.addEventListener('click', handlePrevDay);
    btnNextDayNav.addEventListener('click', handleNextDay);
    btnToday.addEventListener('click', handleGoToday);

    // Asosiy harakat tugmalari
    btnConfirm.addEventListener('click', handleConfirm);
    btnAddRow.addEventListener('click', handleAddRow);
    btnCompleted.addEventListener('click', handleCompleted);

    // Sana tanlash (Datepicker)
    datePickerInput.addEventListener('change', (e) => {
      if (e.target.value) {
        currentDate = e.target.value;
        renderTable();
        showToast(`Sana tanlandi: ${currentDate}`);
      }
    });

    // Eksport va Import
    btnExport.addEventListener('click', handleExport);
    btnImport.addEventListener('click', handleImportClick);
    importFileInput.addEventListener('change', handleImportFile);
  }

  // --- ILOVANI ISHGA TUSHIRISH ---
  function initApp() {
    setupEventListeners();
    renderTable();
  }

  // DOM to'liq yuklangandan so'ng boshlash
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();

