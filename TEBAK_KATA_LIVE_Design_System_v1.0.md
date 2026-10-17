# 🎮 TEBAK KATA LIVE — Design System & UI/UX Design Guide

**Version:** 1.0  
**Status:** Design Reference / Implementation Ready  
**Target:** TikTok LIVE Game  
**Primary Canvas:** 1080 × 1920 px (9:16)  
**Host Dashboard:** 1440 × 900 px

---

# 1. Design Direction

## Konsep

**Premium Arcade × TikTok LIVE Game Show**

Karakter visual:

- Dark
- Energetic
- Playful
- Competitive
- Modern
- High contrast
- Mudah dibaca saat LIVE
- Terasa seperti game show, bukan dashboard biasa

Prinsip utama:

> **Word first. Everything else supports the word.**

Hierarki visual:

1. WORD
2. CATEGORY
3. GAME STATE / CTA
4. WINNER / EVENT
5. LEADERBOARD
6. Secondary information

---

# 2. Product Interface

Produk dibagi menjadi tiga interface:

```text
TEBAK KATA LIVE
│
├── TikTok Overlay
│   └── Untuk penonton
│
├── Host Dashboard
│   └── Untuk mengendalikan game
│
└── Admin / Setup
    └── Untuk mengatur database dan konfigurasi
```

---

# 3. Canvas & Grid

## TikTok Overlay

```text
1080 × 1920 px
Aspect ratio: 9:16
```

Safe area:

```text
Horizontal: 72 px
Vertical: 96 px
```

Content width:

```text
936 px
```

Struktur:

```text
┌──────────────────────────────┐
│          96px                │
│                              │
│        HEADER                │
│                              │
│      CATEGORY               │
│                              │
│      WORD DISPLAY           │
│                              │
│     COMMENT CTA             │
│                              │
│     LEADERBOARD              │
│                              │
│     SESSION INFO             │
│                              │
│          96px                │
└──────────────────────────────┘
```

## Host Dashboard

Primary:

```text
1440 × 900 px
```

Minimum:

```text
1280 × 720 px
```

---

# 4. Color System

## Background

| Token | Hex | Usage |
|---|---|---|
| Background | `#08090D` | Main background |
| Surface | `#11131A` | Cards |
| Surface 2 | `#171A22` | Secondary cards |
| Surface 3 | `#1D202A` | Hover / elevated surfaces |

## Primary

| Token | Hex |
|---|---|
| Primary | `#8B5CF6` |
| Primary Hover | `#A78BFA` |
| Primary Soft | `#2A1D46` |

## Secondary

```text
Cyan: #22D3EE
```

## Semantic

```text
Success: #34D399
Warning: #FBBF24
Danger:  #F87171
```

## Text

```text
Text Primary:   #F8FAFC
Text Secondary: #A1A1AA
Text Muted:     #71717A
```

## Border

```text
Border:        #272A34
Border Strong: #3A3E4A
```

---

# 5. Gradient

Primary game gradient:

```text
#8B5CF6 → #22D3EE
```

Gunakan secara terbatas untuk:

- Logo
- Active state
- Winner
- Boss
- Progress
- Highlight

Jangan menggunakan gradient pada semua komponen.

---

# 6. Typography

## Display Font

Rekomendasi:

**Bebas Neue**

Digunakan untuk:

- TEBAK KATA
- K E L A S
- BOSS
- +50

Ukuran:

```text
Hero Word: 72–112 px
Game Title: 48–64 px
Boss: 64–96 px
```

## UI Font

**Inter**

| Element | Size |
|---|---:|
| Page title | 24 px |
| Section title | 16 px |
| Body | 14 px |
| Small | 12 px |
| Caption | 11 px |

---

# 7. Spacing System

Gunakan kelipatan 4:

```text
4
8
12
16
20
24
32
40
48
64
80
96
```

Standar:

```text
Card padding: 24 px
Component gap: 16 px
Small gap: 8 px
Section gap: 32 px
Major section: 48 px
```

---

# 8. Border Radius

