# PRD — MATEMATIKA LIVE

**Version:** 1.0.0  
**Status:** Ready for Development  
**Product:** TikTok LIVE Interactive Game Platform  
**Module:** Matematika LIVE  
**Game Type:** Arithmetic Speed Challenge  
**Platform:** Web Host Dashboard + TikTok LIVE Overlay  
**Primary Input:** TikTok LIVE Comments  
**Default Answer Time:** 10 seconds

## 1. Product Overview

Matematika LIVE adalah game interaktif untuk TikTok LIVE yang memberikan soal matematika aritmetika sederhana secara otomatis.

Sistem menghasilkan soal secara random tanpa Question Bank. Setiap soal terdiri dari **3 angka**, masing-masing berada pada rentang **1–99**, dengan operasi **penjumlahan (+)** dan/atau **pengurangan (-)**.

Viewer menjawab melalui komentar TikTok LIVE. Semua pemain yang menjawab benar sebelum waktu habis mendapatkan poin berdasarkan urutan jawaban benar.

Contoh:

```text
27 + 14 + 38 = ?
```

Jawaban: `79`

Skor default:

```text
Juara 1  → +10
Juara 2  → +9
Juara 3  → +8
...
Juara 10 → +1
Juara 11+ → +1
```

## 2. Posisi dalam Platform

Matematika LIVE merupakan game module ketiga dalam satu platform TikTok LIVE Interactive Game.

1. Tebak Kata
2. Teka Kata
3. Matematika LIVE

Semua game menggunakan infrastructure bersama:

- LIVE Session
- Game Session
- TikTok Comments
- TikTok Gifts
- Players
- Score
- Leaderboard
- Realtime
- Host Dashboard
- TikTok Overlay

Pergantian game tidak menghapus leaderboard. Leaderboard hanya reset ketika Host memulai LIVE baru.

## 3. Vision

Membuat game matematika yang:

- Mudah dipahami.
- Bisa dimainkan banyak viewer sekaligus.
- Menggunakan komentar TikTok sebagai input.
- Memiliki kompetisi berbasis kecepatan.
- Semua jawaban benar tetap mendapatkan poin.
- Soal dibuat otomatis.
- Tidak membutuhkan Question Bank.
- Bisa dimainkan terus-menerus tanpa round.

## 4. Problem Statement

Game interaktif TikTok LIVE sering membutuhkan banyak soal dan persiapan manual.

Matematika LIVE menggunakan alur:

```text
Random Generator
      ↓
Generate Question
      ↓
Calculate Answer
      ↓
Publish to LIVE
      ↓
Viewer Answers
      ↓
Validate
      ↓
Rank Correct Answers
      ↓
Award Points
      ↓
Update Leaderboard
```

## 5. Goals

### G1 — Automatic Question Generation
Semua soal dibuat otomatis.

### G2 — No Question Bank
Tidak ada tabel Question Bank matematika.

### G3 — Simple Gameplay
Viewer cukup mengetik jawaban angka.

### G4 — Speed Competition
Jawaban benar diberi peringkat berdasarkan urutan diterima server.

### G5 — Multi Winner
Semua viewer yang menjawab benar dalam waktu tersedia mendapatkan poin.

### G6 — Speed-Based Scoring
Semakin cepat menjawab benar, semakin besar poin.

### G7 — Platform Integration
Game terintegrasi dengan infrastructure platform.

## 6. Non-Goals

MVP tidak mencakup:

- Perkalian
- Pembagian
- Pecahan
- Desimal
- Persamaan
- Aljabar
- Soal cerita
- Kalkulus
- Team Mode
- Round system
- Achievement
- Inventory
- Keyboard khusus
- Gesture
- Question Bank matematika

## 7. Target Users

### Host

Host dapat:

- Memilih Matematika LIVE.
- Mengatur waktu menjawab.
- Mengatur operasi.
- Mengatur rentang angka.
- Generate soal.
- Memulai soal.
- Melihat jawaban masuk.
- Melihat ranking.
- Skip soal.
- Reveal jawaban.
- Mengatur Auto Next.

### Viewer

Viewer:

