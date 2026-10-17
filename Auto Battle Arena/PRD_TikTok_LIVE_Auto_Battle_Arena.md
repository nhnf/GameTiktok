# PRD — TikTok LIVE Auto Battle Arena

## 1. Product Overview

**Nama sementara:** LIVE Battle Arena  
**Platform:** TikTok LIVE  
**Format:** Portrait 9:16  
**Genre:** Real-time Auto Battle / Strategy / Viewer Gift Interaction  
**Mode:** 2 tim, Team A (Blue) vs Team B (Red)

### Core Loop

`Viewer Gift → Gift Mapping → Team + Unit/Effect → Spawn → Auto Movement → Auto Targeting → Combat → Defense → Base → Victory`

Game menggunakan bahasa visual game real-time battle, tetapi seluruh karakter, arena, UI, gift mapping, dan balancing dibuat original.

---

# 2. Prinsip Utama

## 2.1 Tidak Ada Permanent Team

Viewer **tidak memilih, join, atau memiliki team permanen**.

Gift secara otomatis menentukan team.

Contoh:

```text
@Ahmad → Gift Blue Tank → Team A
@Ahmad → Gift Red Archer → Team B
@Ahmad → Gift Blue Mage → Team A
```

Satu viewer boleh membantu kedua team berkali-kali dalam satu match.

Data kontribusi disimpan per **gift event**, bukan `viewer.team`.

## 2.2 Tidak Ada Comment Team Selection

Tidak ada:
- Join Team A
- Join Team B
- Select Team
- Permanent Team Assignment

## 2.3 Gift Bukan Direct Damage

Default:

`Gift → Spawn Unit → Unit Bertarung`

Bukan:

`Gift → langsung mengurangi Base HP`

Special gift di masa depan boleh memiliki efek langsung, tetapi harus dikonfigurasi dan dibalance.

---

# 3. Arena & Map

## 3.1 Format

```text
1080 × 1920
9:16
Portrait
Fixed Camera
```

Arena memakai **single central battlefield / open lane**, bukan multi-lane pada MVP.

```text
┌─────────────────────────┐
│       TEAM A HUD        │
├─────────────────────────┤
│       🏰 BLUE BASE      │
│      🗼       🗼        │
│                         │
│       BLUE UNITS        │
│          ↓↓↓            │
│                         │
│       BATTLE ZONE       │
│        ⚔ ⚔ ⚔           │
│                         │
│          ↑↑↑            │
│       RED UNITS         │
│                         │
│      🗼       🗼        │
│       🏰 RED BASE       │
├─────────────────────────┤
│ Gift Events / Activity  │
└─────────────────────────┘
```

### Zona Map

1. Team A Base
2. Team A Defense
3. Team A Territory
4. Central Battle Zone
5. Team B Territory
6. Team B Defense
7. Team B Base

Team A bergerak ke bawah. Team B bergerak ke atas.

## 3.2 Art Direction

- 3D stylized fantasy mobile game
- colorful tetapi tidak terlalu ramai
- readable silhouette
- grass, stone, trees, rocks, fences, banners, torches
- central combat path lebih bersih
- team A: blue / silver / gold
- team B: red / dark steel / gold

Background tidak boleh mengalahkan karakter atau projectile.

---

# 4. Base

Setiap team memiliki 1 Base.

### Default

```text
Base HP = 10.000
```

### Damage States

| HP | Visual |
|---|---|
| 100–75% | Normal |
| 74–50% | Retak + kerusakan ringan |
| 49–25% | Api + asap |
| 24–1% | Api besar + warning |
| 0% | Destruction |

Base mempunyai:
- central castle
- gate
- crown/emblem
- team flag
- torches
- damage states
- destruction animation

---

# 5. Defense Towers

Setiap base memiliki 2 tower.

```text
       🏰
    🗼     🗼
```

### Default Stats

```text
HP         2.500
Damage     100
Range      6
Attack     1.5 sec
```

Target default: unit musuh terdekat.

Tower membantu pertahanan, tetapi harus tetap bisa dihancurkan oleh komposisi unit yang tepat.

