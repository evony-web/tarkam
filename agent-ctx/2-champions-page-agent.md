# Task 2: Rewrite ChampionsPage Component

## Summary
Rewrote the `ChampionsPage` component from a simple placeholder message to a fully functional standalone page that fetches and displays champion data from the stats API.

## What was changed
**File**: `/home/z/my-project/src/components/idm/champions-page.tsx`

### Before
- Simple placeholder with a Trophy icon and text: "Konten season telah dipindahkan ke menu Juara"
- No data fetching, no interactivity

### After
- Full standalone page mirroring the `HighlightsPage` pattern
- Fetches male and female stats from `/api/stats?division=male` and `/api/stats?division=female`
- Displays the following sections:
  1. **Division Filter Header** - Sticky header with Semua/Cowo/Cewe filter tabs
  2. **Weekly Champions** - Via `WeeklyChampionCard` component
  3. **MVP Spotlight** - Via `MvpSpotlight` component
  4. **Sultan of the Week** - Custom `SultanOfWeekCard` with coin/medallion layout
  5. **MVP Hall of Fame** - Via `MvpHallOfFame` component
  6. **Reigning Champion** - Collapsible section with `ReigningChampionPlaque` (ghost cards when no data)
  7. **Sultan of Season** - Collapsible section with per-season sultan display
  8. **Season 1 Club Champion** - Collapsible section with `SeasonOneClubChampion` (only shown when data exists)
- Player profile modal on click (lazy-loaded via dynamic import)
- Proper empty/ghost states when no data is available
- Division filter support (all/male/female)
- Same visual style as HighlightsPage

## Components defined in the file
- `ChampionCollapsible` - Dropdown wrapper for champion sections
- `ChampionsMvpHeader` - Division filter tabs header
- `ChampionDivisionCard` - MVP-style horizontal layout for champion display
- `GhostChampionDivisionCard` - Skeleton placeholder for empty champion slots
- `ReigningChampionPlaque` - Shows most recent season champions
- `SeasonOneClubChampion` - Premium showcase of S1 club champion
- `SultanOfWeekCard` - Coin/medallion layout for weekly sultan
- `SultanOfWeekSection` - Wrapper handling division display logic
- `ChampionsPage` - Main exported component

## Notes
- The `ChampionsPage` component is NOT currently used in the app navigation (the "Juara" menu maps to `HighlightsPage`). However, it is now fully functional if someone wires it up.
- The lint check passes (only pre-existing errors in scripts/ folder).
- The Prisma DB errors in dev.log are a pre-existing environment issue (postgresql provider but SQLite file), unrelated to this change.