1. Melihat soal.
2. Menghitung jawaban.
3. Mengirim jawaban melalui komentar.
4. Mendapat poin jika benar sebelum waktu habis.
5. Melihat leaderboard.

### Admin

Admin mengatur:

- Default configuration.
- Scoring.
- Rate limit.
- Game settings.
- Analytics.
- Permission.

## 8. Core Gameplay Flow

```text
Host memilih Matematika
        ↓
Host mengatur konfigurasi
        ↓
Generate Question
        ↓
Question Ready
        ↓
Start Question
        ↓
Timer berjalan
        ↓
Viewer mengirim jawaban
        ↓
Server menerima comment
        ↓
Normalize Answer
        ↓
Validate
        ↓
Jika benar
        ↓
Cek player
        ↓
Tentukan ranking
        ↓
Hitung poin
        ↓
Update score
        ↓
Broadcast realtime
        ↓
Timer habis
        ↓
TIME UP
        ↓
Complete Question
        ↓
Generate Question berikutnya
```

## 9. Example Question

```text
27 + 14 + 38 = ?
```

Perhitungan:

```text
27 + 14 = 41
41 + 38 = 79
```

Jawaban:

```text
79
```

Jika urutan server:

```text
andi → benar
budi → benar
siti → salah
rudi → benar
```

Maka:

```text
andi → Rank 1 → +10
budi → Rank 2 → +9
rudi → Rank 3 → +8
```

## 10. Supported Operations

MVP mendukung:

```text
+
-
```

Mode:

### Addition Only

```text
27 + 14 + 38
```

### Subtraction Only

```text
95 - 24 - 17
```

### Mixed

```text
86 - 24 + 17
```

Perhitungan `+` dan `-` berlangsung dari kiri ke kanan.

## 11. Number Generation

Setiap soal memiliki tepat 3 angka.

Default:

```text
minNumber = 1
maxNumber = 99
```

Contoh:

```text
A = 27
B = 14
C = 38
```

## 12. Randomization

Generator:

1. Generate 3 angka.
2. Pilih 2 operator.
3. Hitung answer.
4. Validasi.
5. Pastikan tidak sama dengan soal sebelumnya.
6. Simpan generated question.

## 13. Negative Answers

Default:

```text
allowNegative = false
```

Generator harus menghindari expression yang menghasilkan angka negatif.

Contoh tidak valid:

```text
12 - 80 - 5 = -73
```

Contoh valid:

```text
90 - 30 - 20 = 40
```

## 14. Zero Answer

Jawaban `0` diperbolehkan.

Contoh:

```text
25 - 40 + 15 = 0
```

## 15. Duplicate Question Prevention

Sistem sebaiknya menghindari expression yang sama secara berurutan.

```text
Question #001
27 + 14 + 38

Question #002
27 + 14 + 38
```

Tidak diperbolehkan.

## 16. Question State

```text
DRAFT
READY
ACTIVE
TIME_UP
COMPLETED
SKIPPED
```

## 17. Answer Timer

Default:

```text
10 seconds
```

Preset:

```text
5
10
15
20
30
```

Recommended configurable range:

```text
3–60 seconds
```

## 18. Timer Rules

Timer menggunakan waktu server.

Question memiliki:

```text
started_at
ends_at
duration_seconds
```

Client bukan sumber kebenaran waktu.

## 19. Countdown

Overlay menampilkan countdown:

```text
10
9
8
7
6
...
1
0
```

3 detik terakhir dapat menggunakan animasi lebih intens.

## 20. Time Up

Saat `ends_at` tercapai:

```text
Question → TIME_UP
```

Setelah itu:

- Jawaban baru tidak mendapat poin.
- Ranking ditutup.
- Jawaban dapat ditampilkan.
- Question masuk `COMPLETED`.

## 21. Server-Side Time Validation

Validasi:

```text
received_at <= ends_at
```

Jika:

```text
received_at > ends_at
```

maka jawaban tidak eligible untuk scoring.

## 22. Answer Normalization

Input yang disarankan:

```text
79
```

Normalisasi:

```text
trim()
normalize whitespace
parse numeric
```

Contoh valid:

```text
" 79 " → 79
```

MVP menggunakan numeric strict.

