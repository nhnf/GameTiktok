# PRD — Matematika Tarik Tambang LIVE

> **Status:** New Game Module
> **Platform:** TikTok LIVE
> **Orientation:** Portrait 9:16
> **Game Type:** Multiplayer Competitive
> **Genre:** Math Battle / Tug of War
> **Visual Style:** Neo-Brutalism

---

# 1. Overview

**Matematika Tarik Tambang LIVE** adalah game multiplayer untuk TikTok LIVE yang mempertemukan penonton dalam dua tim:

* 🔵 **Tim Biru**
* 🔴 **Tim Merah**

Setiap ronde, kedua tim mendapatkan **soal matematika yang berbeda**, tetapi memiliki tingkat kesulitan yang setara.

Pemain menjawab soal melalui komentar TikTok LIVE.

Jawaban benar menghasilkan **Answer Power**.

Penonton juga dapat membantu tim melalui **Gift Category** yang telah ditentukan untuk masing-masing tim. Gift menghasilkan **Gift Power**.

Total kekuatan tim:

```text
Answer Power
+
Gift Power
=
Total Power
```

Total Power kedua tim menentukan arah pergerakan tali.

```text
🔵 TIM BIRU  ← 🪢 →  TIM MERAH 🔴
```

Tim yang berhasil menarik tali melewati garis kemenangan menjadi pemenang.

---

# 2. Important: Game Module Baru

Game ini **WAJIB dibuat sebagai module baru**.

Game ini **tidak menggantikan** game:

> **Matematika LIVE**

yang sudah tersedia sebelumnya.

Struktur game:

```text
GAME MODULES

├── Tebak Kata LIVE
│
├── Matematika LIVE
│   └── Game matematika sebelumnya
│
├── Matematika Tarik Tambang LIVE
│   └── Game baru
│
└── Game lainnya
```

Tidak boleh:

* Menghapus Matematika LIVE lama.
* Mengubah aturan Matematika LIVE lama.
* Mengubah database/state game lama secara langsung.
* Menggunakan konfigurasi game lama secara otomatis.
* Menggabungkan state pertandingan kedua game.

Game baru harus memiliki:

* Game ID sendiri.
* Configuration sendiri.
* Match state sendiri.
* Round state sendiri.
* Question generator sendiri.
* Gift configuration sendiri.
* Score/power calculation sendiri.

---

# 3. Core Concept

Tagline:

> **DUA TIM. DUA SOAL. SATU TARIK TAMBANG.**

Setiap ronde:

```text
        ROUND

🔵 Tim Biru             🔴 Tim Merah
   Soal A                  Soal B
      ↓                       ↓
  Jawaban                  Jawaban
      ↓                       ↓
Answer Power             Answer Power
      ↓                       ↓
 Gift Power              Gift Power
      ↓                       ↓
      └──────────┬──────────┘
                 ↓
           TOTAL POWER
                 ↓
              🪢 TALI
                 ↓
          Posisi berubah
```

---

# 4. Tujuan Produk

Game dirancang untuk:

1. Meningkatkan interaksi komentar.
2. Membuat penonton memiliki identitas tim.
3. Membuat penonton merasa ikut bertanding.
4. Menggabungkan kemampuan menjawab dengan dukungan gift.
5. Menciptakan kompetisi yang mudah dipahami.
6. Memungkinkan comeback.
7. Memberikan visual yang menarik untuk TikTok LIVE.
8. Membuat match dapat dimainkan berulang kali.
9. Memberikan variasi dari game Matematika LIVE yang sudah ada.

---

# 5. Team System

Game selalu memiliki dua tim.

## 5.1 Tim Biru

```text
Team ID: BLUE

Color: Blue
Icon: 🔵
Flag: Blue
```

## 5.2 Tim Merah

```text
Team ID: RED

Color: Red
Icon: 🔴
Flag: Red
```

---

# 6. Team Assignment

Tersedia tiga metode.

## 6.1 Manual Comment Join

Penonton memilih tim melalui komentar.

Contoh:

```text
BIRU
```

atau:

```text
MERAH
```

Komentar valid pertama menentukan tim pemain.

---

## 6.2 Random Assignment

Sistem membagi pemain secara otomatis.

Target:

```text
50% → Biru
50% → Merah
```

Perbedaan jumlah pemain diperbolehkan.

---

## 6.3 Host Assignment

Host dapat:

* Memindahkan pemain.
* Menambahkan pemain.
* Mengeluarkan pemain dari tim.
* Mengunci tim.
* Membuka kembali perpindahan tim.

---

# 7. Match Structure

Match terdiri dari beberapa ronde.

Default:

```text
10 RONDE
```

Host dapat mengatur:

```text
5 ronde
10 ronde
15 ronde
20 ronde
```

---

# 8. Match Flow

