# TARKAM IDM — Master Worklog

> **Terakhir diperbarui**: Session 7 (2026-03-06)
> **Status project**: Production-ready, semua bug kritis sudah diperbaiki
> **Dev server**: `bun run dev` — port 3000, double-fork via start-dev.js

---

## 📋 RINGKASAN PEKERJAAN YANG SUDAH SELESAI

### Fase 1: Code Cleanup — Dead Code Removal ✅ DONE
| # | Pekerjaan | Status |
|---|-----------|--------|
| 1 | Hapus 75+ file dead code (legacy, dashboard, community, unused landing) | ✅ DONE |
| 2 | Hapus AppView keys: `community`, `champions`, `clubs` | ✅ DONE |
| 3 | Hapus 3 dead files: league-view.tsx, match-detail-modal.tsx, 2 API routes | ✅ DONE |

### Fase 2: Liga IDM Cleanup & Peraturan Move ✅ DONE
| # | Pekerjaan | Status |
|---|-----------|--------|
| 1 | Pindahkan Peraturan dari LeagueView (admin-only) ke Beranda section | ✅ DONE |
| 2 | Hapus 'league' dari AppView type | ✅ DONE |
| 3 | Hapus LeagueView routing dari app-shell.tsx | ✅ DONE |
| 4 | Buat `peraturan-section.tsx` di landing | ✅ DONE |

### Fase 3: Bug Fix Priority Audit (15 bugs) ✅ DONE
| # | Bug | Priority | Status | Detail Perbaikan |
|---|-----|----------|--------|------------------|
| 0 | `ReferenceError: Cannot access 'autoData' before initialization` | 🔴 Critical | ✅ FIXED | MyTournamentCard: `refetchInterval` menggunakan callback `(query) => query.state.data?.liveMatch` bukan langsung akses `autoData` |
| 1 | Hero "0 Match" — `/api/stats` | 🔴 High | ✅ FIXED | Ditambah `totalMatchCount` query (db.match.count) ke /api/stats, hero-section.tsx pakai `totalMatchCount` |
| 2 | `/api/league` returns empty matches | 🔴 High | ✅ FIXED | Ditambah `tournamentMatches` query ke /api/league, totalMatches = leagueMatches + tournamentMatches |
| 3 | Clubs `malePoints`/`femalePoints` salah | 🔴 High | ✅ FIXED | `/api/stats` flatClubs sekarang kirim `malePoint`, `femalePoint`, `maleCount`, `femaleCount`. Clubs-section pakai profileId untuk merge dedup |
| 4 | Peraturan CMS prefix stripping | 🔴 High | ✅ FIXED | `settingsMap` sekarang pakai full key (`peraturan_subtitle` dll) tanpa strip prefix |
| 5 | `maleSeason!` non-null assertion crash | 🟠 Medium | ✅ FIXED | players-section.tsx: `.filter((s): s is NonNullable<typeof s> => s != null)` |
| 6 | Hero CTA "Daftar Tarkam" hardcoded `male` | 🟠 Medium | ✅ FIXED | Sekarang buka division picker modal (shared dengan Bracket CTA) |
| 7 | `/api/stats` response terlalu besar | 🟠 Medium | ✅ FIXED | topPlayers 30→20, mvpHallOfFame 10→5, sultanOfWeekly 10→5, dll |
| 8 | My Tournament Card refetch interval statis | 🟠 Medium | ✅ FIXED | 30s saat live match, 5min otherwise (via callback pattern) |
| 9 | Clubs dedup kehilangan data divisi kedua | 🟡 Low | ✅ FIXED | Merge pakai `.reduce()` + profileId, bukan `.filter()` |
| 10 | Sponsors null return layout shift | 🟡 Low | ✅ N/A | Intentional — bottom of page, no perceptible shift |
| 11 | Footer hardcoded © 2026 | 🟡 Low | ✅ FIXED | Sudah pakai `new Date().getFullYear()` + regex replace |
| 12 | Marquee ticker memory leak | 🟡 Low | ✅ FIXED | styleCache max 100 entries guard |
| 13 | Tournament hub typed `any` | 🟡 Low | ✅ FIXED | LeagueData interface di types/stats.ts |
| 14 | Donor leaderboard O(n²) rebuild | 🟡 Low | ✅ FIXED | weekDonorsMap pakai Map objects |
| 15 | .mp4 video files as avatars | 🟡 Low | ✅ N/A | Sudah ditangani oleh `isVideoUrl()` + `AvatarMedia` component |