---

# 6. Character Roster

MVP memiliki 8 unit:

1. Tank — Guardian
2. Archer — Ranger
3. Berserker
4. Heavy — Golem
5. Mage
6. Spearman
7. Support — Priest
8. Siege

Semua unit memiliki:

- HP / Max HP
- Damage
- Attack Speed
- Range
- Move Speed
- Target Priority
- Role
- Ability
- Spawn Animation
- Idle
- Walk
- Attack
- Hit
- Ability
- Death

---

# 7. Character Design Rules

Karakter harus mudah dikenali ketika ukurannya kecil.

Formula visual:

`Strong Silhouette + Team Color + Signature Weapon + Signature VFX + Distinct Size`

Team A dan Team B memakai karakter dasar yang sama dengan variasi:
- armor accent
- cape
- glow
- projectile
- emblem
- banner

### Relative Size

```text
Spearman  0.8x
Archer    0.9x
Support   1.0x
Mage      1.0x
Berserker 1.1x
Tank      1.25x
Siege     1.2x
Heavy     1.5x
```

---

# 8. Unit Specifications

## 8.1 Tank — Guardian

**Role:** Frontline / Defender

```text
HP          1.500
Damage      80
Attack      1.5 sec
Range       1
Move Speed  0.75
Target      Nearest Enemy
```

### Ability — Shield Wall

```text
Cooldown       8 sec
Duration       3 sec
Damage Reduce  40%
```

Visual:
- armor berat
- shield besar
- tubuh besar
- shield glow saat ability

Fungsi: menahan frontline dan memberi waktu unit belakang menyerang.

---

## 8.2 Archer — Ranger

**Role:** Ranged DPS

```text
HP          550
Damage      120
Attack      1.2 sec
Range       6
Move Speed  1.0
Target      Nearest Enemy
```

### Ability — Multi Shot

Setiap 5 serangan → 2 projectile.

Visual:
- hood
- bow
- projectile jelas
- cenderung berada di belakang frontline

---

## 8.3 Berserker

**Role:** High DPS

```text
HP          800
Damage      180
Attack      1.1 sec
Range       1
Move Speed  1.2
Target      Nearest Enemy
```

### Ability — Rage

Saat HP < 40%:

```text
Attack Speed +40%
Duration = 4 sec
```

Visual berubah menjadi lebih agresif dengan red/orange glow.

---

## 8.4 Heavy — Golem

**Role:** Building Destroyer / Heavy Tank

```text
HP          2.500
Damage      150
Attack      2.2 sec
Range       1
Move Speed  0.55
Target      Defense → Base
```

Tidak memprioritaskan unit biasa.

### Ability — Ground Smash

```text
Cooldown = 10 sec
AoE Damage
Stun = 1 sec
```

Visual: tubuh sangat besar, palu besar, ground impact.

---

## 8.5 Mage

**Role:** Area Damage

```text
HP          700
Damage      220
Attack      2.0 sec
Range       5
Move Speed  0.9
Target      Largest Enemy Cluster
```

### Ability — Meteor

```text
Cooldown = 12 sec
```

Meteor menghasilkan AoE damage besar dan VFX yang sangat mudah dilihat.

---

## 8.6 Spearman

**Role:** Fast Attacker / Raider

```text
HP          450
Damage      100
Attack      0.8 sec
Range       2
Move Speed  1.5
Target      Base → Defense → Unit
```

### Ability — Dash

Melakukan dash pendek ketika menemukan target.

Fungsi: menerobos dan memberikan tekanan cepat.

---

## 8.7 Support — Priest

**Role:** Healer / Support

```text
HP          600
Damage      40
Attack      1.8 sec
Range       5
Move Speed  0.8
Target      Lowest HP Ally
```

### Basic Heal

```text
Heal = 150 HP
Cooldown = 2.5 sec
```

### Ability — Holy Light

```text
Cooldown = 12 sec
Heal = 250 HP
Area = Ally radius
```

Support bukan damage dealer utama.

---

## 8.8 Siege

