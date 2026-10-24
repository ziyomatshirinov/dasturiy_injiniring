import tkinter as tk
from datetime import date, timedelta
from tkinter import ttk

# ---------- Ranglar va shrift ----------
FONT = "Arial"
BG = "#f4f6f9"
CARD = "#ffffff"
CARD_BORDER = "#e6e9ee"
LINE = "#dfe3e8"
HEAD_BG = "#f8f9fb"
SPAN_BG = "#fafbfc"
TEXT = "#2f3640"
TITLE = "#2c3e50"
MUTED = "#9aa3ad"
ACCENT = "#1a79b8"
ACCENT_HOVER = "#155f91"
FIELD_BORDER = "#d0d5dd"
DISABLED = "#c5cbd3"

SECTIONS = [("E", "M"), ("E", "I"), ("K", "M"), ("K", "I")]


def round_rect(canvas, x1, y1, x2, y2, r, **kw):
  """Canvas ichida yumaloq burchakli to'rtburchak chizadi."""
  pts = [
      x1 + r, y1, x2 - r, y1, x2, y1, x2, y1 + r,
      x2, y2 - r, x2, y2, x2 - r, y2, x1 + r, y2,
      x1, y2, x1, y2 - r, x1, y1 + r, x1, y1,
  ]
  return canvas.create_polygon(pts, smooth=True, **kw)


class RoundedButton(tk.Canvas):
  """Yumaloq burchakli tugma (hover va disabled holati bilan)."""

  def __init__(self, parent, text, command, height=50, radius=10,
               color=ACCENT, hover=ACCENT_HOVER):
    super().__init__(parent, height=height, width=1, bg=CARD,
                     highlightthickness=0, cursor="hand2")
    self.text = text
    self.command = command
    self.radius = radius
    self.base_color = color
    self.hover_color = hover
    self.color = color
    self.enabled = True
    self.bind("<Configure>", lambda e: self._draw())
    self.bind("<Enter>", lambda e: self.enabled and self._set(self.hover_color))
    self.bind("<Leave>", lambda e: self.enabled and self._set(self.base_color))
    self.bind("<Button-1>", lambda e: self.enabled and self.command())

  def set_enabled(self, enabled):
    if enabled == self.enabled:
      return
    self.enabled = enabled
    self.color = self.base_color if enabled else DISABLED
    self.config(cursor="hand2" if enabled else "arrow")
    self._draw()

  def _set(self, color):
    self.color = color
    self._draw()

  def _draw(self):
    self.delete("all")
    w, h = self.winfo_width(), self.winfo_height()
    round_rect(self, 0, 0, w, h, self.radius, fill=self.color, outline=self.color)
    self.create_text(w // 2, h // 2, text=self.text, fill="white",
                     font=(FONT, 12, "bold"))