```text
LOBBY
  ↓
TEAM JOIN
  ↓
MATCH START
  ↓
ROUND START
  ↓
SOAL MUNCUL
  ↓
PEMAIN MENJAWAB
  ↓
GIFT MASUK
  ↓
TIMER HABIS
  ↓
VALIDASI JAWABAN
  ↓
HITUNG ANSWER POWER
  ↓
HITUNG GIFT POWER
  ↓
HITUNG TOTAL POWER
  ↓
TALI BERGERAK
  ↓
CEK WIN CONDITION
  ↓
STREAK CHECK
  ↓
NEXT ROUND
```

Jika salah satu tim menang:

```text
→ VICTORY
→ RESULT
→ LOBBY
```

---

# 9. Round System

Setiap ronde memiliki:

* Nomor ronde.
* Soal Tim Biru.
* Soal Tim Merah.
* Jawaban masing-masing.
* Timer.
* Daftar jawaban pemain.
* Answer Power.
* Gift Power.
* Total Power.
* Posisi tali sebelum ronde.
* Posisi tali setelah ronde.
* Tim yang unggul.
* Streak state.

---

# 10. Question System

Setiap tim mendapatkan **soal yang berbeda**.

Contoh:

### Tim Biru

```text
37 + 28 = ?
```

### Tim Merah

```text
84 - 47 = ?
```

Jawaban:

```text
Biru = 65
Merah = 37
```

---

# 11. Question Fairness

Soal kedua tim harus memiliki tingkat kesulitan yang setara.

Tidak diperbolehkan:

```text
Biru:
2 + 3 = ?

Merah:
487 - 269 = ?
```

Lebih baik:

```text
Biru:
37 + 28 = ?

Merah:
84 - 47 = ?
```

Keduanya memiliki kompleksitas yang sebanding.

---

# 12. Supported Operators

Versi awal hanya:

```text
+
-
```

Penjumlahan dan pengurangan.

Operator lain dapat ditambahkan pada versi berikutnya.

---

# 13. Difficulty

Tersedia:

### Easy

```text
23 + 15
48 - 21
```

### Normal

```text
47 + 38
82 - 47
```

### Hard

```text
178 + 246
532 - 287
```

### Extreme

```text
487 + 369
824 - 478
```

Kedua tim selalu berada pada difficulty yang sama.

---

# 14. Question Generation

Soal dibuat secara otomatis.

Generator harus:

* Menghasilkan angka secara random.
* Menghasilkan operator sesuai konfigurasi.
* Menghasilkan jawaban yang valid.
* Menghindari soal duplikat dalam match.
* Menjaga difficulty kedua tim.
* Menyimpan question ID.
* Menyimpan correct answer.

Contoh:

```text
question_id
operator
operand_a
operand_b
answer
difficulty
```

---

# 15. Timer

Default:

```text
10 detik
```

Host dapat mengatur:

```text
5 detik
10 detik
15 detik
20 detik
```

Countdown:

```text
10
9
8
7
6
5
4
3
2
1
0
```

Ketika mencapai 0:

> **WAKTU HABIS!**

Tidak ada jawaban baru yang dapat memperoleh Power.

---

# 16. Answer System

Pemain menjawab melalui komentar TikTok.

Contoh:

```text
Soal:
37 + 28 = ?

Player:
65
```

Sistem:

```text
COMMENT
  ↓
PARSE
  ↓
VALIDATE
  ↓
CHECK ANSWER
  ↓
CHECK TIMESTAMP
  ↓
AWARD POWER
```

---

# 17. Correct Answer

Jika jawaban benar:

* Pemain tercatat sebagai correct.
* Timestamp jawaban dicatat.
* Answer Power diberikan.
* Jawaban pemain tidak dapat memberikan Power kedua kali.

---

# 18. Wrong Answer

Jika salah:

```text
Power = 0
```

Tidak ada penalti.

Jawaban salah tidak:

* Mengurangi Power.
* Menggeser tali.
* Mengurangi HP.
* Menghilangkan pemain.

---

# 19. Multiple Answers

Satu pemain hanya dapat memberikan Power **satu kali per ronde**.

Contoh:

```text
Player A:
65

Player A:
65

Player A:
65
```

Tetap:

```text
Player A = 1 correct answer
```

Jawaban pertama yang valid digunakan.

---

# 20. Answer Power

Power jawaban ditentukan berdasarkan kecepatan.

Default:

| Waktu       | Power |
| ----------- | ----: |
| 0–2 detik   |    +3 |
| >2–5 detik  |    +2 |
| >5–10 detik |    +1 |

Contoh:

```text
Player A → benar pada 1.5 detik
Power = +3

Player B → benar pada 4 detik
Power = +2

Player C → benar pada 8 detik
Power = +1
```

---

# 21. Answer Power Example

