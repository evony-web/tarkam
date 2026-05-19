'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Trophy, Swords, ChevronRight, ChevronDown,
  Gamepad2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AnimatedSection, SectionHeader } from './shared';
import { useAppStore } from '@/lib/store';

/* ─── Types ─── */
type DivisionFilter = 'all' | 'male' | 'female';

interface WeekResult {
  weekNumber: number;
  tournamentName: string;
  tournamentStatus: string;
  hasTournament: boolean;
  tournamentMatches: Array<{
    id: string;
    round: number;
    bracket: string;
    score1: number | null;
    score2: number | null;
    format: string;
    team1: { id: string; name: string } | null;
    team2: { id: string; name: string } | null;
    mvpPlayer: { id: string; gamertag: string } | null;
  }>;
  leagueMatches: Array<{
    id: string;
    week: number;
    score1: number | null;
    score2: number | null;
    format: string;
    club1: { id: string; name: string; logo: string | null };
    club2: { id: string; name: string; logo: string | null };
  }>;
}

interface SeasonResultsData {
  season: {
    id: string;
    name: string;
    number: number;
    status: string;
  };
  weeks: WeekResult[];
}

/* ─── Division config ─── */
const DIVISION_STYLE = {
  male: {
    color: '#2E9FFF',
    bg: 'bg-idm-male/10',
    text: 'text-idm-male',
    borderSubtle: 'border-idm-male/10',
    bgSubtle: 'bg-idm-male/5',
    hoverBorder: 'hover:border-idm-male/20',
    label: '🕺 Cowo',
    emoji: '🕺',
  },
  female: {
    color: '#FF2D78',
    bg: 'bg-idm-female/10',
    text: 'text-idm-female',
    borderSubtle: 'border-idm-female/10',
    bgSubtle: 'bg-idm-female/5',
    hoverBorder: 'hover:border-idm-female/20',
    label: '💃 Cewe',
    emoji: '💃',
  },
} as const;

type DivisionStyle = typeof DIVISION_STYLE.male;

/* ─── Bracket/Round label helper ─── */
function getRoundLabel(bracket: string, round: number): string {
  switch (bracket) {
    case 'grand_final':
      return 'GF';
    case 'upper':
      if (round === 1) return 'Final';
      if (round === 2) return 'SF';
      if (round === 3) return 'QF';
      return `R${round}`;
    case 'lower':
      if (round === 1) return 'LF';
      if (round === 2) return 'LSF';
      return `LR${round}`;
    case 'swiss':
      return `Sw${round}`;
    case 'group':
      return `Gr${round}`;
    default:
      return `R${round}`;
  }
}

function getRoundSortKey(bracket: string, round: number): number {
  switch (bracket) {
    case 'upper': return round * 10;
    case 'lower': return 100 + round * 10;
    case 'grand_final': return 999;
    default: return 500 + round * 10;
  }
}

/* ─── Compact Match Row — 1 line ─── */
function CompactMatchRow({ m, divStyle }: { m: WeekResult['tournamentMatches'][0]; divStyle: DivisionStyle }) {
  const winner1 = m.score1 != null && m.score2 != null && m.score1 > m.score2;
  const isGrandFinal = m.bracket === 'grand_final';

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-colors ${
      isGrandFinal
        ? 'bg-idm-gold-warm/[0.07] border border-idm-gold-warm/15'
        : `${divStyle.bgSubtle} border border-transparent`
    }`}>
      {/* Round badge */}
      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
        isGrandFinal
          ? 'bg-idm-gold-warm/15 text-idm-gold-warm'
          : `${divStyle.bg} ${divStyle.text}`
      }`}>
        {isGrandFinal ? '🏆' : getRoundLabel(m.bracket, m.round)}
      </span>
      {/* Team 1 */}
      <span className={`truncate font-semibold min-w-0 flex-1 text-right ${
        winner1 ? 'text-idm-gold-warm' : 'text-muted-foreground'
      }`}>
        {winner1 && '▸ '}{m.team1?.name || 'TBD'}
      </span>
      {/* Score */}
      <span className="shrink-0 font-black tabular-nums text-[11px] tracking-tight">
        <span className={winner1 ? 'text-idm-gold-warm' : 'text-foreground'}>{m.score1 ?? '-'}</span>
        <span className="text-muted-foreground/40 mx-0.5">-</span>
        <span className={!winner1 && m.score2 != null && m.score1 != null && m.score2 > m.score1 ? 'text-idm-gold-warm' : 'text-foreground'}>{m.score2 ?? '-'}</span>
      </span>
      {/* Team 2 */}
      <span className={`truncate font-semibold min-w-0 flex-1 ${
        !winner1 && m.score2 != null && m.score1 != null && m.score2 > m.score1 ? 'text-idm-gold-warm' : 'text-muted-foreground'
      }`}>
        {m.team2?.name || 'TBD'}{!winner1 && m.score2 != null && m.score1 != null && m.score2 > m.score1 && ' ▸'}
      </span>
      {/* MVP */}
      {m.mvpPlayer && (
        <span className="shrink-0 text-[9px] text-idm-gold-warm flex items-center gap-0.5" title={`MVP: ${m.mvpPlayer.gamertag}`}>
          ⭐<span className="hidden sm:inline truncate max-w-[48px]">{m.mvpPlayer.gamertag}</span>
        </span>
      )}
    </div>
  );
}

