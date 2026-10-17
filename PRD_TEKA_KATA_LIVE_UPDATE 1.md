# PRD — TEKA KATA LIVE

**Version:** 1.0.0  
**Status:** Ready for Development  
**Product:** TikTok LIVE Interactive Game Platform  
**Module:** Teka Kata  
**Platform:** Web — Host Dashboard + TikTok LIVE Overlay  
**Primary Input:** TikTok LIVE Comments  
**Secondary Input:** TikTok LIVE Gifts  

---

## 1. Product Overview

**Teka Kata LIVE** adalah mode permainan baru di dalam platform game interaktif TikTok LIVE yang sudah memiliki game **Tebak Kata**.

Teka Kata bukan aplikasi terpisah. Fitur ini dibuat sebagai **Game Module** yang menggunakan infrastruktur bersama:

- LIVE Session
- TikTok Comments
- TikTok Gifts
- Players
- Score
- Leaderboard
- Realtime
- Host Dashboard
- TikTok LIVE Overlay

Pada mode Teka Kata, penonton melihat kumpulan huruf dan puzzle kata berbentuk crossword/grid. Penonton mencari kata yang dapat dibentuk dari huruf yang tersedia, lalu mengirimkan kata tersebut melalui komentar TikTok LIVE.

Server memvalidasi jawaban. Penonton pertama yang berhasil menemukan kata mendapatkan poin dan kata tersebut ditempatkan ke puzzle.

Permainan berlangsung secara terus-menerus tanpa ronde dan tanpa timer wajib.

---

## 2. Vision

Membuat game kata yang:

1. Mudah dipahami penonton.
2. Tidak membutuhkan keyboard khusus.
3. Cukup dimainkan melalui komentar TikTok.
4. Bisa dimainkan banyak penonton secara bersamaan.
5. Memiliki kompetisi realtime.
6. Memiliki variasi puzzle tinggi.
7. Terintegrasi dengan leaderboard LIVE.
8. Bisa menjadi salah satu dari banyak game dalam satu LIVE.

---

## 3. Problem Statement

Game quiz biasa sering membutuhkan pertanyaan panjang, jawaban panjang, input khusus, persiapan manual, dan konten yang cepat terasa repetitif.

Teka Kata menyederhanakan gameplay menjadi:

> **Lihat huruf → cari kata → kirim komentar → validasi → dapat poin → lanjut mencari.**

---

## 4. Goals

### G1 — Easy Gameplay
Penonton dapat memahami cara bermain dalam beberapa detik.

### G2 — Simple Input
Jawaban cukup dikirim melalui komentar TikTok LIVE.

### G3 — Realtime Competition
Penonton berlomba menemukan kata sebelum penonton lain.

### G4 — Automatic Puzzle
Puzzle dapat dibuat otomatis berdasarkan Word Bank.

### G5 — Multi-Game Platform
Teka Kata dapat dipilih melalui Game Selector yang sama dengan game lain.

### G6 — Reusable Infrastructure
Leaderboard, komentar, gifts, player, realtime, dan LIVE Session tetap menggunakan sistem bersama.

---

## 5. Non-Goals

Versi MVP tidak mencakup:

- Team mode.
- Private room.
- Multiplayer room terpisah.
- Sistem ronde.
- Timer wajib.
- Achievement.
- Inventory.
- Marketplace.
- Player chat.
- Virtual keyboard.
- Input huruf satu per satu.
- Touch interaction pada puzzle untuk viewer.

---

## 6. Target Users

### Host

Host dapat:

- Memilih game.
- Mengatur difficulty.
- Memilih kategori.
- Mengatur jumlah kata.
- Generate puzzle.
- Memulai puzzle.
- Pause/resume.
- Reveal letter.
- Reveal word.
- Skip puzzle.
- Melihat jawaban penonton.
- Melihat leaderboard.
- Mengganti game.

### Viewer / Player

Viewer dapat:

- Melihat puzzle.
- Melihat huruf tersedia.
- Mencari kata.
- Mengirim jawaban melalui komentar.
- Mendapat poin jika menjadi penemu pertama.
- Melihat leaderboard.

### Admin

Admin dapat:

- Mengelola Word Bank.
- Mengelola kategori.
- Mengelola difficulty.
- Mengaktifkan/nonaktifkan kata.
- Blacklist kata.
- Import kata.
- Melihat history puzzle.
- Mengatur konfigurasi game.

---

## 7. Core Gameplay

```text
Host memilih Teka Kata
        ↓
Pilih konfigurasi
        ↓
Generate Puzzle
        ↓
Validasi Puzzle
        ↓
Start Puzzle
        ↓
Puzzle tampil di Overlay
        ↓
Viewer mencari kata
        ↓
Viewer mengirim komentar
        ↓
Server menerima komentar
        ↓
Normalisasi jawaban
        ↓
Validasi jawaban
        ↓
Atomic Claim
        ↓
Jika berhasil → dapat poin
        ↓
Kata ditempatkan pada puzzle
        ↓
Leaderboard diperbarui
        ↓
Jika semua kata ditemukan
        ↓
Puzzle Complete
        ↓
Generate Puzzle berikutnya
```

---

## 8. Contoh Gameplay

Letter Pool:

```text
B A N D A R
```

Target words:

```text
BANDAR
BADAN
DANA
DARA
NADA
```

Viewer:

```text
@andi: BANDAR
```

Server memvalidasi:

- Apakah kata valid?
- Apakah kata termasuk puzzle?
- Apakah kata belum ditemukan?
- Apakah player valid?

Jika valid:

```text
WORD_FOUND
PLAYER_SCORED
LEADERBOARD_UPDATED
```

Hasil:

```text
@ANDI
BANDAR
+50 POINT
```

---

## 9. Letter Pool

Letter Pool adalah kumpulan huruf yang digunakan untuk membentuk kata target.

Aturan:

- Huruf dapat berulang.
- Jumlah penggunaan huruf tidak boleh melebihi jumlah yang tersedia.
- Semua target word harus dapat dibentuk dari Letter Pool.
- Letter Pool harus konsisten dengan puzzle.

Contoh `BANANA` membutuhkan:

```text
A = 3
N = 2
B = 1
```

Jika Letter Pool hanya memiliki A=2, maka BANANA tidak valid.

---

## 10. Word Bank

Word Bank adalah sumber kata yang dapat digunakan generator.

| Field | Type | Description |
|---|---|---|
| id | UUID | ID |
| word | string | Kata |
| normalized_word | string | Bentuk normalisasi |
| category_id | UUID | Kategori |
| difficulty | enum | Easy/Medium/Hard/Boss |
| minimum_length | integer | Panjang minimum |
| maximum_length | integer | Panjang maksimum |
| is_allowed | boolean | Boleh digunakan |
| is_active | boolean | Status aktif |
| created_at | datetime | Waktu dibuat |
| updated_at | datetime | Waktu diperbarui |

---

## 11. Word Categories

Default:

- Umum
- Hewan
- Buah
- Makanan
- Profesi
- Benda
- Tempat
- Transportasi
- Teknologi
- Alam
- Olahraga

Category harus extensible sehingga Admin dapat menambahkan kategori baru.

---

## 12. Word Rules

Default:

- Minimum length: 3.
- Maximum length: 12.
- Kata 2 huruf tidak digunakan pada MVP.
- Tidak boleh duplicate.
- Tidak boleh blacklist.
- Harus aktif.
- Harus sesuai kategori.
- Harus sesuai difficulty.

---

## 13. Word Normalization

Sebelum validasi:

1. Trim whitespace.
2. Convert uppercase.
3. Normalize Unicode.
4. Menghapus punctuation yang tidak diperlukan.
5. Normalize whitespace.
6. Membandingkan berdasarkan `normalized_word`.

Contoh:

```text
" bandar "
```

menjadi:

```text
BANDAR
```

---

## 14. Difficulty

### Easy

- 3–6 huruf.
- Kata umum.
- 4–6 target words.
- Grid sederhana.

### Medium

- 4–8 huruf.
- 6–10 target words.
- Intersections lebih banyak.

### Hard

- 5–12 huruf.
- 8–15 target words.
- Grid lebih kompleks.

### Boss

- 6–12+ huruf.
- 10+ target words.
- Grid besar.
- Score lebih tinggi.
- Visual khusus.

---

