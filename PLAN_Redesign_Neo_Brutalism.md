# 🟨 TEBAK KATA LIVE — Rencana Redesign Neo-Brutalism

**Versi rencana:** 1.0
**Status:** Draft untuk direview (belum ada kode yang diubah)
**Menggantikan:** Arah visual di `TEBAK_KATA_LIVE_Design_System_v1.0.md` ("Premium Arcade", dark + glow)
**Tetap berlaku:** Semua aturan gameplay, hierarki, dan UX flow dari Design System v1.0 dan PRD

---

# 1. Ringkasan

Tampilan diubah dari **"dark neon arcade"** menjadi **"Neo-Brutalist Game Show"**: warna flat yang sangat cerah, garis hitam tebal, bayangan keras tanpa blur, tipografi besar dan berat, serta elemen seperti stiker. Tujuannya membuat LIVE **langsung mencolok saat orang scroll FYP**, terbaca dari jarak jauh di layar HP, dan terasa seru serta "rame".

Prinsip inti tetap sama:

> **Word first. Everything else supports the word.**
> "Masuk LIVE → lihat kata → langsung ikut nebak."

Cakupan: **Overlay TikTok**, **Host Dashboard**, **Admin**, dan **Home**. Logika game dan server **tidak diubah** kecuali pada fitur tambahan yang ditandai *(butuh backend)*.

---

# 2. Kenapa Neo-Brutalism Cocok untuk Game LIVE

| Kebutuhan LIVE | Jawaban Neo-Brutalism |
|---|---|
| Menonjol di feed yang penuh video gelap | Latar krem/kuning dan warna primer flat langsung kontras |
| Terbaca di layar HP kecil & kompresi video | Garis tebal + tanpa blur/glow = tetap tajam walau bitrate rendah |
| Terasa "game", bukan dashboard | Stiker miring, kotak huruf chunky, cap "BENAR!" |
| Performa ringan di OBS / LIVE Studio | Shadow keras tanpa blur & tanpa `backdrop-blur` = murah dirender |
| Mudah dipahami dalam 3 detik | Blok warna besar = zona informasi jelas |

---

# 3. Keputusan Desain Utama

| # | Keputusan | Pilihan yang direkomendasikan | Catatan |
|---|---|---|---|
| D1 | Latar default overlay | **Krem `#FFF4E0` + pola titik halus** | Opsi: kuning, gelap, transparan (via query param) |
| D2 | Tampilan huruf | **Kotak huruf (tile) berbingkai tebal** | Sengaja *mengganti* aturan v1 §12 "jangan kotak berat" — di brutalism justru tile adalah ciri khasnya |
| D3 | Font display | **Archivo Black** | Tebal, lebar, huruf kapital sangat jelas |
| D4 | Font UI | **Space Grotesk** | Karakter "techy-playful", cocok untuk brutalism |
| D5 | Font angka/skor | **Space Mono** (bold) | Angka lebar tetap, skor tidak "loncat" saat berubah |
| D6 | Animasi | **Snappy & "stempel"** — cepat, memantul, tanpa fade lambat | Tetap ada `?reducedMotion=1` |
| D7 | Library animasi | **CSS keyframes + Tailwind** (tanpa dependensi baru) | Framer Motion hanya jika Fase 3 terbukti butuh |

> Semua keputusan di atas bisa diganti — lihat **§15 Pertanyaan Terbuka**.

---

# 4. Design Tokens

## 4.1 Warna

### Dasar

| Token | Hex | Pemakaian |
|---|---|---|
| `ink` | `#111111` | Semua border, shadow, teks utama |
| `paper` | `#FFF4E0` | Latar utama (krem) |
| `white` | `#FFFFFF` | Kartu, tile huruf terbuka |
| `muted` | `#6B6B6B` | Teks sekunder (hanya di atas paper/white) |

### Aksen (flat, saturasi tinggi)