```text
Small:      8 px
Button:     10 px
Card:       16 px
Large card: 24 px
Pill:       999 px
```

---

# 9. Shadow & Glow

Normal:

```text
0 8px 30px rgba(0,0,0,.25)
```

Primary glow:

```text
0 0 30px rgba(139,92,246,.25)
```

Winner glow:

```text
0 0 60px rgba(34,211,238,.35)
```

Glow hanya digunakan untuk state penting.

---

# 10. Button System

## Primary Button

Contoh:

```text
┌──────────────────────┐
│       💡 HINT        │
└──────────────────────┘
```

```text
Height: 44 px
Horizontal padding: 16 px
Radius: 10 px
```

## Secondary

```text
[ SKIP ]
```

## Danger

```text
[ END LIVE ]
```

Gunakan confirmation untuk aksi berbahaya.

## Icon Button

```text
[ ⚙ ]
```

```text
40 × 40 px
```

---

# 11. Badge System

Difficulty:

```text
● EASY
● MEDIUM
● HARD
```

```text
Height: 28 px
Padding: 8px 12px
Radius: 999px
```

Category:

```text
🍔 MAKANAN
```

Category hanya memberi tahu kategori, **bukan petunjuk jawaban**.

---

# 12. Word Display

Word Display adalah komponen paling penting.

## Prinsip

Jangan menggunakan kotak huruf yang terlalu berat.

Lebih baik:

```text
K     E     L     _     _
─     ─     ─     ─     ─
```

Huruf harus terlihat sebagai hero element.

## Desktop Host

```text
Letter width: 64 px
Letter height: 80 px
Gap: 12 px
Font: 56 px
```

## Vertical Overlay

```text
Letter: 72 × 88 px
```

Untuk kata panjang, ukuran font otomatis mengecil.

---

# 13. Word Reveal Logic

Huruf hanya terbuka jika tebakan cocok dengan urutan dari awal.

Contoh target:

```text
KELAS
```

Tebakan:

```text
KOTAK
```

Hasil:

```text
K _ _ _ _
```

Karena hanya `K` yang benar pada posisi awal.

Tebakan:

```text
KEMAS
```

Hasil:

```text
K E _ _ _
```

Tebakan lengkap:

```text
KELAS
```

Hasil:

```text
K E L A S
```

Hanya tebakan lengkap yang mendapatkan poin.

---

# 14. Letter States

## Hidden

```text
_
```

Menggunakan muted text.

## Revealed

```text
K
```

Menggunakan text primary dengan glow.

## Newly Revealed

Animasi:

```text
scale: 0.75 → 1
opacity: 0 → 1
```

Duration:

```text
300 ms
```

Tambahkan glow singkat.

---

# 15. Vertical TikTok Overlay

Komposisi:

```text
┌──────────────────────────────┐
│                              │
│         TEBAK KATA           │
│          ● LIVE              │
│                              │
│       🍔 MAKANAN             │
│                              │
│          K E L _ _           │
│                              │
│       ───────────────        │
│                              │
│     💬 TEBAK DI KOMENTAR     │
│                              │
│                              │
│       🏆 TOP PLAYERS         │
│                              │
│      🥇 ANDI       45        │
│      🥈 BUDI       30        │
│      🥉 SITI       20        │
│                              │
│       WORDS FOUND 27         │
│       👑 BOSS IN 3           │
│                              │
└──────────────────────────────┘
```

Word adalah focal point.

---

# 16. Overlay Header

Position:

```text
Top: ~96 px
```

Center aligned.

```text
TEBAK KATA
LIVE
```

Title:

```text
48 px
```

LIVE badge:

```text
12 px
```

---

# 17. Category Area

Position sekitar:

```text
300–360 px
```

Contoh:

```text
🍔 MAKANAN
```

Style:

- Pill
- Surface semi-transparent
- Center aligned
- Tidak terlalu besar

---

# 18. Word Area

Posisi sekitar:

```text
Top: ~500 px
```

Contoh:

```text
K    E    L    _    _
```