## 15. Puzzle Generator

Input:

```text
category
difficulty
word_count
min_word_length
max_word_length
```

Output:

```text
letters
grid
grid_rows
grid_columns
words
positions
directions
```

Contoh:

```json
{
  "letters": ["B", "A", "N", "D", "A", "R"],
  "grid_rows": 7,
  "grid_columns": 7,
  "words": [
    {
      "word": "BANDAR",
      "row": 2,
      "column": 1,
      "direction": "horizontal"
    }
  ]
}
```

---

## 16. Puzzle Generation Pipeline

```text
Generate
  ↓
Structural Validation
  ↓
Word Validation
  ↓
Grid Validation
  ↓
Letter Pool Validation
  ↓
Duplicate Validation
  ↓
Difficulty Validation
  ↓
READY
```

Jika gagal, retry. Contoh maksimum: **10 attempts**.

Jika tetap gagal:

```text
Puzzle tidak dapat dibuat.
Coba kurangi difficulty, word count, atau ganti kategori.
```

---

## 17. Crossword/Grid Rules

Setiap target word memiliki:

- Word.
- Row.
- Column.
- Direction.

Direction:

```text
horizontal
vertical
```

Generator harus memastikan:

- Tidak ada collision dengan huruf berbeda.
- Intersection memiliki huruf sama.
- Semua word berada di dalam grid.
- Tidak ada duplicate target.
- Grid tidak terlalu besar.
- Puzzle tetap mudah dibaca di Overlay.

---

## 18. Puzzle Validation

Puzzle hanya dapat menjadi `READY` jika:

- Semua word valid.
- Semua word aktif.
- Semua word sesuai category.
- Semua word sesuai difficulty.
- Semua word dapat dibentuk dari Letter Pool.
- Tidak ada duplicate.
- Semua posisi valid.
- Semua intersection valid.
- Grid valid.
- Jumlah word sesuai konfigurasi.

---

## 19. Puzzle State

State:

```text
DRAFT
READY
ACTIVE
COMPLETING
COMPLETED
SKIPPED
```

Flow:

```text
DRAFT
 ↓
READY
 ↓
ACTIVE
 ↓
COMPLETING
 ↓
COMPLETED
```

Host dapat melakukan pause/resume.

---

## 20. Continuous Gameplay

Tidak menggunakan ronde.

```text
LIVE
 ↓
Puzzle #001
 ↓
Puzzle #002
 ↓
Puzzle #003
 ↓
Puzzle #004
 ↓
...
```

---

## 21. Puzzle Completion

Puzzle selesai jika:

```text
found_words == total_words
```

atau Host memilih skip/complete.

Saat selesai:

```text
🎉 PUZZLE COMPLETE

5 / 5 WORDS FOUND
```

### Auto Next ON

```text
Generate
→ Validate
→ Ready
→ Start
```

### Auto Next OFF

```text
Puzzle Complete
→ Wait Host
```

---

## 22. Answer Validation

Saat comment masuk:

```text
@andi: BANDAR
```

Server:

1. Normalize.
2. Check player.
3. Check active game session.
4. Check active puzzle.
5. Check Word Bank.
6. Check puzzle word.
7. Check found state.
8. Atomic claim.
9. Award score.
10. Broadcast realtime event.

---

## 23. First Correct Rule

Hanya player pertama yang berhasil melakukan claim yang mendapatkan poin.

Contoh:

```text
@andi → BANDAR
@budi → BANDAR
```

Jika Andi berhasil lebih dulu:

```text
ANDI +50
BUDI +0
```

Budi menerima:

```text
Already Found
```

---

## 24. Race Condition

Validasi first-correct harus dilakukan di server.

Tidak boleh menentukan winner berdasarkan timestamp client atau urutan animasi client.

Gunakan:

- Database transaction.
- Atomic update.
- Unique constraint.
- Server-side source of truth.

Contoh:

```sql
UPDATE teka_kata_puzzle_words
SET
  is_found = true,
  found_by_player_id = :player_id,
  found_at = NOW()
WHERE
  id = :puzzle_word_id
  AND is_found = false;
```

Affected rows = 1 berarti claim berhasil.

---

## 25. Scoring

Default:

| Word Length | Points |
|---|---:|
| 3 | 10 |
| 4 | 20 |
| 5 | 30 |
| 6 | 50 |
| 7+ | 100 |

Boss:

| Word Length | Points |
|---|---:|
| 3 | 20 |
| 4 | 40 |
| 5 | 60 |
| 6 | 100 |
| 7+ | 200 |

Score hanya diberikan jika:

```text
Valid Word
AND
Belongs To Active Puzzle
AND
Not Found
AND
First Claim
```

---

## 26. Invalid Answer

Jika komentar tidak termasuk puzzle:

```text
INVALID
```

Tidak mendapat poin.

Invalid comment tidak boleh menghasilkan event besar di Overlay agar tidak membuat spam visual.

---

## 27. Already Found

Jika kata sudah ditemukan:

```text
ALREADY FOUND
```

Tidak ada score tambahan.

---

## 28. Shared Leaderboard

Leaderboard adalah infrastructure bersama platform.

Leaderboard:

- Tidak reset ketika ganti game.
- Reset ketika LIVE baru dimulai.
- Digunakan oleh semua game.

Contoh:

```text
1. ANDI     850
2. BUDI     720
3. SITI     640
```

Saat Host mengganti game, score tetap.

---

## 29. Game Session

Satu LIVE dapat memiliki beberapa Game Session.

```text
LIVE SESSION
│
├── Game Session #1
│   └── TEBAK KATA
│
├── Game Session #2
│   └── TEKA KATA
│
└── Game Session #3
    └── TEBAK KATA
```

---

## 30. Switching Game

```text
Current Game
      ↓
Stop Current Game
      ↓
Save State
      ↓
Create New Game Session
      ↓
Activate New Game
      ↓
Update Overlay
```

Leaderboard tidak direset.

Jika puzzle aktif, tampilkan confirmation:

```text
Ganti Game?

Puzzle saat ini masih berjalan.
Progress puzzle akan dihentikan.

[Batal]   [Ganti Game]
```

---

## 31. Game Selector

```text
LIVE
Current Game: Teka Kata ▼
```

Options:

```text
🎯 Tebak Kata
🧩 Teka Kata
```

Future:

```text
🔍 Cari Kesalahan
❓ Benar / Salah
🧠 Puzzle
```

---

## 32. Host Dashboard

Kontrol utama:

```text
Difficulty   [Easy ▼]
Category     [Umum ▼]
Word Count   [5]
Min Length   [3]
Max Length   [8]

Auto Next    [ON]
Gift Reveal  [ON]

[Generate Puzzle]
```

Saat aktif:

```text
[Pause]
[Resume]
[Reveal Letter]
[Reveal Word]
[Skip Puzzle]
[Generate Next]
```

---

## 33. Puzzle Preview

Preview menampilkan:

- Grid.
- Letter Pool.
- Total words.
- Difficulty.
- Category.
- Grid size.

Actions:

```text
Regenerate
Start Puzzle
```

---

## 34. Answer Monitor

```text
WORD STATUS

✓ BANDAR
  Found by @andi
  +50

✓ BADAN
  Found by @siti
  +30

○ DANA
  Not Found

○ DARA
  Not Found
```

---

## 35. Live Chat Monitor

```text
@andi      BANDAR       ✓ +50
@budi      KUCING       Invalid
@siti      BADAN        ✓ +30
@doni      BANDAR       Already Found
```

Status:

```text
Correct
Invalid
Already Found
```

---

## 36. TikTok Overlay

Resolution:

```text
1080 × 1920
9:16
```

Safe area:

```text
Horizontal: 72px
Vertical: 96px
```

Struktur:

```text
TEKA KATA

PUZZLE

[ CROSSWORD GRID ]

HURUF TERSEDIA

A B A N D R

💬 Tulis kata di komentar!

Winner Event

Leaderboard

LIVE
```

---

## 37. Overlay Grid

Cell state:

```text
EMPTY
FILLED
REVEALED
HIGHLIGHTED
```

Empty:

```text
□
```

Filled/revealed:

```text
A
```

Highlighted menggunakan animasi singkat.

---

## 38. Overlay Typography

Game display:

```text
Bebas Neue
```

UI:

```text
Inter
```