/* ─── Compact League Row — 1 line ─── */
function CompactLeagueRow({ m }: { m: WeekResult['leagueMatches'][0] }) {
  const winner1 = m.score1 != null && m.score2 != null && m.score1 > m.score2;
  const winner2 = m.score1 != null && m.score2 != null && m.score2 > m.score1;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs bg-muted/[0.03] border border-transparent">
      <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-muted/15 text-muted-foreground">Liga</span>
      <span className={`truncate font-semibold min-w-0 flex-1 text-right ${winner1 ? 'text-idm-gold-warm' : 'text-muted-foreground'}`}>
        {winner1 && '▸ '}{m.club1.name}
      </span>
      <span className="shrink-0 font-black tabular-nums text-[11px] tracking-tight">
        <span className={winner1 ? 'text-idm-gold-warm' : 'text-foreground'}>{m.score1 ?? '-'}</span>
        <span className="text-muted-foreground/40 mx-0.5">-</span>
        <span className={winner2 ? 'text-idm-gold-warm' : 'text-foreground'}>{m.score2 ?? '-'}</span>
      </span>
      <span className={`truncate font-semibold min-w-0 flex-1 ${winner2 ? 'text-idm-gold-warm' : 'text-muted-foreground'}`}>
        {m.club2.name}{winner2 && ' ▸'}
      </span>
    </div>
  );
}

/* ─── Helper: find index of first week with results ─── */
function firstResultIdx(weeks: WeekResult[]): number {
  return weeks.findIndex(w => w.tournamentMatches.length > 0 || w.leagueMatches.length > 0);
}

