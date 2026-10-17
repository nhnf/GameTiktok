# PRD — Tebak Kata Live TikTok

**Versi:** 1.0  
**Status:** Draft / Core Rules Locked  
**Platform utama:** TikTok LIVE  
**Dokumen:** Product Requirements Document (PRD)

---

## 1. Ringkasan Produk

**Tebak Kata Live** adalah game interaktif yang dimainkan selama TikTok LIVE.

Penonton berpartisipasi melalui komentar. Sistem memiliki satu kata rahasia, lalu menampilkan huruf yang terbuka secara bertahap berdasarkan tebakan penonton.

Aturan inti:

> Huruf hanya terbuka jika tebakan cocok dengan kata target **secara berurutan dari posisi paling awal**.

Contoh:

**Kata target:** `KELAS`

Tebakan `KOTAK`:

```text
K O T A K
K E L A S
↑
```

Hasil:

```text
K _ _ _ _
```

Tebakan `KEMAS`:

```text
K E M A S
K E L A S
↑ ↑
```

Hasil:

```text
K E _ _ _
```

Pemain yang **pertama kali menebak kata lengkap dengan benar** mendapatkan poin. Tebakan parsial hanya berfungsi untuk membuka huruf dan tidak memberikan poin.

Game tidak menggunakan timer dan tidak menggunakan sistem ronde. Game berjalan terus selama satu sesi TikTok LIVE.

---

# 2. Tujuan Produk

## 2.1 Tujuan Utama

1. Membuat pengalaman TikTok LIVE yang interaktif.
2. Mendorong penonton aktif berkomentar.
3. Membuat penonton penasaran terhadap kata yang sedang dimainkan.
4. Menciptakan kompetisi individual melalui leaderboard.
5. Membuat game dapat berjalan terus tanpa memerlukan host mengelola setiap ronde secara manual.
6. Menjadikan gift sebagai salah satu mekanisme interaksi tambahan untuk membuka huruf.

## 2.2 Tujuan Bisnis

- Meningkatkan engagement LIVE.
- Meningkatkan jumlah komentar.
- Meningkatkan retensi penonton.
- Membuat format LIVE yang dapat digunakan berulang kali.
- Membuka peluang pengembangan menjadi beberapa mode game di masa depan.

---

# 3. Non-Goals V1

Fitur berikut **tidak termasuk V1**:

- Timer per kata.
- Team mode.
- Leaderboard permanen lintas LIVE.
- Sistem achievement final.
- Chat pribadi.
- Marketplace.
- Sistem hadiah uang di dalam aplikasi.
- Pembelian item virtual sendiri.
- AI sebagai komponen wajib.
- Mode multiplayer berbasis tim.

---

# 4. Konsep Gameplay

## 4.1 Game Session

Satu sesi game berlangsung sepanjang satu TikTok LIVE.

```text
START LIVE
   ↓
Buat Game Session
   ↓
Leaderboard kosong
   ↓
Pilih kata
   ↓
Penonton menebak
   ↓
Kata ditemukan
   ↓
Pemenang mendapat poin
   ↓
Pilih kata baru
   ↓
Lanjut terus
   ↓
END LIVE
   ↓
Simpan statistik sesi
   ↓
Reset leaderboard
```

Tidak ada konsep:

```text
Ronde 1
Ronde 2
Ronde 3
```

Sebagai gantinya, setiap kata merupakan satu **Puzzle Instance** di dalam satu **Live Session**.

---

# 5. Core Game Rules

## 5.1 Kata Target

Setiap puzzle memiliki satu kata target.

Contoh:

```text
KELAS
```

Sistem menyimpan:

```json
{
  "word": "KELAS",
  "category": "Pendidikan",
  "difficulty": "easy"
}
```

---

## 5.2 Tampilan Awal

Jika target:

```text
KELAS
```

Maka overlay:

```text
CATEGORY
PENDIDIKAN

_ _ _ _ _
```

Kategori ditampilkan, tetapi tidak ada deskripsi atau petunjuk tambahan.

---