Puzzle harus sangat mudah dibaca pada mobile.

---

## 39. Overlay Animation

Flow:

```text
Comment
 ↓
Validation
 ↓
Grid Highlight
 ↓
Word Fill
 ↓
Score Animation
 ↓
Leaderboard Update
```

Target duration:

```text
250–500ms
```

Letter reveal:

```text
scale: .75 → 1
opacity: 0 → 1
duration: ~300ms
```

Winner:

```text
🏆 @ANDI

BANDAR

+50 POINT
```

Gunakan scale, glow, opacity, highlight, dan short burst particles.

---

## 40. Puzzle Complete Animation

```text
🎉 PUZZLE COMPLETE

WORDS FOUND
5 / 5

NEXT PUZZLE...
```

Kemudian transisi ke puzzle baru.

---

## 41. Boss Puzzle Visual

Boss mode dapat menggunakan:

- Crown.
- Glow.
- Stronger particle effect.
- Larger grid.
- Higher score.
- Special header.

Contoh:

```text
👑 BOSS PUZZLE
```

---

## 42. Gift Integration

Gift adalah capability bersama platform.

Pada Teka Kata:

```text
Eligible Gift
      ↓
Reveal Letter
```

Default:

```text
1 Gift = 1 Letter Reveal
```

Gift tidak memberikan score langsung.

Host dapat mengaktifkan/nonaktifkan:

```text
Gift Reveal [ON/OFF]
```

---

## 43. Reveal Letter

Host dapat memilih:

```text
Reveal Letter
```

Sistem memilih hidden cell/letter yang belum terbuka.

Event:

```text
LETTER_REVEALED
```

Overlay menampilkan animasi reveal.

---

## 44. Reveal Word

Host dapat:

```text
Reveal Word
```

Word langsung dibuka pada puzzle.

Word yang direveal:

- Tidak memberikan score kepada viewer.
- Ditandai sebagai revealed.
- Tidak dapat diklaim player.

---

## 45. Pre-Generated Puzzle Queue

Untuk mengurangi jeda, sistem dapat menyiapkan:

```text
Current Puzzle
Next Puzzle
Next + 1 Puzzle
```

Queue hanya berisi puzzle yang sudah generated dan validated.

---

## 46. Database Architecture

Shared tables:

```text
game_types
live_sessions
game_sessions
players
comments
gifts
player_scores
leaderboards
```

Teka Kata tables:

```text
teka_kata_words
teka_kata_categories
teka_kata_puzzles
teka_kata_puzzle_words
teka_kata_found_words
```

---

## 47. Table: game_types

```text
id
code
name
description
icon
is_active
created_at
updated_at
```

Contoh:

```text
TEBAK_KATA
TEKA_KATA
```

---

## 48. Table: teka_kata_categories

```text
id
name
description
is_active
created_at
updated_at
```

---

## 49. Table: teka_kata_words

```text
id
word
normalized_word
category_id
difficulty
minimum_length
maximum_length
is_allowed
is_active
created_at
updated_at
```

---

## 50. Table: teka_kata_puzzles

```text
id
game_session_id
difficulty
category_id
letters
grid_rows
grid_columns
status
total_words
found_words
created_at
started_at
completed_at
```

---

## 51. Table: teka_kata_puzzle_words

```text
id
puzzle_id
word_id
word
row
column
direction
points
is_found
found_by_player_id
found_at
```

---

## 52. Table: teka_kata_found_words

```text
id
puzzle_id
puzzle_word_id
player_id
comment_id
points
created_at
```

---

## 53. Relationships

```text
live_sessions
      │
      ▼
game_sessions
      │
      ▼
teka_kata_puzzles
      │
      ├── teka_kata_puzzle_words
      │          │
      │          ▼
      │     teka_kata_words
      │
      └── teka_kata_found_words
                 │
                 ▼
              players
```

---

## 54. Game Adapter Architecture

```ts
interface GameAdapter {
  initialize(): Promise<void>;
  start(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  handleComment(comment: Comment): Promise<void>;
  handleGift(gift: Gift): Promise<void>;
  getState(): Promise<GameState>;
  getConfig(): GameConfig;
}
```

---

## 55. TekaKataGame

TekaKataGame menyediakan:

```ts
generatePuzzle()
validatePuzzle()
validateWord()
claimWord()
revealLetter()
revealWord()
completePuzzle()
generateNextPuzzle()
```

---

## 56. Suggested Project Structure

```text
src/
├── games/
│   ├── registry/
│   ├── tebak-kata/
│   │   ├── game.ts
│   │   ├── rules.ts
│   │   ├── validator.ts
│   │   └── components/
│   │
│   └── teka-kata/
│       ├── game.ts
│       ├── rules.ts
│       ├── generator.ts
│       ├── validator.ts
│       ├── scorer.ts
│       └── components/
│
├── live/
│   ├── session/
│   ├── comments/
│   ├── gifts/
│   ├── players/
│   └── leaderboard/
│
└── components/
    ├── host/
    ├── overlay/
    └── shared/
```

---

## 57. Game Registry

```ts
const games = {
  TEBAK_KATA: TebakKataGame,
  TEKA_KATA: TekaKataGame,
};
```

Host memilih game berdasarkan registry.

---

## 58. Game Configuration

```json
{
  "difficulty": "easy",
  "category": "umum",
  "wordCount": 5,
  "minWordLength": 3,
  "maxWordLength": 8,
  "autoGenerateNext": true,
  "allowGiftReveal": true
}
```

---

## 59. Realtime Architecture

```text
TikTok
   ↓
Comment Listener
   ↓
Backend
   ↓
Active Game Session
   ↓
TekaKataGame
   ↓
Database Transaction
   ↓
Realtime Event
   ↓
Host Dashboard
   +
TikTok Overlay
```

---

## 60. Realtime Events

```text
GAME_STARTED
PUZZLE_READY
PUZZLE_STARTED
WORD_FOUND
PLAYER_SCORED
LETTER_REVEALED
WORD_REVEALED
PUZZLE_COMPLETED
PUZZLE_SKIPPED
LEADERBOARD_UPDATED
GAME_CHANGED
```

---

## 61. WORD_FOUND Payload

```json
{
  "type": "WORD_FOUND",
  "puzzleId": "puzzle_001",
  "word": "BANDAR",
  "player": {
    "id": "player_001",
    "username": "@andi"
  },
  "points": 50
}
```

---

## 62. Security

Server adalah source of truth.

Client tidak boleh menentukan:

- Score.
- Winner.
- Puzzle state.
- Valid word.
- Reveal.
- Completion.

Client hanya menerima state/event.

---

## 63. Target Word Protection

Viewer tidak boleh menerima full target word list sebelum ditemukan.

Overlay viewer hanya menerima:

- Grid.
- Letter Pool.
- Found state.
- Revealed state.

Target word list tetap berada di server untuk mencegah scraping jawaban.

---

## 64. Anti-Cheat

Proteksi:

- Server-side validation.
- Atomic claim.
- Unique constraint.
- Comment deduplication.
- Rate limiting.
- Client score manipulation prevention.
- Target word list protection.

---

## 65. Rate Limit

Contoh awal:

```text
Maximum 5 candidate words / second / user
```

Nilai final dituning berdasarkan load test dan perilaku spam.

---

## 66. Comment Deduplication

Comment yang sama tidak boleh diproses dua kali untuk claim.

Gunakan:

```text
TikTok comment ID
```

sebagai idempotency key jika tersedia.

---

## 67. Performance Target

```text
Comment → Validation
< 500ms
```

```text
Valid Word → Overlay
< 1s
```

```text
Leaderboard
Near realtime
```

```text
Puzzle Generation
Target < 2s
```

---

## 68. Empty Word Bank

Jika Word Bank kosong:

```text
Tidak ada kata yang tersedia.

Tambahkan kata ke Word Bank terlebih dahulu.
```

CTA:

```text
Manage Word Bank
```

---

## 69. Generator Error

```text
Puzzle tidak dapat dibuat.

Coba:
• Kurangi difficulty
• Kurangi jumlah kata
• Ganti kategori
• Generate ulang
```

---

## 70. No Valid Word Found

Tidak ada auto-timeout.

Jika tidak ada viewer yang menemukan kata:

```text
Reveal Letter
Reveal Word
Skip Puzzle
```