## 23. Correct Answer Ranking

Ranking hanya diberikan jika:

1. Jawaban dikirim sebelum timeout.
2. Jawaban benar.
3. Player belum mendapat skor pada question tersebut.

Contoh:

```text
01 → @andi → correct
02 → @budi → correct
03 → @siti → wrong
04 → @rudi → correct
```

Ranking:

```text
@andi → Rank 1
@budi → Rank 2
@rudi → Rank 3
```

## 24. Multi-Winner Scoring

Default:

```text
Rank 1  → +10
Rank 2  → +9
Rank 3  → +8
Rank 4  → +7
Rank 5  → +6
Rank 6  → +5
Rank 7  → +4
Rank 8  → +3
Rank 9  → +2
Rank 10 → +1
Rank 11+ → +1
```

Formula:

```text
points = max(1, 11 - rank)
```

## 25. One Score Per Player Per Question

Satu player hanya dapat memperoleh skor sekali dalam satu question.

Jawaban salah tetap boleh dicoba kembali.

Contoh:

```text
@andi → 78 → wrong
@andi → 79 → correct → +10
```

## 26. Race Condition

Ranking tidak boleh ditentukan dari timestamp client.

Gunakan:

- Server processing order.
- Database transaction.
- Atomic operation.
- Unique constraint.
- Server timestamp.

## 27. Answer Record

`math_answers`:

```text
id
question_id
player_id
comment_id
submitted_answer
is_correct
rank
points
created_at
```

Optional:

```text
received_at
validation_latency_ms
```

## 28. Question Record

`math_questions`:

```text
id
game_session_id
expression
number_1
number_2
number_3
operator_1
operator_2
answer
min_number
max_number
allow_negative
duration_seconds
status
started_at
ends_at
completed_at
created_at
```

Question disimpan untuk validation, audit, history, analytics, dan debugging.

## 29. No Question Bank Architecture

Tidak ada:

```text
math_question_bank
```

Flow:

```text
Random Generator
      ↓
Generated Question
      ↓
math_questions
      ↓
LIVE
```

Prinsip:

> Generate, Don't Maintain a Question Bank.

## 30. MathQuestionGenerator

Service:

```text
MathQuestionGenerator
```

Methods:

```text
generate()
calculateAnswer()
validateQuestion()
```

Output contoh:

```ts
{
  number1: 27,
  number2: 14,
  number3: 38,
  operator1: "+",
  operator2: "+",
  expression: "27 + 14 + 38",
  answer: 79
}
```

## 31. Generator Validation

Validasi:

```text
1. Exactly 3 numbers
2. Numbers within min/max
3. Operators valid
4. Answer calculated correctly
5. Negative rule valid
6. Duplicate prevention
7. Configuration valid
```

## 32. Host Dashboard Configuration

Host dapat mengatur:

```text
Answer Time
5s / 10s / 15s / 20s / 30s

Operation
Addition / Subtraction / Mixed

Number Range
Min: 1
Max: 99

Allow Negative
OFF

Auto Next
ON / OFF
```

## 33. Dashboard Question Preview

```text
┌───────────────────────────────┐
│ MATEMATIKA LIVE               │
│                               │
│       27 + 14 + 38 = ?        │
│                               │
│ Answer Time: 10 seconds       │
│ Operation: Mixed              │
│ Range: 1–99                   │
│                               │
│        [ START ]              │
└───────────────────────────────┘
```

Answer tidak ditampilkan kepada viewer.

## 34. Active Dashboard

```text
QUESTION
27 + 14 + 38 = ?

TIME
07.4s

CORRECT ANSWERS
1. @andi +10
2. @budi +9
3. @rudi +8

WRONG ANSWERS
@siti
@doni

[ PAUSE ]
[ REVEAL ]
[ SKIP ]
```

## 35. Answer Monitor

Host dapat melihat:

- Username.
- Submitted answer.
- Correct / wrong.
- Rank.
- Points.
- Processing time.

## 36. Pause / Resume

Jika diaktifkan:

```text
PAUSE
RESUME
```

Timer dikontrol server.

Jika tidak dibutuhkan MVP, kontrol dapat disembunyikan.