| Token | Hex | Peran |
|---|---|---|
| `yellow` | `#FFD60A` | **CTA utama**, highlight, logo |
| `pink` | `#FF5CA8` | Gift, event spesial, LIVE badge alternatif |
| `blue` | `#4D7CFE` | Kategori, info, tombol sekunder |
| `green` | `#2EE59D` | Benar / pemenang / EASY |
| `orange` | `#FF8A00` | MEDIUM, "hampir benar" |
| `red` | `#FF3B30` | HARD, LIVE badge, bahaya |
| `purple` | `#9B6BFF` | BOSS |

### Pemetaan semantik

| Makna | Warna isi | Teks |
|---|---|---|
| EASY | `green` | `ink` |
| MEDIUM | `orange` | `ink` |
| HARD | `red` | `white` |
| BOSS | `purple` + garis hazard kuning-hitam | `white` |
| Huruf terbuka | `white` | `ink` |
| Huruf baru terbuka | `yellow` (sementara ±600ms) | `ink` |
| Huruf tertutup | `ink` 8% di atas `paper` | — |
| Pemenang | `green` | `ink` |
| Gift | `pink` | `ink` |

### Aturan kontras

- Teks di atas warna aksen **selalu `ink`**, kecuali `red` dan `purple` yang memakai `white`.
- **Dilarang:** teks putih di atas kuning/hijau/oranye, teks abu-abu di atas warna aksen.
- Target minimal **WCAG AA (4.5:1)** untuk teks kecil, **3:1** untuk teks display ≥ 48px.

## 4.2 Border

| Token | Nilai | Pemakaian |
|---|---|---|
| `nb-1` | `2px` | Elemen kecil dashboard (input, chip) |
| `nb-2` | `3px` | Kartu dashboard, tombol |
| `nb-3` | `5px` | Kartu overlay, badge overlay |
| `nb-4` | `6px` | Tile huruf, banner event |

Semua border berwarna `ink`, solid.

## 4.3 Shadow (keras, tanpa blur)

| Token | Nilai |
|---|---|
| `nb-sm` | `3px 3px 0 0 #111` |
| `nb-md` | `5px 5px 0 0 #111` |
| `nb-lg` | `8px 8px 0 0 #111` |
| `nb-xl` | `12px 12px 0 0 #111` |

Efek tekan (tombol): `translate(3px,3px)` + shadow menjadi `0 0 0 0`.

## 4.4 Radius

| Token | Nilai | Pemakaian |
|---|---|---|
| `none` | `0` | Banner, garis hazard |
| `sm` | `6px` | Chip, input |
| `md` | `12px` | Tombol, kartu, tile |
| `pill` | `999px` | Badge LIVE, kategori |

> Radius sengaja kecil. Brutalism terasa "kotak", tapi 12px menjaga kesan ramah untuk game.

## 4.5 Tipografi

| Peran | Font | Overlay | Host |
|---|---|---|---|
| Logo "TEBAK KATA" | Archivo Black | 96–112px | 24px |
| Huruf kata (tile) | Archivo Black | responsif (§6.3) | 44px |
| Banner event ("BENAR!", "BOSS!") | Archivo Black | 120–160px | — |
| Judul panel | Space Grotesk Bold, UPPERCASE, letter-spacing 0.04em | 32px | 14px |
| Body | Space Grotesk Medium | 28px | 14px |
| Skor / angka | Space Mono Bold | 40px | 16px |
| Caption | Space Grotesk Medium | 22px | 12px |

Dimuat via `next/font/google` (sudah dipakai proyek) → tanpa request font eksternal saat LIVE.

## 4.6 Spacing & Motion

- Spacing tetap kelipatan 4 (v1 §7).
- Durasi:

| Kelas | Durasi | Contoh |
|---|---|---|
| Tap | 90–120ms | Tekan tombol |
| Pop | 180–260ms | Huruf terbuka, badge muncul |
| Stamp | 350–450ms | "BENAR!", gift |
| Show | 1.8–2.8s total | Winner, boss intro |

- Easing: `cubic-bezier(.34,1.56,.64,1)` (overshoot/pantul) untuk pop & stamp; `steps(2)` untuk efek kedip LIVE.

## 4.7 Tekstur & Ornamen

