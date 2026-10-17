# 🟨 TEBAK KATA LIVE — Design System v2.0 (Neo-Brutalism)

**Versi:** 2.0
**Status:** Aktif — sudah diimplementasikan di `apps/web`
**Menggantikan:** `TEBAK_KATA_LIVE_Design_System_v1.0.md` (arah visual "Premium Arcade" dark + glow). Aturan gameplay, hierarki, dan UX flow v1 **tetap berlaku**.
**Rencana & alasan desain:** `PLAN_Redesign_Neo_Brutalism.md`

> **Word first. Everything else supports the word.**

---

## 1. Sumber Token

Semua token ada di **satu tempat**: `packages/shared/src/constants.ts`, lalu dipetakan ke Tailwind di `apps/web/tailwind.config.ts`. Komponen **tidak boleh** menulis hex warna langsung. Pengecualian: SVG/inline style yang mengimpor `DESIGN_COLORS`.

| Konstanta | Isi |
|---|---|
| `DESIGN_COLORS` | ink, paper, paperDeep, white, muted, yellow, pink, blue, green, orange, red, purple |
| `DESIGN_BORDER` | thin 2 · base 3 · thick 5 · heavy 6 (px) |
| `DESIGN_SHADOW` | sm 3 · md 5 · lg 8 · xl 12 (px, offset tanpa blur) |
| `DESIGN_RADIUS` | small 6 · card 12 · pill 999 (px) |
| `DESIGN_FONTS` | Archivo Black · Space Grotesk · Space Mono |
| `MOTION_DURATIONS` | tap 110 · pop 240 · stamp 420 · show 2200 (ms) |

---

## 2. Warna

| Token Tailwind | Hex | Peran |
|---|---|---|
| `ink` | `#111111` | Semua border, shadow, teks utama |
| `paper` | `#FFF4E0` | Latar utama |
| `paper-deep` | `#EADBC0` | Tile huruf tertutup |
| `muted` | `#5C5C5C` | Teks sekunder (hanya di atas paper/white/yellow) |
| `yellow` | `#FFD60A` | CTA, logo, peringkat #1, huruf baru terbuka |
| `pink` | `#FF5CA8` | Gift, nama pemenang |
| `blue` | `#4D7CFE` | Kategori, info |
| `green` | `#2EE59D` | Benar, pemenang, EASY |
| `orange` | `#FF8A00` | MEDIUM, "semua huruf terbuka" |
| `red` | `#FF3B30` | HARD, LIVE, bahaya |
| `purple` | `#9B6BFF` | BOSS |

**Aturan kontras:** teks di atas **semua** warna aksen memakai `ink` (lolos WCAG AA). Teks putih hanya dipakai di atas `ink`. Status tidak pernah ditandai dengan warna saja; selalu ada ikon atau teks.

---

## 3. Border, Shadow, Radius

| Tailwind | Nilai |
|---|---|
| `border-2` / `border-3` / `border-5` / `border-6` | 2 / 3 / 5 / 6 px, selalu `border-ink` |
| `shadow-nb-sm` / `-md` / `-lg` / `-xl` | `3/5/8/12px` offset, `#111`, tanpa blur |
| `rounded-nb-sm` / `rounded-nb` / `rounded-full` | 6 / 12 / pill |

Panduan ukuran: dashboard memakai border 2–3 dan shadow sm–md; overlay memakai border 5–6 dan shadow lg–xl.

---

## 4. Tipografi

| Kelas | Font | Pemakaian |
|---|---|---|
| `font-display` | Archivo Black | Logo, huruf kata, banner event, judul |
| `font-ui` (default body) | Space Grotesk | Teks UI |
| `font-mono` | Space Mono | Skor & angka (lebar tetap, tidak "loncat") |

Dimuat lewat `next/font/google` di `app/layout.tsx` sebagai variabel `--font-display`, `--font-ui`, dan `--font-mono`.

---

## 5. Utilitas CSS (`app/globals.css`)

