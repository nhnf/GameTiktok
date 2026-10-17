# Panduan & Alur Gift — Auto Battle Arena

Dokumen ini menjelaskan cara kerja sistem gift di game **Auto Battle Arena**, cara menyiapkannya untuk TikTok LIVE, dan cara memastikan setiap gift benar-benar menjadi pasukan di arena.

---

## 1. Konsep singkat

> **Penonton tidak memilih tim. Gift yang menentukan tim dan pasukannya.**

```
Gift  →  Tim (A Biru / B Merah)  →  Unit  →  Jumlah
```

- Satu penonton boleh membantu **kedua tim** dalam satu match (PRD §2.1). Kontribusinya dicatat per gift, bukan per tim.
- Gift **tidak** mengurangi HP base secara langsung. Gift memanggil unit, lalu unit bertarung sendiri (PRD §2.3).
- Komentar tidak berpengaruh apa-apa ke battle (PRD §2.2).

---

## 2. Alur lengkap sebuah gift

```
Penonton kirim gift di TikTok LIVE
        │
        ▼
tiktok-live-connector  (event WebcastGift)
        │
        ▼
giftMessageToIncoming()                          apps/server/src/adapters/tiktokLiveAdapter.ts
  • ambil ID gift, nama, harga koin, pengirim
  • hitung jumlah combo (lihat §3)
  • eventId = ID pesan TikTok (msgId) → untuk anti-duplikat
  • catat ke "Gift terdeteksi" (tabel seen_gifts)
        │
        ▼
GameSessionManager.applyGift()                   apps/server/src/state/sessionManager.ts
  • sesi LIVE harus ACTIVE (kalau dijeda/berhenti → diabaikan)
  • diteruskan ke game yang sedang aktif
        │
        ▼
AutoBattleAdapter.handleGift()                   apps/server/src/games/autoBattle/autoBattleAdapter.ts
        │
        ▼
BattleSimulation.receiveGift()                   packages/shared/src/battleEngine.ts
  1. Validasi data (ada ID event, penonton, gift, jumlah > 0)
  2. Cari mapping: cocokkan Gift ID dulu, kalau tidak ada → cocokkan NAMA gift
  3. Mapping nonaktif? → ditolak (DISABLED)
  4. Event ID sudah pernah diproses? → ditolak (DUPLICATE)
  5. Jumlah unit = jumlah di mapping × jumlah gift (combo)
  6. Masuk antrean FIFO tim tersebut
  7. Catat kontribusi penonton + notifikasi feed
        │
        ▼
Setiap 50 ms (simulasi 20×/detik):
  • Antrean di-spawn 1 unit per 100 ms per tim (tidak menumpuk)
  • Maks 40 unit aktif per tim — sisanya menunggu sampai ada unit yang mati
  • Setiap unit spawn → skor kontribusi pemilik gift bertambah
        │
        ▼
Overlay OBS (10 frame/detik) + log gift di Host Dashboard + disimpan ke DB
```

**Gift tidak pernah hilang** selama gift itu terpetakan dan aktif. Gift yang masuk saat lobby, countdown, jeda, atau layar hasil tetap diterima dan masuk antrean, lalu spawn begitu battle berjalan.

---

## 3. Gift combo (misalnya Rose ×10)

Gift yang bisa di-combo (Rose, TikTok, GG, dll.) dikirim TikTok sebagai **beberapa pesan** dengan hitungan kumulatif:

| Pesan dari TikTok | repeatCount | Unit yang di-spawn |
|---|---|---|
| pesan 1 | 1 | +1 |
| pesan 2 | 4 | +3 |
| pesan 3 (terkirim ulang) | 4 | +0 |
| pesan 4 | 9 | +5 |
| pesan akhir (repeatEnd) | 10 | +1 |
| **Total** | | **10** |

Pasukan muncul **selagi penonton masih menekan combo**, dan totalnya tetap tepat 10. Pesan yang terkirim ulang tidak menambah apa pun.

> Catatan: game kata (Tebak Kata / Susun Kata) tetap memakai aturan lama — **satu combo = satu huruf**, dihitung saat combo selesai.

---

## 4. Mapping default (16 gift)

Diatur di **Admin → Auto Battle → Gift → Pasukan**.