- **Pola titik** di latar: `radial-gradient` 2px, jarak 28px, `ink` 7%.
- **Garis hazard** (khusus BOSS): `repeating-linear-gradient(45deg, yellow 0 24px, ink 24px 48px)`.
- **Stiker**: elemen dengan border + shadow, rotasi −3° s/d +3°.
- **Marquee/ticker**: pita teks berjalan (kecepatan pelan, bisa dimatikan).
- **Starburst**: bentuk bintang (SVG inline) di belakang "+10 POIN".

Semua ornamen dibuat dengan CSS/SVG inline, **tanpa file gambar**.

---

# 5. Zona Aman TikTok LIVE (penting untuk menarik penonton)

Kanvas 1080×1920, tetapi aplikasi TikTok menutupi sebagian layar penonton:

```text
┌──────────────────────────────────────┐ 0
│ ▓▓ Profil host, viewer, tombol ✕ ▓▓ │   ~0–200px   → hindari konten penting
│                                      │
│   ZONA UTAMA                         │  200–1250px → WORD, KATEGORI, CTA
│   (paling aman & paling terlihat)    │
│                                      │
│                              ▓▓▓▓▓▓ │  kanan ~150px di bawah 1100px
│ ▓▓▓ Komentar mengambang ▓▓▓  ▓ ikon ▓ │  ~1250–1920px → kiri-bawah tertutup komentar
│ ▓▓▓ Kotak komentar / gift ▓▓▓▓▓▓▓▓▓ │
└──────────────────────────────────────┘ 1920
```

Aturan:

1. **WORD, kategori, dan CTA wajib berada di 200–1250px.**
2. Leaderboard dan statistik boleh di 1250–1600px, tetapi **rata kanan / tengah**, bukan kiri-bawah (tertutup komentar).
3. Tidak ada teks penting di 150px kanan bawah (ikon share/gift TikTok).
4. Angka zona di atas **perkiraan** — wajib dicek ulang dengan preview HP asli (lihat §12, QA).

> Ini menggantikan safe area simetris v1 (72px/96px) yang belum memperhitungkan UI TikTok.

---

# 6. Overlay TikTok (1080×1920)

## 6.1 Layout Utama

```text
┌──────────────────────────────────────────────┐
│                  (zona UI TikTok)            │ 0–200
├──────────────────────────────────────────────┤
│  ╔════════════════╗   ┌─────────┐            │
│  ║  TEBAK KATA    ║   │ ● LIVE  │ (miring)   │ 200–380  Header / logo stiker
│  ╚════════════════╝   └─────────┘            │
│                                              │
│        ┌──────────────────────┐              │
│        │  🍔  MAKANAN   (-2°) │  [MEDIUM]    │ 400–500  Kategori + difficulty
│        └──────────────────────┘              │
│                                              │
│   ┏━━━┓ ┏━━━┓ ┏━━━┓ ┏━━━┓ ┏━━━┓              │
│   ┃ K ┃ ┃ E ┃ ┃ L ┃ ┃   ┃ ┃   ┃              │ 540–760  WORD TILES (elemen terbesar)
│   ┗━━━┛ ┗━━━┛ ┗━━━┛ ┗━━━┛ ┗━━━┛              │
│                                              │
│  ╔══════════════════════════════════════╗    │
│  ║ 💬 KETIK TEBAKANMU DI KOMENTAR!  ➜  ║    │ 820–940  CTA kuning (goyang pelan)
│  ╚══════════════════════════════════════╝    │
│                                              │
│   ▸ @budi KEMAS  → KE✔   ▸ @siti KELAM → KEL✔│ 980–1060 Ticker tebakan terbaru
│   🔥🔥🔥 CHAT LAGI PANAS                     │ 1080–1140 Guess heat bar
│                                              │
├──────────────────────────────────────────────┤ 1250
│              ┌────────────────────────────┐  │
│              │ 🏆 TOP 3                    │  │
│              │ 1  Andi ............. 45   │  │ 1280–1560 Scoreboard (rata kanan)
│              │ 2  Budi ............. 30   │  │
│              │ 3  Siti ............. 20   │  │
│              └────────────────────────────┘  │
│   [KATA DITEMUKAN 27]   [👑 BOSS 3 LAGI]     │ 1580–1680 Stat stiker
│                  (zona komentar TikTok)      │
└──────────────────────────────────────────────┘ 1920
```

