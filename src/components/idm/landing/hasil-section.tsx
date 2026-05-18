'use client';

import React, { useState, useMemo } from 'react';
import {
  Trophy, Swords, ChevronRight, Crown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AnimatedSection, SectionHeader } from './shared';
import { useAppStore } from '@/lib/store';
import type { StatsData } from '@/types/stats';

/* ─── Types ─── */
type DivisionFilter = 'all' | 'male' | 'female';

interface UnifiedMatchResult {
  id: string;
  name1: string;
  name2: string;
  score1: number | null;
  score2: number | null;
  round: number;
  bracket: string | null;
  matchNumber: number | null;
  source: 'league' | 'tournament';
}

/* ─── Helpers (cloned from BracketHasilSection) ─── */

function getRoundLabel(bracket: string | null, round: number): string {
  if (!bracket) return `W${round}`;
  switch (bracket) {
    case 'grand_final':
      return '🏆 Grand Final';
    case 'upper':
      if (round === 1) return '⬆️ Semi Final';
      if (round === 2) return '⬆️ Final Upper';
      return `⬆️ Upper R${round}`;
    case 'lower':
      if (round === 1) return '⬇️ Semi Final Lower';
      if (round === 2) return '⬇️ Final Lower';
      return `⬇️ Lower R${round}`;
    case 'winners':
      return `🏆 Winners R${round}`;
    case 'losers':
      return `💀 Losers R${round}`;
    default:
      return `Round ${round}`;
  }
}

function getRoundSortKey(bracket: string | null, round: number): number {
  if (!bracket) return round * 10;
  switch (bracket) {
    case 'upper': return round * 10;
    case 'lower': return 100 + round * 10;
    case 'grand_final': return 999;
    case 'winners': return round * 10;
    case 'losers': return 100 + round * 10;
    default: return 500 + round * 10;
  }
}

function getGroupKey(m: UnifiedMatchResult): string {
  return m.bracket ? `${m.bracket}-${m.round}` : `round-${m.round}`;
}

/* ─── Division config ─── */
const DIVISION_STYLE = {
  male: {
    color: '#2E9FFF',
    colorRgb: '46,159,255',
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
    colorRgb: '255,45,120',
    bg: 'bg-idm-female/10',
    text: 'text-idm-female',
    borderSubtle: 'border-idm-female/10',
    bgSubtle: 'bg-idm-female/5',
    hoverBorder: 'hover:border-idm-female/20',
    label: '💃 Cewe',
    emoji: '💃',
  },
} as const;

type DivisionStyle = typeof DIVISION_STYLE[keyof typeof DIVISION_STYLE];

/* ─── Match Row — compact, bracket-style ─── */
function MatchRowLanding({ m, divStyle }: { m: UnifiedMatchResult; divStyle: DivisionStyle }) {
  const winner1 = m.score1 != null && m.score2 != null && m.score1 > m.score2;
  const winner2 = m.score1 != null && m.score2 != null && m.score2 > m.score1;

  return (
    <div className={`group flex items-stretch rounded-lg overflow-hidden ${divStyle.bgSubtle} ${divStyle.borderSubtle} border transition-all ${divStyle.hoverBorder} hover:shadow-sm`}>
      <div className="flex-1 min-w-0">
        {/* Team 1 */}
        <div className={`flex items-center px-3 py-1.5 border-b ${divStyle.borderSubtle} ${winner1 ? '' : 'opacity-60'}`}>
          <span className={`text-xs font-semibold truncate flex-1 ${winner1 ? 'text-idm-gold-warm' : 'text-muted-foreground'}`}>
            {winner1 && <span className="mr-1">▸</span>}
            {m.name1}
          </span>
          <span className={`text-sm font-bold tabular-nums w-6 text-right ${winner1 ? 'text-idm-gold-warm' : 'text-foreground'}`}>
            {m.score1 ?? '-'}
          </span>
        </div>
        {/* Team 2 */}
        <div className={`flex items-center px-3 py-1.5 ${winner2 ? '' : 'opacity-60'}`}>
          <span className={`text-xs font-semibold truncate flex-1 ${winner2 ? 'text-idm-gold-warm' : 'text-muted-foreground'}`}>
            {winner2 && <span className="mr-1">▸</span>}
            {m.name2}
          </span>
          <span className={`text-sm font-bold tabular-nums w-6 text-right ${winner2 ? 'text-idm-gold-warm' : 'text-foreground'}`}>
            {m.score2 ?? '-'}
          </span>
        </div>
      </div>
      {/* Status badge */}
      <div className="w-12 shrink-0 flex items-center justify-center border-l border-idm-gold-warm/10">
        <Badge className="bg-green-500/10 text-green-500 text-[8px] border-0">FT</Badge>
      </div>
    </div>
  );
}