# 6. Mekanisme Tebakan

## 6.1 Prefix Matching

Sistem membandingkan tebakan dengan kata target dari posisi pertama.

Algoritma konseptual:

```text
target = KELAS
guess  = KOTAK

index 0:
K == K → buka

index 1:
O != E → berhenti

hasil:
K _ _ _ _
```

Penting:

> Sistem hanya membuka **common prefix** terpanjang.

---

## 6.2 Contoh Lengkap

Target:

```text
KELAS
```

### Tebakan 1

```text
KOTAK
```

Hasil:

```text
K _ _ _ _
```

### Tebakan 2

```text
KEMAS
```

Hasil:

```text
K E _ _ _
```

### Tebakan 3

```text
KELAM
```

Hasil:

```text
K E L A _
```

### Tebakan 4

```text
KELAS
```

Hasil:

```text
K E L A S
```

Puzzle selesai.

---

# 7. Tebakan Parsial

Tebakan parsial:

- Boleh.
- Membuka huruf yang cocok dari depan.
- Tidak memberikan poin.
- Tidak dihitung sebagai kemenangan.
- Tidak mengubah leaderboard.

Contoh:

```text
Target: KOMPUTER

Guess: KEMBALI
Result: K _ _ _ _ _ _ _
```

Karena hanya karakter pertama yang sama.

---

# 8. Tebakan Kata Lengkap

Jika komentar sama dengan kata target:

```text
Target: KELAS

Comment:
KELAS
```

Maka sistem melakukan:

1. Validasi jawaban.
2. Cek apakah puzzle masih aktif.
3. Cek apakah sudah ada pemenang.
4. Jika belum ada pemenang, user menjadi winner.
5. Berikan poin.
6. Tandai puzzle selesai.
7. Tampilkan animasi kemenangan.
8. Generate puzzle berikutnya.

---

# 9. First Correct Answer

Hanya **komentar valid pertama** yang mendapatkan poin.

Contoh:

```text
Andi: KELAS
Budi: KELAS
Siti: KELAS
```

Jika Andi diproses pertama:

```text
Andi → WIN
Budi → tidak mendapat poin
Siti → tidak mendapat poin
```

---

# 10. Comment Normalization

Komentar perlu dinormalisasi sebelum dibandingkan.

Contoh:

```text
kelas
KELAS
Kelas
KELAS!!!
 kelas
```

Semuanya dapat dinormalisasi menjadi:

```text
KELAS
```

Normalisasi minimal:

- uppercase.
- trim whitespace.
- hapus punctuation yang tidak relevan.
- normalisasi spasi.
- dukung variasi kapitalisasi.

---

# 11. Duplicate Guess

Jika user mengirim tebakan yang sama berulang kali:

```text
KEMAS
KEMAS
KEMAS
```

Sistem tidak boleh terus menghasilkan event baru.

Jika huruf yang dihasilkan sudah terbuka:

```text
Tidak ada perubahan state.
Tidak ada poin.
Tidak ada event baru.
```

---

# 12. Winner State

Setiap puzzle memiliki status:

```text
ACTIVE
SOLVED
SKIPPED
```

Saat status:

```text
SOLVED
```

Semua tebakan berikutnya untuk puzzle tersebut diabaikan karena puzzle sudah selesai.

---

# 13. Sistem Poin

## 13.1 Prinsip

Poin hanya diberikan kepada pemain yang pertama kali menebak kata lengkap dengan benar.

Tebakan parsial **tidak menghasilkan poin**.

---

## 13.2 Rekomendasi Scoring V1

| Difficulty | Poin |
|---|---:|
| Easy | 5 |
| Medium | 10 |
| Hard | 20 |
| Boss | 50 |

Contoh:

```text
Kata Easy
→ Winner +5
```

```text
Kata Medium
→ Winner +10
```

```text
Kata Hard
→ Winner +20
```

```text
Boss
→ Winner +50
```

Nilai ini dapat diubah melalui konfigurasi admin.

---

# 14. Leaderboard

Leaderboard bersifat **session-based**.