### Fase 4: Peringkat Data Consistency Fix ✅ DONE
| # | Bug | Priority | Status | Detail Perbaikan |
|---|-----|----------|--------|------------------|
| 1 | Leaderboard menampilkan `totalLosses` (lifetime) bukan per-season | 🔴 Critical | ✅ FIXED | Tambah `seasonLosses` dari PlayerPoint `match_loss` records. Leaderboard sekarang pakai `seasonLosses ?? totalLosses` |
| 2 | Modal profil menampilkan 2L padahal match TBD (belum ada skor) | 🔴 Critical | ✅ FIXED | Modal sekarang hitung W/L dari match history data (actual results), bukan DB counter. TBD matches TIDAK dihitung sebagai loss |
| 3 | Tidak ada per-season loss tracking | 🔴 High | ✅ FIXED | Score route sekarang buat `match_loss` PlayerPoint records (amount: 0) untuk setiap loss. Stats API hitung `seasonLosses` dari records ini |
| 4 | `seasonWins` dihitung dengan `_count` bukan `_sum` | 🟠 Medium | ✅ FIXED | Ada historical records yang aggregate (amount=N), jadi pakai `_sum.amount` bukan `_count.reason` |
| 5 | `seasonLosses` di-strip dari API response | 🟠 Medium | ✅ FIXED | topPlayers `.map()` destructuring menghapus `seasonLosses` — dihapus dari destructure list |
| 6 | Player counter phantom data (totalLosses/matches salah) | 🟠 Medium | ✅ FIXED | Script `repair-player-counters.ts` recalculate dari actual Match records. 15 players fixed |
| 7 | Backfill match_loss records untuk data historis | 🟠 Medium | ✅ FIXED | Script `backfill-match-losses.ts` buat 36 match_loss records dari 12 completed matches |

---

## 📁 FILE YANG PERNAH DIMODIFIKASI

### Backend (API Routes)
| File | Perubahan |
|------|-----------|
| `src/app/api/stats/route.ts` | +totalMatchCount, +malePoint/femalePoint/maleCount/femaleCount, **RESTORE matches/totalLosses/maxStreak/lifetimePoints/city di topPlayers** (sebelumnya di-trim), **+seasonLosses query dari PlayerPoint match_loss**, **seasonWins pakai _sum.amount bukan _count.reason**, **+seasonLossesMap + seasonMatches field**, **fix seasonLosses tidak di-strip dari response** |
| `src/app/api/league/route.ts` | +tournamentMatches query, totalMatches = league + tournament |
| `src/app/api/cms/settings/route.ts` | Tidak diubah (sudah benar) |
| `src/app/api/tournaments/[id]/score/route.ts` | **+match_loss PlayerPoint record creation** saat player kalah (amount: 0, untuk per-season loss tracking) |
| `src/app/api/admin/backfill-match-losses/route.ts` | **NEW** — One-time backfill endpoint untuk membuat match_loss records dari data historis |
| `scripts/backfill-match-losses.ts` | **NEW** — Backfill script (bun run scripts/backfill-match-losses.ts) |
| `scripts/repair-player-counters.ts` | **NEW** — Repair script untuk sync totalWins/totalLosses/matches dengan actual Match records |

