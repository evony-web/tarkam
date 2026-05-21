---
Task ID: 2
Agent: Main Agent
Task: Fix point calculation, W/L tracking, and display bugs in tournament engine + player profiles

Work Log:
- Explored tournament engine code structure (40+ files)
- Analyzed point system: match_win (+1), streak_bonus (+2/3 wins), prize juara (variable)
- Analyzed finalization logic: champion/MVP points, team ranking, season champion update
- Analyzed score route: win/loss/draw handling, streak calculation, bracket advancement
- Analyzed display components: community-leaderboard, player-profile, ranking-panel, stats API

- BUG FIX #1 (CRITICAL): Swiss BYE duplicate streak calculation — score/route.ts
  - Lines 1130-1136 and 1153-1156 had DUPLICATE `const newStreak` and `const streakBonus` declarations
  - This caused a TypeScript compilation error (redeclared block-scoped variable)
  - Also: `player.points` update used `winPts + streakBonus` instead of `totalPts` (inconsistent)
  - Fixed by removing duplicate lines, using `totalPts` consistently
  - Also: moved `tournament.seasonId` fetch OUTSIDE the loop (was fetching per-player, N+1 query)

- BUG FIX #2 (HIGH): Added `totalLosses` field to Player model
  - Previously, losses were derived as `matches - totalWins`, which incorrectly counted draws as losses
  - Added `totalLosses Int @default(0)` to all 4 prisma schema files
  - Updated score route to increment `totalLosses` on loss
  - Updated undo score to decrement `totalLosses` on undo
  - Backfilled existing players with `UPDATE Player SET totalLosses = matches - totalWins WHERE matches > 0`
  - Updated all API routes to include `totalLosses` in responses
  - Updated all display components to use `totalLosses` instead of `matches - totalWins`

- BUG FIX #3 (HIGH): Per-Season Points vs Lifetime W/L mismatch in leaderboard
  - Stats API overrode `points` with per-season points but kept lifetime `totalWins`/`matches`
  - Added `seasonWinsRaw` query: `db.playerPoint.groupBy({ where: { reason: 'match_win', seasonId } })`
  - Now passes `seasonWins` (per-season) and `seasonLosses` to topPlayers
  - Community leaderboard now uses `seasonWins` for W column and `totalLosses` for L column
  - Sort by seasonPoints desc, then seasonWins desc (was using lifetime totalWins)

- BUG FIX #4 (HIGH): Player Profile showing lifetime points overriding season points
  - Profile fetched `/api/players/{id}` which returns lifetime data, overriding season context
  - Now: `lifetimePoints` = from API enrichment, `seasonPoints` = from caller (leaderboard data)
  - Profile displays `seasonPoints` as primary, shows lifetime points as subtitle when they differ
  - Added `totalLosses`, `seasonWins`, `seasonPoints`, `lifetimePoints` to PlayerProfileProps
  - Profile now correctly shows W/L using `totalLosses` field instead of `matches - totalWins`

- Type updates:
  - Updated `TopPlayer` interface in `types/stats.ts` with new optional fields
  - Updated `LeaderboardEntry` interface in `types/index.ts` with `totalLosses`
  - Updated `PlayerProfileProps` in `player-profile.tsx` with new optional fields
  - All TypeScript type checks pass (`tsc --noEmit` = 0 errors)

Stage Summary:
- 4 bugs fixed: Swiss BYE streak calc, totalLosses field, season W/L mismatch, profile points context
- Schema migration: `totalLosses` added to Player model (all 4 schema files, db:push done)
- 8 files modified: score/route.ts, 4× schema.prisma, stats/route.ts, community-leaderboard.tsx, player-profile.tsx
- Plus: rankings/route.ts, players/leaderboard/route.ts, ranking-panel.tsx, types/stats.ts, types/index.ts
- Dev server running, TypeScript type check passing

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