---

## 71. Accessibility

Host Dashboard:

- Keyboard navigation.
- Focus state.
- High contrast.
- Large interactive controls.
- Status tidak hanya menggunakan warna.

Overlay:

- Font besar.
- Kontras tinggi.
- Status mudah dipahami tanpa bergantung pada warna.

---

## 72. Internationalization

MVP:

```text
Bahasa Indonesia
```

Database menggunakan UTF-8.

Arsitektur harus memungkinkan bahasa lain di masa depan.

---

## 73. Admin Settings

Admin dapat mengatur:

```text
Default Difficulty
Default Category
Default Word Count
Default Scoring
Min Word Length
Max Word Length
Gift Reveal
Auto Next
```

---

## 74. Admin Menu

```text
Game Management
└── Teka Kata
    ├── Word Bank
    ├── Categories
    ├── Difficulty
    ├── Puzzle History
    └── Settings
```

---

## 75. Word Bank Management

Actions:

```text
Add
Edit
Delete
Activate
Deactivate
Blacklist
Search
Filter
Bulk Edit
```

---

## 76. CSV Import

Format:

```csv
word,category,difficulty
BANDAR,Umum,Easy
BADAN,Umum,Easy
DANA,Umum,Easy
NADA,Umum,Easy
KOMPUTER,Teknologi,Medium
```

Flow:

```text
Upload
 ↓
Parse
 ↓
Validate
 ↓
Preview
 ↓
Confirm
 ↓
Import
```

---

## 77. CSV Validation

Periksa:

- Empty word.
- Duplicate.
- Invalid characters.
- Unsupported category.
- Invalid difficulty.
- Length di luar batas.
- Blacklisted word.

---

## 78. Puzzle History

Simpan:

```text
Puzzle Number
Difficulty
Category
Word Count
Completed
Skipped
Created At
Started At
Completed At
```

---

## 79. UX Principle

Game harus dapat dipahami dalam kurang dari 5 detik.

Viewer harus langsung memahami:

```text
APA?
Cari kata.

DARI MANA?
Dari huruf tersedia.

KIRIM?
Komentar.

REWARD?
Poin + leaderboard.
```

---

## 80. MVP Scope

### Core

- Game Selector.
- Game Registry.
- Teka Kata module.
- Game Session integration.
- Word Bank.
- Category.
- Difficulty.
- Puzzle Generator.
- Crossword/Grid.
- Letter Pool.
- Word Validation.
- First Correct Claim.
- Score.
- Leaderboard.
- Realtime.

### Host

- Generate.
- Start.
- Pause.
- Resume.
- Reveal Letter.
- Reveal Word.
- Skip.
- Change Game.

### Overlay

- Puzzle.
- Letter Pool.
- Comment CTA.
- Winner event.
- Score.
- Leaderboard.
- Completion animation.

---

## 81. Phase 2

- Boss Puzzle.
- Gift Reveal.
- CSV Import.
- Puzzle History.
- Advanced Generator.
- Word Statistics.
- Player Statistics.
- Pre-generated Puzzle Queue.
- Advanced Scoring.

---

## 82. Phase 3

Game Library:

```text
Tebak Kata
Teka Kata
Cari Kesalahan
Benar / Salah
Puzzle
```

Semua menggunakan infrastructure platform yang sama.

---

## 83. Definition of Done

Fitur dianggap selesai jika:

- Host dapat memilih Teka Kata.
- Host dapat generate puzzle.
- Generator menghasilkan puzzle valid.
- Crossword/grid valid.
- Letter Pool valid.
- Puzzle tampil di Overlay.
- Viewer dapat mengirim jawaban melalui komentar.
- Server memvalidasi jawaban.
- First correct mendapat score.
- Duplicate claim tidak mendapat score.
- Leaderboard realtime.
- Reveal Letter berfungsi.
- Reveal Word berfungsi.
- Puzzle completion berfungsi.
- Auto Next berfungsi.
- Manual Next berfungsi.
- Host dapat pause/resume.
- Host dapat skip.
- Host dapat mengganti game.
- Leaderboard tidak reset saat game berubah.
- Leaderboard reset saat LIVE baru dimulai.
- Score tidak dapat dimanipulasi client.
- Target word tidak bocor ke viewer.
- Tidak ada critical error pada kondisi realtime normal.