**Role:** Building Killer

```text
HP          900
Damage      300
Attack      3.0 sec
Range       8
Move Speed  0.5
Target      Defense → Base
```

### Ability — Heavy Bomb

```text
Cooldown = 8 sec
AoE Explosion
```

Visual: mesin siege kecil, projectile besar, smoke + explosion.

---

# 9. Targeting System

| Unit | Priority |
|---|---|
| Tank | Nearest Enemy |
| Archer | Nearest Enemy |
| Berserker | Nearest Enemy |
| Heavy | Defense → Base |
| Mage | Largest Enemy Cluster |
| Spearman | Base → Defense → Unit |
| Support | Lowest HP Ally |
| Siege | Defense → Base |

Target berubah jika:
- target mati
- target invalid
- target keluar kondisi valid
- priority target yang lebih tinggi tersedia

---

# 10. Combat System

```text
Acquire Target
→ Move Into Range
→ Attack
→ Damage
→ Hit Effect
→ Check HP
→ Continue / Death
```

Semua combat otomatis.

Tidak ada manual attack.

### Attack Speed

`1.5 sec` = satu attack setiap 1,5 detik.

### Movement

- fixed camera
- steering
- soft separation
- minimum distance
- target locking

Unit tidak boleh menjadi satu tumpukan besar.

---

# 11. Unit Capacity

Default:

```text
40 active units / team
80 total
```

Jika penuh:

```text
Gift
→ Spawn Queue
→ Unit mati
→ Queue item spawn
```

Spawn queue harus FIFO kecuali sistem priority khusus di masa depan.

---

# 12. Spawn System

Team A spawn dekat base A.  
Team B spawn dekat base B.

Gunakan random offset kecil:

```text
X ± 40
Y ± 30
```

Jika satu gift menghasilkan banyak unit, lakukan stagger:

```text
Unit 1 = 0ms
Unit 2 = 100ms
Unit 3 = 200ms
Unit 4 = 300ms
```

Tujuan:
- visual lebih natural
- mencegah stack
- mengurangi CPU spike

---

# 13. Gift System

Format:

`Gift → Team → Unit → Quantity`

Contoh:

```text
Gift Blue Tank
→ Team A
→ Tank
→ 1
```

```text
Gift Red Archer
→ Team B
→ Archer
→ 2
```

### Contoh Mapping

```text
Gift A1 → Team A → Spearman ×1
Gift A2 → Team A → Archer ×1
Gift A3 → Team A → Tank ×1
Gift A4 → Team A → Berserker ×1
Gift A5 → Team A → Mage ×1
Gift A6 → Team A → Heavy ×1
Gift A7 → Team A → Support ×2
Gift A8 → Team A → Siege ×1

Gift B1 → Team B → Spearman ×1
Gift B2 → Team B → Archer ×1
Gift B3 → Team B → Tank ×1
Gift B4 → Team B → Berserker ×1
Gift B5 → Team B → Mage ×1
Gift B6 → Team B → Heavy ×1
Gift B7 → Team B → Support ×2
Gift B8 → Team B → Siege ×1
```

Mapping harus configurable dari dashboard.

---

# 14. Gift Tier

### Tier 1 — Small
- Spearman
- Archer

### Tier 2 — Medium
- Tank
- Berserker

### Tier 3 — Large
- Mage
- Heavy
- Support

### Tier 4 — Premium
- Siege
- special event unit

Gift value tidak boleh otomatis berarti “pasti menang”. Balance harus mempertimbangkan role, counter, frequency, dan battle impact.

---

# 15. Gift Processing

```text
TikTok Gift Event
→ Validate
→ Check event_id duplicate
→ Find Gift Mapping
→ Determine Team
→ Determine Unit
→ Check Capacity
→ Spawn / Queue
→ Save Contribution
→ Update Overlay
```

Setiap event mempunyai unique `event_id`.

Event yang sudah diproses tidak boleh diproses ulang.

---

# 16. Viewer Contribution

Data:

```text
viewer_id
viewer_name
gift_id
team
unit
quantity
timestamp
match_id
```