## 6.2 Komponen Overlay

| Komponen | Desain Neo-Brutalism |
|---|---|
| **Header/Logo** | Kotak kuning, border 6px, shadow `nb-xl`, teks "TEBAK KATA" Archivo Black. Badge LIVE merah berbentuk pill miring +4°, titik berkedip `steps(2)` |
| **CategoryBadge** | Stiker biru, emoji di kotak putih kecil, rotasi −2° |
| **DifficultyBadge** | Pill warna semantik, border 5px, teks UPPERCASE |
| **WordDisplay (tile)** | Tile putih, border 6px, shadow `nb-lg`. Tertutup: tile `paper` gelap dengan tanda `?` samar. Baru terbuka: tile kuning + animasi *flip-pop* |
| **CommentCTA** | Tombol besar kuning, border 6px, shadow `nb-xl`, panah ➜; animasi "wiggle" ±1.5° setiap 3 detik (bukan terus-menerus) |
| **GuessTicker** *(baru)* | Pita hitam, teks putih. Menampilkan 3–5 tebakan terakhir, bagian prefix yang benar diberi latar hijau |
| **GuessHeat** | Bar bersegmen (5 blok) yang terisi sesuai kecepatan chat, label "SEPI / RAME / PANAS / MELEDAK!" |
| **LeaderboardMini** | "Papan skor": kartu putih, header hitam, baris bergaris; #1 berlatar kuning + mahkota; skor Space Mono |
| **SessionProgress** | 2 stiker kecil: "KATA DITEMUKAN" (hijau) & "👑 BOSS X LAGI" (ungu) |

## 6.3 Algoritma Ukuran Tile

Lebar konten efektif: **936px**.

```text
gap      = n ≤ 6 ? 16px : n ≤ 10 ? 12px : 8px
tileW    = min(140, floor((936 − gap × (n − 1)) / n))
tileH    = tileW × 1.2
fontSize = tileW × 0.62
border   = tileW ≥ 90 ? 6px : 4px
shadow   = tileW ≥ 90 ? nb-lg : nb-md
```

| Panjang kata | Tile | Font |
|---|---|---|
| 3 | 140px | 87px |
| 5 | 140px | 87px |
| 8 | 106px | 66px |
| 10 | 83px | 51px |
| 12 | 70px | 43px |
| 14+ | pecah jadi **2 baris** (per kata jika ada spasi, atau dibagi dua) | — |

Minimum tile **64px**. Di bawah itu wajib 2 baris agar tetap terbaca di HP.

## 6.4 State Overlay

| State | Tampilan |
|---|---|
| **Idle / menunggu** | Mode "CARA MAIN" *(baru)*: 3 kartu stiker bergantian — ① Lihat kategori ② Tebak di komentar ③ Huruf awal yang benar terbuka! |
| **Active** | Layout §6.1 |
| **Paused** | Latar diberi garis diagonal abu, kartu besar "⏸ JEDA DULU!" miring −2°. Kata tetap terlihat samar |
| **Connection issue** | Pita kuning-hitam di atas: "⚠ MENYAMBUNG ULANG..." — gameplay tetap terlihat, tidak menutup layar |
| **Session ended** | Poster "LIVE SELESAI" + podium Top 3 (balok 1-2-3 bertingkat) + statistik |

## 6.5 Opsi URL (OBS / LIVE Studio)

Parameter lama tetap: `?transparent=1`, `?sound=0`, `?reducedMotion=1`.

Baru:

| Param | Nilai | Fungsi |
|---|---|---|
| `bg` | `paper` (default), `yellow`, `dark`, `transparent` | Pilihan latar (`transparent=1` tetap didukung sebagai alias) |
| `ticker` | `1` (default) / `0` | Tampilkan/sembunyikan ticker tebakan |
| `howto` | `1` (default) / `0` | Mode "CARA MAIN" saat idle |

Pada `bg=transparent`, semua kartu tetap berisi warna solid dan border hitam sehingga tetap terbaca di atas kamera.

