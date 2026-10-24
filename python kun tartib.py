import json
import os
import tkinter as tk
from datetime import date, timedelta
from tkinter import messagebox

FAYL = "kun_tartibi_data.json"
DAVRLAR = [("E", "Ertalabki"), ("K", "Kechki")]
TURLAR = [("M", "Majburiy"), ("I", "Ixtiyoriy")]
BOSHLANGICH = 3
FONT = ("Times New Roman", 14)
KOK = "#4472C4"


def yangi_qator():
    return {"t": "", "d": False}   # t - matn, d - bajarildimi


def yozilgan(satr):
    return satr["t"].strip() != ""


class KunTartibi(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Kun tartibi")
        self.resizable(False, False)
        self.malumot = self.yuklash()
        self.sana = date.today()
        self.fokus = None          # (bo'lim kaliti, qator indeksi)
        self.widgetlar = {}        # "E-M" -> [Entry, ...]

        self.jadval = tk.Frame(self)
        self.jadval.pack(padx=15, pady=(15, 5))

        self.holat = tk.Label(self, text="", fg="gray")
        self.holat.pack()

        tugmalar = tk.Frame(self)
        tugmalar.pack(pady=(5, 15))
        for matn, buyruq, kenglik in [
            ("<", self.oldingi, 6),
            ("Tasdiqlash", self.tasdiqlash, 12),
            ("+", self.qosh, 6),
            ("Bajarildi", self.bajarildi, 12),
            (">", self.keyingi, 6),
        ]:
            tk.Button(tugmalar, text=matn, command=buyruq, width=kenglik,
                      bg=KOK, fg="white", font=("Calibri", 13),
                      activebackground="#2f5597", activeforeground="white",
                      relief="raised", pady=8).pack(side="left", padx=6)

        self.chiz()
        self.protocol("WM_DELETE_WINDOW", self.yopish)

    # ---------- ma'lumotlar ----------
    def yuklash(self):
        if os.path.exists(FAYL):
            try:
                with open(FAYL, encoding="utf-8") as f:
                    return json.load(f)
            except (json.JSONDecodeError, OSError):
                pass
        return {}

    def saqlash(self):
        # Hech narsa yozilmagan kunlarni saqlamaymiz
        toza = {
            k: v for k, v in self.malumot.items()
            if any(yozilgan(s) for sat in v.values() for s in sat)
        }
        with open(FAYL, "w", encoding="utf-8") as f:
            json.dump(toza, f, ensure_ascii=False, indent=2)

    def kun(self):
        k = self.sana.isoformat()
        if k not in self.malumot:
            self.malumot[k] = {
                f"{d}-{t}": [yangi_qator() for _ in range(BOSHLANGICH)]
                for d, _ in DAVRLAR for t, _ in TURLAR
            }
        return self.malumot[k]

    def yig(self):
        """Ekrandagi yozuvlarni ma'lumotga o'tkazadi."""
        kun = self.kun()
        for key, entries in self.widgetlar.items():
            for i, e in enumerate(entries):
                if i < len(kun[key]):
                    kun[key][i]["t"] = e.get()

    # ---------- chizish ----------
    def katak(self, matn="", **kw):
        return tk.Label(self.jadval, text=matn, relief="solid", borderwidth=1,
                        font=FONT, **kw)

    def chiz(self):
        for w in self.jadval.winfo_children():
            w.destroy()
        self.widgetlar = {}
        kun = self.kun()

        self.katak(f"Sana: {self.sana.strftime('%d.%m.%Y')}", anchor="w").grid(
            row=0, column=0, columnspan=3, sticky="nsew")
        self.katak(width=8).grid(row=0, column=3, sticky="nsew")

        r = 1
        raqam = 1                      # umumiy ketma-ket raqam (1, 2, 3, ...)
        for d_kod, _ in DAVRLAR:
            davr_boshi = r
            for t_kod, _ in TURLAR:
                key = f"{d_kod}-{t_kod}"
                satrlar = kun[key]
                if not satrlar:
                    continue           # bo'sh bo'lim ko'rsatilmaydi
                tur_boshi = r
                entries = []
                for i, s in enumerate(satrlar):
                    h = tk.Frame(self.jadval, highlightbackground="black",
                                 highlightthickness=1)
                    h.grid(row=r, column=2, sticky="nsew")
                    tk.Label(h, text=f"{i + 1}.", font=FONT, width=3,
                             anchor="w").pack(side="left")
                    e = tk.Entry(h, font=FONT, width=38, relief="flat")
                    e.insert(0, s["t"])
                    e.pack(side="left", fill="x", expand=True)
                    e.bind("<FocusIn>",
                           lambda ev, k=key, idx=i: self.fokusla(k, idx))
                    entries.append(e)

                    belgi = self.katak("✓" if s["d"] else "", width=8)
                    belgi.grid(row=r, column=3, sticky="nsew")
                    belgi.bind("<Button-1>",
                               lambda ev, k=key, idx=i: self.almashtir(k, idx))
                    r += 1
                    raqam += 1
                self.widgetlar[key] = entries
                self.katak(t_kod, width=4, anchor="n").grid(
                    row=tur_boshi, column=1, rowspan=len(satrlar), sticky="nsew")
            if r > davr_boshi:
                self.katak(d_kod, width=4, anchor="n").grid(
                    row=davr_boshi, column=0, rowspan=r - davr_boshi,
                    sticky="nsew")

    def fokusla(self, key, idx):
        self.fokus = (key, idx)

    def tanla(self, key, idx, kursor=None):
        try:
            e = self.widgetlar[key][idx]
        except (KeyError, IndexError):
            return
        e.focus_set()
        if kursor is not None:
            e.icursor(kursor)

    # ---------- tugmalar ----------
    def qosh(self):
        """+ : hamma 4 ta bo'limga bittadan yangi qator qo'shadi."""
        self.yig()
        kun = self.kun()
        for satrlar in kun.values():
            satrlar.append(yangi_qator())
        self.chiz()
        # Kursor tanlangan bo'limning yangi qatoriga, bo'lmasa birinchisiga
        key = self.fokus[0] if self.fokus else next(iter(kun))
        self.tanla(key, len(kun[key]) - 1)
        self.holat.config(text="")

    def almashtir(self, key, idx):
        self.yig()
        satr = self.kun()[key][idx]
        if not yozilgan(satr):
            return                      # bo'sh qatorni belgilab bo'lmaydi
        satr["d"] = not satr["d"]
        self.chiz()
        self.tanla(key, idx)
        self.saqlash()

    def bajarildi(self):
        if not self.fokus:
            messagebox.showinfo("Bajarildi", "Avval vazifa yozilgan katakka bosing.")
            return
        self.almashtir(*self.fokus)

    def tasdiqlash(self):
        """Yozilmagan (bo'sh) qatorlarni hamma bo'limlardan o'chiradi."""
        self.yig()
        kun = self.kun()
        for key, satrlar in kun.items():
            kun[key] = [s for s in satrlar if yozilgan(s)]
        self.fokus = None
        self.chiz()
        self.saqlash()
        self.holat.config(text="Tasdiqlandi ✔")

    def ozgartir(self, kunlar):
        self.yig()
        self.saqlash()
        self.sana += timedelta(days=kunlar)
        self.fokus = None
        self.chiz()
        self.holat.config(text="")

    def oldingi(self):
        self.ozgartir(-1)

    def keyingi(self):
        self.ozgartir(1)

    def yopish(self):
        self.yig()
        self.saqlash()
        self.destroy()


if __name__ == "__main__":
    KunTartibi().mainloop()
