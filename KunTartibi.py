
import tkinter as tk
from tkinter import ttk, messagebox
from datetime import date, datetime
import calendar
import json
import os

# ==================================================
# 1. SOZLAMALAR
# ==================================================

FILE_NAME = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "kun_tartibi.json"
)

BG = "#EEF2F7"
NAVY = "#203864"
BLUE = "#4472C4"
GREEN = "#238653"
RED = "#C0392B"
WHITE = "#FFFFFF"
GRAY = "#667085"

SECTION_NAMES = [
    "Ertalabki - Majburiy",
    "Ertalabki - Ixtiyoriy",
    "Kechki - Majburiy",
    "Kechki - Ixtiyoriy"
]

MONTHS_UZ = [
    "Yanvar", "Fevral", "Mart", "Aprel",
    "May", "Iyun", "Iyul", "Avgust",
    "Sentabr", "Oktabr", "Noyabr", "Dekabr"
]

WEEKDAYS_UZ = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"]

days_data = {}
current_date = date.today().isoformat()
sections = {}
confirmed = False

section_entries = {}
section_checks = {}
calendar_window = None


def new_sections():
    return {
        name: [
            {"text": "", "done": False}
            for _ in range(3)
        ]
        for name in SECTION_NAMES
    }


def normalize_sections(saved_sections):
    result = {}

    for name in SECTION_NAMES:
        rows = saved_sections.get(name, [])

        if not isinstance(rows, list):
            rows = []

        result[name] = [
            {
                "text": str(item.get("text", "")),
                "done": bool(item.get("done", False))
            }
            for item in rows
            if isinstance(item, dict)
        ]

    return result


# ==================================================
# 2. ASOSIY OYNA
# ==================================================

root = tk.Tk()
root.title("Kun tartibi jadvali")
root.geometry("1100x760")
root.minsize(780, 550)
root.configure(bg=BG)


# ==================================================
# 3. SARLAVHA
# ==================================================

header = tk.Frame(root, bg=NAVY, height=78)
header.pack(fill="x")
header.pack_propagate(False)

tk.Label(
    header,
    text="KUN TARTIBI",
    font=("Arial", 23, "bold"),
    fg=WHITE,
    bg=NAVY
).pack(pady=(8, 0))

tk.Label(
    header,
    text="Ertalabki va kechki vazifalar jadvali",
    font=("Arial", 10),
    fg="#DCE6F1",
    bg=NAVY
).pack()


# ==================================================
# 4. SANA VA KALENDAR
# ==================================================

date_frame = tk.Frame(root, bg=BG)
date_frame.pack(fill="x", padx=18, pady=10)

tk.Label(
    date_frame,
    text="Sana:",
    font=("Arial", 11, "bold"),
    bg=BG
).pack(side="left", padx=(0, 8))

date_entry = ttk.Entry(date_frame, width=15)
date_entry.pack(side="left")
date_entry.insert(0, current_date)

calendar_button = tk.Button(
    date_frame,
    text="📅 Kalendar",
    command=lambda: open_calendar(),
    bg=BLUE,
    fg=WHITE,
    relief="flat",
    padx=10,
    pady=5,
    cursor="hand2"
)
calendar_button.pack(side="left", padx=8)

status_label = tk.Label(
    date_frame,
    text="Yangi jadval",
    bg=BG,
    fg=BLUE,
    font=("Arial", 10, "bold")
)
status_label.pack(side="left", padx=8)


# ==================================================
# 5. JADVAL VA SCROLL
# ==================================================

container = tk.Frame(root, bg=BG)
container.pack(
    fill="both",
    expand=True,
    padx=18,
    pady=(0, 10)
)

canvas = tk.Canvas(
    container,
    bg=BG,
    highlightthickness=0
)

scrollbar = ttk.Scrollbar(
    container,
    orient="vertical",
    command=canvas.yview
)

table = tk.Frame(canvas, bg=BG)

window_id = canvas.create_window(
    (0, 0),
    window=table,
    anchor="nw"
)

canvas.configure(yscrollcommand=scrollbar.set)

canvas.pack(side="left", fill="both", expand=True)
scrollbar.pack(side="right", fill="y")


def resize_table(event):
    canvas.itemconfigure(window_id, width=event.width)


def update_scroll(event=None):
    canvas.configure(scrollregion=canvas.bbox("all"))


canvas.bind("<Configure>", resize_table)
table.bind("<Configure>", update_scroll)


# ==================================================
# 6. KATAK YARATISH
# ==================================================

