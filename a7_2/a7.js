// ===============================
// A7 TO-DO PLANNER
// ===============================

// Boshlang'ich ma'lumotlar
const defaultSections = [
    {
        id: 'morning-required',
        time: 'ertalab',
        title: 'majburiy',
        tasks: [
            { id: 'em1', text: '', completed: false },
            { id: 'em2', text: '', completed: false },
            { id: 'em3', text: '', completed: false }
        ]
    },
    {
        id: 'morning-optional',
        time: 'ertalab',
        title: 'ixtiyoriy',
        tasks: [
            { id: 'ei1', text: '', completed: false },
            { id: 'ei2', text: '', completed: false },
            { id: 'ei3', text: '', completed: false }
        ]
    },
    {
        id: 'evening-required',
        time: 'kechki',
        title: 'majburiy',
        tasks: [
            { id: 'km1', text: '', completed: false },
            { id: 'km2', text: '', completed: false },
            { id: 'km3', text: '', completed: false }
        ]
    },
    {
        id: 'evening-optional',
        time: 'kechki',
        title: 'ixtiyoriy',
        tasks: [
            { id: 'ki1', text: '', completed: false },
            { id: 'ki2', text: '', completed: false },
            { id: 'ki3', text: '', completed: false }
        ]
    }
];

let state = {
    title: 'to-do',
    selectedTime: 'ertalab',
    sections: []
};


// ===============================
// LOCAL STORAGE
// ===============================

function loadState() {
    try {
        const saved = localStorage.getItem('a7_todo_data');

        if (saved) {
            state = JSON.parse(saved);

            // Eski versiyadagi ma'lumotlar sababli xatolik chiqmasligi uchun
            if (!state.sections || !Array.isArray(state.sections)) {
                state.sections = JSON.parse(JSON.stringify(defaultSections));
            }

            if (!state.selectedTime) {
                state.selectedTime = 'ertalab';
            }

        } else {
            state.sections = JSON.parse(JSON.stringify(defaultSections));
        }

    } catch (error) {
        console.error('Ma\'lumotni yuklashda xato:', error);
        state.sections = JSON.parse(JSON.stringify(defaultSections));
    }
}


function saveState() {
    try {
        localStorage.setItem(
            'a7_todo_data',
            JSON.stringify(state)
        );
    } catch (error) {
        console.error('Ma\'lumotni saqlashda xato:', error);
    }
}


// ===============================
// TIME SELECTOR
// ===============================

function createTimeSelector() {

    const oldSelector = document.getElementById('timeSelector');

    if (oldSelector) {
        oldSelector.remove();
    }

    const gridContainer = document.getElementById('gridContainer');

    const selector = document.createElement('div');

    selector.id = 'timeSelector';

    selector.className =
        'col-span-1 md:col-span-2 flex justify-center gap-3 mb-2';

    // Ertalabgi tugma
    const morningBtn = document.createElement('button');

    morningBtn.type = 'button';

    morningBtn.textContent = 'Ertalabgi';

    morningBtn.className =
        'px-4 py-2 rounded-lg text-sm font-medium border transition';

    // Kechki tugma
    const eveningBtn = document.createElement('button');

    eveningBtn.type = 'button';

    eveningBtn.textContent = 'Kechki';

    eveningBtn.className =
        'px-4 py-2 rounded-lg text-sm font-medium border transition';

    function updateButtons() {

        if (state.selectedTime === 'ertalab') {

            morningBtn.className =
                'px-4 py-2 rounded-lg text-sm font-medium border transition bg-pink-200 text-pink-700 border-pink-300';

            eveningBtn.className =
                'px-4 py-2 rounded-lg text-sm font-medium border transition bg-gray-50 text-gray-600 border-gray-200';

        } else {

            eveningBtn.className =
                'px-4 py-2 rounded-lg text-sm font-medium border transition bg-pink-200 text-pink-700 border-pink-300';

            morningBtn.className =
                'px-4 py-2 rounded-lg text-sm font-medium border transition bg-gray-50 text-gray-600 border-gray-200';
        }
    }

    morningBtn.onclick = () => {

        state.selectedTime = 'ertalab';

        saveState();
        updateButtons();
        renderSections();
    };

    eveningBtn.onclick = () => {

        state.selectedTime = 'kechki';

        saveState();
        updateButtons();
        renderSections();
    };

    selector.appendChild(morningBtn);
    selector.appendChild(eveningBtn);

    // Grid ichiga selectorni birinchi element qilib joylashtiramiz
    gridContainer.prepend(selector);

    updateButtons();
}


// ===============================
// RENDER
// ===============================