---

# 7. Event & Animasi

| Event (server) | Animasi Neo-Brutalism | Durasi | Suara |
|---|---|---|---|
| `LETTER_REVEALED` (tebakan) | Tile *flip-pop*: scaleY 0→1.15→1, isi kuning lalu kembali putih | 260ms | click |
| `LETTER_REVEALED` (hint) | Sama + stiker kecil "💡 HINT" muncul di atas tile | 400ms | magic |
| `GIFT_RECEIVED` | Kartu pink **meluncur dari kanan** + miring, teks "@budi kirim 🌹 → BUKA 1 HURUF!", lalu tile terbuka | ~1.8s | chime |
| `PLAYER_WON` | ① Layar "shake" kecil ② Cap **"BENAR!"** hijau raksasa (scale 2→1, rotasi −8°) ③ kartu nama pemenang + starburst "+10 POIN" ④ confetti kotak-kotak | ~2.2s | jingle |
| `NEW_PUZZLE` | Tile lama jatuh ke bawah satu per satu (stagger 40ms), tile baru "dijatuhkan" dari atas | ~0.9s | whoosh |
| `BOSS_STARTED` | Garis hazard menyapu layar, teks "⚠ BOSS ROUND ⚠" berkedip 2×, layout berganti latar ungu | 2.6s | siren |
| `BOSS_DEFEATED` | Cap "BOSS KALAH!" + podium mini + confetti lebih banyak | 2.8s | jingle besar |
| `ALL_LETTERS_REVEALED` | Pita oranye "SEMUA HURUF TERBUKA — SIAPA CEPAT?" | 1.5s | — |
| `PUZZLE_SKIPPED` | Cap abu "DILEWATI" di atas kata + tampilkan jawaban | 1.2s | — |
| `SESSION_ENDED` | Poster akhir (tetap tampil) | — | — |
| Perubahan ranking | Baris leaderboard naik dengan efek "swap", label "NAIK!" hijau | 400ms | — |

Aturan:

- Banner event **tidak menutup kata lebih dari 2.8 detik** (v1 §35 tetap).
- Confetti hanya untuk `PLAYER_WON` dan `BOSS_DEFEATED`.
- Tanpa `backdrop-blur` (berat untuk OBS). Latar event memakai overlay `ink` 35% solid.
- `?reducedMotion=1` → semua animasi diganti muncul/hilang instan; shake, marquee, dan wiggle dimatikan.

---

# 8. Fitur Penarik Penonton (Engagement)

Diurutkan dari yang **paling murah** (hanya frontend) ke yang butuh backend.

| # | Fitur | Dampak | Butuh backend? |
|---|---|---|---|
| E1 | **CTA wiggle + panah** | Penonton baru langsung tahu harus komen | Tidak |
| E2 | **Ticker tebakan terbaru** dengan prefix benar disorot | Membuktikan chat hidup → orang ikut | Tidak (`chatLog` sudah ada di overlay) |
| E3 | **Guess heat bar** bertingkat | Rasa "rame" | Tidak (`GuessHeat` sudah ada, tinggal redesign) |
| E4 | **Mode "CARA MAIN"** saat idle | Penonton baru paham < 3 detik | Tidak |
| E5 | **Label "NAIK!"** saat ranking berubah | Kompetisi terasa | Tidak (bandingkan leaderboard sebelumnya di client) |
| E6 | **"HAMPIR!"** — saat tebakan membuka ≥ 2 huruf baru sekaligus, sorot nama penebaknya | Momen seru | Tidak (turunan `LETTER_REVEALED` + `CHAT_MESSAGE`) — perlu dicek urutan event |
| E7 | **Sambutan penonton baru** "Halo @nama! Ayo tebak!" | Personal, bikin betah | **Ya** — event `member` TikTok belum diteruskan ke overlay |
| E8 | **Streak pemenang** "🔥 3× BERUNTUN" | Motivasi pemain rutin | **Perlu dicek** — ada data streak di server atau belum |
| E9 | **Papan "Pemberi Gift Terbaik"** | Mendorong gift | **Ya** — agregasi gift per sesi |