def make_cell(row, col, rowspan=1, text=""):
    cell = tk.Frame(
        table,
        bg=WHITE,
        highlightbackground="#AAB4C3",
        highlightthickness=1
    )

    cell.grid(
        row=row,
        column=col,
        rowspan=rowspan,
        sticky="nsew"
    )

    if text:
        tk.Label(
            cell,
            text=text,
            bg=WHITE,
            font=("Arial", 12, "bold")
        ).pack(expand=True, fill="both")

    return cell


# ==================================================
# 7. JORIY JADVAL MA'LUMOTLARINI OLISH
# ==================================================

def capture_entries():
    for name in SECTION_NAMES:
        entries = section_entries.get(name, [])
        checks = section_checks.get(name, [])

        while len(sections[name]) < len(entries):
            sections[name].append({
                "text": "",
                "done": False
            })

        for i, entry in enumerate(entries):
            if i < len(sections[name]):
                try:
                    sections[name][i]["text"] = entry.get()
                except tk.TclError:
                    pass

        for i, var in enumerate(checks):
            if i < len(sections[name]):
                sections[name][i]["done"] = bool(var.get())


def current_day_record():
    return {
        "confirmed": confirmed,
        "sections": sections
    }


# ==================================================
# 8. SAQLASH
# ==================================================

def save_data(show_message=True):
    try:
        capture_entries()

        days_data[current_date] = current_day_record()

        with open(FILE_NAME, "w", encoding="utf-8") as file:
            json.dump(
                {"days": days_data},
                file,
                ensure_ascii=False,
                indent=4
            )

        if show_message:
            messagebox.showinfo(
                "Saqlandi",
                f"{current_date} sanasidagi jadval saqlandi."
            )

        return True

    except (OSError, tk.TclError, TypeError) as error:
        if show_message:
            messagebox.showerror(
                "Saqlash xatosi",
                f"Ma'lumotlarni saqlab bo'lmadi:\n{error}"
            )

        return False


# ==================================================
# 9. VAZIFANI BAJARILGAN DEB BELGILASH
# ==================================================

def update_done(name, index):
    if index < len(sections[name]):
        sections[name][index]["done"] = (
            section_checks[name][index].get()
        )

        if index < len(section_entries[name]):
            entry = section_entries[name][index]

            entry.configure(
                fg=GREEN
                if section_checks[name][index].get()
                else "#222222"
            )

        save_data(show_message=False)


# ==================================================
# 10. JADVALNI CHIZISH
# ==================================================

def draw_table():
    for widget in table.winfo_children():
        widget.destroy()

    section_entries.clear()
    section_checks.clear()

    table.grid_columnconfigure(0, minsize=42, weight=0)
    table.grid_columnconfigure(1, minsize=42, weight=0)
    table.grid_columnconfigure(2, minsize=250, weight=1)
    table.grid_columnconfigure(3, minsize=45, weight=0)

    for col in range(4):
        make_cell(0, col)

    em = sections["Ertalabki - Majburiy"]
    ei = sections["Ertalabki - Ixtiyoriy"]
    km = sections["Kechki - Majburiy"]
    ki = sections["Kechki - Ixtiyoriy"]

    morning_total = len(em) + len(ei)
    evening_total = len(km) + len(ki)

    # E — ertalabki
    if morning_total:
        make_cell(1, 0, rowspan=morning_total, text="E")

    if em:
        make_cell(1, 1, rowspan=len(em), text="M")

    if ei:
        make_cell(
            1 + len(em), 1,
            rowspan=len(ei),
            text="I"
        )

    # K — kechki
    evening_start = 1 + morning_total

    if evening_total:
        make_cell(
            evening_start, 0,
            rowspan=evening_total,
            text="K"
        )

    if km:
        make_cell(
            evening_start, 1,
            rowspan=len(km),
            text="M"
        )

    if ki:
        make_cell(
            evening_start + len(km), 1,
            rowspan=len(ki),
            text="I"
        )

    # Vazifalar
    row = 1

    for name in SECTION_NAMES:
        section_entries[name] = []
        section_checks[name] = []

        for number, task in enumerate(sections[name], start=1):
            cell = make_cell(row, 2)

            tk.Label(
                cell,
                text=f"{number}.",
                width=4,
                anchor="w",
                bg=WHITE,
                font=("Arial", 11)
            ).pack(side="left", padx=(4, 0))

            entry = tk.Entry(
                cell,
                font=("Arial", 11),
                relief="flat",
                bg=WHITE
            )

            entry.pack(
                side="left",
                fill="both",
                expand=True,
                padx=4,
                pady=3
            )

            entry.insert(0, task.get("text", ""))

            if task.get("done", False):
                entry.configure(fg=GREEN)

            if confirmed:
                entry.configure(state="disabled")

            section_entries[name].append(entry)

            check_cell = make_cell(row, 3)
            var = tk.BooleanVar(value=task.get("done", False))

            check = tk.Checkbutton(
                check_cell,
                variable=var,
                bg=WHITE,
                activebackground=WHITE,
                cursor="hand2",
                command=lambda n=name, i=number - 1:
                    update_done(n, i)
            )
            check.pack(expand=True)

            section_checks[name].append(var)

            table.grid_rowconfigure(row, minsize=35)
            row += 1

    table.grid_rowconfigure(0, minsize=18)
    update_scroll()