function renderSections() {

    const container = document.getElementById('gridContainer');

    // Eski sectionlarni o'chiramiz,
    // lekin selectorni saqlab qolamiz
    const selector = document.getElementById('timeSelector');

    container.innerHTML = '';

    if (selector) {
        container.appendChild(selector);
    }

    // Faqat tanlangan vaqtni chiqaramiz
    const selectedSections = state.sections.filter(
        section => section.time === state.selectedTime
    );

    selectedSections.forEach((sec) => {

        const sectionIndex = state.sections.indexOf(sec);

        // Section
        const sectionEl = document.createElement('div');

        // Mavjud class saqlanmoqda
        sectionEl.className = 'flex flex-col group';


        // ===============================
        // HEADER
        // ===============================

        const headerBar = document.createElement('div');

        // Mavjud classlar saqlanmoqda
        headerBar.className =
            'bg-pink-header bg-pink-200/70 border border-pink-300 rounded-md h-8 mb-4 px-3 flex items-center justify-between shadow-sm';


        const headerInput = document.createElement('input');

        headerInput.type = 'text';

        headerInput.value = sec.title;

        headerInput.placeholder = 'Category Name...';

        headerInput.className =
            'w-full bg-transparent font-medium text-gray-700 focus:outline-none text-sm tracking-wide';

        headerInput.oninput = (e) => {

            sec.title = e.target.value;

            saveState();
        };


        // ===============================
        // TASK LIST
        // ===============================

        const taskList = document.createElement('div');

        taskList.className =
            'space-y-3 flex-grow';


        sec.tasks.forEach((task, taskIdx) => {

            const row = document.createElement('div');

            row.className =
                'flex items-center gap-3 relative group/row';


            // Checkbox
            const checkbox = document.createElement('input');

            checkbox.type = 'checkbox';

            checkbox.checked = task.completed;

            checkbox.className =
                'custom-checkbox';


            // Text
            const textInput = document.createElement('input');

            textInput.type = 'text';

            textInput.value = task.text;

            textInput.className =
                `line-input w-full py-0.5 text-sm text-gray-700 ${
                    task.completed ? 'completed-task' : ''
                }`;


            // Checkbox o'zgarganda
            checkbox.onchange = () => {

                task.completed = checkbox.checked;

                textInput.classList.toggle(
                    'completed-task',
                    task.completed
                );

                saveState();
            };


            // Text o'zgarganda
            textInput.oninput = (e) => {

                task.text = e.target.value;

                saveState();
            };


            // ===============================
            // DELETE ROW
            // ===============================

            const deleteRowBtn = document.createElement('button');

            deleteRowBtn.className =
                'no-print opacity-0 group-hover/row:opacity-100 text-gray-300 hover:text-red-400 text-xs transition px-1';

            deleteRowBtn.innerHTML =
                '<i class="fa-solid fa-minus"></i>';

            deleteRowBtn.title =
                'Delete line';

            deleteRowBtn.onclick = () => {

                removeTaskRow(
                    sectionIndex,
                    taskIdx
                );
            };


            row.appendChild(checkbox);
            row.appendChild(textInput);
            row.appendChild(deleteRowBtn);

            taskList.appendChild(row);
        });


        // ===============================
        // ADD LINE
        // ===============================

        const addRowBtn = document.createElement('button');

        addRowBtn.className =
            'no-print text-xs text-pink-400 hover:text-pink-600 mt-2 self-start flex items-center gap-1 transition opacity-70 hover:opacity-100';

        addRowBtn.innerHTML =
            '<i class="fa-solid fa-plus text-[10px]"></i> Add Line';

        addRowBtn.onclick = () => {

            addTaskRow(sectionIndex);
        };


        // Header
        headerBar.appendChild(headerInput);

        // Section
        sectionEl.appendChild(headerBar);
        sectionEl.appendChild(taskList);
        sectionEl.appendChild(addRowBtn);

        container.appendChild(sectionEl);
    });
}


// ===============================
// ADD TASK
// ===============================

function addTaskRow(sectionIndex) {

    const section = state.sections[sectionIndex];

    section.tasks.push({

        id: 'task_' + Date.now(),

        text: '',

        completed: false

    });

    saveState();

    renderSections();
}


// ===============================
// DELETE TASK
// ===============================

function removeTaskRow(sectionIndex, taskIndex) {

    const section = state.sections[sectionIndex];

    // Kamida 1 ta qator qoladi
    if (section.tasks.length <= 1) {
        return;
    }

    section.tasks.splice(taskIndex, 1);

    saveState();

    renderSections();
}


// ===============================
// RESET
// ===============================

function resetPlanner() {

    const confirmed = confirm(
        'Are you sure you want to reset all contents to default?'
    );

    if (!confirmed) {
        return;
    }

    state.title = 'to-do';

    state.selectedTime = 'ertalab';

    state.sections =
        JSON.parse(
            JSON.stringify(defaultSections)
        );

    saveState();

    render();
}


// ===============================
// MAIN RENDER
// ===============================

function render() {

    const plannerTitle =
        document.getElementById('plannerTitle');

    plannerTitle.textContent =
        state.title || 'to-do';


    // Add Block kerak emas
    const addSectionBtn =
        document.getElementById('addSectionBtn');

    if (addSectionBtn) {
        addSectionBtn.style.display = 'none';
    }


    createTimeSelector();

    renderSections();
}


// ===============================
// PAGE LOAD
// ===============================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        loadState();

        render();


        // ===============================
        // TITLE EDIT
        // ===============================

        const plannerTitle =
            document.getElementById('plannerTitle');


        plannerTitle.addEventListener(
            'blur',
            () => {

                state.title =
                    plannerTitle.textContent.trim();

                saveState();
            }
        );


        plannerTitle.addEventListener(
            'keydown',
            (e) => {

                if (e.key === 'Enter') {

                    e.preventDefault();

                    plannerTitle.blur();
                }
            }
        );


        // ===============================
        // RESET BUTTON
        // ===============================

        const resetBtn =
            document.getElementById('resetBtn');

        resetBtn.addEventListener(
            'click',
            resetPlanner
        );
    }
);