| Kelas | Fungsi |
|---|---|
| `.nb-input` | Input/select: border 3px, focus = hard shadow |
| `.nb-label` | Label form uppercase |
| `.bg-dots` / `.bg-dots-yellow` / `.bg-dots-dark` | Latar pola titik |
| `.bg-hazard` | Garis kuning-hitam 45° (Boss, peringatan) |
| `.bg-stripes` | Garis diagonal tipis (state jeda) |
| `@keyframes confetti-fall` | Jatuh 2100px dengan `--drift` & `--spin` |

`prefers-reduced-motion: reduce` mematikan animasi secara global.

---

## 6. Animasi (Tailwind `animate-*`)

| Kelas | Pemakaian | Durasi |
|---|---|---|
| `animate-tile-reveal` | Huruf baru: flip + kilat kuning | 260ms + 900ms |
| `animate-drop-in` | Tile kata baru jatuh (stagger 40ms) | 520ms |
| `animate-pop-in` | Chip, modal, label "NAIK!" | 260ms |
| `animate-stamp` | Cap "BENAR!", "BOSS KALAH!", "DILEWATI" | 420ms |
| `animate-wiggle` | CTA komentar (goyang setiap 3 detik) | 3s loop |
| `animate-shake` | Guncangan saat menang | 420ms |
| `animate-slide-in-right` | Gift callout, toast | 480ms |
| `animate-hazard-scroll` | Garis hazard berjalan (Boss) | 1s loop |
| `animate-blink` | Titik LIVE | 1s loop |

Easing pantul: `cubic-bezier(.34,1.56,.64,1)`. Animasi hanya memakai `transform`, `opacity`, `background`, tanpa blur.

---

## 7. Komponen

### UI dasar (`components/ui`)

| Komponen | Catatan |
|---|---|
| `Button` | Varian `primary`(kuning) · `secondary`(putih) · `info`(biru) · `success`(hijau) · `danger`(merah) · `dark`(hitam); ukuran `sm/md/lg`; efek tekan ke shadow; default `type="button"` |
| `Card`, `CardTitle` | Prop `tone` (warna isi), `shadow`, `padded` |
| `DifficultyBadge`, `CategoryBadge` | Ukuran `sm/md/lg` (lg untuk overlay) |
| `Modal` | Konfirmasi; Esc & klik latar = batal (kecuali sedang proses) |
| `ToastProvider`, `useToast` | Notifikasi admin (sukses/gagal) |
| `ErrorNote` | Pesan error inline `role="alert"` |
| `Starburst` | Bintang SVG untuk "+POIN" |

### Kata (`components/WordDisplay.tsx`)

Tile berbingkai tebal. Ukuran dari `tileMetrics(length, context)`:

```text
rows   = length ≥ twoRowsFrom ? 2 : 1          (overlay 14, host 11)
gap    = perRow ≤ 6 ? 16 : perRow ≤ 10 ? 12 : 8 (overlay)
tile   = min(maxTile, floor((width − gap×(perRow−1)) / perRow))
         overlay: width 936, maxTile 140 (2 baris: 96)
         host:    width 340, maxTile 52  (2 baris: 44)
height = tile × 1.2 · font = tile × 0.62
```

State tile: tertutup `paper-deep` + "?", terbuka `white`, baru terbuka kilat `yellow`, terjawab `green`.

### Overlay (`components/overlay`)

`OverlayScreen` (koneksi socket) → `OverlayView` (tampilan murni, juga dipakai halaman preview). Isinya: `OverlayHeader`, `CategoryBadge`/`DifficultyBadge`, `WordDisplay`, `CommentCTA`, `GuessTicker`, `GuessHeat`, `LeaderboardMini`, `SessionProgress`, `HowToPlay`, `SessionEndedPoster`, `EventLayer`, `Confetti`, dan `ScaledStage`.

---

## 8. Overlay 1080×1920

### Zona (menghindari UI TikTok)