Rekomendasi: kerjakan **E1–E6 di fase redesign**, E7–E9 sebagai fase lanjutan terpisah.

---

# 9. Host Dashboard (1440×900)

Brutalism yang **lebih tenang**: fokus pada kecepatan kontrol, bukan hiburan.

```text
┌──────────────────────────────────────────────────────────────────────┐
│ [TEBAK KATA] ● LIVE  02:34:12      TikTok: 🟢 Terhubung   @hannnafiii │ Topbar kuning, border bawah 3px
├───────────┬───────────────────────────────┬──────────────────────────┤
│ SIDEBAR   │ ┌ KATA SAAT INI ────────────┐ │ ┌ LIVE CHAT ───────────┐ │
│ (paper)   │ │ JAWABAN: KELAS  👁         │ │ │ Andi   KOTAK         │ │
│           │ │ [K][E][L][ ][ ]            │ │ │ Budi   KEMAS  KE✔    │ │
│ ▣ Dash    │ │ 🍔 PENDIDIKAN   [EASY]     │ │ │ █ Rian KELAS  +10 █  │ │ ← baris pemenang hijau
│ □ Words   │ └───────────────────────────┘ │ │ ...                  │ │
│ □ Kategori│ ┌ KONTROL ──────────────────┐ │ └──────────────────────┘ │
│ □ Gifts   │ │ [💡 HINT] [⏭ SKIP] [⏸ JEDA]│ │ ┌ LEADERBOARD ─────────┐ │
│ □ Setting │ │ [🔄 KATA BARU]  [⏹ AKHIRI] │ │ │ 1 Andi 55            │ │
│           │ └───────────────────────────┘ │ └──────────────────────┘ │
├───────────┴───────────────────────────────┴──────────────────────────┤
│ [VIEWER 1.2K] [TEBAKAN 8.4K] [GIFT 184] [KATA 27] [BOSS 3 LAGI]      │ Stat bar: blok berwarna
└──────────────────────────────────────────────────────────────────────┘
```

| Komponen | Perubahan |
|---|---|
| **Topbar** | Latar kuning, status koneksi TikTok tampil jelas (hijau/merah + teks) |
| **Sidebar** | Item aktif = blok hitam teks putih + shadow; hover = geser 2px |
| **CurrentPuzzlePanel** | Jawaban dengan tombol intip 👁 (default tersembunyi — aman saat layar host ikut tertangkap kamera) |
| **GameControls** | Tombol besar berwarna: HINT kuning, SKIP biru, JEDA putih, AKHIRI merah. Efek tekan. Shortcut keyboard `H` / `S` / `P` *(baru, frontend saja)* |
| **Konfirmasi AKHIRI** | Modal brutal: kartu putih border 5px, tombol merah "YA, AKHIRI" |
| **LiveChatPanel** | Tebakan dengan prefix benar diberi chip hijau; baris pemenang berlatar hijau penuh |
| **LeaderboardCard** | Tabel bergaris, #1 kuning |
| **SessionStatsBar** | Deretan blok stat berwarna berbeda |

Minimum 1280×720 tetap didukung (kolom chat menyempit, sidebar jadi ikon).

---

# 10. Admin & Home

- **Admin (Words, Categories, Gifts, Settings):** tabel border 3px, header hitam, baris zebra `paper`/`white`; input border 3px dengan focus = shadow kuning `nb-sm`; toast sukses hijau / gagal merah (kanan atas).
- **Home (`/`):** "poster" logo besar + 3 kartu stiker miring (Overlay / Host / Admin) yang lurus saat hover.

---

# 11. Rencana Teknis

## 11.1 Peta File