## 37. Skip Question

Host dapat:

```text
SKIP QUESTION
```

Confirmation:

```text
Skip question?

Current question will be stopped.

[Cancel] [Skip]
```

State:

```text
SKIPPED
```

## 38. Reveal Answer

Host dapat:

```text
REVEAL ANSWER
```

Setelah reveal:

- Scoring dihentikan.
- Question tidak menerima jawaban baru.
- Answer ditampilkan.
- Question menjadi COMPLETED.

## 39. Auto Next

Jika:

```text
autoNext = true
```

Flow:

```text
TIME UP
   ↓
Result Animation
   ↓
1–2 seconds
   ↓
Generate Next Question
   ↓
Start
```

Jika OFF, sistem menunggu Host.

## 40. TikTok Overlay

Ukuran:

```text
1080 × 1920
```

Aspect ratio:

```text
9:16
```

Safe area:

```text
Horizontal: 72px
Vertical: 96px
```

## 41. Overlay Structure

```text
┌──────────────────────┐
│ MATEMATIKA LIVE      │
│                      │
│   27 + 14 + 38       │
│        = ?            │
│                      │
│       07.4s           │
│                      │
│ Jawab di komentar!   │
│                      │
│ Correct Answers      │
│ 1 @andi       +10    │
│ 2 @budi        +9    │
│ 3 @rudi        +8    │
│                      │
│ Leaderboard          │
│ 1 @andi       120    │
│ 2 @budi       105    │
│ 3 @rudi        98    │
└──────────────────────┘
```

## 42. Overlay Hierarchy

Prioritas:

1. Question
2. Timer
3. CTA
4. Correct Answers
5. Leaderboard
6. Decorative elements

Question harus paling mudah dibaca.

## 43. Question Animation

Question baru:

```text
opacity: 0 → 1
scale: 0.92 → 1
```

Durasi:

```text
250–350ms
```

## 44. Timer Animation

Timer normal selama >5 detik.

3 detik terakhir:

```text
scale pulse
```

Saat 0:

```text
TIME UP
```

## 45. Correct Answer Event

Saat player benar:

```text
@andi
✓ 79
+10
```

Animation:

```text
scale .75 → 1
opacity 0 → 1
```

Durasi sekitar 300ms.

## 46. Multiple Correct Answers

```text
✓ @andi +10
✓ @budi +9
✓ @rudi +8
✓ @siti +7
```

List dapat scroll jika banyak.

## 47. Time Up Animation

```text
TIME UP
```

Kemudian:

```text
ANSWER: 79
```

Durasi sekitar:

```text
600–1000ms
```

## 48. Shared Leaderboard

Leaderboard milik LIVE Session, bukan game.

Contoh:

```text
@andi    150
@budi    132
@rudi    121
@siti     98
```

Skor berasal dari:

```text
Tebak Kata
+
Teka Kata
+
Matematika
```

## 49. Game Switching

```text
Tebak Kata
    ↓
Host pilih Matematika
    ↓
Current game stopped
    ↓
Math Game Session created
    ↓
Question generated
    ↓
Math Game started
```

Leaderboard tetap.

## 50. Switch Confirmation

```text
Switch game?

Current question will be stopped.

Leaderboard will not reset.

[Cancel] [Switch Game]
```

## 51. Gift Integration

MVP:

```text
Gift tidak memberikan poin langsung.
```

Future:

- Extra Time.
- Hint.
- Reveal Answer.
- Double Score.

## 52. Anti-Cheat

Server adalah source of truth.

Client tidak boleh menentukan:

```text
score
rank
correct
timer
```

## 53. Answer Protection

Answer tidak boleh dikirim ke client sebelum:

```text
TIME_UP
```

atau:

```text
REVEAL
```

## 54. Rate Limiting

Contoh:

```text
5 answer submissions / second / player
```

Jika melebihi:

```text
RATE_LIMITED
```

## 55. Comment Deduplication

Gunakan `comment_id` TikTok sebagai unique identifier jika tersedia.

Comment yang sama tidak boleh diproses dua kali.

## 56. Realtime Architecture