Tim Biru:

```text
30 pemain × 3 = 90
20 pemain × 2 = 40
10 pemain × 1 = 10

Answer Power = 140
```

---

# 22. Gift System

Gift merupakan mekanik pendukung pertandingan.

Setiap tim memiliki **kategori gift sendiri**.

```text
🔵 Gift Category → Tim Biru
🔴 Gift Category → Tim Merah
```

Penonton tidak perlu mengetik nama tim ketika mengirim gift.

Sistem menentukan tim berdasarkan mapping gift.

---

# 23. Gift Categories

Versi awal memiliki tiga tier per tim.

### Small Gift

```text
+5 Power
```

### Medium Gift

```text
+15 Power
```

### Large Gift

```text
+40 Power
```

Nilai dapat dikonfigurasi oleh host/admin.

---

# 24. Gift Mapping

Gift tidak di-hard-code berdasarkan nama.

Sistem menggunakan mapping.

Data:

```text
gift_id
gift_name
team
tier
power
enabled
```

Contoh:

```text
Gift #001
Team: BLUE
Tier: SMALL
Power: 5

Gift #002
Team: BLUE
Tier: MEDIUM
Power: 15

Gift #003
Team: BLUE
Tier: LARGE
Power: 40
```

Tim Merah memiliki mapping sendiri.

---

# 25. Neutral Gift

Gift tertentu dapat dikategorikan sebagai:

```text
NEUTRAL
```

Neutral gift:

```text
Power = 0
```

Tidak membantu tim mana pun.

---

# 26. Gift Configuration

Admin/host dapat menentukan:

```text
Gift
↓
Team
↓
Tier
↓
Power
↓
Enabled / Disabled
```

Contoh:

```text
Blue Small Gift
→ Team Blue
→ +5

Blue Medium Gift
→ Team Blue
→ +15

Blue Large Gift
→ Team Blue
→ +40
```

dan:

```text
Red Small Gift
→ Team Red
→ +5

Red Medium Gift
→ Team Red
→ +15

Red Large Gift
→ Team Red
→ +40
```

---

# 27. Gift Power

Gift menghasilkan:

> **Gift Power**

Gift Power dipisahkan dari Answer Power.

Contoh:

```text
Blue:

Answer Power = 80
Gift Power   = 90

Total Power  = 170
```

---

# 28. Gift Timing

Gift dapat diterima selama match berlangsung.

Namun untuk menjaga perhitungan stabil, gift dikumpulkan sebagai:

> **Round Gift Power**

Alur:

```text
Gift masuk
    ↓
Gift Power dicatat
    ↓
Round berjalan
    ↓
Timer selesai
    ↓
Gift Power dikunci
    ↓
Gabungkan dengan Answer Power
```

---

# 29. Gift Tidak Menghasilkan Instant Win

Gift tidak boleh:

```text
Gift besar
↓
Instant Win
```

Gift hanya menghasilkan Power.

Power kemudian memengaruhi posisi tali.

```text
Gift
 ↓
Gift Power
 ↓
Total Power
 ↓
Rope Movement
```

---

# 30. Total Power

Rumus:

```text
Total Power =
Answer Power + Gift Power
```

Contoh:

```text
BLUE

Answer Power = 120
Gift Power   = 40

Total = 160
```

```text
RED

Answer Power = 100
Gift Power   = 30

Total = 130
```

Hasil:

```text
Blue > Red

→ Rope bergerak ke Blue
```

---

# 31. Gift Display

Ketika gift diterima, tampilkan notifikasi singkat.

Contoh:

```text
┌──────────────────────┐
│ 🔵 @username         │
│ mengirim Gift Biru   │
│                      │
│       +40 POWER      │
└──────────────────────┘
```

Gift besar dapat menggunakan animasi lebih menonjol.

---

# 32. Gift Power Display

Selama ronde:

```text
🔵 GIFT POWER     🔴 GIFT POWER

     85                 40
```

Setelah ronde:

```text
ANSWER POWER     GIFT POWER

🔵 80             🔵 90
🔴 110            🔴 25
```

---

# 33. Answer Power vs Gift Power

Keduanya harus terlihat berbeda.

Contoh:

```text
🔵 TIM BIRU

Answer Power     +80
Gift Power       +90
────────────────────
TOTAL            170
```

Hal ini membuat penonton memahami kontribusi mereka.

---

# 34. Tug of War System

Di tengah arena terdapat tali.

```text
🔵 ━━━━━━━━━ 🪢 ━━━━━━━━━ 🔴
```

Terdapat:

* Tali.
* Marker tengah.
* Flag Biru.
* Flag Merah.
* Win line kiri.
* Win line kanan.

---

# 35. Rope Position

Position awal:

```text
0
```

Batas:

```text
-100 = Blue Win
+100 = Red Win
```

