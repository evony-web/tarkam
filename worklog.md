# Worklog — Task 2-b: Optimize API Caching & SSR Revalidation for Vercel Speed Insights

## Date: 2026-03-04

## Task
Optimize API caching and SSR revalidation to reduce TTFB from 1.02s to <0.8s.
Increase CDN cache durations and add proper `stale-while-revalidate` headers.

## Changes Applied

### 1. SSR Cache Revalidation — `/home/z/my-project/src/lib/landing-data.ts`
- **Line 737**: `fetchLandingStatsCached` revalidate changed from `300` → `600` (5min → 10min)
- **Line 900**: `fetchLandingLeagueCached` revalidate changed from `300` → `600` (5min → 10min)
- Rationale: Data barely changes — 10 minutes is fine and cuts SSR DB queries in half

### 2. API Route Cache Headers

#### `/home/z/my-project/src/app/api/stats/route.ts`
- **Surrogate-Key**: Changed from `'league-data'` → `'stats-data'` for targeted revalidation
- Cache-Control already had `s-maxage=60, stale-while-revalidate=300` ✅
- Updated comment to reflect correct CDN cache duration and Surrogate-Key

#### `/home/z/my-project/src/app/api/leaderboard/route.ts`
- **Cache-Control**: Changed from `s-maxage=10, stale-while-revalidate=60` → `s-maxage=60, stale-while-revalidate=300`

#### `/home/z/my-project/src/app/api/rankings/route.ts`
- **Cache-Control**: Changed from `no-store, no-cache, must-revalidate` → `public, s-maxage=60, stale-while-revalidate=300`

#### `/home/z/my-project/src/app/api/feed/route.ts`
- **Cache-Control**: Changed from `s-maxage=30, stale-while-revalidate=60` → `s-maxage=60, stale-while-revalidate=300`

#### `/home/z/my-project/src/app/api/tournament-status/route.ts`
- **Cache-Control**: Changed from `s-maxage=30, stale-while-revalidate=60` → `s-maxage=30, stale-while-revalidate=120`
- Shorter s-maxage because tournament status changes more frequently

#### `/home/z/my-project/src/app/api/league/route.ts`
- Already had `s-maxage=60, stale-while-revalidate=300` ✅ — No changes needed

#### `/home/z/my-project/src/app/api/cms/content/route.ts`
- **Cache-Control**: Changed from `s-maxage=60, stale-while-revalidate=300` → `s-maxage=300, stale-while-revalidate=600`
- CMS content changes very rarely — 5min CDN cache + 10min stale-while-revalidate
- Updated comment to reflect new caching strategy

## Verification
- `bun run lint` — ✅ No errors

---

# Worklog — Task 2-c: Optimize Landing Page INP & FCP

## Date: 2026-03-04

## Task
Optimize the landing page for INP (504ms → target <200ms) and FCP (2.22s → target <1.8s).

## Changes Applied to `/home/z/my-project/src/components/idm/landing-page.tsx`

### Fix 1: Dynamic import MarqueeTicker
- Removed synchronous `import { MarqueeTicker } from './marquee-ticker'` (was line 16)
- Added `const MarqueeTicker = dynamic(() => import('./marquee-ticker').then(m => ({ default: m.MarqueeTicker })), { ssr: false, loading: () => <div className="h-12" /> })` alongside other dynamic imports

### Fix 2: Dynamic import BackToTop & ScrollProgress
- Removed synchronous imports for `BackToTop` and `ScrollProgress` (were lines 99-100)
- Added two dynamic imports with `ssr: false` and `loading: () => null`

### Fix 3: Stagger React Query polling intervals
- `stats female`: `refetchInterval: 300000` → `330000` (5.5min, staggered 30s from male)
- `league-landing`: `refetchInterval: 600000` → `660000` (11min, staggered 1min from cms)
- Added `refetchIntervalInBackground: false` to all 5 queries

### Fix 4: Add `notifyOnChangeProps` to stats queries
- Added `notifyOnChangeProps: ['data', 'error']` to both male and female stats queries

## Verification
- `bun run lint` — ✅ No errors

---

# Worklog — Task 2: Create Standalone Page View Components

## Date: 2026-03-04

## Task
Create 4 standalone page view components that wrap existing section components with their own data fetching, enabling page-based navigation instead of scroll-based.

## Files Created

### 1. `/home/z/my-project/src/components/idm/players-page.tsx`
- Full page view for Players (Pemain)
- Fetches male and female stats data using React Query with season selector support (`selectedSeasonId`)
- Renders existing `PlayersSection` component as main content
- Page header with back button, title, and "Daftar" registration button
- Manages state: `selectedPlayer`, `showAllMalePlayers`, `showAllFemalePlayers`, `selectedSeasonId`
- Includes `PlayerProfile` modal and `RegistrationModal`
- Dynamic imports for code splitting

### 2. `/home/z/my-project/src/components/idm/highlights-page.tsx`
- Full page view for Highlights/Juara
- Fetches male and female stats data + league data + CMS data using React Query
- Renders existing `HighlightsSection` component
- Page header with back button, title, and Crown icon
- Manages state: `selectedPlayer`, `preferredSkinType`, `videoModal` state
- Includes `PlayerProfile` modal (with `preferredSkinType` for MVP context) and `VideoModal`
- `setSelectedPlayer` wrapper clears `preferredSkinType` for non-MVP contexts (same pattern as landing-page.tsx)

