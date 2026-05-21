---
Task ID: 1
Agent: Main
Task: Clean up unused code and simplify dashboard structure

Work Log:
- Started dev server with double-fork technique (PID confirmed, HTTP 200)
- Deleted 5 legacy component directories (28 files total):
  - src/components/layout/ (Navbar.tsx, Footer.tsx)
  - src/components/admin/ (5 files)
  - src/components/auth/ (AuthDialog.tsx)
  - src/components/bracket/ (TournamentBracket.tsx)
  - src/components/dashboard/ (19 files)
- Deleted 16 unused community-dashboard files, kept 7 used ones:
  - Kept: community-leaderboard.tsx, community-marketplace.tsx, marketplace-detail-modal.tsx, mvp-hall-of-fame.tsx, mvp-spotlight.tsx, submit-marketplace-modal.tsx, weekly-champion-card.tsx
  - Deleted: index.tsx, index.ts + 14 unused sub-components
- Deleted entire idm/dashboard/ directory (21 files) - was dead code (imported but never rendered)
- Deleted 10 unused landing section files:
  - about-section.tsx, how-it-works-section.tsx, dream-section.tsx, champions-section.tsx, mvp-section.tsx, cta-section.tsx, video-modal.tsx, experiences-section.tsx, season-champion-section.tsx, highlights-section.tsx
- Modified app-shell.tsx:
  - Removed CommunityDashboard import and Dashboard import
  - "community" view now redirects to "landing"
  - "dashboard" view now renders AdminPanel (same as "admin")
  - Removed "community" from publicViews array
  - Cleaned up all currentView === 'community' references
- Modified landing-page.tsx:
  - Removed imports for HighlightsSection, SeasonChampionSection, ExperiencesSection, PlayersSection
  - Changed enterApp to navigate to 'admin' instead of 'dashboard'
  - Changed enterCommunity to redirect to 'landing'
  - Updated deep-link handlers: champion → highlights, club → landing
- Modified bantuan-view.tsx:
  - Updated quick links: community→peringkat, dashboard→hasil
  - Simplified handleQuickLink
  - Fixed back button to go to 'admin'

Stage Summary:
- Total files deleted: 75 (28 legacy + 16 community-dashboard + 21 idm/dashboard + 10 landing sections)
- Community Dashboard sections completely removed - dashboard now only shows Admin Panel + Home
- Admin Panel is completely untouched and working
- Landing page sections cleaned up - only active sections remain
- All navigation updated: community→landing, dashboard→admin
- Lint passes (only pre-existing script errors remain)
- Dev server running, HTTP 200 confirmed, no errors
---
Task ID: 1
Agent: main
Task: Clean up unused dashboard/community components and dead code

Work Log:
- Explored entire project structure to identify used vs unused components
- Identified 26+ dead files that are never imported or rendered
- Deleted 3 dead dashboard view files: dashboard.tsx (735+ lines), champions-page.tsx, clubs-page.tsx
- Deleted 23 unused standalone components: the-dream, cta, gallery, ticker, mvp, sawer, bantuan-view, footer, champions, login-page, ranking-panel, activity-feed, tournament-view, participant-grid, player-comparison, club-peserta, gallery-section, hero, splash-screen, player-search, my-account-card, player-quick-search, countdown-timer
- Deleted dead UI component: ui/social-feed.tsx
- Cleaned up store.ts: removed "community", "champions", "clubs" from AppView type
- Cleaned up app-shell.tsx: removed community redirect block and dead comments
- Cleaned up use-shell-theme.ts: removed community view check
- Cleaned up ui/index.ts: removed SocialFeed export
- Removed dead onEnterCommunity prop from HeroSection and landing-page.tsx
- Verified: lint passes (only pre-existing script errors), app compiles and loads successfully

Stage Summary:
- 27 files deleted (~2000+ lines of dead code removed)
- 4 files modified (store.ts, app-shell.tsx, use-shell-theme.ts, ui/index.ts, hero-section.tsx, landing-page.tsx)
- AppView type cleaned: removed 3 dead view keys (community, champions, clubs)
- Admin panel and home button preserved untouched
- All active features intact: beranda, peringkat, hasil, bracket, juara, pemain, admin panel
