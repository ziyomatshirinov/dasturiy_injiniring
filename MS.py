import csv
import tkinter as tk
from tkinter import filedialog, messagebox

# ---------- RANGLAR ----------
BG = "#eef2f7"
LINE = "#cbd5e1"
CARD_BG = "#ffffff"
HEAD = "#1e1b4b"
HEAD_TXT = "#ffffff"
ACCENT = "#4f46e5"
TXT = "#0f172a"
MUTED = "#64748b"

GROUP = {"E": ("#4f46e5", "#ffffff"), "K": ("#0d9488", "#ffffff")}
SUB = {"M": ("#e0e7ff", "#3730a3"), "I": ("#ccfbf1", "#115e59")}
SUB_ALT = {"M": ("#e0f2fe", "#075985"), "I": ("#fef3c7", "#92400e")}

F = "Segoe UI"


def mix(c1, c2, t):
    a = [int(c1[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(c2[i:i + 2], 16) for i in (1, 3, 5)]
    return "#%02x%02x%02x" % tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def darken(c, k=0.85):
    return mix(c, "#000000", 1 - k)


def lighten(c, k=0.25):
    return mix(c, "#ffffff", k)


class RBtn(tk.Canvas):
    """Gradient, soya va bosilish effektli yumaloq tugma."""

    BODY = 42

    def __init__(self, parent, text, color, cmd, primary=True, w=210, h=56):
        super().__init__(parent, width=w, height=h, bg=BG,
                         highlightthickness=0, cursor="hand2")
        self.text, self.color, self.cmd = text, color, cmd
        self.primary, self.w, self.h = primary, w, h
        self.inside = False
        self.draw("normal")
        self.bind("<Enter>", lambda e: self._set(True, "hover"))
        self.bind("<Leave>", lambda e: self._set(False, "normal"))
        self.bind("<ButtonPress-1>", lambda e: self.draw("press"))
        self.bind("<ButtonRelease-1>", self._release)

    def _set(self, inside, state):
        self.inside = inside
        self.draw(state)

    def _release(self, e):
        if self.inside:
            self.draw("hover")
            self.cmd()
        else:
            self.draw("normal")

    @staticmethod
    def _pill(x1, y1, x2, y2, r):
        return [x1 + r, y1, x2 - r, y1, x2, y1, x2, y1 + r, x2, y2 - r, x2, y2,
                x2 - r, y2, x1 + r, y2, x1, y2, x1, y2 - r, x1, y1 + r, x1, y1]

    def draw(self, state):
        self.delete("all")
        body = self.BODY
        r = body / 2
        x1, x2 = 5, self.w - 5
        top = {"normal": 4, "hover": 2, "press": 7}[state]
        bot = top + body

        # soya
        sh = 6 if state != "press" else 2
        sh_col = {"normal": "#cdd4e0", "hover": "#bcc5d6", "press": "#d6dce7"}[state]
        self.create_polygon(self._pill(x1 + 3, top + sh, x2 - 3, bot + sh, r),
                            smooth=True, fill=sh_col, outline=sh_col)

        # ranglar
        if self.primary:
            k = {"normal": 0.22, "hover": 0.34, "press": 0.08}[state]
            c_top = lighten(self.color, k)
            c_bot = darken(self.color, 0.80 if state != "press" else 0.70)
            line, fg = darken(self.color, 0.72), "white"
        else:
            c_top = "#ffffff"
            c_bot = mix(self.color, "#ffffff", 0.82 if state == "hover" else 0.94)
            if state == "press":
                c_bot = mix(self.color, "#ffffff", 0.70)
            line, fg = self.color, self.color

        # gradient (vertikal)
        for i in range(body):
            dy = i + 0.5 - r
            dx = (max(r * r - dy * dy, 0)) ** 0.5
            xa, xb = x1 + r - dx, x2 - r + dx
            col = mix(c_top, c_bot, i / (body - 1))
            self.create_line(xa, top + i + 0.5, xb, top + i + 0.5, fill=col)

        # kontur
        self.create_polygon(self._pill(x1, top, x2, bot, r), smooth=True,
                            fill="", outline=line, width=2)

        # yaltiroq chiziq (faqat asosiy tugmada)
        if self.primary:
            self.create_line(x1 + r, top + 4, x2 - r, top + 4,
                             fill=lighten(self.color, 0.55), width=1)

        # matn (asosiy tugmada yengil soya bilan)
        cx, cy = self.w / 2, (top + bot) / 2
        font = (F, 12, "bold")
        if self.primary:
            self.create_text(cx, cy + 1, text=self.text, fill=darken(self.color, 0.6),
                             font=font)
        self.create_text(cx, cy, text=self.text, fill=fg, font=font)


OK_BG, OK_FG = "#dcfce7", "#16a34a"
OFF_BG, OFF_FG = "#f8fafc", "#cbd5e1"


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Ma'lumotlar jadvali")
        self.configure(bg=BG, padx=22, pady=12)
        self.resizable(False, False)

        self.view = False
        self.entries = []
        self.tik_labels = []
        self.status = tk.StringVar(value="")
        self.progress = tk.StringVar(value="")

        # ma'lumotlar: {(guruh, kichik): [(matn, tasdiq), ...]}
        self.data = {}
        for g in "EK":
            for h in "MI":
                rows = []
                for _ in range(3):
                    m, c = tk.StringVar(), tk.BooleanVar(value=False)
                    c.trace_add("write", lambda *a: self.hisobla())
                    rows.append((m, c))
                self.data[(g, h)] = rows

        # sarlavha
        top = tk.Frame(self, bg=BG)
        top.pack(fill="x", pady=(0, 8))
        tk.Label(top, text="Ma'lumotlar jadvali", bg=BG, fg=TXT,
                 font=(F, 16, "bold")).pack(anchor="w")
        tk.Label(top, text="Yozib, keyingi qatorga o'tsangiz ✓ qo'yiladi  •  "
                           "Enter — keyingi katak  •  Ctrl+Enter — tasdiqlash",
                 bg=BG, fg=MUTED, font=(F, 9)).pack(anchor="w")

        # to'ldirilganlik ko'rsatkichi
        prog = tk.Frame(top, bg=BG)
        prog.pack(anchor="w", pady=(6, 0))
        self.bar_canvas = tk.Canvas(prog, width=200, height=8, bg="#dbe2ee",
                                    highlightthickness=0)
        self.bar_canvas.pack(side="left")
        tk.Label(prog, textvariable=self.progress, bg=BG, fg=MUTED,
                 font=(F, 9, "bold")).pack(side="left", padx=(10, 0))

        # jadval kartasi
        body = tk.Frame(self, bg=BG)
        body.pack()
        shadow = tk.Frame(body, bg="#d5dbe5", padx=2, pady=2)
        shadow.pack(side="left", anchor="n")
        self.card = tk.Frame(shadow, bg=LINE, padx=1, pady=1)
        self.card.pack()

        # holat yozuvi
        tk.Label(self, textvariable=self.status, bg=BG, fg=ACCENT,
                 font=(F, 10, "italic")).pack(pady=(6, 0))

        # tugmalar — jadval ostida, yonma-yon
        self.bar = tk.Frame(self, bg=BG)
        self.bar.pack(pady=(0, 4))

        # tezkor tugmalar
        self.bind("<Control-Return>",
                  lambda e: None if self.view else self.tasdiqlash())
        self.bind("<Escape>",
                  lambda e: self.tahrirlash() if self.view else None)

        self.render()
        self.hisobla()
        self.update_idletasks()
        x = max(0, (self.winfo_screenwidth() - self.winfo_reqwidth()) // 2)
        self.geometry(f"+{x}+0")

    # ---------- YORDAMCHI ----------
    def cell(self, r, c, rs=1, cs=1, bg=CARD_BG):
        f = tk.Frame(self.card, bg=bg)
        f.grid(row=r, column=c, rowspan=rs, columnspan=cs,
               padx=1, pady=1, sticky="nsew")
        return f

    def label_cell(self, r, c, text, bg, fg, rs=1, size=12, w=None):
        f = self.cell(r, c, rs=rs, bg=bg)
        tk.Label(f, text=text, bg=bg, fg=fg, font=(F, size, "bold"),
                 width=w).pack(expand=True, fill="both", padx=6, pady=2)

    def button(self, text, color, cmd, primary=True, w=210):
        b = RBtn(self.bar, text, color, cmd, primary=primary, w=w)
        b.pack(side="left", padx=8)
        return b

    def toldirilgan(self, m, c):
        """Qator tasdiqlangan (✓ qo'yilgan) bo'lsa True."""
        return c.get()

    def hisobla(self):
        hammasi = sum(len(v) for v in self.data.values())
        toldi = sum(1 for v in self.data.values() for m, c in v if c.get())
        self.progress.set(f"{toldi} / {hammasi} qator tasdiqlandi")

        cv = self.bar_canvas
        cv.delete("all")
        w = int(200 * toldi / hammasi) if hammasi else 0
        if w:
            cv.create_rectangle(0, 0, w, 8, outline="",
                                fill=OK_FG if toldi == hammasi else ACCENT)
        self.yangila_tiklar()

    def yangila_tiklar(self):
        for c, lbl in list(self.tik_labels):
            try:
                on = c.get()
                lbl.config(fg=OK_FG if on else OFF_FG,
                           bg=OK_BG if on else OFF_BG)
            except tk.TclError:
                pass  # qayta chizilganda eski belgilar o'chib ketadi

    def qatordan_chiqdi(self, e, m, c):
        """Boshqa katakka o'tilsa — yozilgan qatorga ✓, bo'shiga ✓ yo'q.
        Oyna boshqa dasturga o'tib ketsa (fokus yo'qolsa) hech narsa qilmaydi."""
        try:
            hozir = self.focus_get()
        except KeyError:
            hozir = None
        if hozir is None or hozir is e:
            return
        c.set(bool(m.get().strip()))

    def ko(self, event, d):
        """Enter / pastga / tepaga — keyingi yoki oldingi katakka o'tish."""
        try:
            i = self.entries.index(event.widget) + d
        except ValueError:
            return "break"
        if 0 <= i < len(self.entries):
            e = self.entries[i]
            e.focus_set()
            e.icursor("end")
        return "break"

    # ---------- CHIZISH ----------
    def render(self):
        for w in self.card.winfo_children():
            w.destroy()
        for w in self.bar.winfo_children():
            w.destroy()
        self.entries = []
        self.tik_labels = []

        # yuqori qator: o'ng tomonda ✓ belgisi
        head = self.cell(0, 0, cs=4, bg=HEAD)
        tk.Label(head, text="  MA'LUMOTLAR", bg=HEAD, fg=HEAD_TXT,
                 font=(F, 11, "bold"), anchor="w", width=44
                 ).pack(fill="both", padx=6, pady=6)
        tot = self.cell(0, 4, bg=ACCENT)
        tk.Label(tot, text="✓", bg=ACCENT, fg="white", font=(F, 16, "bold"),
                 width=9).pack(expand=True, fill="both", pady=2)

        r = 1
        for g in "EK":
            gbg, gfg = GROUP[g]
            blocks = []
            for h in "MI":
                rows = self.data[(g, h)]
                if self.view:
                    rows = [x for x in rows if self.toldirilgan(*x)]
                if rows:
                    blocks.append((h, rows))
            if not blocks:
                continue

            span = sum(len(rows) for _, rows in blocks)
            self.label_cell(r, 0, g, gbg, gfg, rs=span, size=18, w=4)

            for h, rows in blocks:
                sbg, sfg = SUB[h] if g == "E" else SUB_ALT[h]
                self.label_cell(r, 1, h, sbg, sfg, rs=len(rows), size=14, w=4)
                for i, (m, c) in enumerate(rows, 1):
                    self.qator(r, i, m, c)
                    r += 1

        if self.view:
            self.button("✏  Tahrirlash", ACCENT, self.tahrirlash, w=180)
            self.button("⎘  Nusxa", "#475569", self.nusxa, primary=False, w=150)
            self.button("💾  Saqlash", "#0d9488", self.saqlash, primary=False,
                        w=160)
        else:
            self.button("✔  Tasdiqlash", "#16a34a", self.tasdiqlash)
            self.button("⟲  Tozalash", "#64748b", self.tozalash, primary=False)
        self.yangila_tiklar()

    def qator(self, r, n, m, c):
        bg = CARD_BG
        num = self.cell(r, 2, bg="#f8fafc")
        tk.Label(num, text=f"{n}.", bg="#f8fafc", fg=MUTED,
                 font=(F, 11, "bold"), width=3).pack(padx=4, pady=3)

        c1 = self.cell(r, 3, bg=bg)
        c2 = self.cell(r, 4, bg=OFF_BG)

        # ✓ katagi
        lbl = tk.Label(c2, text="✓", font=(F, 14, "bold"), width=9, pady=2,
                       bg=OFF_BG, fg=OFF_FG)
        lbl.pack(fill="both", expand=True)
        self.tik_labels.append((c, lbl))

        if self.view:
            tk.Label(c1, textvariable=m, bg=bg, fg=TXT, font=(F, 11),
                     anchor="w", width=34).pack(fill="x", padx=10, pady=3)
        else:
            lbl.config(cursor="hand2")
            lbl.bind("<Button-1>", lambda ev, c=c: c.set(not c.get()))
            e = tk.Entry(c1, textvariable=m, width=34, justify="left",
                         bd=0, relief="flat", bg=bg, fg=TXT,
                         insertbackground=ACCENT, font=(F, 11),
                         highlightthickness=2, highlightbackground=bg,
                         highlightcolor=ACCENT)
            e.pack(fill="both", padx=4, pady=2, ipady=2)
            e.bind("<Return>", lambda ev: self.ko(ev, 1))
            e.bind("<Down>", lambda ev: self.ko(ev, 1))
            e.bind("<Up>", lambda ev: self.ko(ev, -1))
            # qatordan keyingisiga o'tilganda ✓ qo'yiladi (yozilgan bo'lsa)
            e.bind("<FocusOut>", lambda ev, e=e, m=m, c=c:
                   self.after(10, self.qatordan_chiqdi, e, m, c))
            self.entries.append(e)

    # ---------- HARAKATLAR ----------
    def tasdiqlash(self):
        jami_qator = sum(len(v) for v in self.data.values())
        yozilgan = sum(1 for v in self.data.values() for m, c in v
                       if m.get().strip())
        if yozilgan == 0:
            messagebox.showwarning("Ma'lumot yo'q",
                                   "Hech qanday ma'lumot kiritilmagan!")
            return
        # ✓ faqat yozilgan qatorlarga qo'yiladi, yozilmaganlarga qo'yilmaydi
        for v in self.data.values():
            for m, c in v:
                c.set(bool(m.get().strip()))
        self.view = True
        self.status.set(f"{yozilgan} ta qator tasdiqlandi, "
                        f"{jami_qator - yozilgan} ta bo'sh qator o'chirildi")
        self.render()

    def tahrirlash(self):
        self.view = False
        self.status.set("")
        self.render()

    def tozalash(self):
        if not any(c.get() or m.get().strip() for v in self.data.values()
                   for m, c in v):
            return
        if not messagebox.askyesno("Tozalash", "Hamma kiritilgan ma'lumot "
                                               "o'chirilsinmi?"):
            return
        for rows in self.data.values():
            for m, c in rows:
                m.set("")
                c.set(False)
        self.status.set("")
        self.hisobla()

    def tasdiqlangan_qatorlar(self):
        out = []
        for (g, h), rows in self.data.items():
            n = 0
            for m, c in rows:
                if c.get():
                    n += 1
                    out.append((g, h, n, m.get(), "✓"))
        return out

    def nusxa(self):
        satrlar = [f"{g}-{h}-{n}: {m} {v}"
                   for g, h, n, m, v in self.tasdiqlangan_qatorlar()]
        self.clipboard_clear()
        self.clipboard_append("\n".join(satrlar))
        self.status.set("Nusxa olindi ✔")

    def saqlash(self):
        yol = filedialog.asksaveasfilename(
            defaultextension=".csv", initialfile="jadval.csv",
            filetypes=[("CSV (Excel)", "*.csv")])
        if not yol:
            return
        try:
            with open(yol, "w", newline="", encoding="utf-8-sig") as f:
                w = csv.writer(f, delimiter=";")
                w.writerow(["Guruh", "Kichik", "№", "Matn", "Tasdiq"])
                w.writerows(self.tasdiqlangan_qatorlar())
        except OSError as err:
            messagebox.showerror("Xatolik", f"Faylni saqlab bo'lmadi:\n{err}")
            return
        self.status.set(f"Saqlandi ✔  {yol}")


if __name__ == "__main__":
    App().mainloop()