Leaderboard dibuat ketika LIVE dimulai.

Contoh:

```text
LIVE LEADERBOARD

🥇 Andi    45
🥈 Budi    30
🥉 Siti    20
```

Leaderboard terus diperbarui selama LIVE.

## 14.1 Reset

Ketika LIVE berakhir:

```text
LIVE SESSION END
        ↓
Leaderboard session selesai
        ↓
Data statistik disimpan
        ↓
LIVE berikutnya
        ↓
Leaderboard baru
```

Tidak ada leaderboard permanen untuk V1.

---

# 15. Player Identity

Pemain diidentifikasi berdasarkan identitas dari event komentar TikTok yang tersedia pada integrasi.

Data minimal:

```text
platform_user_id
username
display_name
avatar_url (jika tersedia)
```

Poin disimpan terhadap identitas user di dalam session.

---

# 16. Level Kesulitan

Game memiliki tiga difficulty normal:

### 🟢 EASY

Kata umum dan mudah ditebak.

Contoh:

```text
RUMAH
KELAS
MEJA
BUKU
```

### 🟡 MEDIUM

Kata lebih panjang atau membutuhkan lebih banyak proses.

Contoh:

```text
KOMPUTER
KENDARAAN
PELANGI
```

### 🔴 HARD

Kata panjang atau relatif sulit.

Contoh:

```text
ENTREPRENEUR
KONSTRUKSI
PERPUSTAKAAN
```

Difficulty memengaruhi nilai poin.

---

# 17. Kategori

Setiap kata memiliki kategori.

Kategori ditampilkan pada overlay.

Contoh:

```text
CATEGORY
🍔 MAKANAN
```

```text
CATEGORY
🐾 HEWAN
```

```text
CATEGORY
💻 TEKNOLOGI
```

Tidak ada petunjuk berupa deskripsi.

## Kategori awal

- Makanan
- Hewan
- Benda
- Tempat
- Negara
- Profesi
- Kendaraan
- Teknologi
- Olahraga
- Musik
- Film
- Alam
- Pendidikan
- Umum

Kategori harus dapat dikelola admin.

---

# 18. Hint

Hint hanya memiliki satu fungsi:

> Membuka huruf berikutnya.

Contoh:

```text
K E _ _ _
```

Host menekan:

```text
HINT
```

Hasil:

```text
K E L _ _
```

Hint tidak memberikan:

- kategori tambahan.
- deskripsi.
- jawaban langsung.
- beberapa huruf sekaligus.

---

# 19. Gift System

Gift menjadi mekanisme tambahan untuk membantu membuka huruf.

## 19.1 Core Rule

Gift tertentu dapat dikonfigurasi sebagai:

```text
Gift Event
      ↓
Open Next Letter
```

Contoh:

```text
K E _ _ _

User mengirim gift yang dikonfigurasi
        ↓
K E L _ _
```

Gift tidak memberikan jawaban lengkap.

---

## 19.2 Konfigurasi Gift

Admin dapat menentukan gift yang terhubung dengan:

```text
gift identifier
gift name
effect
enabled/disabled
```

Effect V1:

```text
REVEAL_NEXT_LETTER
```

---

## 19.3 Proteksi

Jika semua huruf sudah terbuka:

```text
K E L A S
```

Gift tidak boleh membuka huruf tambahan.

Sistem dapat menampilkan:

```text
ALL LETTERS REVEALED
```

---

## 19.4 Catatan Compliance

Implementasi gift harus mengikuti aturan dan kebijakan TikTok yang berlaku.

Game tidak boleh mengandalkan mekanisme yang memaksa atau membujuk penonton mengirim gift untuk memperoleh kesempatan bermain.

Gift diposisikan sebagai event/interaksi tambahan, bukan syarat untuk mengikuti game.

---

# 20. Boss Round

Karena tidak ada ronde, Boss Round dipicu berdasarkan jumlah puzzle yang telah diselesaikan dalam session.

Contoh:

```text
10 puzzle selesai
       ↓
BOSS PUZZLE
```

Setelah Boss selesai:

