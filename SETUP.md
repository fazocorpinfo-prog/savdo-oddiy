# SETUP — sizdan talab qilinadigan barcha narsalar

Bu fayl: kod tayyor, faqat **siz tashqi xizmatlarni sozlab, kalitlarni kiritishingiz** kerak.
Stack: **MongoDB Atlas** (ma'lumot) + **Cloudflare R2** (rasm) + **Netlify** (hosting + funksiyalar).

Quyidagi 6 bo'limni tartib bilan bajaring. Har bir bo'lim oxirida nusxalab oladigan qiymatlar bor.

---

## ✅ Umumiy checklist

- [ ] 1. MongoDB Atlas — klaster + user + connection string
- [ ] 2. Cloudflare R2 — bucket + ommaviy kirish + API token + CORS
- [ ] 3. `.env` faylini to'ldirish
- [ ] 4. Lokal sinov (`npm run dev:netlify`)
- [ ] 5. Netlify deploy + environment variables
- [ ] 6. Eski Supabase tokenini bekor qilish (xavfsizlik)

---

## 1. MongoDB Atlas (bepul — ma'lumot bazasi)

1. https://cloud.mongodb.com → ro'yxatdan o'ting / kiring
2. **Create** → **M0 (Free)** klaster yarating (region: o'zingizga yaqinini tanlang)
3. **Database Access** → **Add New Database User**:
   - Username + Password yarating (parolni eslab qoling)
   - Role: **Read and write to any database**
4. **Network Access** → **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`)
   - *(Netlify IP'lari o'zgaruvchan, shuning uchun shu kerak)*
5. **Database** → **Connect** → **Drivers** → connection string'ni nusxalang.
   Ko'rinishi:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   `<user>` va `<password>` ni o'zingiznikiga almashtiring.

**📌 Menga kerak bo'ladigan qiymat:**
| O'zgaruvchi | Qiymat |
|---|---|
| `MONGODB_URI` | yuqoridagi connection string |
| `MONGODB_DB` | `savdo` (shundayligicha qoldiring) |

> Jadvallar (`products`, `categories`, `stores`, `settings`) birinchi yozuvda **avtomatik** yaratiladi — qo'lda hech narsa qilish shart emas.

---

## 2. Cloudflare R2 (bepul — rasm saqlash, limitsiz hajm)

1. https://dash.cloudflare.com → ro'yxatdan o'ting / kiring
2. Chap menyuda **R2** → **Create bucket**:
   - Nomi: `savdo-images`
3. **Ommaviy kirishni yoqing** (bucket → **Settings**):
   - **Tez yo'l:** *Public Development URL (r2.dev)* ni **Enable** qiling → sizga manzil beradi:
     `https://pub-xxxxxxxx.r2.dev`
   - **Eng yaxshi tezlik (ixtiyoriy):** *Custom Domain* ulang (`https://img.sizning-domen.com`) — to'liq Cloudflare CDN keshlash
4. **API token yarating** (R2 bosh sahifa → **Manage API Tokens** → **Create API Token**):
   - Permissions: **Object Read & Write**
   - (Ixtiyoriy) faqat `savdo-images` bucketga cheklang
   - Yaratgach: **Access Key ID** va **Secret Access Key** ni nusxalang *(Secret faqat bir marta ko'rsatiladi!)*
5. **Account ID** — R2 sahifasining o'ng tomonida yoki URL'da bor, nusxalang.
6. ✅ **CORS** — allaqachon sozlab qo'yilgan (`AllowedOrigin: *`, GET+PUT). Qo'shimcha hech narsa qilish shart emas — lokalda ham, deployda ham ishlaydi.

**📌 Menga kerak bo'ladigan qiymatlar:**
| O'zgaruvchi | Qiymat |
|---|---|
| `R2_ACCOUNT_ID` | Account ID |
| `R2_ACCESS_KEY_ID` | Access Key ID |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key |
| `R2_BUCKET` | `savdo-images` |
| `R2_PUBLIC_BASE_URL` | `https://pub-xxxxxxxx.r2.dev` yoki custom domen |

---

## 3. `.env` faylini to'ldirish (lokal ishlash uchun)

Loyiha ildizidagi `.env` faylini oching va to'ldiring:

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:parol@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=savdo

# Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=savdo-images
R2_PUBLIC_BASE_URL=https://pub-xxxxxxxx.r2.dev
```

> ⚠️ `.env` git'ga **tushmaydi** (`.gitignore`'da bor) — maxfiy kalitlar xavfsiz qoladi.

---

## 4. Lokal sinov

```bash
npm install          # birinchi marta
npm run dev:netlify  # Vite + Netlify Functions birga (port 8888)
```

> ⚠️ Oddiy `npm run dev` (Vite) **`/api/...` funksiyalarini ko'rsatmaydi** — ma'lumot va rasm ishlamaydi.
> Har doim `npm run dev:netlify` ishlating. Birinchi marta `npx netlify dev` CLI'ni yuklab oladi.

Brauzerda http://localhost:8888 ni oching, mahsulot qo'shib, rasm yuklab ko'ring.

---

## 5. Netlify deploy

1. https://app.netlify.com → **Add new site** → **Import from Git** → repozitoriyani tanlang
2. Build sozlamalari avtomatik o'qiladi (`netlify.toml`'da yozilgan):
   - Build command: `npm run build`
   - Publish: `dist`
3. **Site settings → Environment variables** → quyidagi **7 ta** o'zgaruvchini qo'shing:

   | Nomi | Qayerdan |
   |---|---|
   | `MONGODB_URI` | 1-bo'lim |
   | `MONGODB_DB` | `savdo` |
   | `R2_ACCOUNT_ID` | 2-bo'lim |
   | `R2_ACCESS_KEY_ID` | 2-bo'lim |
   | `R2_SECRET_ACCESS_KEY` | 2-bo'lim |
   | `R2_BUCKET` | `savdo-images` |
   | `R2_PUBLIC_BASE_URL` | 2-bo'lim |

   > `.env` fayli deploy'ga **ketmaydi** — shuning uchun bu yerga qo'lda kiritish shart.

4. CORS allaqachon `*` bilan ochiq — deploydan keyin hech narsa o'zgartirish shart emas.

---

## 6. Xavfsizlik — eski Supabase tokenini bekor qiling

Loyihada oldin Supabase ishlatilgan va uning **access token**'i (`sbp_...`) fayllarda yozilgan edi.
Hozir kod tozalangan bo'lsa-da, token allaqachon ochilgani uchun uni bekor qiling:

- https://supabase.com/dashboard/account/tokens → eski tokenni **Revoke** qiling.

---

## ℹ️ Muhim eslatmalar

- **Auth (login) yo'q** — `/api/db` endpoint ochiq. Deploy URL'ini bilgan har kim ma'lumotni o'qiy/o'zgartira oladi. Kerak bo'lsa keyin login qo'shamiz.
- **Rasm hajmi** — endi amalda limitsiz (R2 da 1 fayl 5GB gacha). Ilovadagi 10MB cheki olib tashlangan.
- **Bepul tariflar yetarli:** MongoDB M0 (512MB), R2 (10GB + bepul egress), Netlify (125k funksiya chaqiruvi/oy) — kichik/o'rta do'kon uchun bemalol.

---

## 📦 Qisqacha: menga jami kerak bo'lgan 7 qiymat

```
MONGODB_URI            = ...
MONGODB_DB             = savdo
R2_ACCOUNT_ID          = ...
R2_ACCESS_KEY_ID       = ...
R2_SECRET_ACCESS_KEY   = ...
R2_BUCKET              = savdo-images
R2_PUBLIC_BASE_URL     = ...
```

Shu 7 qiymatni `.env`'ga (lokal) va Netlify env vars'ga (deploy) kiritsangiz — ilova to'liq ishlaydi.
