# Panduan Lengkap Menjalankan Tebak Kata Live

Panduan ini mengasumsikan kamu mulai dari **nol** di komputer Windows. Langkah yang sama juga berlaku di macOS/Linux dengan sedikit penyesuaian jalur (`\` → `/`).

---

## Bagian 1 — Yang harus diinstall di komputer

Hanya **satu** yang wajib: **Node.js** (versi 20 atau lebih baru).

1. Download installer Windows dari <https://nodejs.org/> (pilih versi **LTS**).
2. Jalankan installer, klik Next sampai selesai. Tidak perlu centang apa-apa khusus.
3. Buka **Command Prompt** atau **PowerShell**, lalu verifikasi:

   ```bash
   node -v
   npm -v
   ```

   Harusnya muncul nomor versi (misal `v24.13.1` dan `11.8.0`).

**Tidak perlu** install yang lain — tidak perlu Docker, tidak perlu PostgreSQL, tidak perlu Redis. Semua sudah dibundel.

---

## Bagian 2 — Menyiapkan proyek (hanya sekali, di awal)

Buka terminal, masuk ke folder proyek:

```bash
cd D:\VibeCoding\TebakKata
```

Install semua dependency (frontend, backend, shared package):

```bash
npm install
```

Tunggu sampai selesai (~1-2 menit, tergantung internet).

Set up database SQLite (dibuat otomatis, kosong dulu):

```bash
npm run db:migrate
```

Isi database dengan kategori, contoh kata, dan konfigurasi gift awal:

```bash
npm run db:seed
```

Terakhir, salin file konfigurasi default:

```bash
copy apps\server\.env.example apps\server\.env
copy apps\web\.env.local.example apps\web\.env.local
```

Setelah langkah ini, setup selesai. Kamu tidak perlu mengulang Bagian 2 lagi sampai kamu hapus folder `node_modules` atau `apps\server\prisma\dev.db`.

---

## Bagian 3 — Menjalankan aplikasi (setiap kali mau main)

Buka **dua terminal terpisah** (bisa jendela Command Prompt/PowerShell baru, atau dua tab).

**Terminal 1** — jalankan server backend:

```bash
cd D:\VibeCoding\TebakKata
npm run dev:server
```

Tunggu sampai muncul:
```
[server] Tebak Kata Live API listening on http://localhost:4000
```

**Terminal 2** — jalankan web app:

```bash
cd D:\VibeCoding\TebakKata
npm run dev:web
```

Tunggu sampai muncul:
```
▲ Next.js ... Ready in ...ms
```

Buka browser ke **http://localhost:3000** — di sana ada 3 link:
- `/overlay` — tampilan untuk penonton (OBS Browser Source)
- `/host` — dashboard untuk mengendalikan game
- `/admin/words` — kelola kata, kategori, gift, pengaturan

---

## Bagian 4 — Host Dashboard: alur memulai sesi LIVE

1. Buka **http://localhost:3000/host**.
2. Muncul form "Masukkan Host Token" — isi dengan:
   ```
   dev-host-token
   ```
   (default dari `apps\server\.env`). Klik **Masuk**. Token tersimpan di `localStorage`, tidak perlu diketik lagi nanti.
3. Setelah masuk, kamu akan lihat:
   - **Kata saat ini** — huruf yang sudah terbuka + jawaban (tersembunyi; klik **👁 Intip** untuk melihat — aman kalau layar host ikut tertangkap kamera)
   - **Kontrol game** — tombol Mulai / Hint / Skip / Kata baru / Jeda / Akhiri LIVE
   - **Live chat** — komentar yang masuk real-time; tebakan dengan awalan benar diberi tanda hijau, pemenang berlatar hijau
   - **Leaderboard** — skor pemain yang sedang bermain
   - **Statistik sesi** (bar bawah) — total pemain, komentar, kata terjawab, dst.
   - Bar atas menampilkan sumber komentar (TikTok LIVE / Simulasi), status koneksi server, dan status sesi.
4. Klik **▶ Mulai sesi LIVE**. Game mulai dengan puzzle pertama.
5. Selama game berjalan (bisa lewat tombol atau **keyboard**, selama kursor tidak sedang di kolom teks):
   - **💡 Hint** (`H`) — buka 1 huruf berikutnya
   - **⏭ Skip** (`S`) — lewati kata ini (dihitung sebagai "skipped")
   - **✨ Kata baru** (`N`) — ganti kata (tidak dihitung sebagai skip)
   - **⏸ Jeda / ▶ Lanjut** (`P`) — jeda/lanjutkan
   - **⏹ Akhiri LIVE** — akhiri sesi (ada konfirmasi); leaderboard disimpan sebagai ringkasan
6. Semua perubahan langsung muncul real-time di semua tab terbuka (host, overlay, dsb) via WebSocket.

### Mode simulasi (default, tanpa TikTok asli)

Secara default (`LIVE_SOURCE=mock` di `apps\server\.env`), setelah sesi dimulai **penonton virtual otomatis** mulai berkomentar dan kirim gift — supaya kamu bisa lihat seluruh gameplay berjalan tanpa perlu LIVE TikTok sungguhan. Bisa juga kirim komentar manual lewat bagian **Simulasi komentar penonton** di bawah **Live chat** (isi username + tebakan, tekan Enter atau klik **Kirim**).

---

## Bagian 5 — Overlay untuk OBS

1. Di OBS, tambahkan **Browser Source** baru.
2. Isi URL: `http://localhost:3000/overlay`
3. Atur Width: `1080`, Height: `1920` (portrait 9:16, sesuai spesifikasi desain).
4. Centang **Shutdown source when not visible** kalau mau; biarkan yang lain default.
5. Pilih latar belakang lewat parameter `bg`:
   - `?bg=paper` — krem bertitik (default, tanpa parameter)
   - `?bg=yellow` — kuning bertitik
   - `?bg=dark` — hitam bertitik
   - `?bg=transparent` — **transparan**, untuk ditumpuk di atas kamera (`?transparent=1` versi lama tetap berfungsi)
   ```
   http://localhost:3000/overlay?bg=transparent
   ```
   Semua kartu overlay punya warna solid + garis hitam tebal, jadi tetap terbaca di atas latar apa pun.
6. Parameter lain yang tersedia:
   - `&sound=0` — matikan efek suara sintesis (default menyala)
   - `&reducedMotion=1` — matikan animasi, goyangan, & confetti
   - `&ticker=0` — sembunyikan pita "tebakan terbaru"
   - `&howto=0` — sembunyikan kartu "Cara main" saat belum ada kata

   Contoh gabungan: `http://localhost:3000/overlay?bg=transparent&sound=0`

Konten overlay (gaya neo-brutalism): logo "TEBAK KATA" + badge LIVE, stiker kategori & level, kotak-kotak huruf (fokus utama), tombol ajakan "Tebak di komentar!", pita tebakan terbaru, meteran keramaian chat, papan skor Top 3 (dengan label "NAIK!" saat peringkat naik), jumlah kata ditemukan, dan hitungan menuju Boss Round.

Tata letak mengikuti area yang tertutup UI TikTok: kata & kategori di tengah atas, papan skor rata kanan (kiri bawah tertutup komentar). Tetap cek sekali dari HP penonton saat LIVE.

**Coba semua tampilan tanpa LIVE:** saat `npm run dev:web` berjalan, buka **http://localhost:3000/dev/overlay-preview** — ada tombol untuk memicu tebakan, menang, gift, boss, jeda, akhir sesi, putus koneksi, dan mengganti latar. Halaman ini hanya ada di mode development.

---

## Bagian 6 — Admin/Setup: kelola konten game

Buka **http://localhost:3000/admin/words** (pakai Host Token yang sama):

- **Words** — tambah/hapus/nonaktifkan kata. Pilih kategori + difficulty (`easy`, `medium`, `hard`, `boss`).
- **Categories** — tambah/hapus kategori (emoji + nama).
- **Gifts** — konfigurasikan gift TikTok mana yang memicu "buka 1 huruf berikutnya" saat diterima. Gift yang tidak terdaftar di sini diabaikan oleh engine.
- **Settings** — ubah nilai poin per difficulty (default Easy 5 / Medium 10 / Hard 20 / Boss 50), berapa banyak kata terselesaikan sebelum Boss Round (default 10), jumlah window anti-repetisi kata, dan toggle **Aktifkan sumber komentar & gift** (menjalankan sumber sesuai `LIVE_SOURCE` server — TikTok LIVE asli atau simulasi).

---

## Bagian 7 — Koneksi ke TikTok LIVE asli

Secara default game tidak terhubung ke TikTok. Kalau mau komentar & gift asli dari siaran LIVE TikTok-mu ikut memicu game:

1. Buka `apps\server\.env`, ubah/ganti:
   ```
   LIVE_SOURCE="tiktok"
   ```
   Simpan file.
2. Restart terminal backend (Ctrl+C di Terminal 1, lalu `npm run dev:server` lagi).
3. **Mulai siaran TikTok LIVE-mu dulu** — koneksi ditolak kalau akunnya sedang tidak LIVE.
4. Di Host Dashboard, tombol Start akan menampilkan field **"TikTok Username (tanpa @)"**. Isi dengan `@handle` akunmu (tanpa `@`), misal `namakamu`.
5. Klik **▶ START LIVE SESSION**. Sekarang semua komentar asli penonton masuk sebagai tebakan, dan gift asli memicu buka-huruf.
6. Kembali ke mode simulasi dengan mengganti `LIVE_SOURCE="mock"` + restart server.

Ketika LIVE-nya selesai/terputus, adapter otomatis reconnect dengan backoff (5s → 10s → 20s → 30s) sampai kamu End Live. Server tidak akan crash.

**Catatan penting:** ini pakai library tidak resmi `tiktok-live-connector` (TikTok tidak menyediakan API resmi untuk baca komentar/gift LIVE dari pihak ketiga). Lisensinya AGPL-3.0 dan protokol TikTok bisa berubah sewaktu-waktu. Jangan jadikan ini jaminan uptime untuk produk komersial tanpa review lisensi & risiko dulu — lebih detail di README bagian "Connecting to a real TikTok LIVE".

---

## Bagian 8 — Troubleshooting umum

| Gejala | Penyebab & solusi |
|---|---|
| `Missing script: "dev"` saat `npm run dev` | Script-nya namanya `dev:server` dan `dev:web` (dua terminal terpisah), bukan `dev`. |
| Port `EADDRINUSE` / port sudah dipakai | Ada proses lain (misalnya session dev saya sebelumnya) yang masih jalan di port 4000/3000. Tutup terminal lain, atau matikan prosesnya via Task Manager (cari `node.exe`). |
| Halaman terlihat seperti **HTML polos tanpa warna/font** | Ada dua proses Next.js yang menulis ke folder `.next` bersamaan (biasanya `next build` production dijalankan sementara `next dev` jalan). Stop kedua server, hapus folder `apps\web\.next`, jalankan lagi `npm run dev:web`. |
| `Cannot find module ...` saat `npm run dev:server` | Belum `npm install` di folder root, atau dependency-nya belum lengkap. Jalankan ulang `npm install`. |
| Error `prisma` / database tidak ada | Jalankan ulang `npm run db:migrate` dan `npm run db:seed` di folder root. |
| "Token salah" di Host Dashboard | `HOST_TOKEN` di `apps\server\.env` berbeda dengan yang kamu ketik. Cek isinya, atau klik **Sign out** (pojok kanan bawah dashboard) dan masukkan ulang. |
| "TikTok Username" tidak muncul di tombol Start | `LIVE_SOURCE` di `apps\server\.env` masih `"mock"`. Ganti ke `"tiktok"` + restart server. |
| Koneksi TikTok gagal / "Failed to retrieve Room ID" | Akun target sedang tidak LIVE, atau `@username` salah tulis (tanpa `@`). |
| Overlay tidak transparan di OBS | Pastikan pakai `?transparent=1` di URL Browser Source. |
| Browser masih nampilin versi lama setelah perubahan | Hard refresh dengan **Ctrl+Shift+R**. |

---

## Ringkasan cepat (cheat sheet)

```bash
# Sekali saja (setup awal)
cd D:\VibeCoding\TebakKata
npm install
npm run db:migrate
npm run db:seed
copy apps\server\.env.example apps\server\.env
copy apps\web\.env.local.example apps\web\.env.local

# Setiap kali mau main (2 terminal)
npm run dev:server     # Terminal 1
npm run dev:web        # Terminal 2

# URL-nya
# http://localhost:3000        → landing / menu utama
# http://localhost:3000/host   → dashboard host (token: dev-host-token)
# http://localhost:3000/overlay?transparent=1  → OBS Browser Source
# http://localhost:3000/admin/words  → kelola kata/kategori/gift
```