```text
Boss defeated
       ↓
Normal puzzle kembali
```

## 20.1 Boss Characteristics

Boss:

- Difficulty lebih tinggi.
- Poin lebih besar.
- Animasi khusus.
- Kata lebih panjang/sulit.
- Tidak menggunakan timer.
- Tetap mengikuti prefix matching.
- Tetap hanya winner pertama yang memperoleh poin.

Contoh:

```text
👑 BOSS WORD

CATEGORY
TECHNOLOGY

_ _ _ _ _ _ _ _ _ _

REWARD
+50 POINT
```

---

# 21. Progress Counter

Walaupun tidak ada ronde, game dapat menampilkan jumlah puzzle yang telah diselesaikan.

Contoh:

```text
WORDS SOLVED
27
```

Ini juga digunakan untuk menentukan Boss.

Contoh:

```text
27 words solved
```

Puzzle berikutnya:

```text
Normal
```

Saat mencapai threshold:

```text
30 words solved
↓
BOSS
```

---

# 22. Host Dashboard

Host membutuhkan dashboard terpisah dari overlay LIVE.

## 22.1 Dashboard Layout

```text
┌────────────────────────────────────────┐
│ TEBAK KATA LIVE                        │
├────────────────────────────────────────┤
│                                        │
│ CURRENT WORD                           │
│ KELAS                                  │
│                                        │
│ DISPLAY                                │
│ K E _ _ _                              │
│                                        │
│ CATEGORY                               │
│ PENDIDIKAN                             │
│                                        │
│ DIFFICULTY                             │
│ EASY                                   │
│                                        │
│ [ HINT ] [ SKIP ] [ NEW WORD ]         │
│                                        │
├────────────────────────────────────────┤
│ LIVE COMMENTS                          │
│                                        │
│ Andi    KOTAK                          │
│ Budi    KEMAS                          │
│ Siti    KELAM                          │
│ Rian    KELAS                          │
└────────────────────────────────────────┘
```

---

# 23. Host Controls

Minimal V1:

### START LIVE SESSION

Memulai game session.

### PAUSE GAME

Menghentikan sementara pemrosesan gameplay.

### HINT

Membuka satu huruf.

### SKIP

Melewati kata aktif.

### NEW WORD

Memilih puzzle baru jika diperlukan.

### END SESSION

Mengakhiri game session.

---

# 24. OBS Overlay

Overlay adalah tampilan yang ditangkap OBS dan ditampilkan kepada penonton TikTok.

Contoh:

```text
┌─────────────────────────────────┐
│         🔤 TEBAK KATA           │
│                                 │
│         🍔 MAKANAN              │
│                                 │
│      [ K ][ E ][ _ ][ _ ][ _ ] │
│                                 │
│                                 │
│       🏆 LIVE LEADERBOARD       │
│                                 │
│       1. ANDI       45          │
│       2. BUDI       30          │
│       3. SITI       20          │
│                                 │
│       💬 TEBAK DI KOMENTAR      │
└─────────────────────────────────┘
```

Overlay harus mendukung background transparan agar dapat ditempatkan di scene OBS.

---

# 25. UI States

Overlay minimal memiliki state berikut:

## IDLE

```text
TEBAK KATA LIVE
Menunggu game...
```

## ACTIVE

```text
CATEGORY
HEWAN

_ _ _ _ _
```

## LETTER REVEALED

```text
K _ _ _ _
```

## WIN

```text
🎉 WORD FOUND!

K E L A S

@ANDI
+5 POINT
```

## NEW WORD

```text
✨ NEXT WORD

_ _ _ _ _ _
```

## BOSS

```text
👑 BOSS WORD
```

## PAUSED

```text
GAME PAUSED
```

---

# 26. Animasi

Animasi penting tetapi harus ringan.

## Letter Reveal

Saat huruf terbuka:

```text
_
↓
K
```

Gunakan animasi pop/scale/glow.

## Winner

```text
🎉
WORD FOUND
```

## Boss

Gunakan animasi khusus agar penonton mengetahui bahwa mode spesial dimulai.

