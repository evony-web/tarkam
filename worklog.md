---
Task ID: 1
Agent: Main Agent
Task: Audit and fix tournament engine bugs (registration to finalization) across all bracket formats (Swiss, Single Elim, Group Stage+Playoff, Upper Semi)

Work Log:
- Explored entire tournament engine codebase (~22,800 lines across 40+ files)
- Read and analyzed all critical files: generate-bracket/route.ts (735 lines), score/route.ts (1798 lines), finalize/route.ts (710 lines), register/route.ts, generate-teams/route.ts, approve/route.ts
- Identified 7 bugs across the tournament lifecycle

- BUG FIX #1 (HIGH): Removed duplicate Swiss advancement calls in score/route.ts lines 373-391
  - handleSwissAdvancement and advanceSwissPlayoff were called TWICE for every Swiss match scored
  - Could cause double DB queries and potential race conditions
  - Fixed by removing the duplicate block (lines 383-391)

- BUG FIX #2 (MEDIUM): Swiss BYE win now updates streak/maxStreak
  - Previously, BYE auto-wins only updated totalWins, matches, and points — streak was ignored
  - Now correctly increments streak and maxStreak, and awards streak bonus points (same as regular wins)
  - Also fixed participation pointsEarned to include streak bonus

- BUG FIX #3 (HIGH): Added minimum team count validation for Swiss format
  - Swiss requires at least 4 teams for the playoff bracket (SF1, SF2, Final, 3rd)
  - With fewer teams, seedSwissPlayoff would never seed and tournament would be stuck
  - Added validation in generate-bracket/route.ts: returns 400 if teamCount < 4

- BUG FIX #4 (HIGH): Fixed Group Stage small tournament getting stuck
  - When groups have only 2 teams each (e.g., 4 teams total), there's no rank 3 to pre-seed into Lower Bracket L1
  - L1 matches would have team1=null, team2=TBD, making them unplayable → tournament stuck
  - Added minimum team validation (4 teams) in generate-bracket/route.ts
  - Added "effective slot" fallback in advanceGroupStagePlayoff and advanceUpperSemi: if the target slot already has a team but the other slot is null, fills the null slot instead

- BUG FIX #5 (MEDIUM): Single Elim advancement no longer incorrectly applies to Swiss playoff matches
  - Condition `bracket === 'upper' && format !== 'group_stage' && format !== 'upper_semi'` caught Swiss playoff matches (bracket='upper', format='swiss')
  - Added `format !== 'swiss'` to the condition since Swiss has its own handler

- BUG FIX #6 (LOW): Fixed club stats lossPoints always returning 0
  - Original condition: `gameDiff > -Math.abs(gameDiff)` — always false for negative values
  - New condition: `gameDiff < 0 && Math.abs(gameDiff) < 3` — awards 1 point for close losses

- BUG FIX #7 (MEDIUM): Season champion calculation now filters by division
  - PlayerPoint groupBy was grouping ALL points in a season regardless of division
  - If male and female tournaments share the same seasonId, champion could be from wrong division
  - Now pre-fetches division-specific tournament IDs and filters the groupBy

Stage Summary:
- 7 bugs fixed across score/route.ts, generate-bracket/route.ts, and finalize/route.ts
- All lint checks pass for modified files
- Dev server running successfully
- No new dependencies added
