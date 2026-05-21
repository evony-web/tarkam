# Task 1-2: Redesign Champion & Sultan cards to MVP-style horizontal layout

## Summary
Redesigned two card component groups in `highlights-page.tsx` to use MVP-style horizontal layout (avatar panel left + stats panel right), matching the MvpDivisionCard pattern from mvp-spotlight.tsx.

## Changes Made

### File: `/home/z/my-project/src/components/idm/highlights-page.tsx`

1. **Added imports**: `Banknote`, `Calendar` to lucide-react
2. **Replaced ChampionBadge + GhostChampionBadge** → `ChampionDivisionCard` + `GhostChampionDivisionCard`
   - MVP horizontal layout: 3/4 aspect avatar panel (left) + stats panel (right)
   - Stats: Points (Trophy/gold), Wins (Crown/green), Season (Calendar/accent)
   - Crown badge at top-right of avatar, division badge at bottom
   - `bare` prop for side-by-side mode in "all" division
3. **Updated ReigningChampionPlaque**: Uses grid-cols-1 lg:grid-cols-2 for "all" division (bare cards), single card for specific division
4. **Replaced SultanOfWeekCoin + GhostSultanOfWeekCoin** → `SultanWeekDivisionCard` + `GhostSultanWeekDivisionCard`
   - MVP horizontal layout with maroon theme
   - Stats: Total Sawer (Banknote/maroon), Jumlah Sawer (Zap/maroon-light), Week (Calendar/accent)
   - Heart badge at top-right (maroon), donation amount badge at bottom
   - `bare` prop for side-by-side mode
5. **Updated SultanOfWeekSection**: Same grid layout pattern as ReigningChampionPlaque

## Verification
- No lint errors in highlights-page.tsx
- Dev server compiles successfully
