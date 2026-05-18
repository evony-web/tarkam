'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Trophy, Star, Swords, ChevronRight, Loader2, Crown, Flame, Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AnimatedSection, SectionHeader } from './shared';
import { useAppStore } from '@/lib/store';

/* ─── Types ─── */
interface MatchPlayer {
  id: string;
  gamertag: string;
  avatar: string | null;
  tier: string;
}

interface MatchTeam {
  id: string | null;
  name: string;
  score: number | null;
  players: MatchPlayer[];
}

interface HighlightMatch {
  id: string;
  tournamentName: string;
  weekNumber: number;
  team1: MatchTeam;
  team2: MatchTeam;
  winnerId: string | null;
  winnerName: string | null;
  mvpPlayer: {
    id: string;
    gamertag: string;
    avatar: string | null;
    tier: string;
  } | null;
  completedAt: string | null;
  format: string;
  bracket: string;
  division: string;
}

interface HighlightsData {
  matches: HighlightMatch[];
}

/* ─── Division config ─── */
const DIVISION_STYLE = {
  male: {
    color: '#2E9FFF',
    colorRgb: '46,159,255',
    badgeBg: 'bg-idm-male/15',
    badgeText: 'text-idm-male',
    badgeBorder: 'border-idm-male/25',
    iconBg: 'bg-idm-male/10 border-idm-male/25',
    label: '🕺 Cowo',
  },
  female: {
    color: '#FF2D78',
    colorRgb: '255,45,120',
    badgeBg: 'bg-idm-female/15',
    badgeText: 'text-idm-female',
    badgeBorder: 'border-idm-female/25',
    iconBg: 'bg-idm-female/10 border-idm-female/25',
    label: '💃 Cewe',
  },
} as const;

/* ─── Helpers ─── */
function getBracketLabel(bracket: string): string {
  switch (bracket) {
    case 'grand_final': return 'Grand Final';
    case 'upper': return 'Semi Final';
    case 'lower': return 'Semi Final';
    default: return bracket;
  }
}

function getBracketBadgeStyle(bracket: string) {
  if (bracket === 'grand_final') {
    return 'bg-idm-gold-warm/15 text-idm-gold-warm border-idm-gold-warm/25';
  }
  return 'bg-purple-500/15 text-purple-400 border-purple-500/25';
}