/* ─── Grand Final Match — special champion rendering ─── */
function GrandFinalMatch({ m, divStyle }: { m: UnifiedMatchResult; divStyle: DivisionStyle }) {
  if (m.score1 == null || m.score2 == null) {
    return <MatchRowLanding m={m} divStyle={divStyle} />;
  }
  const winner1 = m.score1 > m.score2;
  const winner2 = m.score2 > m.score1;

  return (
    <div className="group flex items-stretch rounded-lg overflow-hidden border bg-idm-gold-warm/5 border-idm-gold-warm/20 transition-all hover:shadow-sm hover:border-idm-gold-warm/35">
      {/* Champion left bar */}
      <div className="w-10 shrink-0 flex items-center justify-center bg-idm-gold-warm/15 border-r border-idm-gold-warm/20">
        <span className="text-base">🏆</span>
      </div>
      {/* Match content */}
      <div className="flex-1 min-w-0">
        {/* Team 1 */}
        <div className={`flex items-center px-3 py-2 border-b border-idm-gold-warm/10 ${winner1 ? 'bg-idm-gold-warm/10' : 'opacity-60'}`}>
          {winner1 && <span className="text-sm mr-1.5">👑</span>}
          <span className={`text-xs font-bold truncate flex-1 ${winner1 ? 'text-idm-gold-warm' : 'text-muted-foreground'}`}>
            {m.name1}
          </span>
          {winner1 && <span className="text-[8px] font-black text-idm-gold-warm/70 uppercase tracking-wider mr-2">Champion</span>}
          <span className={`text-sm font-bold tabular-nums w-6 text-right ${winner1 ? 'text-idm-gold-warm' : 'text-foreground'}`}>{m.score1}</span>
        </div>
        {/* Team 2 */}
        <div className={`flex items-center px-3 py-2 ${winner2 ? 'bg-idm-gold-warm/10' : 'opacity-60'}`}>
          {winner2 && <span className="text-sm mr-1.5">👑</span>}
          <span className={`text-xs font-bold truncate flex-1 ${winner2 ? 'text-idm-gold-warm' : 'text-muted-foreground'}`}>
            {m.name2}
          </span>
          {winner2 && <span className="text-[8px] font-black text-idm-gold-warm/70 uppercase tracking-wider mr-2">Champion</span>}
          <span className={`text-sm font-bold tabular-nums w-6 text-right ${winner2 ? 'text-idm-gold-warm' : 'text-foreground'}`}>{m.score2}</span>
        </div>
      </div>
      {/* Status */}
      <div className="w-14 shrink-0 flex flex-col items-center justify-center border-l border-idm-gold-warm/15">
        <Badge className="bg-idm-gold-warm/15 text-idm-gold-warm text-[8px] border border-idm-gold-warm/25 font-black">FT</Badge>
      </div>
    </div>
  );
}

