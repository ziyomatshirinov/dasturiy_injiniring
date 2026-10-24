
import tkinter as tk
from tkinter import messagebox
from datetime import date, timedelta
import json
import os

FILE_NAME = "tasks.json"

BG = "#ffffff"
BLUE = "#4779c5"
BLUE_HOVER = "#3566ad"
BLACK = "#111111"
GREEN = "#d7f5d7"


class TaskApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Vazifalar")
        self.root.geometry("900x650")
        self.root.minsize(700, 520)
        self.root.configure(bg=BG)

        self.current_date = date.today()
        self.active_section = ("E", "M")
        self.data = self.load_data()
        self.entries = {}
        self.row_frames = {}

        self.build_interface()
        self.show_date()

    def load_data(self):
        if os.path.exists(FILE_NAME):
            try:
                with open(FILE_NAME, "r", encoding="utf-8") as file:
                    return json.load(file)
            except (json.JSONDecodeError, OSError):
                return {}
        return {}

    def save_data(self):
        try:
            with open(FILE_NAME, "w", encoding="utf-8") as file:
                json.dump(self.data, file, ensure_ascii=False, indent=2)
        except OSError as error:
            messagebox.showerror("Xatolik", f"Saqlab bo‘lmadi:\n{error}")

    def date_key(self):
        return self.current_date.isoformat()

    def ensure_date(self):
        key = self.date_key()

        if key not in self.data:
            self.data[key] = {
                group: {
                    subgroup: [
                        {"text": "", "done": False}
                        for _ in range(3)
                    ]
                    for subgroup in ("M", "I")
                }
                for group in ("E", "K")
            }

    def build_interface(self):
        # Sana qatori
        date_frame = tk.Frame(self.root, bg=BG)
        date_frame.pack(fill="x", padx=20, pady=(15, 8))

        tk.Label(
            date_frame,
            text="Sana:",
            font=("Arial", 13),
            bg=BG
        ).pack(side="left", padx=(0, 12))

        self.date_entry = tk.Entry(
            date_frame,
            font=("Arial", 12),
            width=14,
            relief="solid",
            bd=1
        )
        self.date_entry.pack(side="left", ipady=4)
        self.date_entry.bind("<Return>", self.change_date_from_entry)

        # Jadval joylashadigan qism
        self.table_container = tk.Frame(self.root, bg=BG)
        self.table_container.pack(
            fill="both",
            expand=True,
            padx=20,
            pady=5
        )

        # Ustunlar kengligi
        self.table_container.grid_columnconfigure(0, minsize=55)
        self.table_container.grid_columnconfigure(1, minsize=60)
        self.table_container.grid_columnconfigure(2, weight=1, minsize=250)
        self.table_container.grid_columnconfigure(3, minsize=55)

        # Pastdagi tugmalar
        buttons_frame = tk.Frame(self.root, bg=BG)
        buttons_frame.pack(fill="x", padx=20, pady=(10, 18))

        buttons_frame.grid_columnconfigure((0, 1, 2, 3, 4), weight=1)

        self.make_button(buttons_frame, "<", self.previous_day, 0)
        self.make_button(buttons_frame, "Tasdiqlash", self.confirm_task, 1)
        self.make_button(buttons_frame, "+", self.add_row, 2)
        self.make_button(buttons_frame, "Bajarildi", self.show_completed, 3)
        self.make_button(buttons_frame, ">", self.next_day, 4)

    def make_button(self, parent, text, command, column):
        button = tk.Button(
            parent,
            text=text,
            command=command,
            font=("Arial", 12),
            bg=BLUE,
            fg="white",
            activebackground=BLUE_HOVER,
            activeforeground="white",
            relief="raised",
            bd=2,
            cursor="hand2",
            padx=8,
            pady=8
        )
        button.grid(
            row=0,
            column=column,
            sticky="ew",
            padx=5,
            ipady=3
        )

    def make_cell(self, parent, row, column, rowspan=1,
                  text="", width=None, font_size=12):
        cell = tk.Frame(
            parent,
            bg=BG,
            highlightbackground=BLACK,
            highlightcolor=BLACK,
            highlightthickness=1,
            bd=0
        )
        cell.grid(
            row=row,
            column=column,
            rowspan=rowspan,
            sticky="nsew"
        )

        if width:
            cell.configure(width=width)
            cell.grid_propagate(False)

        if text:
            label = tk.Label(
                cell,
                text=text,
                font=("Arial", font_size),
                bg=BG
            )
            label.place(relx=0.5, rely=0.5, anchor="center")

        return cell

    def show_date(self):
        self.ensure_date()
        self.date_entry.delete(0, tk.END)
        self.date_entry.insert(0, self.date_key())
        self.draw_table()

    def draw_table(self):
        for widget in self.table_container.winfo_children():
            widget.destroy()

        self.entries.clear()
        self.row_frames.clear()

        table = self.table_container

        # Har bir vazifa qatori uchun joy
        for row in range(12):
            table.grid_rowconfigure(row, weight=1, minsize=32)

        # E guruhi: 6 qator
        self.make_cell(table, 0, 0, rowspan=6, text="E", font_size=13)

        # K guruhi: 6 qator
        self.make_cell(table, 6, 0, rowspan=6, text="K", font_size=13)

        # M va I bo‘limlari
        self.make_cell(table, 0, 1, rowspan=3, text="M")
        self.make_cell(table, 3, 1, rowspan=3, text="I")
        self.make_cell(table, 6, 1, rowspan=3, text="M")
        self.make_cell(table, 9, 1, rowspan=3, text="I")

        groups = [
            ("E", "M", 0),
            ("E", "I", 3),
            ("K", "M", 6),
            ("K", "I", 9),
        ]

        for group, subgroup, start_row in groups:
            tasks = self.data[self.date_key()][group][subgroup]

            for index, task in enumerate(tasks):
                row = start_row + index

                # Vazifa yoziladigan katak
                task_cell = self.make_cell(table, row, 2)

                number_label = tk.Label(
                    task_cell,
                    text=f"{index + 1}.",
                    font=("Arial", 11),
                    bg=BG,
                    width=4,
                    anchor="e"
                )
                number_label.pack(side="left", padx=(3, 5))

                entry = tk.Entry(
                    task_cell,
                    font=("Arial", 11),
                    relief="flat",
                    bd=0,
                    bg=GREEN if task.get("done") else BG
                )
                entry.pack(side="left", fill="both", expand=True, padx=4)

                entry.insert(0, task.get("text", ""))

                section = (group, subgroup, index)
                self.entries[section] = entry
                self.row_frames[section] = task_cell

                entry.bind(
                    "<FocusIn>",
                    lambda event, g=group, s=subgroup:
                    self.set_active_section(g, s)
                )

                entry.bind(
                    "<KeyRelease>",
                    lambda event, g=group, s=subgroup, i=index:
                    self.update_text(g, s, i)
                )

                # Vazifa bajarilganini belgilash katagi
                check_cell = self.make_cell(table, row, 3)

                check_button = tk.Button(
                    check_cell,
                    text="✓" if task.get("done") else "",
                    font=("Arial", 14),
                    bg=BG,
                    activebackground=BG,
                    relief="flat",
                    bd=0,
                    cursor="hand2",
                    command=lambda g=group, s=subgroup, i=index:
                    self.toggle_done(g, s, i)
                )
                check_button.pack(fill="both", expand=True)

    def set_active_section(self, group, subgroup):
        self.active_section = (group, subgroup)

    def update_text(self, group, subgroup, index):
        section = (group, subgroup, index)
        entry = self.entries.get(section)

        if entry:
            self.data[self.date_key()][group][subgroup][index]["text"] = (
                entry.get()
            )
            self.save_data()

    def toggle_done(self, group, subgroup, index):
        task = self.data[self.date_key()][group][subgroup][index]
        task["done"] = not task.get("done", False)
        self.save_data()
        self.draw_table()

    def confirm_task(self):
        group, subgroup = self.active_section
        tasks = self.data[self.date_key()][group][subgroup]

        selected_text = None

        # Fokusdagi katakdan vazifani aniqlash
        focused = self.root.focus_get()

        for (g, s, i), entry in self.entries.items():
            if entry == focused and g == group and s == subgroup:
                selected_text = entry.get()
                break

        # Fokus bo‘lmasa, birinchi bo‘sh bo‘lmagan vazifa tanlanadi
        if selected_text is None:
            for task in tasks:
                if task.get("text", "").strip():
                    selected_text = task["text"]
                    break

        if selected_text is None or not selected_text.strip():
            messagebox.showwarning(
                "Diqqat",
                "Avval vazifa yozing va uning katagiga bosing."
            )
            return

        # Tanlangan vazifani qoldirib, shu bo‘limdagi qolganlarini o‘chirish
        selected_task = next(
            (
                task for task in tasks
                if task.get("text", "").strip() == selected_text.strip()
            ),
            None
        )

        if selected_task is None:
            return

        self.data[self.date_key()][group][subgroup] = [selected_task]
        self.save_data()
        self.draw_table()

    def add_row(self):
        group, subgroup = self.active_section
        tasks = self.data[self.date_key()][group][subgroup]

        tasks.append({"text": "", "done": False})
        self.save_data()
        self.draw_table()

        # Yangi katakka fokus berish
        new_index = len(tasks) - 1
        entry = self.entries.get((group, subgroup, new_index))

        if entry:
            entry.focus_set()

    def previous_day(self):
        self.save_current_date_text()
        self.current_date -= timedelta(days=1)
        self.show_date()

    def next_day(self):
        self.save_current_date_text()
        self.current_date += timedelta(days=1)
        self.show_date()

    def save_current_date_text(self):
        for (group, subgroup, index), entry in self.entries.items():
            tasks = self.data[self.date_key()][group][subgroup]

            if index < len(tasks):
                tasks[index]["text"] = entry.get()

        self.save_data()

    def change_date_from_entry(self, event=None):
        try:
            new_date = date.fromisoformat(self.date_entry.get().strip())
        except ValueError:
            messagebox.showerror(
                "Sana xatosi",
                "Sanani YYYY-MM-DD ko‘rinishida kiriting.\n"
                "Masalan: 2026-10-24"
            )
            self.show_date()
            return

        self.save_current_date_text()
        self.current_date = new_date
        self.show_date()

    def show_completed(self):
        self.save_current_date_text()

        window = tk.Toplevel(self.root)
        window.title("Bajarilgan vazifalar")
        window.geometry("500x400")
        window.configure(bg=BG)

        tk.Label(
            window,
            text=f"Bajarilgan vazifalar — {self.date_key()}",
            font=("Arial", 13, "bold"),
            bg=BG
        ).pack(pady=12)

        list_frame = tk.Frame(window, bg=BG)
        list_frame.pack(fill="both", expand=True, padx=12, pady=8)

        canvas = tk.Canvas(list_frame, bg=BG, highlightthickness=0)
        scrollbar = tk.Scrollbar(
            list_frame,
            orient="vertical",
            command=canvas.yview
        )
        inner = tk.Frame(canvas, bg=BG)

        inner.bind(
            "<Configure>",
            lambda event: canvas.configure(
                scrollregion=canvas.bbox("all")
            )
        )

        canvas.create_window((0, 0), window=inner, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)

        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        count = 0

        for group in ("E", "K"):
            for subgroup in ("M", "I"):
                tasks = self.data[self.date_key()][group][subgroup]

                for task in tasks:
                    if task.get("done") and task.get("text", "").strip():
                        count += 1
                        tk.Label(
                            inner,
                            text=f"{group} / {subgroup}: "
                                 f"{task['text']}",
                            font=("Arial", 11),
                            bg=BG,
                            anchor="w",
                            wraplength=430,
                            justify="left"
                        ).pack(fill="x", pady=5)

        if count == 0:
            tk.Label(
                inner,
                text="Hozircha bajarilgan vazifalar yo‘q.",
                font=("Arial", 11),
                bg=BG
            ).pack(pady=20)


if __name__ == "__main__":
    root = tk.Tk()
    app = TaskApp(root)
    root.mainloop()