/* ─── Week Card — compact, collapsible ─── */
function WeekCard({ week, divStyle, defaultExpanded }: { week: WeekResult; divStyle: DivisionStyle; defaultExpanded: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const totalMatches = week.tournamentMatches.length + week.leagueMatches.length;

  // Find champion (Grand Final winner)
  const grandFinalMatch = week.tournamentMatches.find(m => m.bracket === 'grand_final');
  const championTeam = grandFinalMatch
    ? (grandFinalMatch.score1 != null && grandFinalMatch.score2 != null
        ? (grandFinalMatch.score1 > grandFinalMatch.score2 ? grandFinalMatch.team1 : grandFinalMatch.team2)
        : null)
    : null;

  const isCompleted = week.tournamentStatus === 'completed';

  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${
      expanded
        ? 'border-border/50 bg-card/80 shadow-sm'
        : 'border-border/30 bg-card/40 hover:border-border/50'
    }`}>
      {/* Week header — clickable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-muted/5 transition-colors"
      >
        <div className={`w-7 h-7 rounded-lg ${divStyle.bg} flex items-center justify-center shrink-0`}>
          <Gamepad2 className={`w-3.5 h-3.5 ${divStyle.text}`} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-bold ${divStyle.text}`}>Week {week.weekNumber}</span>
            {isCompleted && (
              <span className="text-[8px] text-green-500">✓</span>
            )}
            {championTeam && (
              <>
                <span className="text-muted-foreground/30 text-[10px]">·</span>
                <span className="text-[10px] text-idm-gold-warm font-semibold truncate">👑 {championTeam.name}</span>
              </>
            )}
          </div>
          {!championTeam && totalMatches > 0 && (
            <p className="text-[10px] text-muted-foreground/50">{totalMatches} match</p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          <Badge className={`${divStyle.bg} ${divStyle.text} text-[8px] border-0 px-1.5 py-0`}>{totalMatches}</Badge>
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground/50 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Expanded content — compact match list */}
      {expanded && totalMatches > 0 && (
        <div className="px-3 pb-3 pt-1 border-t border-border/10 space-y-1">
          {/* Tournament matches sorted by round order */}
          {[...week.tournamentMatches]
            .sort((a, b) => getRoundSortKey(a.bracket, a.round) - getRoundSortKey(b.bracket, b.round))
            .map(m => (
              <CompactMatchRow key={m.id} m={m} divStyle={divStyle} />
            ))
          }
          {/* League matches */}
          {week.leagueMatches.map(m => (
            <CompactLeagueRow key={m.id} m={m} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Ghost Week Card — empty state ─── */
function GhostWeekCard({ divStyle }: { divStyle: DivisionStyle }) {
  return (
    <div className="border border-border/15 rounded-xl overflow-hidden bg-card/20 opacity-40">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className={`w-7 h-7 rounded-lg ${divStyle.bg} flex items-center justify-center shrink-0`}>
          <Gamepad2 className={`w-3.5 h-3.5 ${divStyle.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold ${divStyle.text}`}>Week —</p>
          <p className="text-[10px] text-muted-foreground/40">Belum ada hasil</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export function HasilSection({ maleData, femaleData, isDataLoading }: {
  maleData: any;
  femaleData: any;
  isDataLoading: boolean;
}) {
  const setCurrentView = useAppStore(s => s.setCurrentView);
  const setInitialBracketTab = useAppStore(s => s.setInitialBracketTab);
  const [hasilDivision, setHasilDivision] = useState<DivisionFilter>('all');

  // Fetch season results for both divisions
  const { data: maleResults, isLoading: maleLoading } = useQuery({
    queryKey: ['season-results', 'male'],
    queryFn: async () => {
      const res = await fetch('/api/season-results?division=male');
      if (!res.ok) return { weeks: [] } as SeasonResultsData;
      return res.json() as Promise<SeasonResultsData>;
    },
    staleTime: 30000,
  });

  const { data: femaleResults, isLoading: femaleLoading } = useQuery({
    queryKey: ['season-results', 'female'],
    queryFn: async () => {
      const res = await fetch('/api/season-results?division=female');
      if (!res.ok) return { weeks: [] } as SeasonResultsData;
      return res.json() as Promise<SeasonResultsData>;
    },
    staleTime: 30000,
  });

  const maleWeeks = maleResults?.weeks || [];
  const femaleWeeks = femaleResults?.weeks || [];
  const hasMaleResults = maleWeeks.some(w => w.tournamentMatches.length > 0 || w.leagueMatches.length > 0);
  const hasFemaleResults = femaleWeeks.some(w => w.tournamentMatches.length > 0 || w.leagueMatches.length > 0);
  const hasAnyResults = hasMaleResults || hasFemaleResults;
  const isLoadingResults = maleLoading || femaleLoading;

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

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <AnimatedSection>
          <SectionHeader
            icon={Trophy}
            label="Hasil"
            title="Hasil Pertandingan"
            subtitle="Hasil pertandingan tarkam setiap minggu — bracket, skor & MVP"
          />
        </AnimatedSection>

        {/* Section Title Row + Division Filter */}
        <div className="stagger-item-fast flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded bg-idm-gold-warm/10 flex items-center justify-center shrink-0">
              <Trophy className="w-3 h-3 text-idm-gold-warm" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{
              background: 'linear-gradient(135deg, #FAF0DC 0%, #EFF923 30%, #F9CB25 50%, #F9CB25 70%, #EFF923 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Hasil Pertandingan</h3>
          </div>

          {/* Division pills */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-idm-gold-warm/5 border border-idm-gold-warm/10">
            {([
              { key: 'all' as DivisionFilter, label: 'Semua' },
              { key: 'male' as DivisionFilter, label: 'Cowo' },
              { key: 'female' as DivisionFilter, label: 'Cewe' },
            ]).map(div => (
              <button
                key={div.key}
                onClick={() => setHasilDivision(div.key)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  hasilDivision === div.key
                    ? 'bg-idm-gold-warm/15 text-idm-gold-warm shadow-sm shadow-idm-gold-warm/10 border border-idm-gold-warm/25'
                    : 'text-muted-foreground/70 hover:text-foreground border border-transparent hover:bg-muted/40'
                }`}
              >
                {div.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoadingResults || isDataLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {[1, 2].map(i => (
              <div key={i} className="h-32 rounded-xl border border-border/30 bg-card/40 animate-pulse" />
            ))}
          </div>
        ) : !hasAnyResults ? (
          /* Empty state */
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-idm-gold-warm/5 border border-idm-gold-warm/10 flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-7 h-7 text-idm-gold-warm/30" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-1">Belum Ada Hasil Pertandingan</p>
            <p className="text-xs text-muted-foreground/60">Hasil match akan muncul setelah pertandingan selesai</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Semua — both divisions side by side on desktop */}
            {hasilDivision === 'all' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Male column */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{DIVISION_STYLE.male.emoji}</span>
                    <span className={`text-xs font-bold ${DIVISION_STYLE.male.text}`}>Cowo</span>
                    <Badge className={`${DIVISION_STYLE.male.bg} ${DIVISION_STYLE.male.text} text-[8px] border-0`}>{maleWeeks.filter(w => w.tournamentMatches.length > 0).length} Wk</Badge>
                  </div>
                  {hasMaleResults ? (
                    maleWeeks.map((w, idx) => (
                      <WeekCard key={w.weekNumber} week={w} divStyle={DIVISION_STYLE.male} defaultExpanded={idx === firstResultIdx(maleWeeks)} />
                    ))
                  ) : (
                    <GhostWeekCard divStyle={DIVISION_STYLE.male} />
                  )}
                </div>
                {/* Female column */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{DIVISION_STYLE.female.emoji}</span>
                    <span className={`text-xs font-bold ${DIVISION_STYLE.female.text}`}>Cewe</span>
                    <Badge className={`${DIVISION_STYLE.female.bg} ${DIVISION_STYLE.female.text} text-[8px] border-0`}>{femaleWeeks.filter(w => w.tournamentMatches.length > 0).length} Wk</Badge>
                  </div>
                  {hasFemaleResults ? (
                    femaleWeeks.map((w, idx) => (
                      <WeekCard key={w.weekNumber} week={w} divStyle={DIVISION_STYLE.female} defaultExpanded={idx === firstResultIdx(femaleWeeks)} />
                    ))
                  ) : (
                    <GhostWeekCard divStyle={DIVISION_STYLE.female} />
                  )}
                </div>
              </div>
            )}

            {/* Male only */}
            {hasilDivision === 'male' && (
              <div className="max-w-2xl space-y-2">
                {hasMaleResults ? (
                  maleWeeks.map((w, idx) => (
                    <WeekCard key={w.weekNumber} week={w} divStyle={DIVISION_STYLE.male} defaultExpanded={idx === firstResultIdx(maleWeeks)} />
                  ))
                ) : (
                  <GhostWeekCard divStyle={DIVISION_STYLE.male} />
                )}
              </div>
            )}

            {/* Female only */}
            {hasilDivision === 'female' && (
              <div className="max-w-2xl space-y-2">
                {hasFemaleResults ? (
                  femaleWeeks.map((w, idx) => (
                    <WeekCard key={w.weekNumber} week={w} divStyle={DIVISION_STYLE.female} defaultExpanded={idx === firstResultIdx(femaleWeeks)} />
                  ))
                ) : (
                  <GhostWeekCard divStyle={DIVISION_STYLE.female} />
                )}
              </div>
            )}

            {/* CTA — Lihat Semua Hasil → Bracket > Hasil tab */}
            <div className="flex justify-center mt-4">
              <button
                onClick={() => {
                  setInitialBracketTab('results');
                  setCurrentView('bracket');
                  setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                }}
                className="group flex items-center gap-2 px-5 py-2.5 rounded-xl border border-idm-gold-warm/20 bg-idm-gold-warm/5 text-idm-gold-warm text-sm font-bold transition-all duration-300 hover:bg-idm-gold-warm/10 hover:border-idm-gold-warm/35 hover:shadow-[0_0_20px_rgba(239,249,35,0.1)] cursor-pointer active:scale-[0.98]"
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