| Y (px) | Isi |
|---|---|
| 0–200 | Kosong (profil/viewer TikTok) |
| 200–380 | Logo "TEBAK KATA" + badge LIVE |
| ~352 | Pita "menyambung ulang" (hanya saat koneksi putus) |
| 400–1260 | Boss ribbon · kategori + level · **kata** · CTA · ticker · heat |
| 1290+ | Papan skor Top 3 + stiker progres, **rata kanan** (kiri bawah tertutup komentar) |

Angka zona adalah perkiraan; tetap cek dari HP penonton saat LIVE.

### Parameter URL

| Param | Nilai | Default |
|---|---|---|
| `bg` | `paper` · `yellow` · `dark` · `transparent` | `paper` |
| `transparent` | `1` (alias lama untuk `bg=transparent`) | — |
| `sound` | `0` untuk mematikan | nyala |
| `reducedMotion` | `1` untuk mematikan animasi | mati |
| `ticker` | `0` untuk menyembunyikan | tampil |
| `howto` | `0` untuk menyembunyikan | tampil |

`ScaledStage` mengecilkan panggung 1080×1920 agar muat di jendela browser biasa. Di OBS dengan ukuran 1080×1920, skalanya 1:1.

### Event

| Event server | Tampilan | Durasi |
|---|---|---|
| `LETTER_REVEALED` | Tile flip + kilat kuning (+ suara) | 260ms |
| `PLAYER_WON` | Latar redup, shake, cap "BENAR!", kata hijau, nama pink, starburst poin, confetti | 2.2s |
| `BOSS_STARTED` | Pita hazard penuh "⚠ BOSS ROUND", kategori, starburst poin | 2.6s |
| `BOSS_DEFEATED` | Cap "BOSS KALAH!" ungu + confetti | 2.8s |
| `GIFT_RECEIVED` | Kartu pink meluncur dari kanan, tanpa meredupkan gameplay | 1.8s |
| `ALL_LETTERS_REVEALED` | Callout oranye | 1.5s |
| `PUZZLE_SKIPPED` | Cap "DILEWATI" + jawaban | 1.6s |
| Status `PAUSED` | Garis diagonal + kartu "⏸ JEDA DULU!" | selama jeda |
| Status `ENDED` | Poster "LIVE SELESAI!" + podium + statistik | selama sesi berakhir |

---

## 9. Host Dashboard & Admin

- **Topbar kuning:** sumber komentar, status server, dan status sesi. Semuanya berupa pill dengan teks.
- **Sidebar:** item aktif berupa blok hitam; di bawah lebar 1400px hanya ikon.
- **Kata saat ini:** jawaban tersembunyi secara default (tombol 👁 Intip).
- **Kontrol game:** shortcut keyboard `H` hint · `S` skip · `N` kata baru · `P` jeda/lanjut (tidak aktif saat mengetik di kolom).
- **Akhiri LIVE:** selalu lewat `Modal` konfirmasi.
- **Live chat:** chip hijau untuk awalan benar, baris hijau untuk pemenang.
- **Admin:** header stiker kuning, tabel/list bergaris, toast untuk setiap aksi.

---

## 10. Halaman Preview Dev

`/dev/overlay-preview` hanya ada di `next dev`. Halaman ini memakai `OverlayView` dengan data palsu dan tombol untuk setiap event, status, dan latar. Gunakan untuk QA desain tanpa server atau LIVE.

---

## 11. Checklist QA

- [ ] Kata adalah elemen terbesar; kata 3, 8, 12, 16 huruf muat & terbaca
- [ ] Kata, kategori, CTA berada di 200–1260px; tidak ada info penting di kiri bawah
- [ ] Semua latar (`paper`, `yellow`, `dark`, `transparent`) terbaca
- [ ] Banner event ≤ 2.8 detik; confetti hanya untuk menang/boss kalah
- [ ] `?reducedMotion=1` mematikan goyangan, shake, marquee
- [ ] Tidak ada `blur`/`backdrop-blur`
- [ ] Jawaban host tersembunyi secara default; Akhiri LIVE memakai konfirmasi
- [ ] Dicek di HP penonton asli saat LIVE
