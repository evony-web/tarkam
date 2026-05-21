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