| Unit | Tier | Team A · Biru | Team B · Merah |
|---|---|---|---|
| Spearman (raider cepat) | 1 | Rose (5655) ×1 | TikTok (5269) ×1 |
| Ranger / Archer | 1 | GG (6064) ×1 | Ice Cream Cone (5827) ×1 |
| Guardian / Tank | 2 | Finger Heart (5487) ×1 | Friendship Necklace ×1 |
| Berserker | 2 | Doughnut (5879) ×1 | Rosa ×1 |
| Mage | 3 | Perfume (5658) ×1 | Hat and Mustache ×1 |
| Golem / Heavy | 3 | Hand Hearts (5660) ×1 | Corgi ×1 |
| Priest / Support | 3 | Confetti (5585) **×2** | Sunglasses **×2** |
| Siege | 4 | Galaxy (11046) ×1 | Money Gun ×1 |

⚠️ **Penting — ID gift TikTok bisa berbeda per region dan bisa berubah.** Angka di atas adalah ID yang umum dikenal; gift Tim B tanpa ID dicocokkan lewat **nama**. Sebelum LIVE sungguhan, lakukan langkah §6 untuk mengunci ID yang benar dari akun Anda sendiri.

Tips memilih gift:
- Buat nilai koin kedua tim **seimbang** untuk unit yang sama, supaya tidak ada tim yang "lebih murah".
- Gift paling murah dan paling sering (Rose) sebaiknya memanggil unit ringan. PRD §38: gift mahal ≠ otomatis menang.
- Satu gift hanya boleh dipakai di satu mapping (sistem menolak duplikat ID atau nama).

---

## 5. Menyiapkan LIVE sungguhan

1. **`apps/server/.env`**
   ```
   LIVE_SOURCE="tiktok"
   TIKTOK_USERNAME=akun_anda
   TIKTOK_SIGN_API_KEY=...        # dari eulerstream.com
   ```
2. Jalankan seperti biasa (dua terminal):
   ```
   npm run dev:server
   npm run dev:web
   ```
3. **OBS / TikTok LIVE Studio** → Browser Source `http://localhost:3000/overlay`, ukuran **1080 × 1920**.
4. Mulai siaran TikTok LIVE dulu (koneksi ditolak kalau akun belum LIVE).
5. Buka **Host Dashboard** (`/host`) → pilih game **⚔️ Auto Battle** di bagian atas → isi username TikTok → **▶ Mulai sesi LIVE**.
6. Arena masuk **lobby 15 detik**, lalu countdown 3-2-1 dan battle mulai otomatis. Setelah match selesai, layar hasil tampil 8 detik, kembali ke lobby, dan match berikutnya mulai sendiri. (Bisa dimatikan di **Tim & Unit → "Match berikutnya mulai otomatis"**.)

---

## 6. Memastikan gift benar-benar berjalan (checklist)

**A. Tanpa LIVE (mode simulasi, `LIVE_SOURCE="mock"`)**
1. Mulai sesi dengan game Auto Battle.
2. Di Host Dashboard, panel **🎁 Gift battle** → klik tombol gift mana saja (bisa ×1 / ×5 / ×10).
3. Tombol tes ini memakai **jalur yang sama persis** dengan gift TikTok asli. Pastikan:
   - log menampilkan `→ Team A · Spearman ×1` (titik hijau),
   - unit muncul di overlay,
   - feed kiri overlay menampilkan `@tester …`.

**B. Saat LIVE sungguhan (lakukan sekali sebelum LIVE penting)**
1. Minta teman mengirim beberapa gift berbeda yang ingin Anda pakai.
2. Buka **Admin → Gift → Pasukan**, bagian **📡 Gift terdeteksi dari LIVE** → klik **↻ Muat ulang**.
3. Setiap gift yang benar-benar masuk tampil dengan **ID asli, nama, dan harga koin**:
   - **Ubah** — gift sudah terpetakan lewat ID. Beres.
   - **Kunci ID** — gift cocok lewat nama saja. Klik lalu **Simpan** supaya ID aslinya tersimpan (lebih andal).
   - **Petakan** — gift belum dipakai. Klik, pilih tim & unit, lalu **+ Tambah**.
4. Kirim gift lagi → di log Host Dashboard harus muncul titik hijau.

**Arti status di log gift Host Dashboard:**