atau implementasi ekuivalen sesuai engine.

---

# 36. Rope Movement

Jika:

```text
Blue Total Power > Red Total Power
```

tali bergerak ke Blue.

Jika:

```text
Red Total Power > Blue Total Power
```

tali bergerak ke Red.

Jika:

```text
Blue Total Power = Red Total Power
```

tali tetap.

---

# 37. Rope Movement Formula

Contoh konsep:

```text
Power Difference =
Blue Total Power - Red Total Power
```

Semakin besar perbedaan Power, semakin besar pergerakan tali.

Namun setiap ronde harus memiliki **movement cap** agar satu ronde tidak langsung menghasilkan pergerakan ekstrem.

Contoh:

```text
Minimum Movement: 2
Maximum Movement: 20
```

Nilai dapat dikonfigurasi.

---

# 38. Win Line

Terdapat garis kemenangan pada kedua sisi.

```text
BLUE WIN                     RED WIN
   │                            │
   ▼                            ▼

━━━│━━━━━━━━ 🪢 ━━━━━━━━━━━━━━━│━━━
```

Jika marker melewati garis:

```text
🏆 TEAM BLUE WINS
```

atau:

```text
🏆 TEAM RED WINS
```

---

# 39. Early Victory

Jika win line tercapai sebelum semua ronde selesai:

```text
MATCH END
```

Contoh:

```text
Round 7

Tali melewati Blue Win Line.

→ Blue Wins
→ Round 8–10 tidak dimainkan.
```

---

# 40. Full Round Victory

Jika seluruh ronde selesai dan tidak ada tim yang mencapai win line:

Pemenang ditentukan berdasarkan posisi tali terakhir.

```text
Blue side
     ↓
━━━━━━━━ 🪢 ━━━━━━━
              ↑
           Red side
```

Marker lebih dekat ke suatu sisi → tim tersebut menang.

Jika tepat di tengah:

```text
DRAW
```

---

# 41. Streak System

Streak merupakan indikator momentum.

Streak **tidak memberikan bonus**.

Tidak ada:

```text
×2 Power
×3 Power
+50 Power
```

Streak hanya notifikasi.

---

# 42. Streak Calculation

Jika tim unggul dalam ronde berturut-turut:

```text
Round 1 → Blue
Round 2 → Blue
Round 3 → Blue
```

Maka:

```text
🔥 BLUE STREAK x3
```

---

# 43. Streak Notification

Contoh:

```text
🔥 BLUE STREAK x3!

Tim Biru unggul
3 ronde berturut-turut!
```

Durasi:

```text
±1–2 detik
```

Kemudian kembali ke gameplay.

---

# 44. Streak Broken

Jika lawan menghentikan streak:

```text
⚡ STREAK BROKEN!

Tim Merah menghentikan
streak Tim Biru!
```

Streak Biru:

```text
0
```

Streak Merah:

```text
1
```

---

# 45. No Streak Bonus

Streak tidak memengaruhi:

* Answer Power.
* Gift Power.
* Total Power.
* Rope Movement.
* Difficulty.
* Timer.

Streak hanya feedback visual.

---

# 46. Visual Design

Format:

```text
9:16 Portrait
```

Visual harus dioptimalkan untuk layar smartphone.

Gameplay harus dapat dipahami tanpa membaca banyak teks.

Prioritas:

```text
1. Soal
2. Tim
3. Timer
4. Tali
5. Power
6. Result
7. Streak
8. Supporting information
```

---

# 47. Neo-Brutalism

Game menggunakan visual **Neo-Brutalism**.

Karakteristik:

* Bold typography.
* High contrast.
* Thick borders.
* Hard offset shadows.
* Flat colors.
* Paper/card texture.
* Sticker effect.
* Tape effect.
* Rough edges.
* Hand-drawn accents.
* Asymmetrical composition.
* Strong geometric shapes.

Hindari:

* Glassmorphism.
* Excessive gradients.
* Soft floating cards.
* Excessive blur.
* Excessive glow.
* Corporate dashboard look.

---

# 48. Color System

Base:

```text
Black
Off-white
Dark Gray
```

Team:

```text
Blue
Red
```

Blue digunakan untuk:

* Team Blue.
* Blue question.
* Blue score.
* Blue flag.
* Blue rope side.
* Blue gift.

Red digunakan untuk:

* Team Red.
* Red question.
* Red score.
* Red flag.
* Red rope side.
* Red gift.

---

# 49. Typography

Typography harus:

* Bold.
* Impactful.
* Readable.
* Competitive.
* Mobile-friendly.

Angka matematika harus sangat besar.

Contoh:

```text
37 + 28
```

harus lebih dominan daripada:

```text
SOAL TIM BIRU
```

---

# 50. Main Screen Layout