## Leaderboard

Perubahan ranking dapat dianimasikan secara halus.

---

# 27. Audio

Audio opsional untuk V1 tetapi direkomendasikan.

### Correct Word

Victory sound.

### Letter Reveal

Short reveal sound.

### Boss

Special boss sound.

### New Word

Transition sound.

Audio harus dapat:

- enable/disable.
- mengatur volume.
- tidak mengganggu audio utama LIVE.

---

# 28. Word Database

Database kata harus mendukung:

```text
id
word
category_id
difficulty
is_active
usage_count
created_at
updated_at
```

Contoh:

```json
{
  "word": "KELAS",
  "category": "Pendidikan",
  "difficulty": "easy",
  "is_active": true
}
```

---

# 29. Word Selection

Sistem memilih kata secara otomatis.

Kriteria:

- `is_active = true`.
- Sesuai difficulty.
- Tidak sedang digunakan.
- Tidak terlalu sering muncul.
- Dapat dipilih secara random.

V1 tidak perlu algoritma AI.

---

# 30. Anti-Repetition

Sistem sebaiknya mencegah kata yang sama muncul berulang terlalu dekat.

Contoh:

```text
KELAS
↓
RUMAH
↓
BUKU
↓
KELAS
```

Boleh muncul kembali setelah sejumlah puzzle, tetapi tidak langsung berturut-turut.

---

# 31. Comment Processing Engine

Alur:

```text
TikTok Comment Event
        ↓
Receive
        ↓
Normalize
        ↓
Validate
        ↓
Check active puzzle
        ↓
Compare with target
        ↓
Update revealed letters
        ↓
Check full answer
        ↓
Award winner if applicable
        ↓
Broadcast state
```

---

# 32. Game State

Contoh state:

```json
{
  "sessionId": "session-001",
  "puzzleId": "puzzle-027",
  "word": "KELAS",
  "category": "Pendidikan",
  "difficulty": "easy",
  "revealedLength": 3,
  "display": "KEL__",
  "status": "ACTIVE",
  "winner": null
}
```

Saat menang:

```json
{
  "status": "SOLVED",
  "winner": {
    "userId": "123",
    "username": "andi"
  }
}
```

---

# 33. Real-Time Architecture

Arsitektur konseptual:

```text
             TikTok LIVE
                  │
          Comment / Gift Events
                  │
                  ▼
        ┌────────────────────┐
        │ TikTok Event Layer │
        └──────────┬─────────┘
                   │
                   ▼
        ┌────────────────────┐
        │   Game Engine      │
        │                    │
        │ Prefix Matching    │
        │ Scoring            │
        │ Winner Detection   │
        │ Hint               │
        │ Gift               │
        │ Boss               │
        └──────────┬─────────┘
                   │
             Game State
                   │
          ┌────────┴────────┐
          ▼                 ▼
     Host Dashboard      OBS Overlay
          │                 │
          └────────┬────────┘
                   ▼
               TikTok LIVE
```

---

# 34. Real-Time State Distribution

Perubahan state harus dikirim ke:

- Host Dashboard.
- OBS Overlay.

Contoh event:

```text
LETTER_REVEALED
```

Payload:

```json
{
  "position": 2,
  "letter": "L"
}
```

Event:

```text
PLAYER_WON
```

Payload:

```json
{
  "username": "andi",
  "points": 10
}
```

Event:

```text
NEW_PUZZLE
```

Payload:

```json
{
  "category": "Makanan",
  "difficulty": "medium",
  "display": "_____"
}
```

---

# 35. Database Structure

Struktur awal yang direkomendasikan:

```text
users
categories
words
live_sessions
session_players
puzzles
puzzle_guesses
gift_configs
game_events
```

## users

Menyimpan identitas pemain.

## categories

Daftar kategori.

## words

Database kata.

## live_sessions

Satu record untuk setiap LIVE.

## session_players

Pemain yang berpartisipasi dalam LIVE.

## puzzles

Puzzle yang dimainkan dalam session.

## puzzle_guesses