| File | Aksi |
|---|---|
| `packages/shared/src/constants.ts` | Ganti `DESIGN_COLORS` / `DESIGN_RADIUS` dengan token neo (§4). Tambah `DESIGN_SHADOW`, `DESIGN_BORDER` |
| `apps/web/tailwind.config.ts` | Warna, `boxShadow` nb-*, `borderWidth` nb-*, font, keyframes (`flip-pop`, `stamp`, `wiggle`, `shake`, `slide-in-right`, `drop-in`, `marquee`, `blink`) |
| `apps/web/app/globals.css` | Utilitas `@layer components`: `.nb-card`, `.nb-btn`, `.nb-press`, `.bg-dots`, `.bg-hazard`, `.nb-sticker`; `prefers-reduced-motion` global |
| `apps/web/app/layout.tsx` | Ganti Bebas Neue/Inter → Archivo Black, Space Grotesk, Space Mono |
| `components/ui/Button.tsx` | Varian: `primary`(kuning), `secondary`(putih), `info`(biru), `danger`(merah), `icon` + efek tekan |
| `components/ui/Card.tsx` | Border + shadow keras, prop `tone` (warna isi) & `tilt` |
| `components/ui/Badge.tsx` | Difficulty & Category versi stiker, ukuran `sm/md/lg` |
| `components/ui/Sticker.tsx` | **Baru** — wrapper rotasi + border + shadow |
| `components/ui/Modal.tsx` | **Baru** — dialog konfirmasi brutal |
| `components/ui/Toast.tsx` | **Baru** — notifikasi admin/host |
| `components/WordDisplay.tsx` | Rewrite ke tile + algoritma §6.3 + 2 baris |
| `components/overlay/OverlayScreen.tsx` | Layout zona §5–6, param `bg`/`ticker`/`howto` |
| `components/overlay/CommentCTA.tsx` | Redesign (E1) |
| `components/overlay/GuessHeat.tsx` | Bar bersegmen (E3) |
| `components/overlay/GuessTicker.tsx` | **Baru** (E2) |
| `components/overlay/HowToPlay.tsx` | **Baru** (E4) |
| `components/overlay/LeaderboardMini.tsx` | Papan skor + "NAIK!" (E5) |
| `components/overlay/SessionProgress.tsx` | Stat stiker |
| `components/overlay/EventLayer.tsx` | Semua banner §7, hapus `backdrop-blur` |
| `components/overlay/Confetti.tsx` | Partikel kotak/segitiga warna aksen |
| `components/host/*` | Redesign §9 + shortcut keyboard |
| `components/admin/*` | Redesign §10 |
| `app/page.tsx` | Redesign home |
| `lib/sound.ts` | Opsional: pilihan suara lebih "arcade" |
| `TEBAK_KATA_LIVE_Design_System_v2.0.md` | **Baru** — dokumentasi resmi pengganti v1 |

## 11.2 Prinsip Implementasi

1. **Token dulu, komponen kemudian** — tidak boleh ada hex warna tertulis langsung di komponen.
2. **Tidak mengubah kontrak data** (`ServerEvent`, `GameStatePublic`) di fase redesign.
3. **Tanpa dependensi baru** kecuali disetujui (lihat D7).
4. Setiap fase bisa dirilis sendiri; overlay lama tidak rusak di tengah jalan.
5. Performa OBS: target **60fps** di browser source, tanpa blur, animasi hanya `transform`/`opacity`.

## 11.3 Halaman Preview Dev *(baru)*

`/dev/overlay-preview` — menampilkan overlay dengan **data palsu** dan tombol untuk memicu setiap event (menang, gift, boss, dll.) tanpa perlu LIVE atau server. Mempercepat desain & QA, dan hanya aktif di mode development.

---

# 12. Fase Pengerjaan

| Fase | Isi | Hasil yang bisa dicek | Estimasi |
|---|---|---|---|
| **0. Validasi visual** | Jawab §15, buat mockup overlay (active, winner, boss) & host | Mockup disetujui | 0.5 hari |
| **1. Fondasi** | Token shared, Tailwind, globals.css, font, Button/Card/Badge/Sticker/Modal/Toast, halaman preview dev | `/dev/overlay-preview` menampilkan komponen dasar | 1 hari |
| **2. Overlay inti** | WordDisplay tile, header, kategori, CTA, leaderboard, progress, layout zona aman, param `bg` | Overlay active tampil penuh gaya baru | 1–1.5 hari |
| **3. Event & animasi** | Semua banner §7, confetti baru, state paused/connection/ended, reduced motion | Semua event bisa dipicu di preview | 1.5 hari |
| **4. Engagement** | E1–E6 (ticker, heat, cara main, NAIK!, HAMPIR!) | Tes dengan mock chat | 1 hari |
| **5. Host dashboard** | §9 + shortcut + modal | Host bisa jalankan sesi penuh | 1 hari |
| **6. Admin & Home** | §10 | Semua halaman konsisten | 0.5–1 hari |
| **7. QA LIVE nyata** | Checklist §13 di OBS/LIVE Studio + HP penonton | Semua checklist ✅ | 0.5 hari |
| **8. Lanjutan (opsional)** | E7–E9 (butuh backend) | — | terpisah |