Tidak ada field permanent:

```text
viewer.team
```

### Contribution Score

Contoh baseline:

```text
Tank Spawn       +10
Archer Spawn     +10
Mage Spawn       +25
Heavy Spawn      +30
Siege Spawn      +40
```

Nilai configurable.

Tambahan statistik:
- total gifts
- units spawned
- damage
- building damage
- healing
- score

---

# 17. Battle Events

Contoh:

```text
⚡ @Ahmad spawned BLUE TANK!
🔥 @Budi spawned RED MAGE!
💥 RED SIEGE destroyed BLUE TOWER!
👑 BLUE BASE CRITICAL!
```

UI event harus di-throttle dan tidak menutupi battle.

Jika gift sama dikirim cepat:

```text
@Ahmad ×5
BLUE ARCHER
```

lebih baik daripada 5 notification terpisah.

---

# 18. Match Flow

## Lobby

Status:

`WAITING`

Host memilih:
- Team A
- Team B
- logo
- warna
- gift mapping
- settings

## Countdown

```text
3 → 2 → 1 → BATTLE!
```

## Battle

Gift diproses dan unit otomatis bertarung.

## Victory

Base hancur atau timer selesai.

## Result

Tampilkan:
- winner
- top contributors
- stats
- duration
- gifts
- damage

Kemudian kembali ke lobby.

---

# 19. Match Timer

Default:

```text
5 menit / 300 detik
```

Jika timer habis:

1. Bandingkan Base HP.
2. HP lebih tinggi menang.
3. Jika sama → Sudden Death.

## Sudden Death

```text
Base damage ×2
```

Gift tetap bisa masuk.

Match selesai saat salah satu base hancur.

---

# 20. Victory Conditions

```text
Base A HP <= 0 → Team B Wins
Base B HP <= 0 → Team A Wins
```

Atau saat timer habis:

```text
Higher Base HP → Winner
Equal HP → Sudden Death
```

---

# 21. Viewer MVP / Leaderboard

Kategori:

- Most Units
- Most Damage
- Most Building Damage
- Most Healing

Jangan menetapkan viewer sebagai anggota team.

Leaderboard hanya menghitung contribution dalam match.

---

# 22. Portrait UI

Target:

```text
1080 × 1920
```

Layout:

```text
┌─────────────────────────┐
│ TEAM A   VS    TEAM B   │
│ HP ████       ████████  │
│         TIMER           │
├─────────────────────────┤
│                         │
│       BLUE BASE         │
│      🗼       🗼        │
│                         │
│        BLUE UNITS       │
│            ↓            │
│       ⚔ BATTLE ⚔       │
│            ↑            │
│        RED UNITS        │
│                         │
│      🗼       🗼        │
│        RED BASE         │
│                         │
├─────────────────────────┤
│ Gift Activity            │
└─────────────────────────┘
```

### Top HUD

- Team A name
- Team A emblem
- Team A HP
- VS
- Team B name
- Team B emblem
- Team B HP
- timer

### Bottom

Gift activity, tetapi battlefield tetap menjadi fokus.

---

# 23. Victory Screen

```text
🏆 TEAM A WINS
```

Tampilkan 3–5 detik:

- winner
- top contributors
- total gifts
- battle duration
- damage
- building damage

### Animation

Loser:
`Crack → Fire → Explosion → Collapse → Smoke`

Winner:
`Flag Wave → Golden Glow → Victory Particles`

---

# 24. Character Animation

Minimum:

```text
Idle
Walk
Attack
Hit
Ability
Death
Spawn
```

Optional:

```text
Victory
Critical
Stun
Heal
```

---

# 25. Camera

Fixed camera.

Tidak ada:
- zoom ekstrem
- camera follow per unit
- camera switching

Micro shake hanya untuk:
- Heavy Smash
- Meteor
- Siege Explosion
- Base Destruction

Durasi sangat singkat.

---

# 26. VFX Rules

VFX:
- singkat
- kontras
- mudah dibaca
- tidak menutupi unit

