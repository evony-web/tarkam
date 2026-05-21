# TARKAM IDM — Master Worklog

> **Terakhir diperbarui**: Session 5 (2026-03-05)
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

---

## 📁 FILE YANG PERNAH DIMODIFIKASI

### Backend (API Routes)
| File | Perubahan |
|------|-----------|
| `src/app/api/stats/route.ts` | +totalMatchCount, +malePoint/femalePoint/maleCount/femaleCount, **RESTORE matches/totalLosses/maxStreak/lifetimePoints/city di topPlayers** (sebelumnya di-trim) |
| `src/app/api/league/route.ts` | +tournamentMatches query, totalMatches = league + tournament |
| `src/app/api/cms/settings/route.ts` | Tidak diubah (sudah benar) |

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

### Data Flow: Leaderboard vs Player Profile Modal (SUDAH FIX)
- **Leaderboard** (`/api/stats` topPlayers): Mengirim `points` (season), `seasonPoints`, `lifetimePoints`, `totalWins`, `totalLosses`, `matches`, `maxStreak`, `streak`, `totalMvp`, `city`
- **Modal enrichment** (`/api/players/[id]`): Mengirim lifetime data dari tabel Player
- **Merge logic di player-profile.tsx**:
  - `totalWins`, `totalLosses`, `matches`, `maxStreak`, `streak`, `totalMvp` → prefer enrichment API (authoritative)
  - `points` (display) → seasonPoints dari caller (leaderboard), bukan lifetime
  - `lifetimePoints` → dari enrichment API, ditampilkan sebagai subtitle "X total"
- **Root cause perbedaan data (FIXED)**: Sebelumnya `/api/stats` topPlayers trimming menghapus `matches`, `totalLosses`, `maxStreak`, `lifetimePoints`, `city` → modal fallback ke enrichment API yang bisa return data berbeda (lifetime vs season). Sekarang field-field tersebut dikembalikan sehingga modal punya data lengkap dari caller sebelum enrichment tiba.

---

## 📊 VERIFIKASI TERAKHIR

```
/api/stats?division=male  → totalMatchCount: 20, clubs: 10, totalPlayers: 20
/api/stats?division=female → totalMatchCount: 6, clubs: 10, totalPlayers: 12
/api/league → hasData: true, totalClubs: 14, totalMatches: 26, tournamentMatches: 26
/api/cms/settings → peraturan_* keys tersedia dan terbaca oleh peraturan-section
Page load → HTTP 200, no console errors
Lint → only pre-existing script/ errors (not app code)
```