Tambahkan subtle glow di belakang word area.

Tujuannya membuat penonton langsung fokus ke kata.

---

# 19. Comment CTA

```text
💬 TEBAK DI KOMENTAR
```

Ukuran:

```text
20–24 px
```

Animasi ringan:

```text
opacity: 0.75 → 1
```

Loop sekitar:

```text
2.5 s
```

CTA harus selalu terbaca.

---

# 20. Leaderboard Overlay

Hanya tampilkan Top 3 agar gameplay tetap dominan.

```text
🏆 TOP PLAYERS

🥇 ANDI       45
🥈 BUDI       30
🥉 SITI       20
```

Card:

```text
Width: 80–85%
Radius: 20 px
Padding: 20 px
```

---

# 21. Player Row

```text
Height: 44 px
Avatar: 32 × 32 px
Username: 14 px
Score: 16 px bold
```

Struktur:

```text
🥇 [Avatar] ANDI                  45
```

---

# 22. Session Progress

Contoh:

```text
WORDS FOUND
27

👑 BOSS IN 3
```

Tidak perlu progress bar besar.

Informasi ini bersifat sekunder.

---

# 23. Host Dashboard Layout

```text
┌─────────────────────────────────────────────────────────┐
│ TOP BAR                                    🟢 LIVE      │
├──────────────┬──────────────────────┬──────────────────┤
│              │                      │                  │
│ SIDEBAR      │ GAME CONTROL         │ LIVE CHAT        │
│              │                      │                  │
│ Dashboard    │ CURRENT WORD         │ comments         │
│ Game         │                      │                  │
│ Words        │ K E L _ _            │                  │
│ Categories   │                      │                  │
│ Gifts        │ [HINT] [SKIP]        │                  │
│ Analytics    │                      │                  │
│ Settings     │ LEADERBOARD          │                  │
│              │                      │                  │
├──────────────┴──────────────────────┴──────────────────┤
│ SESSION STATS                                           │
└─────────────────────────────────────────────────────────┘
```

---

# 24. Sidebar

Width:

```text
220 px
```

Menu:

```text
🎮 Dashboard
🔤 Game
📚 Words
🏷 Categories
🎁 Gifts
📊 Analytics
⚙ Settings
```

Active state:

```text
background: #1D202A
left accent
```

---

# 25. Host Topbar

Height:

```text
64 px
```

Isi:

```text
TEBAK KATA LIVE

                         🟢 LIVE
                         @username
                         ⚙
```

---

# 26. Current Puzzle Panel

Panel harus menunjukkan:

```text
CURRENT WORD

KELAS

K E L _ _

🍔 PENDIDIKAN
● EASY
```

Host juga dapat melihat jawaban sebenarnya.

---

# 27. Host Controls

Primary:

```text
[ 💡 HINT ]
[ ⏭ SKIP ]
[ ⏸ PAUSE ]
```

Secondary:

```text
[ NEW WORD ]
[ END LIVE ]
```

`END LIVE` harus memakai confirmation dialog.

---

# 28. Answer Visibility

Host:

```text
TARGET ANSWER

KELAS
```

Overlay:

```text
K E L _ _
```

Opsional:

```text
[ 👁 SHOW ANSWER ]
```

---

# 29. Live Chat Panel

Contoh:

```text
LIVE CHAT
────────────────

ANDI
KOTAK

BUDI
KEMAS

SITI
KELAM

RIAN
KELAS
```

Chat row:

```text
Padding: 12 px
```

Hover:

```text
Surface 2
```

---

# 30. Correct Answer State

Ketika jawaban lengkap ditemukan:

```text
┌─────────────────────────┐
│ 🎯 CORRECT ANSWER       │
│                         │
│ @RIAN                   │
│ KELAS                   │
│                         │
│ +10 POINT               │
└─────────────────────────┘
```

Animasi:

```text
fade in
scale .95 → 1
```

---

# 31. Winner Animation

Timeline:

```text
0 ms       Normal game
200 ms     Screen glow
400 ms     WORD FOUND
700 ms     Winner name
1000 ms    +POINT
2200 ms    Fade
2800 ms    New word
```

Visual:

```text
🎉

WORD FOUND

KELAS

@ANDI

+10 POINT
```

---

# 32. New Word Animation

Jangan mengganti kata secara kasar.

Flow:

```text
OLD WORD
↓
Fade out
↓
✨ NEW WORD
↓
Category
↓
Hidden letters
```

Durasi:

```text
~1 second
```

---

# 33. Hint Animation

Sebelum:

```text
K E _ _ _
```

Animasi:

```text
✨
↓
L
```

Setelah:

```text
K E L _ _
```

Label:

```text
💡 LETTER REVEALED
```

Hint hanya membuka huruf berikutnya.

---

# 34. Gift System Visual

Gift hanya berfungsi untuk membuka huruf.

Contoh:

```text
🌹

@BUDI
sent a gift

NEXT LETTER
REVEALED
```

Kemudian:

```text
K E L _ _
↓
K E L A _
```

Gift tidak memberikan poin secara langsung.

---

# 35. Gift Animation Timeline

```text
0 ms       Gift appears
150 ms     Glow
300 ms     Letter reveal
700 ms     Celebration
1600 ms    Fade out
```

Total:

```text
~1.8 seconds
```

Gift event tidak boleh menutupi gameplay terlalu lama.

---

# 36. Boss Round

Boss adalah state khusus yang lebih spektakuler.

Normal:

```text
🔥 TEBAK KATA

🍔 MAKANAN

K E L _ _
```

Boss:

```text
👑 BOSS WORD

💻 TEKNOLOGI

_ _ _ _ _ _ _ _ _

+50 POINT
```

Boss menggunakan:

- Stronger glow
- Animated particles
- Crown icon
- Special title
- Larger reward
- Stronger typography

Struktur dasar gameplay tetap sama.

---

# 37. Boss Transition

Ketika Boss aktif:

```text
👑
BOSS INCOMING
```

Kemudian:

```text
👑 BOSS WORD

💻 TEKNOLOGI

_ _ _ _ _ _ _ _ _
```

Intro:

```text
2–3 seconds
```

---

# 38. Boss Defeated

```text
╭────────────────────────╮
│                        │
│      👑 DEFEATED!      │
│                        │
│      K O M P U T E R   │
│                        │
│      @ANDI             │
│                        │
│       +50 POINT        │
│                        │
╰────────────────────────╯
```

Gunakan confetti.

---

# 39. Guess Heat

Elemen opsional untuk meningkatkan rasa ramai:

```text
🔥 GUESSING...
```

Saat komentar meningkat:

```text
🔥🔥🔥 GUESSING INTENSITY
```

Jika sangat ramai:

```text
🔥🔥🔥🔥🔥
```

Ini bukan scoring.

Fungsinya hanya memberikan feedback bahwa chat sedang aktif.

---

# 40. Motion System

## Fast

```text
150–200 ms
```

Untuk:

- Hover
- Button
- Small UI transitions

## Normal

```text
250–350 ms
```

Untuk:

- Letter reveal
- Card transitions
- State changes

## Celebration

```text
600–1000 ms
```

Untuk:

- Winner
- Boss
- Major events

Gunakan easing:

```text
ease-out
spring-like
```

Hindari animasi permanen yang mengganggu pembacaan.

---

# 41. Sound Design

## Letter Reveal

Soft click.

## Hint

Magic/reveal sound.

## Gift

Short premium chime.

## Winner

Success jingle.

## Boss

Dramatic transition.

Sound harus bisa dimatikan.

---

# 42. Responsive Word Algorithm

Contoh:

```text
3 letters
→ 88 px

5 letters
→ 80 px

8 letters
→ 64 px

10+ letters
→ 48–56 px
```

Tujuan:

> Kata selalu berada dalam safe area.

---

# 43. UI States

## Idle

```text
🔤 TEBAK KATA

GAME READY

Waiting for LIVE...
```

## Active

