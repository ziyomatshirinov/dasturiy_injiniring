
const STORAGE_KEY = "kunlikTopshiriqlarV1";

let activeDate = new Date().toLocaleDateString("sv-SE");
let allDays = {};
let saveTimer;

function initialTasks() {
    const tasks = [];

    for (const group of ["E", "K"]) {
        for (const type of ["M", "I"]) {
            for (let i = 1; i <= 3; i++) {
                tasks.push({
                    id: Date.now() + Math.random(),
                    group: group,
                    type: type,
                    text: "",
                    status: "pending"
                });
            }
        }
    }

    return tasks;
}

function loadData() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "{}"
        );

        allDays = saved.days || {};

        if (saved.theme === "dark") {
            document.body.classList.add("dark");
        }
    } catch (error) {
        allDays = {};
    }
}

function getTasks() {
    if (!allDays[activeDate]) {
        allDays[activeDate] = initialTasks();
    }

    return allDays[activeDate];
}

function saveData(showMessage = false) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
            days: allDays,
            theme: document.body.classList.contains("dark")
                ? "dark"
                : "light"
        })
    );

    if (showMessage) {
        document.getElementById("saveBtn").textContent = "Saqlandi ✓";

        setTimeout(() => {
            document.getElementById("saveBtn").textContent = "Saqlash";
        }, 1000);
    }
}

function autoSave() {
    clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
        saveData();
    }, 200);
}

function formatDate(date) {
    return new Date(date + "T12:00:00").toLocaleDateString(
        "uz-UZ",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );
}

function render() {
    document.getElementById("datePicker").value = activeDate;
    document.getElementById("dayTitle").textContent =
        formatDate(activeDate);

    const table = document.getElementById("taskTable");
    table.innerHTML = "";

    const tasks = getTasks();
    const groupSeen = {};
    const typeSeen = {};
    const counts = {};

    tasks.forEach(task => {
        const key = task.group + task.type;
        counts[key] = (counts[key] || 0) + 1;
    });

    tasks.forEach((task, index) => {
        const row = document.createElement("tr");

        if (!groupSeen[task.group]) {
            const cell = document.createElement("td");
            cell.textContent = task.group;
            cell.rowSpan = tasks.filter(
                t => t.group === task.group
            ).length;

            row.appendChild(cell);
            groupSeen[task.group] = true;
        }

        const typeKey = task.group + task.type;

        if (!typeSeen[typeKey]) {
            const cell = document.createElement("td");
            cell.textContent = task.type;
            cell.rowSpan = counts[typeKey];

            row.appendChild(cell);
            typeSeen[typeKey] = true;
        }

        const taskCell = document.createElement("td");
        const wrapper = document.createElement("div");
        wrapper.className = "row-number";

        const number = document.createElement("span");

        number.textContent =
            tasks.filter((t, i) =>
                i <= index &&
                t.group === task.group &&
                t.type === task.type
            ).length + ".";

        const input = document.createElement("input");
        input.className = "task-input";
        input.placeholder = "Topshiriqni yozing...";
        input.value = task.text;

        input.addEventListener("input", () => {
            task.text = input.value;
            autoSave();
            updateSummary();
        });

        wrapper.append(number, input);
        taskCell.appendChild(wrapper);
        row.appendChild(taskCell);

        const statusCell = document.createElement("td");
        const select = document.createElement("select");

        select.className = "status-select " + task.status;

        const options = [
            ["pending", "Belgilanmagan"],
            ["done", "Bajarildi"],
            ["notdone", "Bajarilmadi"]
        ];

        options.forEach(([value, label]) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = label;
            select.appendChild(option);
        });

        select.value = task.status;

        select.addEventListener("change", () => {
            task.status = select.value;
            select.className = "status-select " + task.status;

            autoSave();
            updateSummary();
        });

        statusCell.appendChild(select);
        row.appendChild(statusCell);
        table.appendChild(row);
    });

    updateSummary();
}

function updateSummary() {
    const tasks = getTasks().filter(
        task => task.text.trim() !== ""
    );

    const done = tasks.filter(
        task => task.status === "done"
    ).length;

    const notDone = tasks.filter(
        task => task.status === "notdone"
    ).length;

    document.getElementById("summary").textContent =
        `Jami: ${tasks.length} | Bajarildi: ${done} | Bajarilmadi: ${notDone}`;
}

function changeDay(amount) {
    const date = new Date(activeDate + "T12:00:00");

    date.setDate(date.getDate() + amount);

    activeDate = date.toLocaleDateString("sv-SE");

    render();
}

document.getElementById("prevBtn").addEventListener("click", () => {
    changeDay(-1);
});

document.getElementById("nextBtn").addEventListener("click", () => {
    changeDay(1);
});

document.getElementById("todayBtn").addEventListener("click", () => {
    activeDate = new Date().toLocaleDateString("sv-SE");
    render();
});

document.getElementById("datePicker").addEventListener("change", event => {
    if (event.target.value) {
        activeDate = event.target.value;
        render();
    }
});

document.getElementById("addBtn").addEventListener("click", () => {
    const tasks = getTasks();
    const last = tasks[tasks.length - 1];

    tasks.push({
        id: Date.now() + Math.random(),
        group: last ? last.group : "E",
        type: last ? last.type : "M",
        text: "",
        status: "pending"
    });

    render();
    saveData();

    const inputs = document.querySelectorAll(".task-input");

    inputs[inputs.length - 1].focus();
});

document.getElementById("saveBtn").addEventListener("click", () => {
    saveData(true);
});

document.getElementById("themeBtn").addEventListener("click", () => {
    document.body.classList.toggle("dark");

    const dark = document.body.classList.contains("dark");

    document.getElementById("themeBtn").textContent =
        dark ? "☀️ Light" : "🌙 Dark";

    saveData();
});

loadData();

document.getElementById("themeBtn").textContent =
    document.body.classList.contains("dark")
        ? "☀️ Light"
        : "🌙 Dark";

render();