```text
TikTok Comment
      ↓
Comment Processor
      ↓
Math Game Engine
      ↓
Validator
      ↓
Scorer
      ↓
Leaderboard Service
      ↓
Realtime Event
      ↓
Overlay + Host Dashboard
```

## 57. Realtime Events

```text
GAME_STARTED
QUESTION_READY
QUESTION_STARTED
ANSWER_SUBMITTED
ANSWER_CORRECT
ANSWER_WRONG
PLAYER_SCORED
TIMER_UPDATED
TIME_UP
ANSWER_REVEALED
QUESTION_COMPLETED
QUESTION_SKIPPED
LEADERBOARD_UPDATED
GAME_CHANGED
```

## 58. ANSWER_CORRECT Payload

```json
{
  "type": "ANSWER_CORRECT",
  "questionId": "math_001",
  "player": {
    "id": "player_001",
    "username": "@andi"
  },
  "answer": 79,
  "rank": 1,
  "points": 10
}
```

## 59. TIME_UP Payload

```json
{
  "type": "TIME_UP",
  "questionId": "math_001",
  "answer": 79,
  "correctAnswers": 8
}
```

## 60. Database

Shared:

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

Matematika:

```text
math_questions
math_answers
```

Tidak ada `math_question_bank`.

## 61. Game Adapter

```ts
interface GameAdapter {
  initialize(): Promise<void>
  start(): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  stop(): Promise<void>
  handleComment(comment): Promise<void>
  handleGift(gift): Promise<void>
  getState(): GameState
  getConfig(): GameConfig
}
```

## 62. MathGame Methods

```text
generateQuestion()
calculateAnswer()
validateAnswer()
registerCorrectAnswer()
calculatePoints()
startTimer()
completeQuestion()
```

## 63. Configuration

```json
{
  "durationSeconds": 10,
  "minNumber": 1,
  "maxNumber": 99,
  "operators": ["+", "-"],
  "allowNegative": false,
  "autoNext": true,
  "minPoints": 1,
  "firstPlacePoints": 10
}
```

## 64. Project Structure

```text
src/
├── games/
│   ├── registry/
│   ├── tebak-kata/
│   ├── teka-kata/
│   └── matematika/
│       ├── game.ts
│       ├── generator.ts
│       ├── calculator.ts
│       ├── validator.ts
│       ├── scorer.ts
│       ├── timer.ts
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

## 65. Generator Pseudocode

```ts
function generateQuestion(config) {
  let question

  do {
    const number1 = random(config.minNumber, config.maxNumber)
    const number2 = random(config.minNumber, config.maxNumber)
    const number3 = random(config.minNumber, config.maxNumber)

    const operator1 = randomOperator(config.operators)
    const operator2 = randomOperator(config.operators)

    const answer = calculate(
      number1,
      operator1,
      number2,
      operator2,
      number3
    )

    question = {
      number1,
      number2,
      number3,
      operator1,
      operator2,
      answer
    }
  } while (!validateQuestion(question))

  return question
}
```

## 66. Scoring Algorithm

```ts
function calculatePoints(rank: number) {
  return Math.max(1, 11 - rank)
}
```

## 67. Question Lifecycle

```text
DRAFT
  ↓
READY
  ↓
ACTIVE
  ↓
TIME_UP
  ↓
COMPLETED
```

Alternative:

```text
READY
  ↓
SKIPPED
```

## 68. Performance Target

```text
Question generation < 100ms
Comment validation < 500ms
Correct answer → Overlay < 1 second
Leaderboard update < 1 second
```

## 69. Configuration Validation

```text
minNumber >= 1
maxNumber <= 99
minNumber <= maxNumber
duration >= 3
duration <= 60
operators contains + or -
firstPlacePoints >= 1
minPoints >= 1
```

## 70. UX Principles

Game harus dapat dipahami viewer dalam kurang dari 5 detik.

Overlay langsung menjelaskan:

```text
SOAL
+
WAKTU
+
CARA MENJAWAB
```

Contoh:

```text
27 + 14 + 38 = ?

7.4s

