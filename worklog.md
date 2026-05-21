---
Task ID: 1
Agent: main
Task: Fix Week 2 bugs (MVP not visible, points not updating, female delay) + sync project with repo

Work Log:
- Pulled latest code from GitHub repo (122 files, 18000+ changes) — resolved merge conflicts
- Switched Prisma schema from postgresql back to sqlite for local dev
- Updated .env with new Neon DB URL, Cloudinary, Pusher, and Session credentials
- Investigated full finalization chain: admin finalize → ranking determination → point awarding → season champion update → display
- Diagnosed Bug 1 ROOT CAUSE: `group_stage` format in finalize route has NO fallback ranking when playoff matches aren't played (only looks for groupLabel='Final' and '3rd')
- Fixed finalize/route.ts: Added GF/bracket=grand_final support + win-count fallback for group_stage format
- Diagnosed Bug 2: Week 2 TournamentPrize is empty — no prizes configured, so no points awarded during finalization (DATA issue)
- Diagnosed Bug 3 ROOT CAUSE: Female stats intentionally NOT fetched during SSR (initialFemaleStats=null), loaded client-side only → 10-15s delay
- Fixed page.tsx: Now fetches both male AND female stats during SSR via Promise.all — eliminates visible delay

Stage Summary:
- Fixed: group_stage format ranking fallback in finalize/route.ts
- Fixed: Female data delay — both divisions now SSR-fetched in parallel
- Noted: TournamentPrize must be created by admin before finalization (not a code bug)
- Neon DB is quota exceeded — cannot sync production data until resolved
- Dev server running on port 3000 (double-fork technique)