### Frontend Components
| File | Perubahan |
|------|-----------|
| `src/components/idm/my-tournament-card.tsx` | Fix `refetchInterval` TDZ → callback pattern |
| `src/components/idm/landing/clubs-section.tsx` | Fix malePoints/femalePoints mapping, profileId merge |
| `src/components/idm/landing/peraturan-section.tsx` | Fix settingsMap: full key access (no prefix strip) |
| `src/components/idm/landing/players-section.tsx` | Fix `maleSeason!` → type-safe filter |
| `src/components/idm/landing/hero-section.tsx` | +totalMatchCount usage, +division picker modal for Daftar |
| `src/components/idm/landing/landing-footer.tsx` | Dynamic year (sudah benar, tidak diubah) |
| `src/components/idm/landing-page.tsx` | +PeraturanSection import, removed dead imports |
| `src/components/idm/player-profile.tsx` | **+matchHistoryStats override** — hitung W/L dari match history data (hanya completed matches). **+seasonWins/seasonLosses/seasonMatches dari caller** (prefer season data over lifetime). **+displayWins/displayLosses/displayMatches/displayWinRate** — final display values pakai match history → season data → lifetime fallback |
| `src/components/idm/community-dashboard/community-leaderboard.tsx` | **displayLosses pakai `seasonLosses ?? totalLosses`** bukan hanya `totalLosses` |

### State & Navigation
| File | Perubahan |
|------|-----------|
| `src/lib/store.ts` | Removed 'community', 'champions', 'clubs', 'league' from AppView |
| `src/components/idm/app-shell.tsx` | Removed LeagueView, community redirect |
| `src/hooks/use-shell-theme.ts` | Removed 'league', 'community' checks |

### Types
| File | Perubahan |
|------|-----------|
| `src/types/stats.ts` | +totalMatchCount field, +LeagueData interface |

---

## 🗑️ FILE YANG SUDAH DIHAPUS (JANGAN BUAT ULANG)

```
# Phase 1 — Legacy cleanup (75+ files)
src/components/layout/Navbar.tsx, Footer.tsx
src/components/admin/ (5 files)
src/components/auth/AuthDialog.tsx
src/components/bracket/TournamentBracket.tsx
src/components/dashboard/ (19 files)
src/components/idm/dashboard/ (21 files)
src/components/ui/social-feed.tsx
10 unused landing sections: about, how-it-works, dream, champions, mvp, cta, video-modal, experiences, season-champion, highlights

# Phase 1 — Dead standalone components (23 files)
the-dream, cta, gallery, ticker, mvp, sawer, bantuan-view, footer, champions, login-page, ranking-panel, activity-feed, tournament-view, participant-grid, player-comparison, club-peserta, gallery-section, hero, splash-screen, player-search, my-account-card, player-quick-search, countdown-timer

# Phase 2 — Liga IDM cleanup
src/components/idm/league-view.tsx
src/components/idm/match-detail-modal.tsx
src/app/api/league-matches/[id]/route.ts
src/app/api/league-matches/club/route.ts
```

---

## 🏗️ ARSITEKTUR SAAT INI

### AppView Type (store.ts)
```typescript
type AppView = 'landing' | 'peringkat' | 'hasil' | 'bracket' | 'juara' | 'pemain' | 'admin' | 'bantuan' | 'register' | 'login';
```

### Landing Page Section Order
1. HeroSection
2. MarqueeTicker
3. TournamentHub (MyTournamentCard + Division Info)
4. PlayersSection (Peringkat)
5. ClubsSection
6. PeraturanSection ← baru ditambahkan (dari LeagueView)
7. SponsorsSection
8. DonorLeaderboardSection
9. LandingFooter

### API Endpoints YANG MASIH AKTIF
- `/api/stats?division=male|female|semua` — data utama hero + peringkat + clubs
- `/api/league` — data clubs + tournament matches + tarkam champion
- `/api/tournaments/my-status` — my tournament card
- `/api/tournament-status` — registration status
- `/api/cms/settings` — CMS key-value settings
- `/api/feed` — marquee ticker feed
- `/api/sponsors` — sponsors section
- `/api/league-matches` — admin settings panel

