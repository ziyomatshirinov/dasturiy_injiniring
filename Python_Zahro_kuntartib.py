
import tkinter as tk
from tkinter import ttk, messagebox
from datetime import date, timedelta
import json
import os

FILE_NAME = "kun_tartibi.json"

SECTIONS = {
    "ertalab_majburiy": ("Ertalabki", "Majburiy"),
    "ertalab_ixtiyoriy": ("Ertalabki", "Ixtiyoriy"),
    "kechqurun_majburiy": ("Kechki", "Majburiy"),
    "kechqurun_ixtiyoriy": ("Kechki", "Ixtiyoriy"),
}


class KunTartibi:
    def __init__(self, root):
        self.root = root
        self.root.title("Kun tartibi")
        self.root.geometry("1000x700")
        self.root.minsize(750, 500)
        self.root.configure(bg="#f1f4f9")

        self.today = date.today()
        self.data = self.load_data()
        self.selected_section = "ertalab_majburiy"
        self.entries = {}

        self.create_interface()
        self.show_day()

    def load_data(self):
        if os.path.exists(FILE_NAME):
            try:
                with open(FILE_NAME, "r", encoding="utf-8") as f:
                    data = json.load(f)

                # Eski formatdagi ma'lumotlarni moslashtirish
                for day in data.values():
                    for key in SECTIONS:
                        day.setdefault(key, [])
                return data
            except (OSError, json.JSONDecodeError):
                pass
        return {}

    def save_data(self):
        try:
            with open(FILE_NAME, "w", encoding="utf-8") as f:
                json.dump(
                    self.data, f,
                    ensure_ascii=False, indent=4
                )
            return True
        except OSError as error:
            messagebox.showerror("Xatolik", str(error))
            return False

    def day_data(self):
        key = self.today.isoformat()

        if key not in self.data:
            self.data[key] = {
                section: [] for section in SECTIONS
            }

        for section in SECTIONS:
            self.data[key].setdefault(section, [])

        return self.data[key]

    def create_interface(self):
        header = tk.Frame(self.root, bg="white")
        header.pack(fill="x", padx=20, pady=15)

        tk.Label(
            header, text="KUN TARTIBI",
            font=("Arial", 22, "bold"),
            fg="#244875", bg="white"
        ).pack(pady=(10, 5))

        self.date_label = tk.Label(
            header, font=("Arial", 14),
            bg="white"
        )
        self.date_label.pack(pady=(0, 10))

        # Jadval sarlavhasi
        self.table = tk.Frame(self.root, bg="white")
        self.table.pack(
            fill="both", expand=True,
            padx=20, pady=5
        )

        self.table.grid_columnconfigure(0, minsize=65)
        self.table.grid_columnconfigure(1, minsize=110)
        self.table.grid_columnconfigure(2, weight=1)
        self.table.grid_columnconfigure(3, minsize=100)

        headers = ["Vaqt", "Tur", "Vazifalar", "Bajarildi"]

        for col, title in enumerate(headers):
            tk.Label(
                self.table, text=title,
                font=("Arial", 11, "bold"),
                bg="#dce8fa", relief="solid", bd=1,
                pady=8
            ).grid(row=0, column=col, sticky="nsew")

        self.rows_frame = tk.Frame(self.table, bg="white")
        self.rows_frame.grid(
            row=1, column=0, columnspan=4,
            sticky="nsew"
        )

        self.table.grid_rowconfigure(1, weight=1)
        self.rows_frame.grid_columnconfigure(0, minsize=65)
        self.rows_frame.grid_columnconfigure(1, minsize=110)
        self.rows_frame.grid_columnconfigure(2, weight=1)
        self.rows_frame.grid_columnconfigure(3, minsize=100)

        # Pastki tugmalar
        buttons = tk.Frame(self.root, bg="#f1f4f9")
        buttons.pack(fill="x", padx=20, pady=15)

        configs = [
            ("<", self.previous_day),
            ("Tasdiqlash", self.confirm),
            ("+", self.add_task),
            ("Bajarildi", self.mark_done),
            (">", self.next_day),
        ]

        for col, (title, command) in enumerate(configs):
            buttons.grid_columnconfigure(col, weight=1)

            tk.Button(
                buttons, text=title,
                command=command,
                font=("Arial", 12, "bold"),
                bg="#4476c4", fg="white",
                activebackground="#315a9b",
                activeforeground="white",
                padx=8, pady=12, cursor="hand2"
            ).grid(
                row=0, column=col,
                sticky="ew", padx=4
            )

    def show_day(self):
        self.date_label.config(
            text="Sana: " + self.today.strftime("%d.%m.%Y")
        )

        for widget in self.rows_frame.winfo_children():
            widget.destroy()

        self.entries = {}
        data = self.day_data()
        row = 0

        groups = [
            ("ertalab", "E", [
                "ertalab_majburiy",
                "ertalab_ixtiyoriy"
            ]),
            ("kechqurun", "K", [
                "kechqurun_majburiy",
                "kechqurun_ixtiyoriy"
            ])
        ]

        for period, letter, section_keys in groups:
            period_start = row
            period_count = sum(
                len(data[key]) for key in section_keys
            )

            # Ertalab/kechki belgisi
            period_label = tk.Label(
                self.rows_frame, text=letter,
                font=("Arial", 17, "bold"),
                bg="#dce8fa", relief="solid", bd=1
            )
            period_label.grid(
                row=period_start, column=0,
                rowspan=max(period_count, 1),
                sticky="nsew"
            )

            if period_count == 0:
                tk.Label(
                    self.rows_frame, text="",
                    bg="white", relief="solid", bd=1
                ).grid(row=row, column=1, sticky="nsew")

                tk.Label(
                    self.rows_frame, text="",
                    bg="white", relief="solid", bd=1
                ).grid(row=row, column=2, sticky="nsew")

                tk.Label(
                    self.rows_frame, text="",
                    bg="white", relief="solid", bd=1
                ).grid(row=row, column=3, sticky="nsew")

                row += 1
                continue

            for section in section_keys:
                tasks = data[section]
                category = "M" if "majburiy" in section else "I"

                if not tasks:
                    continue

                section_start = row

                tk.Label(
                    self.rows_frame, text=category,
                    font=("Arial", 14),
                    bg="#eef3fa", relief="solid", bd=1
                ).grid(
                    row=section_start, column=1,
                    rowspan=len(tasks), sticky="nsew"
                )

                for index, task in enumerate(tasks):
                    current_row = row

                    text_var = tk.StringVar(value=task["text"])

                    entry = tk.Entry(
                        self.rows_frame,
                        textvariable=text_var,
                        font=("Arial", 12),
                        relief="solid", bd=1
                    )
                    entry.grid(
                        row=current_row, column=2,
                        sticky="nsew", ipady=7
                    )

                    self.entries[(section, index)] = text_var

                    entry.bind(
                        "<FocusIn>",
                        lambda event, s=section:
                        self.select_section(s)
                    )

                    entry.bind(
                        "<KeyRelease>",
                        lambda event, s=section,
                        i=index, v=text_var:
                        self.update_text(s, i, v.get())
                    )

                    if task["done"]:
                        entry.config(fg="#218838")

                    done_var = tk.BooleanVar(value=task["done"])

                    tk.Checkbutton(
                        self.rows_frame,
                        variable=done_var,
                        bg="white",
                        command=lambda s=section, i=index,
                        v=done_var: self.set_done(s, i, v.get())
                    ).grid(
                        row=current_row, column=3,
                        sticky="nsew"
                    )

                    row += 1

        self.selected_section = getattr(
            self, "selected_section", "ertalab_majburiy"
        )

    def select_section(self, section):
        self.selected_section = section

    def update_text(self, section, index, value):
        self.day_data()[section][index]["text"] = value

    def set_done(self, section, index, value):
        self.day_data()[section][index]["done"] = value
        self.save_data()

    def add_task(self):
        dialog = tk.Toplevel(self.root)
        dialog.title("Yangi joy qo'shish")
        dialog.geometry("360x200")
        dialog.resizable(False, False)
        dialog.transient(self.root)
        dialog.grab_set()

        tk.Label(
            dialog, text="Qaysi bo'limga qo'shilsin?",
            font=("Arial", 11)
        ).pack(pady=(15, 8))

        choices = {
            "Ertalabki - Majburiy": "ertalab_majburiy",
            "Ertalabki - Ixtiyoriy": "ertalab_ixtiyoriy",
            "Kechki - Majburiy": "kechqurun_majburiy",
            "Kechki - Ixtiyoriy": "kechqurun_ixtiyoriy"
        }

        combo = ttk.Combobox(
            dialog, values=list(choices.keys()),
            state="readonly", font=("Arial", 11)
        )
        combo.pack(fill="x", padx=20)
        combo.current(0)

        def add_blank():
            section = choices[combo.get()]
            self.selected_section = section

            self.day_data()[section].append({
                "text": "",
                "done": False
            })

            self.save_data()
            dialog.destroy()
            self.show_day()

        tk.Button(
            dialog, text="Yangi joy yaratish",
            command=add_blank,
            bg="#4476c4", fg="white",
            font=("Arial", 11, "bold"),
            pady=7
        ).pack(pady=18)

    def mark_done(self):
        section = self.selected_section

        for (entry_section, index), var in self.entries.items():
            if entry_section == section:
                task = self.day_data()[section][index]
                task["done"] = not task["done"]
                self.save_data()
                self.show_day()
                return

        messagebox.showinfo(
            "Ma'lumot",
            "Avval vazifa yozing va uning maydonini tanlang."
        )

    def confirm(self):
        data = self.day_data()

        # Bo'sh vazifalarni barcha bo'limlardan o'chirish
        for section in SECTIONS:
            data[section] = [
                task for task in data[section]
                if task["text"].strip()
            ]

        if self.save_data():
            self.show_day()
            messagebox.showinfo(
                "Tasdiqlandi",
                "Bo'sh joylar o'chirildi va kun tartibi saqlandi!"
            )

    def previous_day(self):
        self.save_data()
        self.today -= timedelta(days=1)
        self.show_day()

    def next_day(self):
        self.save_data()
        self.today += timedelta(days=1)
        self.show_day()


if __name__ == "__main__":
    root = tk.Tk()
    app = KunTartibi(root)
    root.mainloop()