Riwayat tebakan.

## gift_configs

Mapping gift → game effect.

## game_events

Log event penting.

---

# 36. Session Player

Contoh:

```text
session_players

id
session_id
platform_user_id
username
points
wins
guesses
created_at
updated_at
```

Leaderboard dapat dibuat dari:

```text
ORDER BY points DESC
```

---

# 37. Puzzle Record

Contoh:

```text
puzzles

id
session_id
word_id
difficulty
display_state
status
winner_player_id
started_at
solved_at
```

---

# 38. Guess Record

Contoh:

```text
puzzle_guesses

id
puzzle_id
player_id
raw_comment
normalized_guess
matched_length
is_full_match
is_winner
created_at
```

Ini berguna untuk analytics.

---

# 39. Game Event Log

Event contoh:

```text
SESSION_STARTED
PUZZLE_STARTED
GUESS_RECEIVED
LETTER_REVEALED
PLAYER_WON
HINT_USED
GIFT_RECEIVED
PUZZLE_SKIPPED
BOSS_STARTED
BOSS_DEFEATED
SESSION_ENDED
```

---

# 40. Analytics

Setelah LIVE selesai, sistem dapat menyimpan:

```text
Total players
Total comments processed
Total valid guesses
Total puzzles solved
Total puzzles skipped
Total boss puzzles
Total winners
Average guesses per puzzle
Most active players
Top players
```

Contoh:

```text
LIVE SUMMARY

Players              1,284
Comments             8,492
Valid Guesses        3,214
Words Solved            87
Words Skipped             4
Bosses Defeated           6

Top Player
ANDI — 145 POINT
```

Analytics detail dapat dikembangkan setelah V1.

---

# 41. Achievement — Status

Achievement **belum dikunci dalam V1**.

Sistem achievement perlu dibahas terpisah sebelum implementasi.

Potensi achievement:

```text
FIRST WIN
First successful answer.

WORD HUNTER
Win 10 puzzles.

PERFECT GUESS
Win without requiring revealed letters.

BOSS SLAYER
Defeat a Boss.

STREAK MASTER
Win several puzzles consecutively.
```

Namun aturan final, persistence, dan reset achievement belum ditentukan.

---

# 42. Moderation & Anti-Spam

Karena komentar TikTok dapat sangat ramai, engine harus memiliki proteksi.

Minimal:

- Ignore empty comments.
- Ignore unsupported content.
- Normalize duplicate variations.
- Deduplicate repeated event.
- Prevent duplicate winner.
- Ignore guesses after puzzle solved.
- Rate limit internal processing.
- Handle event ordering.
- Handle reconnect.
- Handle duplicate event delivery.

---

# 43. Concurrency & Race Condition

Kasus penting:

```text
Andi → KELAS
Budi → KELAS
```

Hampir bersamaan.

Server harus memastikan hanya satu yang menjadi winner.

Implementasi harus menggunakan atomic transaction / locking / conditional update.

Contoh konsep:

```text
UPDATE puzzle
SET winner = Andi,
    status = SOLVED
WHERE id = X
AND status = ACTIVE
AND winner IS NULL
```

Hanya request pertama yang berhasil menjadi winner.

---

# 44. Error Handling

Jika koneksi TikTok terputus:

```text
TikTok Connection Lost
```

Game tidak boleh langsung menghapus session.

Jika reconnect berhasil:

```text
Connection Restored
```

Game melanjutkan state terakhir.

Jika database error:

- Jangan memberikan poin dua kali.
- Jangan membuat dua puzzle sekaligus.
- Gunakan transaction/idempotency untuk event penting.

---

# 45. Session Lifecycle

```text
CREATED
   ↓
LIVE
   ↓
PAUSED
   ↓
LIVE
   ↓
ENDED
```

State session:

```text
CREATED
ACTIVE
PAUSED
ENDED
```

---

# 46. Functional Requirements

## FR-001

Sistem harus dapat membuat Live Session.

## FR-002

Sistem harus memilih kata secara otomatis.

## FR-003