# ==================================================
# 11. QATOR QO'SHISH
# ==================================================

def add_row():
    if confirmed:
        messagebox.showwarning(
            "Jadval tasdiqlangan",
            "Tasdiqlangandan keyin qator qo'shib bo'lmaydi."
        )
        return

    capture_entries()

    sections[selected_section.get()].append({
        "text": "",
        "done": False
    })

    draw_table()


# ==================================================
# 12. QATOR O'CHIRISH
# ==================================================

def remove_row():
    if confirmed:
        messagebox.showwarning(
            "Jadval tasdiqlangan",
            "Tasdiqlangandan keyin qator o'chirib bo'lmaydi."
        )
        return

    capture_entries()

    name = selected_section.get()
    rows = sections[name]

    if not rows:
        messagebox.showinfo(
            "Ma'lumot",
            "Bu bo'limda qator mavjud emas."
        )
        return

    if rows[-1]["text"].strip():
        messagebox.showwarning(
            "Diqqat",
            "Oxirgi qatordagi vazifani avval o'chiring."
        )
        return

    rows.pop()
    draw_table()


# ==================================================
# 13. TUGMALAR HOLATI
# ==================================================

def update_control_states():
    if confirmed:
        section_box.configure(state="disabled")
        add_button.configure(state="disabled")
        remove_button.configure(state="disabled")
        confirm_button.configure(state="disabled")
    else:
        section_box.configure(state="readonly")
        add_button.configure(state="normal")
        remove_button.configure(state="normal")
        confirm_button.configure(state="normal")


# ==================================================
# 14. SANANI ALMASHTIRISH
# ==================================================

def load_day(day_string):
    global current_date, sections, confirmed

    try:
        datetime.strptime(day_string, "%Y-%m-%d")
    except ValueError:
        messagebox.showerror(
            "Sana xatosi",
            "Sanani YYYY-MM-DD shaklida tanlang."
        )
        return False

    # Hozirgi jadval ma'lumotlarini yo'qotmaslik
    capture_entries()
    days_data[current_date] = current_day_record()

    current_date = day_string

    if current_date in days_data:
        record = days_data[current_date]
        sections = normalize_sections(record.get("sections", {}))
        confirmed = bool(record.get("confirmed", False))
    else:
        sections = new_sections()
        confirmed = False

    date_entry.configure(state="normal")
    date_entry.delete(0, tk.END)
    date_entry.insert(0, current_date)

    if confirmed:
        status_label.configure(
            text="Tasdiqlangan jadval",
            fg=GREEN
        )
    else:
        status_label.configure(
            text="Tahrirlash mumkin",
            fg=BLUE
        )

    draw_table()
    update_control_states()

    return True


def change_to_date(day_string):
    if day_string == current_date:
        return

    if load_day(day_string):
        save_data(show_message=False)


def change_date_from_entry():
    chosen = date_entry.get().strip()

    if chosen == current_date:
        return

    change_to_date(chosen)


# ==================================================
# 15. TASDIQLASH
# ==================================================