### 3. `/home/z/my-project/src/components/idm/champions-page.tsx`
- Full page view for Season Champions
- Fetches male and female stats data + league data using React Query
- Renders existing `SeasonChampionSection` component
- Page header with back button, title, and Trophy icon
- Manages state: `selectedPlayer`, `selectedClub`
- Includes `PlayerProfile` modal and `ClubProfile` modal
- Passes `isSeasonDataPlaceholder` and `skinMap` to SeasonChampionSection

### 4. `/home/z/my-project/src/components/idm/clubs-page.tsx`
- Full page view for Clubs
- Fetches male and female stats data + league data + CMS data using React Query with season selector support
- Renders existing `ClubsSection` component
- Page header with back button, title, and Shield icon
- Manages state: `selectedClub`, `showAllClubs`, `selectedSeasonId`
- Includes `ClubProfile` modal

## Design Decisions
- All pages use `'use client'` directive for client-side rendering
- Consistent page header pattern: sticky, backdrop blur, back button → landing view, title + subtitle
- Data fetching patterns match existing landing-page.tsx (staleTime, refetchInterval, placeholderData, etc.)
- Dynamic imports with `ssr: false` for all section components and modals to reduce initial bundle
- Each page is self-contained with its own data fetching — works independently
- State management uses `useState` and `useCallback` from React
- Uses `useAppStore` from `@/lib/store` for `setCurrentView` navigation
- All modals conditionally rendered only when their state is non-null

## Verification
- `bun run lint` — ✅ No errors
- Dev server running without compilation errors

## Task 3+4+5: Page-based navigation (scroll → view)

**Date:** 2026-03-05

### Summary
Changed from scroll-based single-page navigation to page-based navigation. When clicking a nav item like "Pemain", it now opens a separate page/view instead of scrolling to the section.

### Changes Made

#### `src/components/idm/app-shell.tsx`
1. **Added icon imports**: `Crown`, `Trophy`, `Music` to the lucide-react import
2. **Added dynamic imports** for 4 new page components: `PlayersPage`, `HighlightsPage`, `ChampionsPage`, `ClubsPage`
3. **Updated `communityNavItems`**: Added 5 new items (Pemain/Music, Juara/Crown, Season/Trophy, Club/Shield) between Komunitas and Arena Live
4. **Updated `renderView()` switch**: Added cases for `'players'`, `'highlights'`, `'champions'`, `'clubs'`
5. **Updated sidebar icon backgrounds**: Added `iconBg` entries for new view IDs (`players`, `highlights`, `champions`, `clubs`)
6. **Updated `isFullBleed` check**: Added new view names so they get full-bleed mobile styling
7. **Updated mobile header view name mapping**: Added `'players': 'Pemain'`, `'highlights': 'Juara'`, `'champions': 'Season'`, `'clubs': 'Club'`
8. **Replaced mobile bottom nav**: Changed from (Home, Komunitas, Live-FAB, Market, Aturan) to (Home, Pemain/Music, Live-FAB, Juara/Crown, Club/Shield)

#### `src/components/idm/landing-page.tsx`
1. **Added `AppView` type import** from `@/lib/store`
2. **Added `currentView`** to the `useAppStore()` destructure
3. **Removed `Play` icon** import (no longer used in mobile nav)
4. **Removed `scrollToSection` function** and `activeSection` state + IntersectionObserver
5. **Updated Desktop Nav Links**: Changed from scroll-based (`scrollToSection(item.id)`, `activeSection === item.id`) to view-based (`setCurrentView(item.view)`, `currentView === item.view`)
6. **Updated Mobile Bottom Nav**: Changed from scroll-based to view-based navigation with new items (Kompetisi/Swords, Pemain/Music, Juara/Crown-special, Season/Trophy, Club/Shield)
7. **Kept `scrolled` state and scroll listener** since they're used for nav background styling

### Verification
- ESLint: No errors
- Dev server: Running without errors
---
Task ID: 1-6
Agent: Main Agent + Subagents
Task: Change from scroll-based navigation to page-based navigation - clicking nav items opens separate page views instead of scrolling to sections

Work Log:
- Updated AppView type in store.ts to add: "players" | "highlights" | "champions" | "clubs"
- Created 4 standalone page view components:
  - players-page.tsx: Full page for Pemain with own data fetching, season selector, player profile modals
  - highlights-page.tsx: Full page for Juara with MVP cards, weekly champions, video modals
  - champions-page.tsx: Full page for Season Champions with duo champion display
  - clubs-page.tsx: Full page for Club directory with season selector, club profiles
- Updated app-shell.tsx:
  - Added dynamic imports for all 4 new page components
  - Added renderView cases for players, highlights, champions, clubs
  - Updated communityNavItems with 8 items: Komunitas, Pemain, Juara, Season, Club, Arena Live, Marketplace, Peraturan
  - Updated mobile bottom nav: Home, Pemain, Live (FAB), Juara, Club
- Updated landing-page.tsx:
  - Desktop nav: Changed from scrollToSection() to setCurrentView() with view-based items
  - Mobile bottom nav: Changed from scroll-based to view-based navigation
  - Removed scrollToSection function and activeSection IntersectionObserver (no longer needed)
  - Kept scrolled state for nav background styling

Stage Summary:
- Navigation is now page-based instead of scroll-based
- Each section (Pemain, Juara, Season, Club) opens as a separate page with its own data fetching
- Landing page remains as the home/summary page
- Lint passes clean, dev server running without errors
- All new pages have back buttons to return to landing