Sistem harus menampilkan kategori.

## FR-004

Sistem harus menyembunyikan huruf yang belum terbuka.

## FR-005

Sistem harus melakukan prefix matching.

## FR-006

Sistem harus membuka huruf yang cocok secara berurutan dari awal.

## FR-007

Sistem tidak boleh membuka huruf setelah mismatch.

## FR-008

Sistem harus mendeteksi jawaban lengkap.

## FR-009

Sistem harus memberikan poin hanya kepada first correct answer.

## FR-010

Sistem harus membuat leaderboard session.

## FR-011

Leaderboard harus reset pada LIVE berikutnya.

## FR-012

Sistem harus menyediakan hint untuk membuka satu huruf.

## FR-013

Sistem harus dapat memproses gift yang dikonfigurasi.

## FR-014

Gift yang valid dapat membuka satu huruf.

## FR-015

Sistem harus mendukung difficulty.

## FR-016

Sistem harus mendukung Boss Puzzle.

## FR-017

Sistem harus memiliki Host Dashboard.

## FR-018

Sistem harus memiliki OBS Overlay.

## FR-019

Sistem harus menyinkronkan state secara real-time.

## FR-020

Sistem harus mencatat event gameplay penting.

---

# 47. Non-Functional Requirements

## Performance

Target:

- UI update terasa real-time.
- Event processing latency serendah mungkin.
- Tidak ada blocking request untuk setiap komentar.

## Reliability

- Tidak boleh ada double winner.
- Tidak boleh ada double scoring.
- Session harus dapat recover dari reconnect.

## Scalability

Arsitektur harus memungkinkan satu LIVE dengan ribuan komentar.

## Security

- Secret/API credentials tidak boleh dikirim ke frontend.
- Host controls harus dilindungi authentication.
- User tidak dapat memanipulasi poin dari client.
- Game state authoritative berada di server.

---

# 48. Recommended Technology Architecture

Teknologi final dapat diputuskan saat technical design.

Rekomendasi:

### Frontend

```text
Next.js
React
TypeScript
Tailwind CSS
```

### Backend

Dapat menggunakan:

```text
Node.js / TypeScript
```

atau backend server yang kompatibel dengan arsitektur real-time.

### Database

Rekomendasi:

```text
PostgreSQL
```

### Real-Time

Pilihan:

```text
WebSocket
```

atau layanan realtime yang sesuai.

### Overlay

```text
Browser Source
```

di OBS.

---

# 49. Security Architecture

API key dan credential TikTok:

```text
Server only
```

Tidak boleh:

```text
Browser
OBS Overlay
Client JavaScript
```

Host API:

```text
Authenticated
```

Game engine:

```text
Server authoritative
```

Client hanya menerima state.

---

# 50. MVP Scope

MVP wajib memiliki:

### Gameplay

- [x] Prefix matching.
- [x] Partial guess.
- [x] Full answer.
- [x] First winner.
- [x] Scoring.
- [x] Difficulty.
- [x] Category.
- [x] Hint.
- [x] Boss.
- [x] No timer.
- [x] No rounds.

### LIVE

- [x] Comment ingestion.
- [x] Gift event handling.
- [x] Real-time state.
- [x] OBS overlay.
- [x] Host dashboard.

### Data

- [x] Word database.
- [x] Categories.
- [x] Live session.
- [x] Players.
- [x] Scores.
- [x] Guess history.
- [x] Game event log.

### Deferred

- [ ] Achievement.
- [ ] Permanent player profile progression.
- [ ] Team mode.
- [ ] Timer.
- [ ] Advanced gift powers.
- [ ] Multiple game modes.

---

# 51. Contoh End-to-End

Target:

```text
KOMPUTER
```

Overlay:

```text
💻 TEKNOLOGI

_ _ _ _ _ _ _ _
```

Komentar:

```text
ANDI: KOTAK
```

Hasil:

```text
K _ _ _ _ _ _ _
```

Komentar:

```text
BUDI: KEMAS
```

Hasil:

```text
K E _ _ _ _ _ _
```

