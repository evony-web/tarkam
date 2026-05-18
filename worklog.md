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
---
Task ID: 1
Agent: Main Agent
Task: Restructure Tarkam navigation from dashboard sidebar to public page layout

Work Log:
- Created `/home/z/my-project/src/components/idm/public-page-layout.tsx` — a landing-page-style layout with:
  - Fixed top nav (logo, nav links: Kompetisi/Pemain/Juara/Season/Club, theme toggle, login button)
  - Mobile bottom nav (Home + 4 nav items)
  - LandingFooter (same as landing page footer)
  - ScrollProgress and BackToTop
  - UnifiedLoginModal support
  - No sidebar, no dashboard feel
- Modified `/home/z/my-project/src/components/idm/app-shell.tsx`:
  - Added `isPublicView` check for views: players, highlights, champions, clubs, community
  - Public views now render inside `<PublicPageLayout>` instead of the dashboard sidebar layout
  - Dashboard/admin/matchday/marketplace/league/bracket/register still use the sidebar layout
- Updated page components to remove their own sticky headers:
  - `players-page.tsx`: Replaced sticky header with gradient title banner
  - `highlights-page.tsx`: Replaced sticky header with gradient title banner
  - `champions-page.tsx`: Replaced sticky header with gradient title banner
  - `clubs-page.tsx`: Replaced sticky header with gradient title banner
  - Removed unused ArrowLeft imports and setCurrentView calls from all 4 pages
- Fixed TypeScript error: `preferredSkinType` null vs undefined in highlights-page.tsx

Stage Summary:
- Public views (Pemain, Juara, Season, Club, Kompetisi) now open in a landing-page-style layout
- No more dashboard sidebar when navigating from landing page
- Admin/Dashboard/Arena Live/Marketplace still use the sidebar layout
- All pages compile and render successfully (HTTP 200)

---
Task ID: 7
Agent: Main Agent
Task: Add Peringkat (ranking) section to landing page below Kompetisi section

Work Log:
- Created `/home/z/my-project/src/components/idm/landing/peringkat-section.tsx` — new landing page section wrapping CommunityLeaderboard + PeringkatHeader from community-dashboard
- Modified `/home/z/my-project/src/components/idm/landing-page.tsx`:
  - Added dynamic import for PeringkatSection
  - Added Award icon import from lucide-react
  - Inserted PeringkatSection between TournamentHub (Kompetisi) and PlayersSection
  - Updated desktop nav: Added "Peringkat" between Kompetisi and Pemain with scroll-to behavior
  - Updated mobile bottom nav: Replaced "Season" with "Peringkat" (Award icon, scroll-to behavior)
  - Updated deep link handler: `?view=peringkat` now scrolls to `#peringkat` section instead of navigating to community dashboard
- Modified `/home/z/my-project/src/components/idm/public-page-layout.tsx`:
  - Added Award icon import
  - Added "Peringkat" to publicNavItems (between Kompetisi and Pemain)
  - Desktop nav: Peringkat click navigates to landing + scrolls to section
  - Mobile nav: Peringkat click navigates to landing + scrolls to section