Contoh:
`Meteor → Impact → Explosion → Damage`

Damage number dapat digunakan:
- `-120`
- `-350`
- `CRIT!`
- `+150`

Jika hit sangat banyak, gunakan aggregation untuk mencegah spam.

---

# 27. Audio

Event audio:

- spawn: short summon/pop
- attack: weapon-specific
- magic: magic sound
- siege: heavy impact
- base critical: warning
- victory: short fanfare

Audio harus memiliki volume cap.

---

# 28. Performance

Target:

```text
60 FPS ideal
30 FPS minimum acceptable
80 active units total
```

Gunakan:
- object pooling
- particle pooling
- mesh reuse
- capped VFX
- capped damage numbers
- batched updates

### AI Tick

```text
Render             60 FPS
Movement           ~30 FPS
Target Search      ~10 FPS
Combat Check       10–20 FPS
```

Tidak semua AI perlu dihitung setiap render frame.

---

# 29. Server Authority

Server/game engine menjadi sumber kebenaran.

Client/overlay hanya menampilkan state.

Server menyimpan:

```text
match
teams
baseHP
towerHP
units
unitHP
unitPosition
combat
giftEvents
viewerContribution
```

---

# 30. Data Model

## Match

```text
id
status
started_at
ended_at
winner
team_a_base_hp
team_b_base_hp
duration
```

## GiftEvent

```text
id
match_id
event_id
viewer_id
viewer_name
gift_id
gift_name
team
unit_id
quantity
timestamp
```

## Unit

```text
id
match_id
team
unit_type
hp
max_hp
x
y
target_id
state
spawned_by
created_at
```

## ViewerContribution

```text
match_id
viewer_id
viewer_name
total_gifts
units_spawned
damage
building_damage
healing
score
```

---

# 31. Unit State Machine

```text
SPAWNING
↓
IDLE
↓
SEARCHING
↓
MOVING
↓
ATTACKING
↓
ABILITY
↓
MOVING
```

Jika HP <= 0:

```text
DEATH
↓
REMOVE
```

---

# 32. Host Dashboard

## Match Control

```text
Create Match
Start
Pause
Resume
End Match
Reset
```

## Team Settings

```text
Team A Name
Team A Logo
Team A Color

Team B Name
Team B Logo
Team B Color
```

## Battle Settings

```text
Base HP
Tower HP
Match Duration
Max Units / Team
Sudden Death
Damage Multiplier
```

---

# 33. Unit Dashboard

Host dapat mengubah:

```text
HP
Damage
Attack Speed
Range
Move Speed
Ability Cooldown
Ability Power
Spawn Quantity
Target Priority
```

Semua nilai sebaiknya configurable, bukan hard-coded.

---

# 34. Gift Mapping Dashboard

Form:

```text
Gift
↓
Team
↓
Unit
↓
Quantity
```

Validation:
- gift tidak duplicate
- unit valid
- team valid
- quantity > 0
- mapping aktif

---

# 35. Live Monitor

Dashboard menampilkan:

```text
TEAM A
Base HP
Tower HP
Active Units
Queue

TEAM B
Base HP
Tower HP
Active Units
Queue
```

Juga:
- current timer
- recent gifts
- recent battle events
- top contributors

---

# 36. Match History

Simpan:

```text
Match ID
Date
Duration
Winner
Total Gifts
Team A Gifts
Team B Gifts
Top Contributors
Base Damage
Building Damage
Units Spawned
```

---

# 37. Anti Spam & Overload

Jika gift masuk sangat cepat:

```text
100 Gift Events
```

backend:
1. menerima event
2. validasi
3. queue
4. aggregate jika memungkinkan
5. spawn sesuai kapasitas
6. menjaga simulation tetap stabil

Floating notifications dibatasi, misalnya maksimal 5 aktif.

---

# 38. Balancing

Balancing tidak boleh hanya:

`Gift mahal = otomatis menang`

Gunakan:

`Role + Counter + Spawn Frequency + Battle Impact`

Contoh counter:

```text
Heavy ← kuat melawan building, rentan terhadap banyak DPS
Mage ← kuat melawan cluster, rentan terhadap unit cepat
Tank ← kuat menahan damage, tidak cepat menghancurkan building
Siege ← kuat melawan building, rentan terhadap unit cepat
```

Tujuan: komposisi pasukan penting.

---

# 39. MVP Scope

### Wajib

- 2 team
- portrait arena
- single open battlefield
- 2 base
- 4 defense tower
- 8 unit
- auto movement
- auto targeting
- auto combat
- gift mapping
- viewer bebas membantu kedua team
- spawn queue
- max unit
- timer
- victory / defeat
- dashboard
- overlay
- contribution leaderboard
- event de-duplication

### Tidak wajib MVP

- hero system
- equipment
- levels
- clan
- matchmaking
- PvP manual
- multi-lane
- map selection
- character upgrade
- permanent progression
- inventory viewer

---

# 40. Future Expansion

## New Units

- Assassin
- Dragon
- Necromancer
- Bomber
- Knight
- Summoner

## Special Gifts

Dapat memicu:
- special summon
- meteor
- heal base
- temporary buff
- boss

Semua harus configurable dan balanced.

## Boss Round

```text
BOSS INCOMING
```

Boss muncul di tengah arena. Kedua team dapat menyerang. Reward dapat dihitung berdasarkan damage/contribution.

---

# 41. Acceptance Criteria

## Gift

- Gift diterima real-time.
- Gift menentukan team.
- Gift menentukan unit.
- Satu viewer dapat membantu kedua team.
- Event duplicate tidak menghasilkan spawn kedua.
- Gift queue bekerja ketika capacity penuh.

## Battle

- Unit spawn.
- Unit bergerak.
- Unit mencari target.
- Unit menyerang.
- Unit menerima damage.
- Unit mati.
- Ability bekerja.
- Tower menyerang.
- Base menerima damage.
- Target priority bekerja.

## Match

- Countdown bekerja.
- Timer bekerja.
- Pause/resume bekerja.
- Base destruction mengakhiri match.
- Sudden Death bekerja.
- Winner ditentukan.
- Reset membuat match baru.

## Dashboard

- Host dapat mengontrol match.
- Host dapat mengatur team.
- Host dapat mengatur unit.
- Host dapat mengatur gift mapping.
- Host dapat melihat battle state.

## Overlay

- HP kedua team terlihat.
- Timer terlihat.
- Battlefield terlihat.
- Gift event terlihat.
- Victory screen terlihat.

---

# 42. Default Configuration

```json
{
  "arena": {
    "width": 1080,
    "height": 1920,
    "orientation": "portrait"
  },
  "match": {
    "duration": 300,
    "baseHp": 10000,
    "suddenDeath": true
  },
  "defense": {
    "towerCountPerTeam": 2,
    "towerHp": 2500
  },
  "units": {
    "maxActivePerTeam": 40
  },
  "teams": {
    "teamA": {
      "color": "blue"
    },
    "teamB": {
      "color": "red"
    }
  }
}
```

---

# 43. Final Product Flow

```text
TIKTOK LIVE
     ↓
GIFT EVENT
     ↓
VALIDATE EVENT
     ↓
GIFT MAPPING
     ↓
┌───────────────┐
│ Team A / Team B│
└───────────────┘
     ↓
UNIT SPAWN / QUEUE
     ↓
AUTO MOVEMENT
     ↓
AUTO TARGETING
     ↓
AUTO COMBAT
     ↓
DEFENSE
     ↓
BASE
     ↓
BASE DESTROYED
     ↓
VICTORY
     ↓
CONTRIBUTION RESULT
     ↓
NEXT MATCH
```

## Identitas Utama

> **Viewer tidak memilih team. Viewer mengendalikan battle melalui Gift. Gift menentukan pasukan. Pasukan bertarung otomatis.**

Dokumen ini menjadi baseline PRD MVP. Angka unit, gift mapping, dan balancing sengaja dibuat configurable agar dapat diuji melalui simulasi dan live testing tanpa mengubah arsitektur inti.