def confirm_table():
    global confirmed

    if confirmed:
        return

    capture_entries()

    try:
        selected = datetime.strptime(
            date_entry.get().strip(),
            "%Y-%m-%d"
        ).date()
    except ValueError:
        messagebox.showerror(
            "Sana xatosi",
            "Sanani YYYY-MM-DD shaklida kiriting."
        )
        return

    # Agar sana qo'lda o'zgartirilgan bo'lsa, tegishli
    # sana jadvalini avval ochish kerak.
    if selected.isoformat() != current_date:
        if not load_day(selected.isoformat()):
            return

        capture_entries()

    # Faqat bo'sh vazifalarni olib tashlash.
    # Kiritilgan vazifalar saqlanib qoladi.
    for name in SECTION_NAMES:
        sections[name] = [
            task for task in sections[name]
            if task["text"].strip()
        ]

    # Joriy jadvalni tasdiqlash.
    confirmed = True
    days_data[current_date] = current_day_record()

    # Shu oynada qayta chiziladi; keyingi kun ochilmaydi.
    draw_table()
    update_control_states()

    status_label.configure(
        text="Tasdiqlangan jadval",
        fg=GREEN
    )

    if save_data(show_message=False):
        messagebox.showinfo(
            "Jadval tasdiqlandi",
            f"{current_date} sanasidagi jadval saqlandi.\n\n"
            "Vazifalar oynada qoladi.\n"
            "Matnlarni tahrirlash yopiladi.\n"
            "Bajarilganlik belgilarini bosish mumkin."
        )


# ==================================================
# 16. KALENDAR
# ==================================================

def open_calendar():
    global calendar_window

    if calendar_window is not None:
        try:
            if calendar_window.winfo_exists():
                calendar_window.lift()
                return
        except tk.TclError:
            pass

    try:
        chosen = datetime.strptime(
            date_entry.get().strip(), "%Y-%m-%d"
        ).date()
    except ValueError:
        chosen = date.today()

    year = chosen.year
    month = chosen.month

    calendar_window = tk.Toplevel(root)
    calendar_window.title("Sanani tanlang")
    calendar_window.geometry("330x350")
    calendar_window.resizable(False, False)
    calendar_window.configure(bg=WHITE)
    calendar_window.transient(root)
    calendar_window.grab_set()

    title_label = tk.Label(
        calendar_window,
        text="",
        font=("Arial", 14, "bold"),
        bg=NAVY,
        fg=WHITE,
        pady=12
    )
    title_label.pack(fill="x")

    days_frame = tk.Frame(calendar_window, bg=WHITE)
    days_frame.pack(padx=10, pady=10, fill="both", expand=True)

    navigation = tk.Frame(calendar_window, bg=WHITE)
    navigation.pack(fill="x", padx=12, pady=(0, 12))

    def choose_date(day_number):
        selected = date(year, month, day_number)
        close_calendar()
        change_to_date(selected.isoformat())

    def previous_month():
        nonlocal year, month

        if month == 1:
            month = 12
            year -= 1
        else:
            month -= 1

        draw_calendar()

    def next_month():
        nonlocal year, month

        if month == 12:
            month = 1
            year += 1
        else:
            month += 1

        draw_calendar()

    def choose_today():
        nonlocal year, month

        today = date.today()
        year = today.year
        month = today.month
        draw_calendar()

    def draw_calendar():
        for widget in days_frame.winfo_children():
            widget.destroy()

        title_label.configure(
            text=f"{MONTHS_UZ[month - 1]} {year}"
        )

        for col, day_name in enumerate(WEEKDAYS_UZ):
            tk.Label(
                days_frame,
                text=day_name,
                bg=WHITE,
                font=("Arial", 9, "bold"),
                width=4
            ).grid(row=0, column=col, padx=1, pady=3)

        for row_index, week in enumerate(
            calendar.monthcalendar(year, month),
            start=1
        ):
            for col, day_number in enumerate(week):
                if day_number == 0:
                    continue

                is_today = (
                    year == date.today().year
                    and month == date.today().month
                    and day_number == date.today().day
                )

                tk.Button(
                    days_frame,
                    text=str(day_number),
                    width=3,
                    bg=GREEN if is_today else "#F3F6FA",
                    fg=WHITE if is_today else "#222222",
                    activebackground=BLUE,
                    activeforeground=WHITE,
                    relief="flat",
                    cursor="hand2",
                    command=lambda d=day_number: choose_date(d)
                ).grid(
                    row=row_index,
                    column=col,
                    padx=2,
                    pady=2
                )

        for widget in navigation.winfo_children():
            widget.destroy()

        tk.Button(
            navigation,
            text="◀ Oldingi",
            command=previous_month,
            bg=BLUE,
            fg=WHITE,
            relief="flat",
            padx=7
        ).pack(side="left")

        tk.Button(
            navigation,
            text="Bugun",
            command=choose_today,
            bg=GREEN,
            fg=WHITE,
            relief="flat",
            padx=7
        ).pack(side="left", padx=7)

        tk.Button(
            navigation,
            text="Keyingi ▶",
            command=next_month,
            bg=BLUE,
            fg=WHITE,
            relief="flat",
            padx=7
        ).pack(side="right")

    def close_calendar():
        global calendar_window

        try:
            calendar_window.grab_release()
        except tk.TclError:
            pass

        calendar_window.destroy()
        calendar_window = None

    calendar_window.protocol(
        "WM_DELETE_WINDOW",
        close_calendar
    )

    draw_calendar()