### API Endpoints YANG SUDAH DIHAPUS
- `/api/league-matches/[id]` — dead (match-detail-modal deleted)
- `/api/league-matches/club` — dead (not called from frontend)

---

## ⚠️ HAL YANG PERLU DIPERHATIKAN

### Dev Server
- **Double-fork**: `start-dev.js` → `dev-intermediate.js` → Next.js (grandchild reparented to PID 1)
- **NODE_OPTIONS=--max-old-space-size=4096**: Wajib, tanpa ini OOM crash
- **SQLite lokal**: `bun run db:push` untuk push schema, `switch-provider.mjs sqlite` auto-run saat dev
- **Neon PostgreSQL**: Production DB, quota bisa exceeded (HTTP 402)

### Schema
- **Champion/MVP fields**: Ada di **Season** model, BUKAN Tournament
- **PlayerPoint system**: `type` field (match_win, prize_juara1, prize_mvp, etc.), `points`, `playerId`
- **Club division**: Setiap Club record punya 1 division. ClubProfile = persistent entity. ClubProfile bisa punya Club records di male DAN female season.

### Known Issues (low priority, bisa ditangani nanti)
- Neon quota exceeded → tidak bisa sync data ke production DB (butuh project baru)
- Empty Juara page & Peringkat page — mungkin butuh data atau komponen baru
- Female data delay — kadang data female sedikit terlambat load

### Data Flow: Leaderboard vs Player Profile Modal (SUDAH FIX - Session 6)
- **Leaderboard** (`/api/stats` topPlayers): Mengirim `points` (season), `seasonPoints`, `lifetimePoints`, `totalWins`, `totalLosses`, `matches`, `maxStreak`, `streak`, `totalMvp`, `city`, **`seasonWins`** (dari _sum.amount PlayerPoint match_win), **`seasonLosses`** (dari _count PlayerPoint match_loss), **`seasonMatches`** (seasonWins + seasonLosses)
- **Leaderboard display**: `displayWins = seasonWins ?? totalWins`, `displayLosses = seasonLosses ?? totalLosses` — per-season data preferred
- **Modal enrichment** (`/api/players/[id]`): Mengirim lifetime data dari tabel Player (sekarang sudah diperbaiki oleh repair script)
- **Modal match history** (`/api/players/[id]/matches`): Mengirim actual match results — TBD/upcoming matches have `result: null`, completed matches have `result: 'win'|'loss'`
- **Merge logic di player-profile.tsx** (UPDATED):
  - Priority 1: **matchHistoryStats** — hitung W/L dari actual match results (paling akurat, TBD tidak dihitung sebagai loss)
  - Priority 2: **season data dari caller** (seasonWins, seasonLosses, seasonMatches dari leaderboard)
  - Priority 3: **lifetime data** dari enrichment API (fallback)
  - `points` (display) → seasonPoints dari caller (leaderboard), bukan lifetime
  - `lifetimePoints` → dari enrichment API, ditampilkan sebagai subtitle "X total"
- **Score route**: Saat submit skor, buat `match_win` PlayerPoint (amount: 1) untuk pemenang DAN `match_loss` PlayerPoint (amount: 0) untuk yang kalah. Keduanya punya seasonId untuk per-season tracking.

---

## 📊 VERIFIKASI TERAKHIR

```
/api/stats?division=male  → totalMatchCount: 20, clubs: 10, totalPlayers: 20
  Zico: seasonWins=3, seasonLosses=0, seasonMatches=3, totalWins=3, totalLosses=0, matches=3 ✓
  afroki: seasonWins=2, seasonLosses=2, seasonMatches=4, totalWins=2, totalLosses=2, matches=4 ✓
/api/stats?division=female → totalMatchCount: 6, clubs: 10, totalPlayers: 12
/api/league → hasData: true, totalClubs: 14, totalMatches: 26, tournamentMatches: 26
/api/cms/settings → peraturan_* keys tersedia dan terbaca oleh peraturan-section
Backfill: 36 match_loss records created from 12 completed matches
Repair: 15 players had phantom counters fixed (totalLosses/matches synced with actual Match data)
Page load → HTTP 200, no console errors
Lint → only pre-existing script/ errors (not app code)
```

