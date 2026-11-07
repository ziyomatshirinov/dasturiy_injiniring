
Yangiliklar:
 - mashina turi bo'yicha alohida tarif (yengil / jip-mikroavtobus / yuk)
 - bepul vaqt 5 daqiqaga tushirildi
 - tungi tarif (22:00-06:00 da narx 50% arzon)
 - abonent (doimiy mijoz) uchun 20% chegirma
 - chek yo'qolsa jarima
 - hisobot mashina turlari bo'yicha
"""
import json
import os
from datetime import datetime, timedelta
 
# ---------------- SOZLAMALAR ----------------
SIGIM = 50
BEPUL_DAQIQA = 5
TUN_BOSHI, TUN_OXIRI = 22, 6      # tungi soatlar
TUN_KOEFF = 0.5                   # tunda narx 50%
ABONENT_CHEGIRMA = 0.20           # 20% chegirma
YOQOTILGAN_CHEK_JARIMA = 30000
FAYL = "parking_data_v2.json"
FORMAT = "%Y-%m-%d %H:%M"
 
# tur: (nomi, soatlik narx, sutkalik maksimum)
TARIFLAR = {
    "1": ("Yengil mashina", 8000, 60000),
    "2": ("Jip / mikroavtobus", 12000, 90000),
    "3": ("Yuk mashinasi", 20000, 150000),
}
# --------------------------------------------
 
 
def yuklash():
    if os.path.exists(FAYL):
        with open(FAYL, encoding="utf-8") as f:
            return json.load(f)
    return {"ichkarida": {}, "tarix": [], "abonentlar": []}
 
 
def saqlash(data):
    with open(FAYL, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
 
 
def vaqt_olish(savol):
    s = input(f"{savol} (Enter = hozir, yoki 2026-11-07 09:30): ").strip()
    if not s:
        return datetime.now().replace(second=0, microsecond=0)
    try:
        return datetime.strptime(s, FORMAT)
    except ValueError:
        print("Format noto'g'ri, hozirgi vaqt olindi.")
        return datetime.now().replace(second=0, microsecond=0)
 
 
def som(x):
    return f"{int(x):,}".replace(",", " ") + " so'm"
 
 
def tungi_soatmi(t):
    return t.hour >= TUN_BOSHI or t.hour < TUN_OXIRI
 
 
def hisoblash(kirish, chiqish, soatlik, sutkalik):
    """(daqiqa, summa) qaytaradi. Har boshlangan soat alohida hisoblanadi,
    tunda arzon; har 24 soatlik oyna sutkalik maksimumdan oshmaydi."""
    jami_sekund = (chiqish - kirish).total_seconds()
    daqiqa = max(0, -(-int(jami_sekund) // 60))
    if daqiqa <= BEPUL_DAQIQA:
        return daqiqa, 0
 
    jami = 0
    oyna_summa = 0
    oyna_boshi = kirish
    t = kirish
    while t < chiqish:
        if t - oyna_boshi >= timedelta(hours=24):
            jami += min(oyna_summa, sutkalik)
            oyna_summa = 0
            oyna_boshi = t
        oyna_summa += soatlik * (TUN_KOEFF if tungi_soatmi(t) else 1)
        t += timedelta(hours=1)
    jami += min(oyna_summa, sutkalik)
    return daqiqa, int(jami)
 
 
def tur_tanlash():
    print("Mashina turi:")
    for k, (nom, narx, mx) in TARIFLAR.items():
        print(f"  {k}. {nom} - {som(narx)}/soat, sutkasiga max {som(mx)}")
    t = input("Tur raqami: ").strip()
    return t if t in TARIFLAR else None
 
 
def tariflar_korsat(data=None):
    print(f"\nBepul vaqt: {BEPUL_DAQIQA} daqiqa")
    print(f"Tungi tarif ({TUN_BOSHI}:00-{TUN_OXIRI:02d}:00): "
          f"narx {int(TUN_KOEFF * 100)}%")
    print(f"Abonent chegirmasi: {int(ABONENT_CHEGIRMA * 100)}%")
    for nom, narx, mx in TARIFLAR.values():
        print(f"  {nom:<22} {som(narx)}/soat, sutkasiga max {som(mx)}")
 
 
def kirish_qilish(data):
    raqam = input("Mashina raqami: ").strip().upper()
    if not raqam:
        return print("Raqam kiritilmadi.")
    if raqam in data["ichkarida"]:
        return print("Bu mashina allaqachon ichkarida!")
    if len(data["ichkarida"]) >= SIGIM:
        return print("Avtoturargoh to'lgan, bo'sh joy yo'q.")
    tur = tur_tanlash()
    if not tur:
        return print("Noto'g'ri tur tanlandi.")
    t = vaqt_olish("Kirish vaqti")
    data["ichkarida"][raqam] = {"kirish": t.strftime(FORMAT), "tur": tur}
    saqlash(data)
    nom, narx, mx = TARIFLAR[tur]
    print("\n--- CHEK ---")
    print(f"Raqam : {raqam}" + ("  (ABONENT)" if raqam in data["abonentlar"] else ""))
    print(f"Tur   : {nom}")
    print(f"Kirish: {t.strftime(FORMAT)}")
    print(f"Bepul : {BEPUL_DAQIQA} daqiqa")
    print(f"Narx  : {som(narx)}/soat, sutkasiga max {som(mx)}")
    print("------------")
 
 
def chiqish_qilish(data):
    raqam = input("Mashina raqami: ").strip().upper()
    if raqam not in data["ichkarida"]:
        return print("Bunday mashina ichkarida topilmadi.")
    info = data["ichkarida"][raqam]
    kirish = datetime.strptime(info["kirish"], FORMAT)
    nom, soatlik, sutkalik = TARIFLAR[info["tur"]]
    chiqish = vaqt_olish("Chiqish vaqti")
    if chiqish < kirish:
        return print("Chiqish vaqti kirishdan oldin bo'lishi mumkin emas.")
 
    daqiqa, summa = hisoblash(kirish, chiqish, soatlik, sutkalik)
    chegirma = 0
    if summa > 0 and raqam in data["abonentlar"]:
        chegirma = round(summa * ABONENT_CHEGIRMA / 100) * 100
        summa -= chegirma
 
    jarima = 0
    if input("Chek yo'qolganmi? (ha/yo'q): ").strip().lower() in ("ha", "h", "y"):
        jarima = YOQOTILGAN_CHEK_JARIMA
        summa += jarima
 
    soat, min_ = divmod(daqiqa, 60)
    print(f"\nRaqam  : {raqam}  ({nom})")
    print(f"Kirish : {kirish.strftime(FORMAT)}")
    print(f"Chiqish: {chiqish.strftime(FORMAT)}")
    print(f"Turdi  : {soat} soat {min_} daqiqa")
    if chegirma:
        print(f"Abonent chegirmasi: -{som(chegirma)}")
    if jarima:
        print(f"Chek yo'qotilgan jarima: +{som(jarima)}")
    print(f"TO'LOV : {som(summa)}")
 
    if summa > 0:
        try:
            berildi = int(input("Mijoz bergan pul (so'm): ").replace(" ", ""))
        except ValueError:
            return print("Noto'g'ri summa. Chiqish bekor qilindi.")
        if berildi < summa:
            return print(f"Yetarli emas! Yana {som(summa - berildi)} kerak.")
        if berildi > summa:
            print(f"Qaytim: {som(berildi - summa)}")
 
    data["tarix"].append({
        "raqam": raqam, "tur": info["tur"],
        "kirish": kirish.strftime(FORMAT), "chiqish": chiqish.strftime(FORMAT),
        "daqiqa": daqiqa, "summa": summa,
    })
    del data["ichkarida"][raqam]
    saqlash(data)
    print("To'lov qabul qilindi. Yo'lingiz bo'lsin!")
 
 
def ichkaridagilar(data):
    print(f"\nIchkarida: {len(data['ichkarida'])}/{SIGIM}, "
          f"bo'sh: {SIGIM - len(data['ichkarida'])}")
    for raqam, info in data["ichkarida"].items():
        print(f"  {raqam:<10} {TARIFLAR[info['tur']][0]:<20} kirgan: {info['kirish']}")
 
 
def hisobot(data):
    jami = sum(x["summa"] for x in data["tarix"])
    print(f"\nChiqib ketgan mashinalar: {len(data['tarix'])}")
    print(f"Jami tushum: {som(jami)}")
    for k, (nom, _, _) in TARIFLAR.items():
        qismi = [x for x in data["tarix"] if x["tur"] == k]
        print(f"  {nom:<22} {len(qismi)} ta, {som(sum(x['summa'] for x in qismi))}")
    print("So'nggi 10 ta:")
    for x in data["tarix"][-10:]:
        print(f"  {x['raqam']:<10} {x['kirish']} -> {x['chiqish']}  {som(x['summa'])}")
 
 
def abonent_qoshish(data):
    raqam = input("Abonent mashina raqami: ").strip().upper()
    if not raqam:
        return
    if raqam in data["abonentlar"]:
        return print("Bu raqam allaqachon abonent.")
    data["abonentlar"].append(raqam)
    saqlash(data)
    print(f"{raqam} abonent qilindi ({int(ABONENT_CHEGIRMA * 100)}% chegirma).")
 
 
def main():
    data = yuklash()
    menyu = {
        "1": ("Mashina kirishi", kirish_qilish),
        "2": ("Mashina chiqishi va to'lov", chiqish_qilish),
        "3": ("Ichkaridagi mashinalar", ichkaridagilar),
        "4": ("Hisobot (tushum)", hisobot),
        "5": ("Abonent qo'shish", abonent_qoshish),
        "6": ("Tariflar", tariflar_korsat),
    }
    while True:
        print("\n=== AVTOTURARGOH ===")
        for k, (nom, _) in menyu.items():
            print(f"{k}. {nom}")
        print("0. Chiqish")
        tanlov = input("Tanlang: ").strip()
        if tanlov == "0":
            break
        if tanlov in menyu:
            menyu[tanlov][1](data)
        else:
            print("Noto'g'ri tanlov.")
 
 
if __name__ == "__main__":
    main()
 
