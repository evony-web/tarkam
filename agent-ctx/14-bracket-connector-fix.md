# Task 14: Fix Single Elimination Bracket Connectors & Add Visual Connectors to Upper Semi View

## Agent: Main Agent
## Date: 2026-03-05

## Summary
Fixed the single elimination bracket connector algorithm to use a SOURCE→TARGET approach (iterating from source matches to find their target match) instead of the old TARGET→FEEDER approach that broke with BYE matches. Also rewrote the Upper Semi View to use horizontal bracket layout with SVG connector lines instead of text labels.

## Changes Made

### 1. Helper Functions Added (bracket-view.tsx)
- `getBracketRound(groupLabel)` — extracts round number from "U1-2" → 1, "L2-1" → 2
- `matchHasWinner(m)` — checks if match has decided winner (score1 !== score2)

### 2. calculateConnectors Algorithm Rewrite (BracketView)
- OLD: For each target match → find feeders at positions 2P-1, 2P → fallback to index pairing
- NEW: For each source match at position P → compute target ceil(P/2) → group by target → draw
- This guarantees every connector starts from an EXISTING match
- BYE positions (no match) no longer cause wrong index-based fallback

### 3. New BracketColumnView Component
- Reusable horizontal bracket layout with SVG connectors
- Self-contained: own refs, connector state, alignment logic, timing effects
- Renders with ZoomableContainer for mobile pinch-zoom + drag-pan
- Configurable styling via props

### 4. Rewritten UpperSemiView
- UB: BracketColumnView with division colors, "U" match labels
- LB: BracketColumnView with orange accent, "L" match labels
- Drop connector: SVG red/orange arrow with glow effect
- GF connector: Gold SVG merge junction with neon glow
- Grand Final: Gold-bordered section with gradient header

### 5. Cleanup
- Removed unused ArrowDown import (replaced with SVG arrows)

## Verification
- ESLint: No new errors on bracket-view.tsx
- Dev server: Compiles successfully
- Pre-existing lint errors in hero-section.tsx and shared.tsx unchanged