/* ─── Division Hasil Card — per-division grouped results ─── */
function DivisionHasilCard({
  division,
  matchesGrouped,
  totalMatches,
  isEmpty,
}: {
  division: 'male' | 'female';
  matchesGrouped: Record<string, UnifiedMatchResult[]>;
  totalMatches: number;
  isEmpty: boolean;
}) {
  const ds = DIVISION_STYLE[division];

  // Sort group keys by round order
  const sortedKeys = Object.keys(matchesGrouped).sort((a, b) => {
    const mA = matchesGrouped[a]?.[0];
    const mB = matchesGrouped[b]?.[0];
    if (!mA || !mB) return 0;
    return getRoundSortKey(mA.bracket, mA.round) - getRoundSortKey(mB.bracket, mB.round);
  });

  // Ghost empty state
  if (isEmpty) {
    return (
      <Card className="overflow-hidden border border-border/40 bg-card/60 backdrop-blur-sm">
        <div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent 5%, ${ds.color} 30%, ${ds.color} 70%, transparent 95%)` }} />
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/20">
          <div className={`w-5 h-5 rounded ${ds.bg} flex items-center justify-center shrink-0`}>
            <Trophy className={`w-3 h-3 ${ds.text}`} />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider">{ds.emoji} Hasil Match</h3>
          <Badge className={`${ds.bg} ${ds.text} ml-auto text-[9px] border-0`}>0 Match</Badge>
        </div>
        <div className="p-4 space-y-3">
          {['⬆️ Semi Final', '🏆 Grand Final'].map((label, idx) => (
            <div key={idx} className="opacity-30">
              <div className="flex items-center gap-3 mb-2">
                <div className={`px-2 py-0.5 rounded-md ${ds.bg} ${ds.text} text-[9px] font-bold uppercase tracking-wider`}>
                  {label}
                </div>
                <div className={`flex-1 h-px ${ds.borderSubtle}`} />
                <span className="text-[8px] text-muted-foreground">—</span>
              </div>
              <div className={`rounded-lg ${ds.bgSubtle} ${ds.borderSubtle} border h-[52px] flex items-center justify-center`}>
                <span className="text-[10px] text-muted-foreground/40 italic">Belum ada hasil</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border border-border/40 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-idm-gold-warm/15 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      {/* Top accent line */}
      <div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent 5%, ${ds.color} 30%, ${ds.color} 70%, transparent 95%)` }} />
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/20">
        <div className={`w-5 h-5 rounded ${ds.bg} flex items-center justify-center shrink-0`}>
          <Trophy className={`w-3 h-3 ${ds.text}`} />
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-wider">{ds.emoji} Hasil Match</h3>
        <Badge className={`${ds.bg} ${ds.text} ml-auto text-[9px] border-0`}>{totalMatches} Match</Badge>
      </div>
      {/* Match groups */}
      <div className="p-4 space-y-4">
        {sortedKeys.map(key => {
          const matches = matchesGrouped[key];
          const firstMatch = matches[0];
          const roundLabel = firstMatch ? getRoundLabel(firstMatch.bracket, firstMatch.round) : `Round ${key}`;
          const isGrandFinal = firstMatch?.bracket === 'grand_final';

          return (
            <div key={key}>
              {/* Round header */}
              <div className="flex items-center gap-3 mb-2">
                <div className={`px-2 py-0.5 rounded-md ${ds.bg} ${ds.text} text-[9px] font-bold uppercase tracking-wider whitespace-nowrap`}>
                  {roundLabel}
                </div>
                <div className={`flex-1 h-px ${ds.borderSubtle}`} />
                <span className="text-[8px] text-muted-foreground">{matches.length} match</span>
              </div>
              {/* Match rows */}
              <div className="space-y-1.5">
                {matches.map(m => (
                  isGrandFinal
                    ? <GrandFinalMatch key={m.id} m={m} divStyle={ds} />
                    : <MatchRowLanding key={m.id} m={m} divStyle={ds} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ─── Build UnifiedMatchResult from StatsData ─── */
function buildMatchResults(data: StatsData | undefined): UnifiedMatchResult[] {
  if (!data) return [];
  const results: UnifiedMatchResult[] = [];

  // 1. League matches (recentMatches — club-vs-club)
  for (const m of (data.recentMatches ?? [])) {
    results.push({
      id: m.id,
      name1: m.club1.name,
      name2: m.club2.name,
      score1: m.score1,
      score2: m.score2,
      round: m.week,
      bracket: null,
      matchNumber: null,
      source: 'league',
    });
  }

  // 2. Tournament matches (activeTournament.matches — team-vs-team, only completed)
  const tMatches = data.activeTournament?.matches?.filter(m => m.status === 'completed') ?? [];
  for (const m of tMatches) {
    results.push({
      id: m.id,
      name1: m.team1?.name ?? 'TBD',
      name2: m.team2?.name ?? 'TBD',
      score1: m.score1,
      score2: m.score2,
      round: m.round ?? 1,
      bracket: m.bracket ?? null,
      matchNumber: m.matchNumber ?? null,
      source: 'tournament',
    });
  }

  return results;
}

function groupMatches(matches: UnifiedMatchResult[]): Record<string, UnifiedMatchResult[]> {
  const map: Record<string, UnifiedMatchResult[]> = {};
  for (const m of matches) {
    const key = getGroupKey(m);
    if (!map[key]) map[key] = [];
    map[key].push(m);
  }
  // Sort each group by matchNumber
  for (const key of Object.keys(map)) {
    map[key].sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0));
  }
  return map;
}

/* ─── Main Component ─── */
interface HasilSectionProps {
  maleData: StatsData | undefined;
  femaleData: StatsData | undefined;
  isDataLoading: boolean;
}

export function HasilSection({ maleData, femaleData, isDataLoading }: HasilSectionProps) {
  const setCurrentView = useAppStore(s => s.setCurrentView);
  const [hasilDivision, setHasilDivision] = useState<DivisionFilter>('all');

  // Build unified match results per division
  const maleMatches = useMemo(() => buildMatchResults(maleData), [maleData]);
  const femaleMatches = useMemo(() => buildMatchResults(femaleData), [femaleData]);
  const maleMatchesGrouped = useMemo(() => groupMatches(maleMatches), [maleMatches]);
  const femaleMatchesGrouped = useMemo(() => groupMatches(femaleMatches), [femaleMatches]);

  const hasMaleMatches = maleMatches.length > 0;
  const hasFemaleMatches = femaleMatches.length > 0;
  const hasAnyMatches = hasMaleMatches || hasFemaleMatches;

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
            subtitle="Hasil pertandingan tarkam terbaru — Semi Final, Grand Final & lebihnya"
          />
        </AnimatedSection>

        {/* Section Title Row + Division Filter — title left, pills right inline */}
        <div className="stagger-item-fast flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded bg-idm-gold-warm/10 flex items-center justify-center shrink-0">
              <Trophy className="w-3 h-3 text-idm-gold-warm" />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{
              background: 'linear-gradient(135deg, #FAF0DC 0%, #EFF923 30%, #F9CB25 50%, #F9CB25 70%, #EFF923 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Hasil Pertandingan</h3>
          </div>

          {/* Division pills — right-aligned */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-idm-gold-warm/5 border border-idm-gold-warm/10">
            {([
              { key: 'all' as DivisionFilter, label: 'Semua' },
              { key: 'male' as DivisionFilter, label: 'Cowo' },
              { key: 'female' as DivisionFilter, label: 'Cewe' },
            ]).map(div => (
              <button
                key={div.key}
                onClick={() => setHasilDivision(div.key)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
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
        {isDataLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="h-64 rounded-2xl border border-border/30 bg-card/40 animate-pulse" />
            ))}
          </div>
        ) : !hasAnyMatches ? (
          /* Empty state */
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-idm-gold-warm/5 border border-idm-gold-warm/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-idm-gold-warm/30" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-1">Belum Ada Hasil Pertandingan</p>
            <p className="text-xs text-muted-foreground/60">Hasil match akan muncul setelah pertandingan selesai</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Semua — both divisions side by side */}
            {hasilDivision === 'all' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <DivisionHasilCard
                  division="male"
                  matchesGrouped={maleMatchesGrouped}
                  totalMatches={maleMatches.length}
                  isEmpty={!hasMaleMatches}
                />
                <DivisionHasilCard
                  division="female"
                  matchesGrouped={femaleMatchesGrouped}
                  totalMatches={femaleMatches.length}
                  isEmpty={!hasFemaleMatches}
                />
              </div>
            )}

            {/* Male only */}
            {hasilDivision === 'male' && (
              <DivisionHasilCard
                division="male"
                matchesGrouped={maleMatchesGrouped}
                totalMatches={maleMatches.length}
                isEmpty={!hasMaleMatches}
              />
            )}

            {/* Female only */}
            {hasilDivision === 'female' && (
              <DivisionHasilCard
                division="female"
                matchesGrouped={femaleMatchesGrouped}
                totalMatches={femaleMatches.length}
                isEmpty={!hasFemaleMatches}
              />
            )}

            {/* CTA — Lihat Semua Hasil → Bracket view */}
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setCurrentView('bracket')}
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