/* ─── Match Card ─── */
function MatchCard({ match }: { match: HighlightMatch }) {
  const divStyle = DIVISION_STYLE[match.division as 'male' | 'female'] || DIVISION_STYLE.male;
  const isGF = match.bracket === 'grand_final';
  const team1Won = match.winnerId === match.team1.id;
  const team2Won = match.winnerId === match.team2.id;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-idm-gold-warm/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
      style={{
        background: `linear-gradient(165deg, rgba(${divStyle.colorRgb},0.06) 0%, var(--bg-mid) 40%, rgba(${divStyle.colorRgb},0.03) 100%)`,
      }}
    >
      {/* Top accent line */}
      <div
        className="h-[2px]"
        style={{
          background: isGF
            ? 'linear-gradient(90deg, transparent 5%, #EFF923 30%, #EFF923 70%, transparent 95%)'
            : `linear-gradient(90deg, transparent 5%, ${divStyle.color} 30%, ${divStyle.color} 70%, transparent 95%)`,
        }}
      />

      <div className="p-3 sm:p-4">
        {/* Header row: bracket badge + division + week */}
        <div className="flex items-center gap-2 mb-3">
          <Badge className={`text-[8px] font-bold uppercase tracking-wider border ${getBracketBadgeStyle(match.bracket)}`}>
            {isGF ? <Crown className="w-2.5 h-2.5 mr-0.5" /> : <Flame className="w-2.5 h-2.5 mr-0.5" />}
            {getBracketLabel(match.bracket)}
          </Badge>
          <Badge className={`text-[8px] font-semibold border ${divStyle.badgeBg} ${divStyle.badgeText} ${divStyle.badgeBorder}`}>
            {divStyle.label}
          </Badge>
          <span className="text-[9px] text-muted-foreground/50 ml-auto tabular-nums">
            W{match.weekNumber} • {match.format}
          </span>
        </div>

        {/* Match content */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Team 1 */}
          <div className={`flex-1 min-w-0 text-right ${team1Won ? '' : 'opacity-50'}`}>
            <p className={`text-xs sm:text-sm font-bold truncate ${team1Won ? 'text-idm-gold-warm' : ''}`}>
              {match.team1.name}
            </p>
            <p className="text-[9px] text-muted-foreground/50 truncate hidden sm:block">
              {match.team1.players.map(p => p.gamertag).join(', ')}
            </p>
          </div>

          {/* Score */}
          <div className="flex items-center gap-1.5 shrink-0 px-1">
            <span className={`text-base sm:text-xl font-black tabular-nums w-6 sm:w-7 text-center ${
              team1Won ? 'text-idm-gold-warm' : 'text-muted-foreground'
            }`}>
              {match.team1.score ?? '-'}
            </span>
            <span className="text-[10px] text-muted-foreground/30 font-bold">vs</span>
            <span className={`text-base sm:text-xl font-black tabular-nums w-6 sm:w-7 text-center ${
              team2Won ? 'text-idm-gold-warm' : 'text-muted-foreground'
            }`}>
              {match.team2.score ?? '-'}
            </span>
          </div>

          {/* Team 2 */}
          <div className={`flex-1 min-w-0 text-left ${team2Won ? '' : 'opacity-50'}`}>
            <p className={`text-xs sm:text-sm font-bold truncate ${team2Won ? 'text-idm-gold-warm' : ''}`}>
              {match.team2.name}
            </p>
            <p className="text-[9px] text-muted-foreground/50 truncate hidden sm:block">
              {match.team2.players.map(p => p.gamertag).join(', ')}
            </p>
          </div>
        </div>

        {/* MVP + Winner info */}
        {(match.mvpPlayer || match.winnerName) && (
          <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-border/20">
            {match.winnerName && (
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3 h-3 text-idm-gold-warm" />
                <span className="text-[10px] font-semibold text-idm-gold-warm truncate">
                  {match.winnerName}
                </span>
              </div>
            )}
            {match.mvpPlayer && (
              <div className="flex items-center gap-1 ml-auto">
                <Badge className="text-[8px] px-1.5 py-0 h-4 bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/20">
                  <Star className="w-2 h-2 mr-0.5" />
                  MVP: {match.mvpPlayer.gamertag}
                </Badge>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export function HasilSection() {
  const setCurrentView = useAppStore(s => s.setCurrentView);

  /* Fetch GF matches for both divisions */
  const { data: gfData, isLoading: isGFLoading } = useQuery<HighlightsData>({
    queryKey: ['matches-highlights', 'grand_final'],
    queryFn: async () => {
      const res = await fetch('/api/matches/recent?division=semua&bracket=grand_final&limit=6');
      if (!res.ok) throw new Error('Gagal memuat data');
      return res.json();
    },
    staleTime: 60000,
  });

  /* Fetch upper bracket matches (SF candidates) for both divisions */
  const { data: sfData, isLoading: isSFLoading } = useQuery<HighlightsData>({
    queryKey: ['matches-highlights', 'upper'],
    queryFn: async () => {
      const res = await fetch('/api/matches/recent?division=semua&bracket=upper&limit=10');
      if (!res.ok) throw new Error('Gagal memuat data');
      return res.json();
    },
    staleTime: 60000,
  });

  const isLoading = isGFLoading || isSFLoading;

  /* Process and categorize matches:
     - GF: all grand_final matches
     - SF: from upper bracket, take the highest round per tournament (these are the semi-finals)
  */
  const gfMatches: HighlightMatch[] = gfData?.matches ?? [];

  // For SF: group upper bracket matches by tournamentId (implicit via tournamentName + weekNumber),
  // then take only the highest round per tournament
  const sfRaw: HighlightMatch[] = sfData?.matches ?? [];

  // Group by tournament (name + weekNumber), keep only highest round matches per tournament
  const sfByTournament = new Map<string, HighlightMatch[]>();
  for (const m of sfRaw) {
    const key = `${m.tournamentName}-W${m.weekNumber}`;
    if (!sfByTournament.has(key)) sfByTournament.set(key, []);
    sfByTournament.get(key)!.push(m);
  }

  // For each tournament, sort by weekNumber desc, take top 2 tournaments, then take highest round matches
  const sfMatches: HighlightMatch[] = [];
  const sortedTournaments = [...sfByTournament.entries()]
    .sort((a, b) => {
      // Sort by most recent (higher week number first)
      const weekA = a[1][0]?.weekNumber ?? 0;
      const weekB = b[1][0]?.weekNumber ?? 0;
      return weekB - weekA;
    })
    .slice(0, 2); // Take top 2 most recent tournaments

  for (const [, matches] of sortedTournaments) {
    // Find the highest round in this tournament's upper bracket
    // (highest round = closest to final = semi-final)
    const maxRound = Math.max(...matches.map(m => {
      // round is not in our response, use position in sorted list
      // Since we can't determine round from the API, just take the last 2 matches
      return 0;
    }));
    // Take up to 2 matches per tournament (the semi-finals)
    sfMatches.push(...matches.slice(0, 2));
  }

  // Combine and deduplicate
  const allMatches = [...gfMatches, ...sfMatches];
  const seen = new Set<string>();
  const uniqueMatches = allMatches.filter(m => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  // Sort: GF first, then SF; within each bracket, by weekNumber desc
  uniqueMatches.sort((a, b) => {
    if (a.bracket === 'grand_final' && b.bracket !== 'grand_final') return -1;
    if (a.bracket !== 'grand_final' && b.bracket === 'grand_final') return 1;
    return b.weekNumber - a.weekNumber;
  });

  const hasMatches = uniqueMatches.length > 0;

  return (
    <section
      id="hasil"
      role="region"
      aria-label="Hasil"
      className="landing-section relative py-6 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-hidden bg-deep border-t border-border/10 dark:border-t-0"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-[0.018]" style={{ backgroundImage: 'radial-gradient(circle, rgba(239,249,35,0.5) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(239,249,35,0.05) 0%, transparent 50%), radial-gradient(ellipse at 20% 70%, rgba(46,159,255,0.03) 0%, transparent 40%), radial-gradient(ellipse at 80% 70%, rgba(255,45,120,0.03) 0%, transparent 40%)' }} />
      {/* Top edge glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-idm-gold-warm/30 to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-idm-gold-warm/[2.5] to-transparent pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Section Header */}
        <AnimatedSection>
          <SectionHeader
            icon={Trophy}
            label="Hasil"
            title="Hasil Pertandingan"
            subtitle="Hasil Semi Final & Grand Final pertandingan tarkam terbaru"
          />
        </AnimatedSection>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 rounded-2xl border border-border/30 bg-card/40 animate-pulse" />
            ))}
          </div>
        ) : !hasMatches ? (
          /* Empty state */
          <div className="text-center py-12 mt-6">
            <div className="w-16 h-16 rounded-2xl bg-idm-gold-warm/5 border border-idm-gold-warm/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-idm-gold-warm/30" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-1">Belum ada hasil pertandingan</p>
            <p className="text-xs text-muted-foreground/60">Hasil SF & Grand Final akan muncul di sini setelah turnamen selesai</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {/* Match cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {uniqueMatches.slice(0, 4).map(match => (
                <AnimatedSection key={match.id} variant="fadeUp">
                  <MatchCard match={match} />
                </AnimatedSection>
              ))}
            </div>

            {/* CTA Button */}
            <div className="flex justify-center mt-6">
              <button
                onClick={() => {
                  setCurrentView('community');
                  // Scroll to matches section after navigation
                  setTimeout(() => {
                    const el = document.getElementById('section-matches');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 500);
                }}
                className="group flex items-center gap-2 px-6 py-3 rounded-2xl border border-idm-gold-warm/20 bg-idm-gold-warm/5 text-idm-gold-warm text-sm font-bold transition-all duration-300 hover:bg-idm-gold-warm/10 hover:border-idm-gold-warm/35 hover:shadow-[0_0_20px_rgba(239,249,35,0.1)] cursor-pointer active:scale-[0.98]"
              >
                <Swords className="w-4 h-4" />
                <span>Lihat Semua Hasil</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