---

## 84. Example Full LIVE

```text
LIVE START
   ↓
Leaderboard Reset
   ↓
Host memilih TEBAK KATA
   ↓
Viewer bermain
   ↓
Score terkumpul
   ↓
Host memilih TEKA KATA
   ↓
Confirmation
   ↓
Tebak Kata berhenti
   ↓
Teka Kata Game Session dibuat
   ↓
Leaderboard tetap
   ↓
Puzzle #001
   ↓
Viewer menemukan BANDAR
   ↓
@ANDI +50
   ↓
Puzzle selesai
   ↓
Puzzle #002
   ↓
...
   ↓
Host kembali ke TEBAK KATA
   ↓
Leaderboard tetap
```

---

## 85. Technical Priority

### P0 — Infrastructure

- Game Registry.
- Game Session.
- Shared Score.
- Shared Leaderboard.
- Realtime.
- Comment Listener.

### P1 — Teka Kata Core

- Word Bank.
- Puzzle Generator.
- Grid.
- Letter Pool.
- Validation.
- First Claim.
- Score.

### P2 — Host

- Configuration.
- Generate.
- Start.
- Pause.
- Resume.
- Reveal.
- Skip.
- Switch Game.

### P3 — Overlay

- Grid.
- Letter Pool.
- CTA.
- Winner.
- Score.
- Leaderboard.
- Animations.

### P4 — Admin

- Word Bank UI.
- Categories.
- CSV Import.
- History.
- Settings.

### P5 — Optimization

- Puzzle pre-generation.
- Advanced analytics.
- Generator optimization.
- Load testing.
- Anti-spam tuning.

---

## 86. Product Success Metrics

Metric yang dapat dipantau:

```text
Average puzzles / LIVE
Average words found / puzzle
Average comments / LIVE
Correct answer rate
Invalid answer rate
Players participating
Unique active players
Average score / player
Puzzle completion rate
Puzzle skip rate
Average puzzle generation time
Comment validation latency
Realtime event latency
```

---

## 87. Recommended Analytics Events

```text
game_selected
puzzle_generated
puzzle_started
word_submitted
word_found
word_invalid
word_already_found
letter_revealed
word_revealed
puzzle_completed
puzzle_skipped
game_changed
player_scored
leaderboard_updated
```

---

## 88. Important Business Rules

1. Satu LIVE memiliki satu leaderboard utama.
2. Leaderboard tidak reset ketika game berganti.
3. Leaderboard hanya reset ketika LIVE baru dimulai.
4. Tidak ada team mode.
5. Tidak ada ronde.
6. Tidak ada timer wajib.
7. Score hanya diberikan untuk first valid claim.
8. Gift tidak memberikan score langsung.
9. Gift dapat digunakan untuk reveal jika fitur aktif.
10. Server menjadi source of truth.
11. Target words tidak dikirim lengkap ke viewer.
12. Puzzle harus tervalidasi sebelum dimainkan.
13. Host dapat menghentikan puzzle kapan saja.
14. Host dapat mengganti game tanpa menghapus score LIVE.

---

## 89. Future Extensibility

Arsitektur harus memungkinkan game baru menggunakan:

```text
GameAdapter
Game Registry
Game Session
Shared Score
Shared Leaderboard
Shared Comment Listener
Shared Gift Listener
Shared Realtime
```

Dengan demikian, menambah game baru tidak membutuhkan pembangunan ulang sistem LIVE.

---

## 90. Final Product Definition

**Teka Kata LIVE** adalah game crossword/word puzzle realtime yang berjalan sebagai salah satu game mode di dalam platform TikTok LIVE.

Viewer:

```text
Lihat huruf
→
Cari kata
→
Kirim komentar
→
Menjadi first correct
→
Dapat poin
```

Host:

```text
Pilih game
→
Atur puzzle
→
Start
→
Monitor
→
Control
→
Switch game
```

Platform:

```text
LIVE
+
Comments
+
Gifts
+
Players
+
Score
+
Leaderboard
+
Realtime
```

Semua game menggunakan core infrastructure yang sama.

> **Build the platform once, add games as modules.**