Konsep:

```text
┌──────────────────────────┐
│       MATEMATIKA         │
│          BATTLE          │
│        ROUND 04          │
├────────────┬─────────────┤
│ TIM BIRU   │ TIM MERAH   │
│ 1.240      │ 1.180       │
├────────────┼─────────────┤
│            │             │
│ SOAL BIRU  │ SOAL MERAH  │
│            │             │
│ 37 + 28    │ 84 - 47     │
│    = ?     │    = ?      │
│            │             │
│   07 DETIK │ 07 DETIK    │
├────────────┴─────────────┤
│                          │
│      🔥 BLUE STREAK      │
│                          │
│ 🔵━━━━━━🪢━━━━━━🔴       │
│                          │
│      TARIK TAMBANG       │
├──────────────────────────┤
│      HASIL RONDE         │
├──────────────────────────┤
│ LIVE COMMENTS            │
└──────────────────────────┘
```

---

# 51. Round Result

Setelah timer selesai:

```text
RINGKASAN RONDE

🔵 TIM BIRU

Answer Power    +80
Gift Power      +90
TOTAL           170


🔴 TIM MERAH

Answer Power    +110
Gift Power      +25
TOTAL           135
```

Kemudian:

```text
🔵 BLUE PULL!
```

Tali bergerak.

---

# 52. Answer Result

Contoh:

```text
37 + 28 = 65
✓ 86 BENAR
```

dan:

```text
84 - 47 = 37
✓ 73 BENAR
```

---

# 53. Lobby

Sebelum match:

```text
MATEMATIKA
BATTLE

🔵 TIM BIRU      🔴 TIM MERAH

  124 pemain       119 pemain

      MATCH START
```

Pemain dapat bergabung sebelum match dimulai.

---

# 54. Victory Screen

Contoh:

```text
━━━━━━━━━━━━━━━━━━━━

       🏆 MENANG!

      TIM BIRU

      FINAL POWER
         1.842

━━━━━━━━━━━━━━━━━━━━

Rounds Played: 8
Correct Answers: 684
Gift Power: 530

       REMATCH

━━━━━━━━━━━━━━━━━━━━
```

---

# 55. Host Dashboard

Dashboard harus memiliki:

## Match

* Start Match.
* Pause.
* Resume.
* End Match.
* Restart Match.

## Team

* Assignment Mode.
* Randomize.
* Lock Team.
* Move Player.

## Question

* Difficulty.
* Operators.
* Timer.
* Number of Rounds.

## Gift

* Gift Mapping.
* Team Assignment.
* Tier.
* Power.
* Enable/Disable.

## Visual

* Streak ON/OFF.
* Power Display ON/OFF.
* Player Count ON/OFF.
* Gift Notification ON/OFF.
* Sound ON/OFF.

---

# 56. Gift Dashboard

Contoh:

```text
GIFT MANAGEMENT

┌─────────────────────────────────┐
│ Gift Name     Team   Tier Power │
├─────────────────────────────────┤
│ Gift A        🔵     Small   +5 │
│ Gift B        🔵     Medium +15 │
│ Gift C        🔵     Large  +40 │
│ Gift D        🔴     Small   +5 │
│ Gift E        🔴     Medium +15 │
│ Gift F        🔴     Large  +40 │
│ Gift G        ⚪     Neutral  0 │
└─────────────────────────────────┘
```

Admin dapat:

* Add mapping.
* Edit mapping.
* Disable mapping.
* Delete mapping.

---

# 57. Game Configuration

Default:

```text
Game:
Matematika Tarik Tambang LIVE

Teams:
2

Rounds:
10

Difficulty:
Normal

Operators:
+ -

Timer:
10 seconds

Streak:
ON

Streak Bonus:
OFF

Sound:
ON

Gift:
ON

Small Gift:
+5

Medium Gift:
+15

Large Gift:
+40
```

---

# 58. Player Data

Minimal:

```text
player_id
username
team
correct_answers
wrong_answers
total_answer_power
total_gift_power
match_power
```

---

# 59. Match Data

```text
match_id
started_at
ended_at
winning_team
total_rounds
completed_rounds
final_rope_position
blue_total_power
red_total_power
```

---

# 60. Round Data

```text
round_id
match_id
round_number

blue_question_id
blue_question
blue_answer

red_question_id
red_question
red_answer

blue_answer_power
red_answer_power

blue_gift_power
red_gift_power

blue_total_power
red_total_power

rope_position_before
rope_position_after

leading_team
streak_team
streak_count
```

---

# 61. Gift Event Data

Setiap gift event dapat dicatat:

```text
gift_event_id
match_id
round_id
player_id
username
gift_id
gift_name
team
tier
power
timestamp
```

---

# 62. Anti-Spam

Satu pemain hanya dapat memperoleh Answer Power sekali per ronde.