**Total fase 0–7: ± 7–8 hari kerja.**

---

# 13. QA Checklist

### Overlay

- [ ] 1080×1920, WORD adalah elemen terbesar
- [ ] WORD, kategori, CTA berada di zona 200–1250px
- [ ] Tidak ada info penting di kiri-bawah (komentar TikTok) & kanan-bawah (ikon)
- [ ] Dicek di **HP penonton asli** saat LIVE (bukan hanya di OBS)
- [ ] Kata 3, 8, 12, 16 huruf tetap muat & terbaca
- [ ] Username panjang (30 karakter) & emoji terpotong rapi dengan `…`
- [ ] `bg=paper`, `yellow`, `dark`, `transparent` semua terbaca di atas kamera
- [ ] Kontras teks lulus AA

### Animasi & Performa

- [ ] Letter reveal ≤ 300ms
- [ ] Banner event ≤ 2.8s, tidak menutup kata terlalu lama
- [ ] Confetti hanya untuk menang & boss kalah
- [ ] `?reducedMotion=1` mematikan shake, wiggle, marquee
- [ ] Stabil 60fps di OBS browser source selama 30 menit
- [ ] Tidak ada `backdrop-blur` / `filter: blur`

### Host

- [ ] Jawaban tersembunyi secara default, bisa diintip
- [ ] HINT / SKIP / JEDA bisa via tombol & keyboard
- [ ] AKHIRI memakai konfirmasi
- [ ] Status koneksi TikTok terlihat jelas
- [ ] Layak di 1280×720

### Gameplay (tidak boleh berubah)

- [ ] Prefix matching, first correct answer, hint/gift 1 huruf, tanpa timer, leaderboard reset per LIVE

---

# 14. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Latar krem terlalu terang/silau di kamera | Sediakan `bg=dark` (ink + border kuning) & `bg=transparent` |
| Terlalu ramai → kata tidak fokus | Batasi aksen per layar maks. 4 warna; ornamen hanya di header & event |
| Kata panjang tidak muat | Algoritma tile + 2 baris (§6.3) |
| UI TikTok menutupi elemen | Zona aman §5 + QA di HP asli |
| Animasi berlebihan mengganggu | Wiggle berkala (bukan terus-menerus), reduced motion |
| Bertentangan dengan Design System v1 | Terbitkan v2 dan tandai v1 sebagai arsip |
| Perubahan token shared merusak halaman lain di tengah proses | Kerjakan per fase; token lama dihapus di akhir Fase 6 |

---

# 15. Pertanyaan Terbuka (perlu jawaban sebelum Fase 1)

1. **Latar default overlay:** krem (rekomendasi), kuning, atau gelap?
2. **Font:** setuju Archivo Black + Space Grotesk, atau ingin yang lebih "kartun"/bulat (mis. Lilita One / Bricolage Grotesque)?
3. **Tile huruf** menggantikan gaya garis bawah v1 — setuju?
4. **Bahasa label** overlay: Indonesia penuh ("BENAR!", "KATA DITEMUKAN") atau campur Inggris ("WORD FOUND")?
5. **Maskot/logo** khusus? (mis. karakter kotak huruf) — atau cukup logo teks.
6. **Fitur backend E7–E9** masuk rencana sekarang atau nanti?
7. **Suara:** tetap suara saat ini atau diganti gaya arcade/8-bit?
8. Perlu **mockup visual dulu** (Fase 0) sebelum coding, atau langsung ke Fase 1?

---

**Akhir Rencana v1.0**