| Status | Artinya | Yang perlu dilakukan |
|---|---|---|
| 🟢 `→ Team A · Mage ×1` | Diterima, unit dipanggil | — |
| 🟢 `… (3 antre)` | Diterima, sebagian menunggu slot (tim sudah 40 unit) | Normal |
| 🔴 Gift belum di-mapping | Gift ini tidak ada di daftar mapping | Petakan di Admin (lihat B.3) |
| 🔴 Mapping nonaktif | Mapping ada tapi dimatikan | Aktifkan di Admin |
| 🔴 Event duplikat | Pesan TikTok yang sama terkirim dua kali | Tidak perlu apa-apa (memang sengaja diabaikan) |

Tidak ada log sama sekali saat gift dikirim? Periksa: sesi LIVE sedang **ACTIVE** (bukan jeda), game aktif **Auto Battle**, dan terminal server menampilkan `[tiktokLiveAdapter] gift @…`.

---

## 7. Kontribusi & leaderboard

- Skor dihitung per unit yang di-spawn (bisa diubah di **Tim & Unit → Skor spawn**):
  Spearman 10 · Ranger 10 · Guardian 10 · Berserker 15 · Priest 20 · Mage 25 · Golem 30 · Siege 40
- Juga dicatat: jumlah gift, unit, damage, damage ke bangunan, dan healing → dipakai untuk **MVP** di layar kemenangan (unit terbanyak, damage terbesar, perusak bangunan, healer terbaik).
- Saat match selesai, skor ditambahkan ke **leaderboard sesi** dan disimpan di **Riwayat Match**.

---

## 8. Keseimbangan (balancing)

Statistik unit mengikuti PRD §8. Angka **bangunan** disetel ulang melalui simulasi (PRD §38/§42 memang meminta angka diuji lewat simulasi), karena dengan baseline PRD satu bentrokan awal langsung "bola salju" dan match selesai dalam ~1 menit:

| Pengaturan | PRD baseline | Default sekarang |
|---|---|---|
| HP base | 10.000 | 15.000 |
| HP tower | 2.500 | 4.000 |
| Damage tower / jeda | 100 / 1,5 dtk | 300 / 1 dtk |
| Base ikut menembak | tidak ada | 250 dmg / 1 dtk (0 = mati) |
| Damage unit ke bangunan | 100% | 25–30% unit biasa, Golem 75%, Siege 100% |

Hasil simulasi dengan default ini: match rata-rata **2,5–4 menit**, beberapa sampai timer 5 menit, dan menang-kalah seimbang (uji cermin 6–6). Semua angka bisa dikembalikan ke baseline PRD di **Admin → Tim & Unit**.

Kalau match terasa terlalu cepat saat LIVE ramai → naikkan HP base, atau turunkan "× bangunan". Terlalu lama saat LIVE sepi → turunkan HP base atau durasi match.

---

## 9. Yang belum bisa diverifikasi

- Belum diuji dengan **TikTok LIVE sungguhan**. Pembacaan pesan gift (combo, msgId, nama, koin) sudah diuji dengan pesan tiruan berformat sama, tapi ID gift asli di akun Anda perlu dicek lewat langkah §6-B.
- ID gift default Tim B sengaja dikosongkan (dicocokkan lewat nama) karena ID-nya tidak pasti.

---

## 10. Peta file (untuk developer)

| Bagian | File |
|---|---|
| Engine battle + pipeline gift | `packages/shared/src/battleEngine.ts` |
| Pencocokan mapping, anti-duplikat, combo | `packages/shared/src/battleGift.ts` |
| Statistik unit, mapping default, layout arena | `packages/shared/src/battleConstants.ts` |
| Pembaca gift TikTok | `apps/server/src/adapters/tiktokLiveAdapter.ts` (`giftMessageToIncoming`) |
| Pencatat gift terdeteksi | `apps/server/src/adapters/giftDiscovery.ts` |
| Game adapter (loop 20 Hz, simpan DB) | `apps/server/src/games/autoBattle/autoBattleAdapter.ts` |
| REST API `/api/battle/*` | `apps/server/src/routes/battle.ts` |
| Overlay (canvas + HUD) | `apps/web/components/battle/` |
| Host Dashboard panel | `apps/web/components/host/BattleHostPanels.tsx` |
| Admin | `apps/web/components/admin/Battle*Manager.tsx` |
| Aset sprite & arena | `apps/web/public/battle/` (dipotong dari `Karakter Set.png` & `Map.png`) |
| Test | `packages/shared/tests/battleEngine.test.ts`, `apps/server/tests/tiktokGift.test.ts` |