Ketik jawaban di komentar!
```

## 71. Accessibility

Perhatikan:

- Kontras tinggi.
- Ukuran angka besar.
- Jangan hanya menggunakan warna untuk status.
- Timer tetap terbaca.
- Text tidak terlalu kecil.
- Animasi tidak berlebihan.

## 72. Language

MVP:

```text
Bahasa Indonesia
```

Future dapat menggunakan i18n untuk bahasa lain.

## 73. Admin Settings

Admin dapat mengatur:

```text
Default Timer
Default Number Range
Default Operators
Default Scoring
Minimum Points
Rate Limit
Auto Next Default
```

## 74. Analytics

Track:

```text
GAME_STARTED
QUESTION_GENERATED
QUESTION_STARTED
ANSWER_SUBMITTED
ANSWER_CORRECT
ANSWER_WRONG
TIME_UP
QUESTION_SKIPPED
PLAYER_SCORED
GAME_SWITCHED
```

Metrics:

```text
Average Answers / Question
Correct Answer Rate
Average Response Time
Players / Question
Average Points
Questions / LIVE
```

## 75. Success Metrics

- Viewer participation.
- Answers per question.
- Correct answer rate.
- Average players per question.
- Questions played per LIVE.
- Average session duration.
- Game switching frequency.

## 76. MVP Scope

MVP wajib memiliki:

- Game Selector.
- Matematika LIVE.
- Random question generator.
- 3 angka.
- Range 1–99.
- Addition.
- Subtraction.
- Mixed operation.
- Default timer 10 detik.
- Configurable timer.
- Comment input.
- Answer validation.
- Multi-winner scoring.
- Rank-based points.
- One score per player/question.
- Retry wrong answer.
- Server-side timer.
- Server-side scoring.
- Realtime leaderboard.
- Host dashboard.
- TikTok overlay.
- Auto next.
- Skip.
- Reveal answer.
- Game switching.
- Shared leaderboard.

## 77. Phase 2

Potensial:

- Multiplication.
- Division.
- Difficulty presets.
- Negative answers.
- Gift extra time.
- Gift hint.
- Gift reveal.
- Streak bonus.
- Advanced scoring.
- Analytics dashboard.
- Weighted operators.
- Custom scoring profiles.

## 78. Phase 3

Potensial game:

```text
Math Puzzle
Math Memory
Sequence Challenge
Number Guess
Rapid Calculation
Logic Challenge
```

Semua menggunakan shared Game Adapter.

## 79. Definition of Done

### Game

- [ ] Host dapat memilih Matematika.
- [ ] Sistem dapat generate soal random.
- [ ] Soal memiliki tepat 3 angka.
- [ ] Angka default 1–99.
- [ ] Operasi + dan - berjalan.
- [ ] Answer dihitung server.

### Timer

- [ ] Default 10 detik.
- [ ] Timer configurable.
- [ ] Server menjadi source of truth.
- [ ] Jawaban setelah timeout tidak mendapat poin.

### Answer

- [ ] Viewer dapat menjawab melalui comment.
- [ ] Answer dinormalisasi.
- [ ] Answer benar terdeteksi.
- [ ] Answer salah dapat dicoba kembali.
- [ ] Player hanya mendapat skor sekali/question.

### Scoring

- [ ] Rank 1 mendapat +10.
- [ ] Rank 2 mendapat +9.
- [ ] Rank 3 mendapat +8.
- [ ] Rank 10 mendapat +1.
- [ ] Rank >10 tetap minimal +1.
- [ ] Semua jawaban benar mendapatkan poin.

### Security

- [ ] Client tidak dapat menentukan score.
- [ ] Client tidak dapat menentukan rank.
- [ ] Answer tidak bocor sebelum time up.
- [ ] Rate limiting aktif.
- [ ] Duplicate comments ditangani.

### Realtime

- [ ] Correct answer muncul di overlay.
- [ ] Score diperbarui.
- [ ] Leaderboard diperbarui.
- [ ] TIME UP broadcast.
- [ ] Game switching broadcast.

### Integration

- [ ] Leaderboard tidak reset saat switch game.
- [ ] Leaderboard reset saat LIVE baru.
- [ ] Math Game menggunakan Game Adapter.
- [ ] Shared infrastructure digunakan.

## 80. Full Gameplay Example

Configuration:

```text
Timer: 10s
Numbers: 1–99
Operations: Mixed
Negative: OFF
Auto Next: ON
```

Generated:

```text
27 + 14 + 38 = ?
```

Answer:

```text
79
```

Comments:

```text
@andi → 79
@budi → 79
@siti → 78
@rudi → 79
@doni → 79
```

Server result:

```text
@andi → Rank 1 → +10
@budi → Rank 2 → +9
@siti → Wrong
@rudi → Rank 3 → +8
@doni → Rank 4 → +7
```

TIME UP:

```text
Answer: 79
```

Auto Next:

```text
Question #002 generated
```

## 81. Full Game Session Example

```text
LIVE SESSION #001