# ==================================================
# 17. BOSHQARUV TUGMALARI
# ==================================================

controls = tk.Frame(root, bg=BG)
controls.pack(fill="x", padx=18, pady=8)

tk.Label(
    controls,
    text="Bo'lim:",
    font=("Arial", 10, "bold"),
    bg=BG
).pack(side="left", padx=4)

selected_section = tk.StringVar(
    value="Ertalabki - Majburiy"
)

section_box = ttk.Combobox(
    controls,
    textvariable=selected_section,
    values=SECTION_NAMES,
    state="readonly",
    width=24
)
section_box.pack(side="left", padx=4)

add_button = tk.Button(
    controls,
    text="+ Qator qo'shish",
    command=add_row,
    bg=BLUE,
    fg=WHITE,
    padx=9,
    pady=6,
    relief="flat"
)
add_button.pack(side="left", padx=4)

remove_button = tk.Button(
    controls,
    text="- Qator o'chirish",
    command=remove_row,
    bg=RED,
    fg=WHITE,
    padx=9,
    pady=6,
    relief="flat"
)
remove_button.pack(side="left", padx=4)

save_button = tk.Button(
    controls,
    text="💾 Saqlash",
    command=save_data,
    bg=GRAY,
    fg=WHITE,
    padx=10,
    pady=6,
    relief="flat"
)
save_button.pack(side="left", padx=4)

confirm_button = tk.Button(
    root,
    text="✓ TASDIQLASH",
    command=confirm_table,
    bg=GREEN,
    fg=WHITE,
    font=("Arial", 12, "bold"),
    padx=28,
    pady=10,
    relief="flat",
    cursor="hand2"
)
confirm_button.pack(pady=(0, 15))


# ==================================================
# 18. JSON FAYLIDAGI MA'LUMOTLARNI YUKLASH
# ==================================================

def load_all_data():
    global days_data

    if not os.path.exists(FILE_NAME):
        days_data = {}
        return

    try:
        with open(FILE_NAME, "r", encoding="utf-8") as file:
            data = json.load(file)

        if isinstance(data, dict) and isinstance(
            data.get("days"), dict
        ):
            days_data = data["days"]

        # Oldingi koddagi JSON formatini ham o'qish.
        elif isinstance(data, dict) and "sections" in data:
            old_date = data.get(
                "date", date.today().isoformat()
            )

            days_data[old_date] = {
                "confirmed": bool(data.get("confirmed", False)),
                "sections": data.get("sections", {})
            }

        else:
            days_data = {}

    except (OSError, json.JSONDecodeError, TypeError):
        messagebox.showwarning(
            "Ogohlantirish",
            "Saqlangan faylni o'qib bo'lmadi.\n"
            "Yangi jadval ochiladi."
        )
        days_data = {}


# ==================================================
# 19. DASTURNI YOPISH
# ==================================================

def close_application():
    capture_entries()

    # Yopishdan oldin ma'lumotlar saqlanadi.
    save_data(show_message=False)

    root.destroy()


# ==================================================
# 20. ISHGA TUSHIRISH
# ==================================================

load_all_data()

today = date.today().isoformat()

# Dastur qayta ochilganda bugungi sana ko'rsatiladi.
# Bugungi jadval mavjud bo'lsa, o'sha jadval yuklanadi.
# Bo'lmasa, yangi bo'sh jadval ochiladi.
if today in days_data:
    record = days_data[today]
    sections = normalize_sections(record.get("sections", {}))
    confirmed = bool(record.get("confirmed", False))
else:
    sections = new_sections()
    confirmed = False

date_entry.delete(0, tk.END)
date_entry.insert(0, today)
current_date = today

draw_table()
update_control_states()

if confirmed:
    status_label.configure(
        text="Tasdiqlangan jadval",
        fg=GREEN
    )
else:
    status_label.configure(
        text="Tahrirlash mumkin",
        fg=BLUE
    )

root.protocol("WM_DELETE_WINDOW", close_application)
root.mainloop()