Komentar:

```text
SITI: KELUARGA
```

Hasil:

```text
K E _ _ _ _ _ _
```

Komentar:

```text
ANDI: KOMPUTER
```

Hasil:

```text
K O M P U T E R
```

Winner:

```text
🎉 ANDI WON!

+10 POINT
```

Leaderboard:

```text
🥇 ANDI  10
🥈 BUDI   0
🥉 SITI   0
```

Kemudian otomatis:

```text
NEW WORD
```

---

# 52. Acceptance Criteria — Core Mechanic

Sistem dianggap berhasil jika:

### Scenario A

Target:

```text
KELAS
```

Guess:

```text
KOTAK
```

Expected:

```text
K _ _ _ _
```

### Scenario B

Target:

```text
KELAS
```

Guess:

```text
KEMAS
```

Expected:

```text
K E _ _ _
```

### Scenario C

Target:

```text
KELAS
```

Guess:

```text
KELAM
```

Expected:

```text
K E L A _
```

### Scenario D

Target:

```text
KELAS
```

Guess:

```text
KELAS
```

Expected:

```text
K E L A S
```

Winner mendapat poin.

### Scenario E

Dua pemain mengirim jawaban benar hampir bersamaan.

Expected:

```text
Hanya satu winner.
```

### Scenario F

Gift event terjadi.

Expected:

```text
Next hidden letter terbuka satu posisi.
```

### Scenario G

LIVE berakhir.

Expected:

```text
Session leaderboard selesai.
```

LIVE berikutnya:

```text
Leaderboard kembali kosong.
```

---

# 53. Future Roadmap

## V1

Core game.

## V1.5

- Achievement.
- Player statistics.
- Better analytics.
- More gift events.
- Custom themes.
- Better moderation.

## V2

Multiple games:

```text
Tebak Kata
Tebak Emoji
Tebak Lagu
Tebak Film
Trivia
Speed Challenge
```

## V3

Potential platform expansion:

```text
YouTube LIVE
Twitch
Other live platforms
```

Dengan game engine yang sama dan adapter berbeda untuk sumber event.

---

# 54. Product Principle

Prinsip utama produk:

> **Simple to understand, exciting to watch, easy to participate.**

Penonton harus bisa memahami game hanya dengan melihat overlay selama beberapa detik.

Core loop:

```text
LIHAT KATEGORI
      ↓
LIHAT HURUF
      ↓
TEBAK DI KOMENTAR
      ↓
HURUF TERBUKA
      ↓
TEBAK LAGI
      ↓
TEMUKAN KATA
      ↓
DAPAT POIN
      ↓
KATA BARU
      ↓
ULANGI
```

---

# 55. Final Locked Rules V1

| Fitur | Keputusan |
|---|---|
| Tebak huruf/kata melalui komentar | ✅ |
| Prefix matching | ✅ |
| Huruf terbuka dari kiri ke kanan | ✅ |
| Mismatch menghentikan reveal | ✅ |
| Tebakan parsial mendapat poin | ❌ |
| Full correct answer mendapat poin | ✅ |
| First correct answer mendapat poin | ✅ |
| Timer | ❌ |
| Ronde | ❌ |
| Kategori | ✅ |
| Petunjuk/deskripsi | ❌ |
| Hint | Buka 1 huruf |
| Difficulty | ✅ |
| Boss | ✅ |
| Team mode | ❌ |
| Leaderboard | ✅ |
| Leaderboard reset setiap LIVE | ✅ |
| Gift | Buka 1 huruf |
| Achievement | Belum ditentukan |
| OBS Overlay | ✅ |
| Host Dashboard | ✅ |
| Real-time gameplay | ✅ |

---

## Status Dokumen

**Core gameplay rules:** LOCKED  
**Scoring:** LOCKED secara konsep  
**Timer:** REMOVED  
**Round system:** REMOVED  
**Team mode:** REMOVED  
**Gift:** V1 menggunakan reveal-next-letter  
**Achievement:** DEFERRED  
**Technical stack:** TBC / Technical Design Phase