```text
🍔 MAKANAN

K E L _ _

💬 TEBAK DI KOMENTAR
```

## Letter Revealed

```text
K E L _ _
```

dengan reveal animation.

## Winner

```text
🎉 WORD FOUND!

KELAS

@ANDI

+10 POINT
```

## Boss

```text
👑 BOSS WORD

_ _ _ _ _ _
```

## Paused

```text
GAME PAUSED

Host sedang menjeda permainan.
```

## Connection Error

Overlay:

```text
⚠ CONNECTION ISSUE

Reconnecting...
```

Host:

```text
TikTok Connection
🔴 Disconnected

[ RECONNECT ]
```

---

# 44. Accessibility

Minimum requirements:

- Contrast tinggi.
- Jangan mengandalkan warna saja untuk status.
- Font dashboard minimal 12 px.
- Word memiliki kontras sangat tinggi.
- Animasi dapat dimatikan.
- Sound dapat dimatikan.
- Status penting memiliki icon + text.

---

# 45. Figma Component Structure

```text
Design System
│
├── Typography
├── Colors
├── Icons
├── Buttons
├── Badges
├── Cards
├── Avatar
├── Leaderboard
├── Word Display
├── Category Badge
├── Difficulty Badge
├── Game Status
├── Winner Card
├── Gift Event
├── Boss Banner
├── Toast
└── Modal
```

---

# 46. Overlay Component Tree

```text
<GameOverlay>

  <Header />

  <CategoryBadge />

  <DifficultyBadge />

  <WordDisplay />

  <GuessCTA />

  <Leaderboard />

  <SessionProgress />

  <EventLayer>
      <LetterReveal />
      <GiftAnimation />
      <WinnerAnimation />
      <BossAnimation />
      <Confetti />
  </EventLayer>

</GameOverlay>
```

---

# 47. Host Dashboard Component Tree

```text
<HostDashboard>

  <Sidebar />

  <Topbar />

  <MainContent>

    <CurrentPuzzle />

    <GameControls />

    <Leaderboard />

    <SessionStats />

  </MainContent>

  <LiveChat />

  <EventNotifications />

</HostDashboard>
```

---

# 48. Design Hierarchy

## TikTok Overlay

```text
WORD
 ↓
CATEGORY
 ↓
COMMENT CTA
 ↓
EVENT / WINNER
 ↓
LEADERBOARD
 ↓
SESSION INFO
```

## Host Dashboard

```text
CURRENT GAME
 ↓
GAME CONTROLS
 ↓
LIVE CHAT
 ↓
LEADERBOARD
 ↓
SESSION ANALYTICS
```

---

# 49. Do / Don't

## Jangan

- Terlalu banyak panel pada overlay.
- Terlalu banyak warna.
- Terlalu banyak animasi.
- Word terlalu kecil.
- Leaderboard terlalu dominan.
- Text panjang.
- Overlay terlihat seperti admin dashboard.
- Gift menutupi gameplay terlalu lama.
- Confetti untuk setiap kejadian kecil.

## Harus

- Word sangat jelas.
- Category langsung terbaca.
- CTA komentar jelas.
- Winner terasa rewarding.
- Boss terasa spesial.
- Leaderboard mudah dipahami.
- Animasi cepat.
- Dark background.
- High contrast.
- Vertical-first.

---

# 50. Screen Map

```text
                    TEBAK KATA LIVE
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
       OVERLAY            HOST            ADMIN
          │              DASHBOARD          │
          │                │                │
       TikTok           Control Game      Database
       LIVE             Read Chat         Words
          │             Leaderboard        Categories
          │             Gift Events        Gifts
          │             Statistics         Settings
          │
       Audience
```

---

# 51. UX Flow Penonton

```text
Masuk LIVE
    ↓
Melihat kategori
    ↓
Melihat huruf yang terbuka
    ↓
Membaca CTA
    ↓
Menebak lewat komentar
    ↓
Huruf terbuka jika prefix cocok
    ↓
Menebak lagi
    ↓
Jawaban lengkap
    ↓
Pemenang mendapatkan poin
    ↓
Leaderboard berubah
    ↓
Kata baru
    ↓
Main lagi
```