Untuk gift:

Setiap gift event yang valid dapat dihitung sesuai mapping.

Sistem harus tetap memiliki proteksi terhadap event duplikat.

Jika event TikTok yang sama diterima lebih dari sekali, sistem tidak boleh memberikan Power dua kali.

Gunakan unique event identifier jika tersedia.

---

# 63. Anti-Cheat

Validasi jawaban menggunakan:

```text
player_id
round_id
question_id
answer
timestamp
```

Jawaban harus:

* Berasal dari ronde aktif.
* Berasal dari soal yang sesuai.
* Masuk sebelum timer selesai.
* Belum pernah digunakan untuk Power oleh pemain tersebut.

---

# 64. Match State

State utama:

```text
LOBBY
STARTING
QUESTION_ACTIVE
ANSWER_LOCKED
CALCULATING
ROPE_ANIMATION
ROUND_RESULT
NEXT_ROUND
VICTORY
RESULT
```

---

# 65. Question State

```text
QUESTION_ACTIVE
```

Pemain dapat menjawab.

Ketika timer selesai:

```text
ANSWER_LOCKED
```

Tidak ada jawaban baru yang mendapatkan Power.

---

# 66. Gift State

Gift event selama ronde:

```text
RECEIVED
 ↓
VALIDATE
 ↓
MAP GIFT
 ↓
ASSIGN TEAM
 ↓
CALCULATE POWER
 ↓
ADD TO ROUND GIFT POWER
```

---

# 67. Round Calculation

Saat ronde selesai:

```text
Blue Total =
Blue Answer Power
+
Blue Gift Power
```

```text
Red Total =
Red Answer Power
+
Red Gift Power
```

Kemudian:

```text
Difference =
Blue Total - Red Total
```

Difference menentukan arah dan jarak pergerakan tali.

---

# 68. Equal Power

Jika:

```text
Blue Total = Red Total
```

Maka:

```text
Rope Movement = 0
```

Notifikasi:

```text
⚖️ IMBANG!
```

Opsional.

---

# 69. No Player Case

Jika satu tim tidak memiliki pemain yang menjawab benar:

```text
Answer Power = 0
```

Jika tidak ada gift:

```text
Gift Power = 0
```

Maka tim tersebut dapat memiliki:

```text
Total Power = 0
```

Game tetap berjalan.

---

# 70. Empty Match Protection

Match tidak dapat dimulai jika:

* Tidak ada pemain.
* Tidak ada tim yang aktif.
* Question generator gagal.
* Gift configuration corrupt.

Host mendapatkan error yang jelas.

---

# 71. Question Generator Failure

Jika generator gagal membuat soal:

```text
QUESTION GENERATION ERROR
```

Sistem harus:

1. Retry.
2. Menggunakan generator fallback.
3. Tidak memulai ronde sampai question valid tersedia.

Tidak boleh menampilkan:

```text
undefined
NaN
null
```

---

# 72. Gift Mapping Failure

Jika gift tidak memiliki mapping:

```text
Unknown Gift
```

Gift tidak memberikan Power.

Game tetap berjalan.

---

# 73. TikTok Event Failure

Jika event komentar/gift terlambat atau koneksi terputus:

* Game tidak crash.
* Match state tetap berjalan.
* Timer tetap konsisten.
* Event yang masuk terlambat tidak boleh dihitung untuk ronde yang sudah ditutup.

---

# 74. Performance

Game harus mampu menangani:

* Banyak komentar.
* Banyak jawaban simultan.
* Banyak gift event.
* Animasi real-time.

Processing event harus menggunakan queue/event processing agar UI tidak freeze.

---

# 75. Real-Time Requirements

Target:

```text
Comment → Game
```

harus terasa real-time.

Target internal dapat menggunakan:

```text
< 500ms
```

untuk event normal jika koneksi memungkinkan.

Latency TikTok/network tetap dianggap sebagai faktor eksternal.

---

# 76. Accessibility / Readability

Karena game ditampilkan pada TikTok LIVE:

* Text harus besar.
* Angka harus sangat jelas.
* Kontras tinggi.
* Jangan bergantung hanya pada warna.
* Tim tetap memiliki label "TIM BIRU" dan "TIM MERAH".
* Timer mudah dibaca.
* Rope position mudah dipahami.

---

# 77. Sound

Sound dapat digunakan untuk:

* Countdown.
* Correct answer.
* Wrong answer.
* Gift.
* Rope movement.
* Streak.
* Streak broken.
* Victory.

Semua sound dapat diaktifkan/nonaktifkan.

---

# 78. Sound Priority

Prioritas:

```text
Victory
↓
Streak
↓
Gift Large
↓
Rope
↓
Correct
↓
Countdown
```

Sound tidak boleh terlalu ramai ketika banyak gift masuk.