### Fase 5: Streak Data Fix ✅ DONE
| # | Bug | Priority | Status | Detail Perbaikan |
|---|-----|----------|--------|------------------|
| 1 | Players dengan 0 losses tapi streak=0 (Zico, Ren, Predator: 3W 0L, streak harusnya 3) | 🔴 High | ✅ FIXED | Recalculate streak & maxStreak dari actual Match records. 18 players fixed |
| 2 | maxStreak inflated (seed data / repair script artifacts) | 🟠 Medium | ✅ FIXED | zico: maxStreak 5→3, Ren: 5→3, players tanpa completed matches: maxStreak → 0 |

**Detail Fix:**
- Recalculate `streak` (current consecutive wins) dan `maxStreak` (longest ever) dari actual completed Match records
- Players tanpa completed matches: streak=0, maxStreak=0
- Players dengan losses terakhir: streak=0
- Players yang masih menang berturut: streak = current win count
- 18 players diperbaiki, termasuk Zico (0→3), Ren (0→3), Predator (0→3)

### Fase 6: Tournament Reset & Rollback Fix ✅ DONE
| # | Bug/Feature | Priority | Status | Detail Perbaikan |
|---|-------------|----------|--------|------------------|
| 1 | DELETE tournament tidak rollback `totalLosses` | 🔴 Critical | ✅ FIXED | Ditambah `lossesDelta` ke playerStatChanges map. Losing team players sekarang mendapat -1 totalLosses saat tournament dihapus |
| 2 | DELETE tournament tidak rollback `totalMvp` | 🔴 High | ✅ FIXED | Ditambah MVP rollback dari Participation records (isMvp=true). totalMvp di-decrement untuk setiap MVP turnamen |
| 3 | DELETE tournament set `streak: 0` tanpa recalculate | 🟠 Medium | ✅ FIXED | Streak & maxStreak sekarang di-recalculate dari sisa PlayerPoint records (match_win/match_loss) di season yang sama, bukan hard-reset ke 0 |
| 4 | Completed tournament tidak bisa dihapus | 🟠 Medium | ✅ FIXED | Ditambah `?force=true` parameter untuk mengizinkan penghapusan turnamen completed. Tanpa force, tetap diblock dengan pesan informatif |
| 5 | DELETE tournament tidak update PlayerSeasonStats | 🟠 Medium | ✅ FIXED | Ditambah `recalculateSeasonStats()` helper yang upsert PlayerSeasonStats setelah rollback |
| 6 | Hero banner "Match" count delay (0 → "—" → 12) | 🟠 Medium | ✅ FIXED | Hero section sekarang menampilkan match count segera setelah data male tersedia, tidak menunggu female data (yang di-delay 1.5-3s oleh deferredQueriesReady) |
| 7 | DELETE response tidak informatif | 🟡 Low | ✅ FIXED | Response sekarang menyertakan rollback summary (jumlah players, clubs, MVPs yang di-rollback) |

**Detail Fix:**

#### Tournament DELETE Endpoint (`/api/tournaments/[id]`)
- **Before**: Hanya rollback points, totalWins, matches. Streak di-set ke 0. totalLosses, totalMvp, maxStreak TIDAK di-rollback.
- **After**: Full rollback mencakup:
  1. `points` — dikurangi dari PlayerPoint records (sudah ada)
  2. `totalWins` — dikurangi per completed match win (sudah ada)
  3. `totalLosses` — dikurangi per completed match loss (**BARU**)
  4. `matches` — dikurangi per completed match (sudah ada)
  5. `totalMvp` — dikurangi per MVP participation (**BARU**)
  6. `streak` & `maxStreak` — recalculated dari sisa match data di season (**BARU**, sebelumnya hard-reset ke 0)
  7. `PlayerSeasonStats` — recalculated setelah rollback (**BARU**)
  8. Club stats — sudah ada, tidak berubah

