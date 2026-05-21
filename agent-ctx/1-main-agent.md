# Task 1: Fix Single Elimination Bracket + Rewrite UpperSemiView

## Summary
Fixed single elimination bracket connecting lines by adding BYE placeholder matches for missing R1 positions, and rewrote UpperSemiView with a unified Challonge-style layout.

## Changes Made to `/home/z/my-project/src/components/idm/bracket-view.tsx`

### 1. Added helper functions (after line 51)
- `isByePlaceholder(m)` — checks if match is a synthetic BYE placeholder
- `fillByePlaceholders(rounds, bracketPrefix)` — fills missing R1 positions with BYE placeholders

### 2. Updated BracketMatchCard (line 122+)
- Added early return for BYE placeholder rendering: compact dashed-border card with BYE/WALKOVER labels
- Same height as regular cards for proper bracket spacing

### 3. Updated roundsData computation (line 1963+)
- Applied `fillByePlaceholders(sortedRounds)` for single_elimination bracket type

### 4. Updated calculateConnectors (line 2020)
- Added `if (isByePlaceholder(sourceMatch)) continue;` to skip BYE connector arms

### 5. Rewrote UpperSemiView (lines 1701-2237)
- Unified layout: one ZoomableContainer with UB top, LB bottom, GF right
- SVG connectors for UB, LB, UB→GF, LB→GF
- Card alignment for both UB and LB brackets
- BYE placeholder filling for both UB and LB rounds

## Verification
- Lint: No new errors (2 pre-existing in other files)
- TypeScript: No errors
- Dev server: Compiles successfully