---

# 79. Gift Notification Queue

Jika banyak gift masuk bersamaan:

Jangan menampilkan 20 popup sekaligus.

Gunakan queue:

```text
Gift Event
 ↓
Queue
 ↓
Display
 ↓
Next Gift
```

Gift kecil dapat digabung.

Contoh:

```text
🔵 +25 GIFT POWER
5 gift masuk
```

Gift besar dapat ditampilkan individual.

---

# 80. Gameplay Balance

Tujuan balance:

> Jawaban matematika tetap penting, gift menjadi faktor pendukung.

Sistem harus menghindari kondisi di mana gift selalu mengalahkan gameplay matematika.

Power gift harus dapat dikonfigurasi oleh admin.

---

# 81. Example Match

## Round 1

### Blue

```text
27 + 35 = ?
```

Answer Power:

```text
128
```

Gift Power:

```text
40
```

Total:

```text
168
```

### Red

```text
84 - 29 = ?
```

Answer Power:

```text
117
```

Gift Power:

```text
30
```

Total:

```text
147
```

Result:

```text
🔵 BLUE PULL
```

---

# 82. Round 2

Blue:

```text
48 + 26 = ?
```

Red:

```text
91 - 38 = ?
```

Result:

```text
Blue = 104
Red = 131
```

Tali bergerak ke Red.

---

# 83. Round 3

Blue kembali unggul.

Streak:

```text
🔥 BLUE STREAK x2
```

Tidak ada bonus.

---

# 84. Round 4

Blue kembali unggul.

```text
🔥 BLUE STREAK x3
```

Tidak ada bonus.

---

# 85. Round 5

Red menang ronde.

```text
⚡ STREAK BROKEN!

Tim Merah menghentikan
streak Tim Biru!
```

Blue streak:

```text
0
```

Red streak:

```text
1
```

---

# 86. Comeback Example

Awalnya:

```text
🔵━━━━━━🪢━━━━━━━━🔴
```

Blue hampir mencapai win line.

Namun Red memenangkan beberapa ronde.

```text
🔵━━━━🪢━━━━━━━━━━🔴
```

Kemudian:

```text
🔵━━━━━━━━🪢━━━━━━🔴
```

Kemudian:

```text
🔵━━━━━━━━━━━━🪢━🔴
```

Red akhirnya menang.

Game harus memungkinkan comeback seperti ini.

---

# 87. Match End

Match selesai ketika:

### Kondisi A

Salah satu tim melewati win line.

### Kondisi B

Semua ronde selesai.

Kemudian:

```text
VICTORY
 ↓
RESULT
 ↓
LOBBY
```

---

# 88. Post Match Result

Tampilkan:

```text
MATCH RESULT

🏆 TIM BIRU

Final Rope Position
-72

Answer Power
1.240

Gift Power
530

Total Power
1.770

Rounds
8
```

Tim lawan juga ditampilkan.

---

# 89. Analytics

Sistem dapat menyimpan:

### Player

* Total answers.
* Correct answers.
* Average answer speed.
* Answer Power.
* Gift contribution.

### Team

* Correct answers.
* Answer Power.
* Gift Power.
* Total Power.
* Round wins.
* Maximum streak.
* Final rope position.

### Match

* Duration.
* Number of rounds.
* Number of players.
* Number of comments.
* Number of gift events.
* Winning team.

---

# 90. Future Expansion

Game dapat dikembangkan menjadi:

```text
Matematika Tarik Tambang
        ↓
Question Engine
        ↓
├── Math
├── Logic
├── Word
├── Emoji
└── General Knowledge
```

Tetapi versi pertama hanya menggunakan:

```text
+
-
```

---

# 91. Future Gift Features

Dapat dikembangkan:

* Gift combo.
* Gift streak.
* Team gift goal.
* Gift leaderboard.
* Gift animation khusus.
* Gift milestone.
* Special event gift.

Namun fitur tersebut **tidak termasuk MVP**.

---

# 92. MVP Scope

MVP wajib memiliki:

* [x] Dua tim.
* [x] Team assignment.
* [x] Dua soal berbeda.
* [x] Difficulty yang seimbang.
* [x] Addition.
* [x] Subtraction.
* [x] Timer.
* [x] Comment answer.
* [x] Answer validation.
* [x] Answer Power.
* [x] Gift Category.
* [x] Gift Mapping.
* [x] Gift Power.
* [x] Total Power.
* [x] Rope movement.
* [x] Win line.
* [x] Streak notification.
* [x] No streak bonus.
* [x] Lobby.
* [x] Victory screen.
* [x] Neo-Brutalist visual.
* [x] Portrait 9:16.
* [x] Host configuration.

---

# 93. Out of Scope MVP

Tidak termasuk versi pertama:

* Division/team lebih dari dua.
* Multiplication.
* Division.
* Power-up item.
* Player elimination.
* HP pemain.
* Character battle.
* Individual leaderboard sebagai mekanik utama.
* Gift instant win.
* Streak bonus.
* Special ability.
* Boss battle.

---

# 94. Acceptance Criteria

Game dianggap berhasil jika:

### Core

* [ ] Game dapat dimulai sebagai module terpisah.
* [ ] Matematika LIVE lama tidak berubah.
* [ ] Dua tim dapat bermain.
* [ ] Pemain dapat bergabung.
* [ ] Dua soal berbeda muncul.
* [ ] Difficulty kedua soal seimbang.

### Answer

* [ ] Timer berjalan.
* [ ] Komentar dapat menjadi jawaban.
* [ ] Jawaban benar divalidasi.
* [ ] Jawaban salah tidak memberikan Power.
* [ ] Satu pemain hanya mendapat Power sekali per ronde.
* [ ] Answer Power berdasarkan kecepatan.

### Gift

* [ ] Gift dapat dipetakan ke Tim Biru.
* [ ] Gift dapat dipetakan ke Tim Merah.
* [ ] Gift dapat dibuat Neutral.
* [ ] Gift memiliki tier.
* [ ] Gift menghasilkan Gift Power.
* [ ] Gift Power terpisah dari Answer Power.
* [ ] Gift tidak menghasilkan instant win.
* [ ] Duplicate gift event tidak dihitung dua kali.
* [ ] Gift mapping dapat dikonfigurasi.

### Tug of War

* [ ] Tali berada di tengah saat match dimulai.
* [ ] Total Power menentukan pergerakan.
* [ ] Tali bergerak secara visual.
* [ ] Win line tersedia.
* [ ] Tim dapat menang sebelum semua ronde selesai.
* [ ] Posisi akhir menentukan pemenang jika semua ronde selesai.

### Streak

* [ ] Streak dihitung.
* [ ] Streak notification tampil.
* [ ] Streak dapat broken.
* [ ] Streak tidak memberikan bonus Power.
* [ ] Streak tidak memengaruhi gameplay.

### Visual

* [ ] Portrait 9:16.
* [ ] Neo-Brutalism.
* [ ] High contrast.
* [ ] Soal mudah dibaca.
* [ ] Timer mudah dibaca.
* [ ] Team identity jelas.
* [ ] Rope position mudah dipahami.

---

# 95. Final Gameplay Summary

```text
                 MATCH
                   │
          ┌────────┴────────┐
          │                 │
       🔵 BIRU           🔴 MERAH
          │                 │
       SOAL A             SOAL B
          │                 │
       JAWABAN            JAWABAN
          │                 │
   ANSWER POWER      ANSWER POWER
          │                 │
       GIFTS               GIFTS
          │                 │
     GIFT POWER         GIFT POWER
          │                 │
          └────────┬────────┘
                   │
              TOTAL POWER
                   │
                   ▼
             🪢 TARIK TAMBANG
                   │
             ROPE MOVEMENT
                   │
          ┌────────┴────────┐
          │                 │
      BLUE WIN           RED WIN
          │                 │
          └────────┬────────┘
                   ▼
                RESULT
                   │
                   ▼
                 LOBBY
```

---

# 96. Final Rules

Aturan inti game:

1. Hanya ada **dua tim**: Biru dan Merah.
2. Setiap tim mendapatkan **soal yang berbeda**.
3. Soal kedua tim harus memiliki **tingkat kesulitan yang setara**.
4. Pemain menjawab melalui komentar.
5. Jawaban benar menghasilkan **Answer Power**.
6. Jawaban lebih cepat mendapatkan Power lebih besar.
7. Satu pemain hanya dapat memperoleh Answer Power satu kali dalam satu ronde.
8. Jawaban salah tidak memberikan penalti.
9. Setiap tim memiliki **kategori gift sendiri**.
10. Gift yang dipetakan ke suatu tim memberikan **Gift Power** kepada tim tersebut.
11. Gift dapat memiliki tier Small, Medium, dan Large.
12. Gift Neutral tidak membantu tim.
13. Gift tidak boleh menghasilkan kemenangan instan.
14. **Total Power = Answer Power + Gift Power.**
15. Total Power menentukan arah pergerakan tali.
16. Tim yang menarik tali melewati win line memenangkan match.
17. Jika semua ronde selesai, posisi akhir tali menentukan pemenang.
18. Streak hanya berupa **notifikasi**.
19. Streak **tidak memberikan bonus atau multiplier apa pun**.
20. Game ini adalah **module baru** dan tidak mengubah **Matematika LIVE** yang sudah ada.
21. Game menggunakan **portrait 9:16**.
22. Visual menggunakan **Neo-Brutalism**.