- Reverted AppView type change (no separate 'peringkat' page needed — it's on the landing page)

Stage Summary:
- Peringkat section (player ranking table + club standings table) now appears on the landing page
- Positioned below Kompetisi section and above Pemain section
- Navigation item "Peringkat" scrolls to the section on the landing page
- Uses existing CommunityLeaderboard component with full player/club toggle and division filter
- Lint passes clean, dev server compiles without errors

---
Task ID: 8
Agent: Main Agent
Task: Fix Peringkat navigation (show only peringkat content, not entire landing page) + Fix section heading sizes + Polish UX for elegant, professional look

Work Log:
- Updated AppView type in store.ts: Added "peringkat" as a valid view
- Created `/home/z/my-project/src/components/idm/peringkat-page.tsx` — standalone page for Peringkat with own data fetching, compact header banner, PlayerProfile and ClubProfile modals
- Updated `/home/z/my-project/src/components/idm/app-shell.tsx`:
  - Added dynamic import for PeringkatPage
  - Added "peringkat" to publicViews array (uses PublicPageLayout, not sidebar)
  - Added renderPublicView case for 'peringkat'
  - Added Award icon import
  - Added Peringkat to communityNavItems in sidebar
  - Added iconBg for peringkat in sidebar
  - Added peringkat to mobile header view name mapping
- Updated `/home/z/my-project/src/components/idm/landing-page.tsx`:
  - Changed Peringkat nav from scrollTo to setCurrentView('peringkat')
  - Updated both desktop and mobile navigation
  - Updated deep link handler: ?view=peringkat now uses setCurrentView('peringkat') instead of scrolling
- Updated `/home/z/my-project/src/components/idm/public-page-layout.tsx`:
  - Removed scrollTo behavior from Peringkat nav item
  - Changed to setCurrentView('peringkat') for both desktop and mobile nav
- Updated `/home/z/my-project/src/components/idm/landing/shared.tsx`:
  - Reduced SectionHeader title size: text-3xl sm:text-4xl lg:text-5xl font-black → text-xl sm:text-2xl lg:text-3xl font-bold
  - Removed shimmer line animation (visual noise)
  - Reduced label pill size (px-4 py-1.5 → px-3 py-1, icon w-4 h-4 → w-3.5 h-3.5, text 11px → 10px)
  - Reduced spacing: mb-12 sm:mb-16 → mb-6 sm:mb-8
  - Reduced subtitle size: text-sm sm:text-[15px] → text-xs sm:text-sm
  - Reduced gradient line widths
- Updated all page banner headers for consistency:
  - players-page.tsx: text-2xl sm:text-3xl font-black py-6 sm:py-8 → text-lg sm:text-xl font-bold py-4 sm:py-5
  - champions-page.tsx: same reduction
  - highlights-page.tsx: same reduction
  - clubs-page.tsx: same reduction
  - peringkat-page.tsx: already created with compact banner
- Updated section padding across landing page sections:
  - tournament-hub.tsx: py-10 sm:py-24 → py-6 sm:py-12
  - players-section.tsx: py-10 sm:py-24 → py-6 sm:py-12
  - peringkat-section.tsx: py-10 sm:py-24 → py-6 sm:py-12
  - highlights-section.tsx: py-20 sm:py-28 → py-8 sm:py-14
  - experiences-section.tsx: py-16 sm:py-24 → py-6 sm:py-12
  - clubs-section.tsx: py-16 sm:py-24 → py-6 sm:py-12
  - season-champion-section.tsx: py-24 → py-6 sm:py-12

Stage Summary:
- Peringkat now opens as a standalone page (like Pemain, Juara, Season, Club) — no longer shows entire landing page
- Section headings are now compact and elegant (xl-2xl-3xl instead of 3xl-4xl-5xl)
- Page banners are consistent and professional (lg-xl font-bold instead of 2xl-3xl font-black)
- Section padding is much tighter and professional
- Removed excessive shimmer animation from SectionHeader
- All navigation (desktop, mobile, sidebar) consistently uses setCurrentView for Peringkat
- Lint passes clean, dev server compiles without errors

---
Task ID: 1
Agent: Main Agent
Task: Remove redundant SectionHeader headings from navigation menu pages (Peringkat, Pemain, Juara, Season, Club)

Work Log:
- Added `hideHeader` optional boolean prop to 5 landing section components:
  - `peringkat-section.tsx` — hides SectionHeader (label pill + title + subtitle) when hideHeader=true
  - `players-section.tsx` — hides SectionHeader when hideHeader=true, moved Season Selector out of stagger-item wrapper
  - `highlights-section.tsx` — hides SectionHeader (AnimatedSection + SectionHeader) when hideHeader=true
  - `season-champion-section.tsx` — hides SectionHeader when hideHeader=true
  - `clubs-section.tsx` — hides SectionHeader when hideHeader=true, removed stale stagger-item wrapper div
- Passed `hideHeader` from each page component:
  - `peringkat-page.tsx` → `<PeringkatSection hideHeader />`
  - `players-page.tsx` → `<PlayersSection hideHeader />`
  - `highlights-page.tsx` → `<HighlightsSection hideHeader />`
  - `champions-page.tsx` → `<SeasonChampionSection hideHeader />`
  - `clubs-page.tsx` → `<ClubsSection hideHeader />`
- Verified CommunityDashboard (Kompetisi) page doesn't use SectionHeader — no changes needed
- Fixed JSX closing tag issue in clubs-section.tsx (extra closing div from removed stagger-item wrapper)
- Lint passes clean, dev server compiles successfully

Stage Summary:
- Each navigation menu page now only shows the Page Title Banner (compact h1 + subtitle), not the duplicate SectionHeader below
- On the landing page, SectionHeader still renders normally (hideHeader defaults to false)
- This eliminates the redundant double-heading issue the user reported

---
Task ID: 9
Agent: Main Agent
Task: Refactor MyTournamentCard: hide "Belum Ada Turnamen" when empty, show search results in modal instead of inline

Work Log:
- Completely rewrote `/home/z/my-project/src/components/idm/my-tournament-card.tsx`
- Removed overview query and all overview-related rendering (tournament status cards, live matches, champion card, top teams, recent results, upcoming matches, participants, help card)
- Default view now only shows the search bar (no "Belum Ada Turnamen" card)
- When user types name and clicks "Cari", a Dialog modal opens with tournament results
- Modal has gradient header (division-themed), scrollable body, close button
- Modal content shows all search result states: loading, error, not found, no active tournament, no team, full team dashboard with match history
- Search results are rendered inside the modal instead of replacing the search bar inline
- Removed framer-motion dependency (replaced with CSS animations)
- Removed unused imports: motion, AnimatePresence, ArrowRight, Award, Gamepad2, MapPin, Heart, Flame, Radio, Calendar, Star, OverviewMatch/Team/Player types
- Added Dialog/DialogContent/DialogHeader/DialogTitle/DialogDescription imports
- Added X icon import for modal close button

Stage Summary:
- "Cari Turnamen Kamu" section on landing page now shows only the search bar when empty
- No "Belum Ada Turnamen" text shown when no search is active
- Search results display in a modal popup with division-themed header
- Lint passes clean, TypeScript compiles without errors
---
Task ID: 1
Agent: Main Agent
Task: Create Hasil (Results) section on landing page showing only SF & GF with CTA

Work Log:
- Explored codebase structure: landing page sections, match data APIs, navigation, Prisma schema
- Modified `/api/matches/recent` route to include `bracket` and `division` fields in response, plus `bracket` query param filtering and increased limit cap to 20
- Created `/src/components/idm/landing/hasil-section.tsx` — new section component
  - Fetches GF matches via `bracket=grand_final` and SF candidates via `bracket=upper` 
  - Displays match cards with team names, scores, MVP, division badge, bracket label
  - GF cards have gold accent, SF cards have division-colored accent
  - Shows up to 4 matches (max 2 GF + 2 SF)
  - CTA "Lihat Semua Hasil" navigates to community view → scrolls to #section-matches
- Added lazy-loaded HasilSection import to landing-page.tsx
- Placed HasilSection between Kompetisi and Peringkat sections (with SectionDividers)
- Lint passed clean, dev server running, API endpoints returning 200s

Stage Summary:
- New Hasil section live on landing page below Kompetisi
- API enhanced with bracket filter + division field
- Shows SF & GF results only, with CTA to full results page
---
Task ID: 2
Agent: Main Agent
Task: Enhance landing HasilSection, change CTA to Bracket, remove Kompetisi nav

Work Log:
- Rewrote `/src/components/idm/landing/hasil-section.tsx` completely:
  - Now uses StatsData props (maleData/femaleData) instead of separate API calls
  - Bracket-aware grouping: merges league matches + tournament matches into UnifiedMatchResult
  - Per-division cards with round/bracket labels (⬆️ Semi Final, 🏆 Grand Final, etc.)
  - Special Grand Final champion rendering: 👑 crown, gold border, "Champion" badge, 🏆 trophy
  - Division filter pills: Semua / Cowo / Cewe (same style as BracketHasilSection)
  - Ghost empty state with bracket round placeholders when no data
  - MatchRow-style rows with winner highlighting and FT badge
- Changed CTA "Lihat Semua Hasil" to navigate to Bracket view (`setCurrentView('bracket')`)
- Removed "Kompetisi" from desktop nav and mobile bottom nav in landing-page.tsx
- Added "Bracket" to desktop nav (was already in mobile bottom nav)
- Updated deep-link `?view=hasil` to scroll to landing `#hasil` section instead of navigating to community
- Fixed `?view=champion` deep-link to navigate to community → #section-champions
- Updated landing-page.tsx to pass maleData/femaleData/isDataLoading props to HasilSection
- Lint passed clean, dev server running

Stage Summary:
- Landing HasilSection now matches BracketHasilSection quality
- "Kompetisi" removed from landing nav, "Bracket" added to desktop nav
- CTA navigates to Bracket view for full results
- Navigation: Peringkat → Pemain → Juara → Bracket

---
Task ID: 10
Agent: Main Agent
Task: Fix mobile header - theme toggle and login button styling

Work Log:
- Identified issue: On mobile, the theme toggle and login button in the fixed header appeared "not compact" with visible card/container backgrounds and borders that looked different from desktop
- First attempt: Made elements smaller (h-7 w-7), removed borders on mobile (border-transparent), hid admin shield (hidden sm:block) — user rejected this approach saying it removed the card/container style entirely and the admin shield disappeared
- Second attempt (final): Restored card/container styling on mobile with proper borders and backgrounds, kept admin shield visible
- Changes to `landing-page.tsx` LandingThemeToggle:
  - Size: h-7 w-7 on mobile, h-8 w-8 on sm+ (slightly smaller on mobile)
  - Icons: h-3.5 w-3.5 on mobile, h-4 w-4 on sm+
  - When not scrolled: border-white/15 bg-white/5 (visible card style on hero dark bg)
  - When scrolled: border-idm-gold-warm/20 bg-idm-gold-warm/5 (gold card style)
- Changes to `landing-page.tsx` LandingAuthButton (not logged in):
  - Login button: border-white/20 bg-white/5 on mobile hero (visible card), gold when scrolled
  - Admin shield: Always visible (NOT hidden on mobile), text-white/50 when not scrolled
  - Gap: gap-1 sm:gap-1.5
- Changes to `landing-page.tsx` LandingAuthButton (logged in):
  - Card: border-white/15 bg-white/5 when not scrolled, gold when scrolled
  - Avatars: w-5 h-5 on mobile, w-6 h-6 on sm+ (proper size with ring + shadow)
  - Text: text-[10px] on mobile, sm:text-xs (max-w-[60px] mobile)
- Applied identical changes to `public-page-layout.tsx` PublicThemeToggle and PublicAuthButton

Stage Summary:
- Mobile header theme toggle and login button now have proper card/container styling (border + bg)
- Admin shield icon is always visible on mobile
- Elements are slightly more compact on mobile (h-7 vs h-8, smaller icons)
- When on hero (not scrolled): white/glass card style on dark background
- When scrolled: gold card style matching nav
- Desktop view unchanged

---
Task ID: 10b
Agent: Main Agent
Task: Fix mobile header compactness - second attempt with toolbar approach

Work Log:
- Analyzed the issue: On mobile (375px), the right side of the h-14 header had too many separate elements (theme toggle circle + login button with text + admin shield) making it look not compact
- Root causes found:
  - `.glow-pulse` on logo creates 40px box-shadow that bleeds visually
  - `.btn-press:hover` adds scale(1.03) translateY(-1px) which can trigger on mobile touch
  - Login button with "Login" text + icon + border + padding was the tallest element
- New approach: Unified toolbar pattern for the login area
  - Wrapped Login + Admin shield in a single rounded-full container with shared border/bg
  - Login button: icon-only on mobile (no "Login" text), shows text on sm+ breakpoint
  - Admin shield: compact h-7 w-7 circle inside the toolbar
  - Container has `p-0.5 gap-0.5` for tight spacing
- Theme toggle: Consistent h-7 w-7 (no sm: breakpoint size change), h-3.5 w-3.5 icons
- Both landing-page.tsx and public-page-layout.tsx updated with identical pattern

Stage Summary:
- Mobile header right side is now a compact toolbar: [🔒 Login icon | 🛡️ Shield] in one pill
- "Login" text only shows on sm+ breakpoint, icon-only on mobile
- Theme toggle stays as a separate h-7 circle button
- Both elements are h-7 (28px) tall — consistent and compact in the h-14 header
- Desktop view shows "Login" text as before