Tidak ada timer.

Tidak ada ronde.

Leaderboard di-reset setiap LIVE.

Hanya penebak pertama yang memberikan jawaban lengkap yang mendapatkan poin.

---

# 52. Core Gameplay UI Rules

## Rule 1 — Prefix Reveal

Jika tebakan hanya cocok pada beberapa huruf awal:

```text
Target: KELAS
Guess:  KEMAS

Display:
K E _ _ _
```

## Rule 2 — Complete Answer

Hanya jawaban lengkap:

```text
KELAS
```

yang memberikan poin.

## Rule 3 — Hint

Hint hanya membuka huruf berikutnya.

## Rule 4 — Gift

Gift hanya membuka huruf berikutnya.

## Rule 5 — Leaderboard

Leaderboard reset ketika LIVE baru dimulai.

## Rule 6 — No Timer

Tidak ada countdown untuk puzzle normal.

## Rule 7 — Category

Kategori ditampilkan, tetapi tidak memberikan petunjuk tambahan.

---

# 53. Final Design Philosophy

Game harus terasa:

> **“Masuk LIVE → lihat kata → langsung ikut nebak.”**

Bukan:

> “Masuk LIVE → membaca tutorial → memahami UI → baru bermain.”

Maka desain harus mempertahankan tiga elemen sebagai pusat:

```text
        🔤 WORD
           +
       🏷 CATEGORY
           +
      💬 COMMENT CTA
```

Leaderboard, gift, Boss, animation, dan statistik semuanya mendukung tiga elemen tersebut.

---

# 54. Implementation Priority

Urutan implementasi visual yang direkomendasikan:

```text
PHASE 1
│
├── Design Tokens
├── Typography
├── Colors
├── Word Display
├── Category
└── Basic Overlay
        ↓
PHASE 2
│
├── Host Dashboard
├── Game Controls
├── Live Chat
└── Leaderboard
        ↓
PHASE 3
│
├── Letter Animation
├── Winner Animation
├── Hint Animation
└── Gift Animation
        ↓
PHASE 4
│
├── Boss
├── Boss Animation
└── Confetti
        ↓
PHASE 5
│
├── Words
├── Categories
├── Gift Configuration
└── Settings
```

---

# 55. Design QA Checklist

Sebelum dianggap selesai, cek:

### Overlay

- [ ] 1080×1920
- [ ] Safe area diterapkan
- [ ] Word adalah elemen terbesar
- [ ] Category mudah dibaca
- [ ] CTA komentar terlihat
- [ ] Top 3 leaderboard terlihat
- [ ] Tidak ada informasi berlebihan

### Host Dashboard

- [ ] 1440×900
- [ ] Current word terlihat
- [ ] Target answer tersedia untuk host
- [ ] Hint tersedia
- [ ] Skip tersedia
- [ ] Pause tersedia
- [ ] Live chat terlihat
- [ ] Leaderboard terlihat
- [ ] End Live menggunakan confirmation

### Animation

- [ ] Letter reveal < 350ms
- [ ] Winner animation tidak mengganggu
- [ ] Gift animation singkat
- [ ] Boss terasa berbeda
- [ ] Confetti hanya pada event besar
- [ ] Reduced motion tersedia

### Gameplay

- [ ] Prefix matching benar
- [ ] Jawaban lengkap memberikan poin
- [ ] First correct answer menang
- [ ] Hint membuka satu huruf
- [ ] Gift membuka satu huruf
- [ ] Tidak ada timer
- [ ] Leaderboard reset setiap LIVE

---

# 56. Final Principle

> **The game should be understood before it is explained.**

Jika penonton baru masuk LIVE dan dalam kurang dari beberapa detik mereka dapat memahami:

**“Ini kategorinya → ini hurufnya → saya harus menebak lewat komentar”**

maka UI/UX sudah berhasil.

---

**End of Design System v1.0**
