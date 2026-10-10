(() => {
  const body = document.getElementById('tableBody');
  const message = document.getElementById('message');
  const app = document.getElementById('app');
  const dateInput = document.getElementById('dateInput');
  let running = false;
  let activeGroup = 0;
  let history = [];
  let data = [
    { group: 'E', kind: 'M', items: [{text:'', checked:true},{text:'',checked:false},{text:'',checked:false}] },
    { group: 'E', kind: 'I', items: [{text:'',checked:false},{text:'',checked:false},{text:'',checked:false}] },
    { group: 'K', kind: 'M', items: [{text:'',checked:false},{text:'',checked:false},{text:'',checked:false}] },
    { group: 'K', kind: 'I', items: [{text:'',checked:false},{text:'',checked:false},{text:'',checked:false}] }
  ];
  const clone = value => JSON.parse(JSON.stringify(value));
  function saveHistory() { history.push({data:clone(data), date:dateInput.value, running, activeGroup}); if (history.length > 100) history.shift(); }
  function render(focusIndex = null) {
    body.innerHTML = '';
    data.forEach((section, si) => {
      section.items.forEach((item, ii) => {
        const tr = document.createElement('tr');
        if (ii === 0) {
          const groupCell = document.createElement('td');
          groupCell.className = 'group'; groupCell.rowSpan = section.items.length; groupCell.textContent = section.group;
          tr.appendChild(groupCell);
          const kindCell = document.createElement('td');
          kindCell.className = 'kind'; kindCell.rowSpan = section.items.length; kindCell.textContent = section.kind;
          tr.appendChild(kindCell);
        }
        const number = document.createElement('td'); number.className = 'number'; number.textContent = `${ii + 1}.`; tr.appendChild(number);
        const entry = document.createElement('td'); entry.className = 'entry';
        const input = document.createElement('input'); input.type = 'text'; input.value = item.text;
        input.setAttribute('aria-label', `${section.group} ${section.kind}, ${ii+1}-qator`);
        input.disabled = running;
        input.addEventListener('input', () => { data[si].items[ii].text = input.value; });
        input.addEventListener('change', () => { saveHistory(); data[si].items[ii].text = input.value; });
        entry.appendChild(input); tr.appendChild(entry);
        const status = document.createElement('td'); status.className = 'status'; status.textContent = item.checked ? '✓' : ''; tr.appendChild(status);
        body.appendChild(tr);
      });
    });
    document.getElementById('undoBtn').disabled = history.length === 0;
    document.getElementById('confirmBtn').disabled = running;
    document.getElementById('addBtn').disabled = running;
    document.getElementById('nextBtn').disabled = running;
    app.classList.toggle('running', running);
    if (focusIndex !== null) {
      const inputs = body.querySelectorAll('input');
      if (inputs[focusIndex]) { inputs[focusIndex].focus(); inputs[focusIndex].setSelectionRange(inputs[focusIndex].value.length, inputs[focusIndex].value.length); }
    }
  }
  function snapshot() { saveHistory(); }
  document.getElementById('confirmBtn').addEventListener('click', () => {
    snapshot();
    data.forEach(section => { section.items = section.items.filter(item => item.text.trim() !== ''); });
    data = data.filter(section => section.items.length > 0);
    data.forEach(section => section.items.forEach((item, index) => { item.checked = false; }));
    if (!data.length) {
      message.textContent = 'Bo‘sh kataklar olib tashlandi. Hozircha matn kiritilmagan.';
    } else {
      message.textContent = 'Bo‘sh qatorlar olib tashlandi va raqamlar qayta tartiblandi.';
    }
    render();
  });
  document.getElementById('addBtn').addEventListener('click', () => {
    snapshot();
    if (!data.length) {
      data = [
        {group:'E',kind:'M',items:[]},
        {group:'E',kind:'I',items:[]},
        {group:'K',kind:'M',items:[]},
        {group:'K',kind:'I',items:[]}
      ];
    }
    // Agar barcha mavjud kataklarda matn bo‘lsa, har bir bo‘limga bittadan qator qo‘shiladi.
    const allFilled = data.every(section => section.items.length > 0 && section.items.every(item => item.text.trim() !== ''));
    if (allFilled) {
      data.forEach(section => section.items.push({text:'',checked:false}));
      message.textContent = 'Barcha kataklar to‘ldirilgan. Har bir bo‘limga bittadan yangi qator qo‘shildi.';
      render();
      const firstNewInput = body.querySelectorAll('input')[Math.max(0, body.querySelectorAll('input').length - data.length)];
      if (firstNewInput) firstNewInput.focus();
      return;
    }
    const target = data[Math.min(activeGroup, data.length - 1)];
    target.items.push({text:'',checked:false});
    message.textContent = `${target.group} / ${target.kind} bo‘limiga yangi qator qo‘shildi. Barcha kataklar to‘ldirilsa, + tugmasi har bir bo‘limga qator qo‘shadi.`;
    render();
    const inputs = body.querySelectorAll('input');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });
  document.getElementById('undoBtn').addEventListener('click', () => {
    if (!history.length) return;
    const previous = history.pop();
    data = previous.data; dateInput.value = previous.date; running = previous.running; activeGroup = previous.activeGroup;
    message.textContent = 'Oxirgi amal bekor qilindi.';
    render();
  });
  document.getElementById('runBtn').addEventListener('click', () => {
    if (!running) {
      snapshot(); running = true;
      message.textContent = 'Dastur ishga tushdi: ro‘yxat bajarish rejimida.';
      render();
      document.getElementById('runBtn').textContent = 'Tahrirlash';
    } else {
      snapshot(); running = false;
      message.textContent = 'Tahrirlash rejimiga qaytildi.';
      render();
      document.getElementById('runBtn').textContent = 'Bajarildi';
    }
  });
  document.getElementById('nextBtn').addEventListener('click', () => {
    if (!data.length) { message.textContent = 'Avval qator qo‘shing.'; return; }
    snapshot();
    activeGroup = (activeGroup + 1) % data.length;
    const section = data[activeGroup];
    message.textContent = `Tanlangan bo‘lim: ${section.group} / ${section.kind}. Endi + shu bo‘limga qator qo‘shadi.`;
  });
  dateInput.addEventListener('change', snapshot);
  render();
})();