class TodoApp:

  def __init__(self, root):
    self.root = root
    self.root.title("To-Do Table List")
    self.root.geometry("630x780")
    self.root.minsize(520, 600)
    self.root.configure(bg=BG)

    self.setup_styles()

    # Har bir kun uchun alohida holat: {sana: {"data": ..., "confirmed": bool}}
    self.days = {}
    self.current_date = date.today()
    self.data = {}

    self.create_widgets()
    self.show_day(self.current_date)

  # ---------- Stillar ----------
  def setup_styles(self):
    st = ttk.Style()
    st.theme_use("clam")

    self.root.option_add("*TCombobox*Listbox.font", (FONT, 11))
    self.root.option_add("*TCombobox*Listbox.background", "#ffffff")
    self.root.option_add("*TCombobox*Listbox.foreground", TEXT)
    self.root.option_add("*TCombobox*Listbox.selectBackground", "#e8f1f8")
    self.root.option_add("*TCombobox*Listbox.selectForeground", TEXT)

    def combo_style(name, border, padding):
      st.configure(
          name, padding=padding, arrowsize=14, arrowcolor="#555555",
          background="#ffffff", fieldbackground="#ffffff", foreground=TEXT,
          bordercolor=border, lightcolor="#ffffff", darkcolor="#ffffff",
          borderwidth=1 if border != "#ffffff" else 0,
      )
      st.map(
          name,
          fieldbackground=[("readonly", "#ffffff")],
          background=[("active", "#ffffff"), ("readonly", "#ffffff")],
          foreground=[("readonly", TEXT)],
          selectbackground=[("readonly", "#ffffff")],
          selectforeground=[("readonly", TEXT)],
          arrowcolor=[("active", ACCENT)],
      )

    combo_style("Status.TCombobox", FIELD_BORDER, (6, 3))  # jadvaldagi status

    # Ingichka zamonaviy scrollbar
    st.layout("Modern.Vertical.TScrollbar", [
        ("Vertical.Scrollbar.trough", {
            "sticky": "ns",
            "children": [("Vertical.Scrollbar.thumb",
                          {"expand": "1", "sticky": "nswe"})],
        })
    ])
    st.configure("Modern.Vertical.TScrollbar", troughcolor="#ffffff",
                 background="#c1c7d0", bordercolor="#ffffff",
                 lightcolor="#c1c7d0", darkcolor="#c1c7d0", arrowsize=10)
    st.map("Modern.Vertical.TScrollbar",
           background=[("active", "#9aa3ad")])

  # ---------- Asosiy oyna ----------
  def create_widgets(self):
    # Orqa fon + yumaloq karta
    self.bg = tk.Canvas(self.root, bg=BG, highlightthickness=0)
    self.bg.pack(fill=tk.BOTH, expand=True)

    self.content = tk.Frame(self.bg, bg=CARD)
    self.card_win = self.bg.create_window(0, 0, window=self.content, anchor="nw")
    self.bg.bind("<Configure>", self.on_resize)

    tk.Label(self.content, text="To-Do List", font=(FONT, 20, "bold"),
             fg=TITLE, bg=CARD).pack(pady=(10, 2))
    self.date_label = tk.Label(self.content, text="", font=(FONT, 12),
                               fg=MUTED, bg=CARD)
    self.date_label.pack(pady=(0, 14))

    # Forma pastda (avval pack qilinadi, shunda doim ko'rinib turadi)
    form = tk.Frame(self.content, bg=CARD)
    form.pack(side=tk.BOTTOM, fill=tk.X, pady=(14, 8))

    # Jadval
    outer = tk.Frame(self.content, bg=CARD)
    outer.pack(fill=tk.BOTH, expand=True)

    self.canvas = tk.Canvas(outer, bg=CARD, highlightthickness=0,
                            yscrollincrement=30)
    sb = ttk.Scrollbar(outer, orient="vertical", command=self.canvas.yview,
                       style="Modern.Vertical.TScrollbar")
    self.canvas.configure(yscrollcommand=sb.set)
    sb.pack(side=tk.RIGHT, fill=tk.Y, padx=(6, 0))
    self.canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

    self.table_inner = tk.Frame(self.canvas, bg=LINE)  # LINE rangi = chiziqlar
    self.inner_win = self.canvas.create_window(
        (0, 0), window=self.table_inner, anchor="nw")
    self.table_inner.bind(
        "<Configure>",
        lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all")))
    # Jadval kengligini canvas kengligiga moslash
    self.canvas.bind(
        "<Configure>",
        lambda e: self.canvas.itemconfig(self.inner_win, width=e.width))

    # Sichqoncha g'ildiragi
    self.root.bind_all("<MouseWheel>",
                       lambda e: self.canvas.yview_scroll(-1 if e.delta > 0 else 1, "units"))
    self.root.bind_all("<Button-4>", lambda e: self.canvas.yview_scroll(-1, "units"))
    self.root.bind_all("<Button-5>", lambda e: self.canvas.yview_scroll(1, "units"))

    # ----- Forma: [<] [Add Row] [Confirm] [>] -----
    form.columnconfigure(0, minsize=56)
    form.columnconfigure(3, minsize=56)
    form.columnconfigure((1, 2), weight=1, uniform="btn")

    RoundedButton(form, "<", lambda: self.change_day(-1), height=52).grid(
        row=0, column=0, sticky="ew", padx=(0, 6))
    self.add_btn = RoundedButton(form, "Add Row", self.add_row, height=52)
    self.add_btn.grid(row=0, column=1, sticky="ew", padx=6)
    self.confirm_btn = RoundedButton(form, "Confirm", self.confirm, height=52)
    self.confirm_btn.grid(row=0, column=2, sticky="ew", padx=6)
    RoundedButton(form, ">", lambda: self.change_day(1), height=52).grid(
        row=0, column=3, sticky="ew", padx=(6, 0))

  def on_resize(self, e):
    m = 24  # tashqi chetdan masofa
    self.bg.delete("card")
    round_rect(self.bg, m, m, e.width - m, e.height - m, 22,
               fill=CARD, outline=CARD_BORDER, tags="card")
    self.bg.tag_lower("card")
    self.bg.coords(self.card_win, m + 22, m + 12)
    self.bg.itemconfig(self.card_win,
                       width=max(e.width - 2 * (m + 22), 100),
                       height=max(e.height - 2 * m - 24, 100))

  # ---------- Jadvalni chizish ----------
  def new_task(self, text=""):
    var = tk.StringVar(value=text)
    var.trace_add("write", lambda *_: self.update_confirm_state())
    return {
        "var": var,
        "status": tk.StringVar(value="To do"),
        "locked": False,
        "cell": None,
        "entry": None,
    }

  def has_any_task(self):
    return any(t["var"].get().strip()
               for tasks in self.data.values() for t in tasks)

  def update_confirm_state(self):
    """Confirm faqat shu kunda kamida bitta task yozilgan bo'lsa ishlaydi."""
    state = self.days.get(self.current_date)
    if state is None:
      return
    self.confirm_btn.set_enabled(
        not state["confirmed"] and self.has_any_task())

  def span_cell(self, row, col, text, rowspan):
    tk.Label(self.table_inner, text=text, font=(FONT, 11, "bold"),
             bg=SPAN_BG, fg=TEXT).grid(
        row=row, column=col, rowspan=rowspan, sticky="nsew",
        padx=(1 if col == 0 else 0, 1), pady=(0, 1))

  def task_row(self, row, index, task):
    cell = tk.Frame(self.table_inner, bg=CARD)
    cell.grid(row=row, column=2, sticky="nsew", padx=(0, 1), pady=(0, 1))
    task["cell"] = cell
    task["entry"] = None

    tk.Label(cell, text=f"{index}.", font=(FONT, 11), bg=CARD, fg=TEXT,
             padx=14).pack(side=tk.LEFT)

    if task["locked"]:
      # Tasdiqlangan: faqat o'qish uchun
      tk.Label(cell, text=task["var"].get(), font=(FONT, 11), bg=CARD,
               fg=TEXT, anchor="w").pack(side=tk.LEFT, fill=tk.X, expand=True)
    else:
      # Tahrirlash mumkin
      entry = tk.Entry(cell, textvariable=task["var"], font=(FONT, 11),
                       relief=tk.FLAT, bd=0, bg=CARD, fg=TEXT,
                       insertbackground=TEXT, highlightthickness=1,
                       highlightbackground=FIELD_BORDER,
                       highlightcolor=ACCENT)
      entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10),
                 pady=8, ipady=6)
      task["entry"] = entry

    # Status har doim o'zgartirilishi mumkin
    frame = tk.Frame(self.table_inner, bg=CARD)
    frame.grid(row=row, column=3, sticky="nsew", padx=(0, 1), pady=(0, 1))
    cb = ttk.Combobox(frame, values=["To do", "In progress", "Done"],
                      state="readonly", font=(FONT, 10),
                      textvariable=task["status"], style="Status.TCombobox",
                      width=11)
    cb.pack(fill=tk.X, padx=10, pady=10)
    cb.bind("<<ComboboxSelected>>", lambda e: e.widget.selection_clear())

  def render_table(self, focus=None):
    y = self.canvas.yview()[0]  # scroll holatini eslab qolamiz
    for w in self.table_inner.winfo_children():
      w.destroy()

    t = self.table_inner
    t.columnconfigure(0, minsize=72)
    t.columnconfigure(1, minsize=72)
    t.columnconfigure(2, weight=1)
    t.columnconfigure(3, minsize=150)

    # Sarlavha
    for col, h in enumerate(["Time", "Type", "Task", "Status"]):
      tk.Label(t, text=h, font=(FONT, 11, "bold"), bg=HEAD_BG, fg=TITLE,
               anchor="w" if col == 2 else "center",
               padx=14 if col == 2 else 4).grid(
          row=0, column=col, sticky="nsew",
          padx=(1 if col == 0 else 0, 1), pady=(1, 1), ipady=10)

    row = 1
    for time_val in ("E", "K"):
      time_start = row
      for type_val in ("M", "I"):
        tasks = self.data[(time_val, type_val)]
        type_start = row
        for i, task in enumerate(tasks, 1):
          self.task_row(row, i, task)
          row += 1
        self.span_cell(type_start, 1, type_val, len(tasks))
      self.span_cell(time_start, 0, time_val, row - time_start)

    self.root.update_idletasks()
    self.canvas.yview_moveto(y)

    # Yangi qo'shilgan qatorni ko'rinadigan qilib, unga fokus beramiz
    if focus is not None and focus.get("entry"):
      self.reveal(focus["cell"])
      focus["entry"].focus_set()

  def reveal(self, widget):
    """Berilgan qator canvas ko'rinish oynasidan tashqarida bo'lsa, scroll qiladi."""
    total = self.table_inner.winfo_height()
    if total <= 0:
      return
    top = widget.winfo_y()
    bottom = top + widget.winfo_height()
    view_top = self.canvas.canvasy(0)
    view_h = self.canvas.winfo_height()
    if top < view_top:
      self.canvas.yview_moveto(top / total)
    elif bottom > view_top + view_h:
      self.canvas.yview_moveto((bottom - view_h) / total)

  # ---------- Kunlar ----------
  @staticmethod
  def format_date(d):
    return f"{d.strftime('%A')}, {d.day} {d.strftime('%B %Y')}"

  def day_state(self, d):
    if d not in self.days:
      self.days[d] = {
          "data": {s: [self.new_task()] for s in SECTIONS},
          "confirmed": False,
      }
    return self.days[d]

  def show_day(self, d):
    self.current_date = d
    state = self.day_state(d)
    self.data = state["data"]
    self.date_label.config(text=self.format_date(d))
    self.add_btn.set_enabled(not state["confirmed"])
    self.update_confirm_state()
    self.canvas.yview_moveto(0)
    self.render_table()

  def change_day(self, delta):
    self.root.focus_set()
    self.show_day(self.current_date + timedelta(days=delta))

  # ---------- Tugmalar ----------
  def confirm(self):
    """Bir martalik tasdiqlash: bo'sh qatorlar o'chadi, yozilganlari qulflanadi.

    Agar biror bo'limda (E-M, E-I, K-M, K-I) birorta ham task bo'lmasa,
    jadval buzilmasligi uchun o'sha bo'limda bitta bo'sh qator qoladi.
    """
    if not self.has_any_task():
      return

    for key, tasks in self.data.items():
      kept = []
      for task in tasks:
        text = task["var"].get().strip()
        if text:
          task["var"].set(text)
          task["locked"] = True
          kept.append(task)
      if not kept:
        placeholder = self.new_task()
        placeholder["locked"] = True
        kept = [placeholder]
      self.data[key] = kept

    # Tasdiqlash har kun uchun faqat bir marta: tugmalar o'chiriladi
    self.days[self.current_date]["confirmed"] = True
    self.add_btn.set_enabled(False)
    self.confirm_btn.set_enabled(False)
    self.render_table()
    self.root.focus_set()

  def add_row(self):
    """Bo'sh qatori qolmagan har bir bo'limga bittadan yangi qator qo'shadi."""
    first = None
    for tasks in self.data.values():
      has_empty = any(not t["var"].get().strip() for t in tasks)
      if not has_empty:
        task = self.new_task()
        tasks.append(task)
        if first is None:
          first = task
    if first is not None:
      self.render_table(focus=first)


if __name__ == "__main__":
  root = tk.Tk()
  app = TodoApp(root)
  root.mainloop()