- **Force delete**: `DELETE /api/tournaments/[id]?force=true` mengizinkan penghapusan turnamen completed
- **Response**: Menyertakan `rollback` object dengan summary

#### Helper Functions (BARU)
- `recalculateStreaks(playerIds, seasonId)` — Recalculate streak & maxStreak dari sisa PlayerPoint records
- `recalculateSeasonStats(playerIds, seasonId, division)` — Upsert PlayerSeasonStats setelah rollback

#### Hero Section Match Count Fix
- **Before**: `totalMatches` hanya dihitung jika KEDUA divisi (male & female) punya data → delay 1.5-3s
- **After**: `totalMatches` dihitung segera dari data yang tersedia (male data loads first, tanpa delay)
- `hasAnyMatchData` flag untuk menampilkan angka atau skeleton "—"

#### Alur Reset Per Week (Admin Flow)
1. Admin hapus turnamen: `DELETE /api/tournaments/[id]?force=true`
2. Sistem rollback otomatis: points, W/L, streak, MVP, club stats, season stats
3. Semua data turnamen dihapus: matches, teams, participations, prizes, point records, achievements, sponsors
4. Player stats bersih dari turnamen tersebut, stats dari turnamen lain tetap utuh
5. Admin bisa buat turnamen baru untuk week yang sama

### Fase 7: Bracket Visibility After Finalization ✅ DONE
| # | Bug | Priority | Status | Detail Perbaikan |
|---|-----|----------|--------|------------------|
| 1 | Admin panel: bracket hilang setelah finalisasi (status `completed` tidak termasuk di render condition) | 🔴 High | ✅ FIXED | Tambah `completed` ke bracket render condition di tournament-manager.tsx |
| 2 | Stats API: match data di-strip untuk tournament completed (hanya kirim id/name/weekNumber/status) | 🔴 High | ✅ FIXED | Completed tournament sekarang menyertakan full match data + teams untuk bracket display |
| 3 | Public bracket: bracket kosong ketika turnamen completed dan turnamen baru dibuat | 🔴 High | ✅ FIXED | Tambah `latestBracketTournament` field ke stats API + BracketContent fallback logic |

**Detail Fix:**

#### Admin Panel — Bracket Render Condition (`tournament-manager.tsx`)
- **Before**: Bracket hanya tampil untuk status `bracket_generation`, `main_event`, `finalization`
- **After**: Tambah `completed` → bracket tetap terlihat untuk review setelah finalisasi
- Admin actions (Re-generate, Mulai Event, dll) sudah ter-gate oleh status check, jadi tidak muncul di completed

#### Stats API — Completed Tournament Match Data (`/api/stats/route.ts`)
- **Before**: `activeTournament` untuk status `completed` hanya mengirim `{ id, name, weekNumber, status, division }` — TANPA match data
- **After**: Completed tournament mengirim full match data + teams + format/scheduledAt/prizePool, tapi TANPA participations/donations (tidak perlu untuk bracket display)
- **New field**: `latestBracketTournament` — Fallback query yang mencari latest completed tournament WITH matches, hanya di-query ketika `activeTournament` tidak ada atau tidak punya matches

#### BracketContent — Fallback Logic (`match-day-center.tsx`)
- **Before**: Hanya pakai `data.activeTournament.matches` → kosong ketika tournament completed tanpa match data, atau ketika tournament baru tanpa matches
- **After**: Fallback ke `data.latestBracketTournament.matches` ketika activeTournament tidak punya matches
- Format selector dan sponsor section juga menggunakan bracketTournament (fallback-aware)

#### MatchDayContent — Fallback Logic (`match-day-center.tsx`)
- **Before**: `const tournamentMatches = t?.matches || []` — hanya pakai activeTournament
- **After**: `const bracketT = t?.matches?.length ? t : data.latestBracketTournament` — fallback ke completed tournament bracket
- Sponsor dan match meta sections juga menggunakan bracketT
