const table = document.querySelector("table");
const main = document.querySelector("main");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

const counter = document.createElement("div");
counter.className = "task-counter";
main.insertBefore(counter, table);

const addBtn = document.createElement("button");
addBtn.textContent = "Add task";
addBtn.className = "add-task";
main.insertBefore(addBtn, table);

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function updateCounter() {
    const total = document.querySelectorAll(".task").length;
    const completed = document.querySelectorAll(".check-btn.completed").length;

    counter.textContent = `Tasks: ${total} | Completed: ${completed}`;
}

function addButtons(row) {
    const taskCell = row.querySelector(".task");
    const checkCell = row.querySelector(".check");

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "edit-btn";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "delete-btn";

    taskCell.appendChild(editBtn);
    taskCell.appendChild(deleteBtn);

    const checkBtn = checkCell.querySelector(".check-btn");

    checkBtn.addEventListener("click", function () {
        checkBtn.classList.toggle("completed");

        const input = taskCell.querySelector("input");

        if (checkBtn.classList.contains("completed")) {
            input.style.textDecoration = "line-through";
            checkBtn.textContent = "✓";
        } else {
            input.style.textDecoration = "none";
            checkBtn.textContent = "✓";
        }

        saveCurrentTasks();
        updateCounter();
    });

    editBtn.addEventListener("click", function () {
        const input = taskCell.querySelector("input");

        if (input.disabled) {
            input.disabled = false;
            input.focus();
            editBtn.textContent = "Save";
        } else {
            input.disabled = true;
            editBtn.textContent = "Edit";
            saveCurrentTasks();
        }
    });

    deleteBtn.addEventListener("click", function () {
        row.remove();
        saveCurrentTasks();
        updateCounter();
    });
}

function saveCurrentTasks() {
    tasks = [];

    document.querySelectorAll("tr").forEach(row => {
        const input = row.querySelector(".task input");
        const check = row.querySelector(".check-btn");

        if (input) {
            tasks.push({
                text: input.value,
                completed: check.classList.contains("completed")
            });
        }
    });

    saveTasks();
}

document.querySelectorAll("tr").forEach(row => {
    const input = row.querySelector(".task input");

    if (input) {
        input.disabled = true;
        addButtons(row);
    }
});

addBtn.addEventListener("click", function () {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td class="time">Y</td>

        <td class="category">Y</td>

        <td class="task">
            <span>+</span>
            <input type="text" placeholder="Vazifa yozing">
        </td>

        <td class="check">
            <button class="check-btn">✓</button>
        </td>
    `;

    table.appendChild(row);

    const input = row.querySelector("input");
    input.disabled = false;
    input.focus();

    addButtons(row);

    saveCurrentTasks();
    updateCounter();
});

function loadTasks() {
    const rows = document.querySelectorAll("tr");

    tasks.forEach((task, index) => {
        const input = rows[index]?.querySelector(".task input");
        const check = rows[index]?.querySelector(".check-btn");

        if (input) {
            input.value = task.text;
            input.disabled = true;
        }

        if (check && task.completed) {
            check.classList.add("completed");
            input.style.textDecoration = "line-through";
        }
    });
}

loadTasks();
updateCounter();