Game Session #1
TEBAK KATA
@andi +30
@budi +20

Game Session #2
TEKA KATA
@andi +50
@siti +30

Game Session #3
MATEMATIKA
@andi +10
@budi +9
@rudi +8
```

Final leaderboard menggabungkan seluruh game.

## 82. Technical Priority

### P0 — Shared Infrastructure

- Game Registry.
- Game Session.
- Player.
- Comment Processor.
- Score.
- Leaderboard.
- Realtime.

### P1 — Math Core

- Generator.
- Calculator.
- Validator.
- Scorer.
- Timer.

### P2 — Host Dashboard

- Configuration.
- Preview.
- Active state.
- Answer monitor.
- Controls.

### P3 — Overlay

- Question.
- Timer.
- Correct answer.
- Result.
- Leaderboard.

### P4 — Optimization

- Pre-generation.
- Analytics.
- Rate limiting refinement.
- Performance optimization.

## 83. Business Rules

1. Matematika LIVE adalah game module ketiga.
2. Tidak menggunakan Question Bank.
3. Soal dibuat secara random.
4. Setiap soal memiliki tepat 3 angka.
5. Default angka 1–99.
6. Operasi MVP adalah + dan -.
7. Default timer 10 detik.
8. Timer dapat dikonfigurasi.
9. Semua jawaban benar mendapatkan poin.
10. Poin berdasarkan urutan jawaban benar.
11. Rank 1 mendapat +10.
12. Rank 2 mendapat +9.
13. Rank 3 mendapat +8.
14. Rank 10 mendapat +1.
15. Setelah rank 10, minimum tetap +1.
16. Satu player hanya dapat memperoleh skor sekali per question.
17. Jawaban salah dapat dicoba kembali.
18. Jawaban setelah timeout tidak mendapat poin.
19. Server adalah source of truth.
20. Client tidak dapat menentukan rank atau score.
21. Leaderboard bersifat shared.
22. Pergantian game tidak mereset leaderboard.
23. LIVE baru mereset leaderboard.
24. Generated question disimpan untuk validation dan history.
25. Answer disembunyikan dari viewer sampai question selesai atau direveal.

## 84. Architecture Principle

> **Generate, Don't Maintain a Question Bank.**

Flow:

```text
Generate
→ Validate
→ Store Session Question
→ Play
→ Score
→ Complete
→ Generate Again
```

Keuntungan:

- Konten tidak cepat habis.
- Tidak perlu maintenance Question Bank.
- Variasi soal sangat besar.
- Mudah diskalakan.
- Mudah menambah konfigurasi.
- Cocok untuk LIVE continuous gameplay.

## 85. Final Product Definition

Matematika LIVE adalah game matematika realtime untuk TikTok LIVE yang menghasilkan soal aritmetika secara otomatis menggunakan tiga angka dan operasi penjumlahan/pengurangan.

Viewer menjawab melalui komentar. Semua jawaban benar sebelum timer berakhir memperoleh poin, dengan poin menurun berdasarkan urutan jawaban.

Default:

```text
3 angka
1–99
+
-
10 detik
Rank 1 = +10
Rank 2 = +9
Rank 3 = +8
...
Minimum = +1
```

Game tidak menggunakan Question Bank dan dapat berjalan terus-menerus dalam satu LIVE.

Matematika LIVE mengikuti arsitektur shared platform sehingga dapat berpindah dari dan ke game lain tanpa menghapus leaderboard LIVE.
