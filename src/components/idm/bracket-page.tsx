'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useAppStore } from '@/lib/store';
import { Radio, Swords, Trophy } from 'lucide-react';
import { BracketContent, ResultsContent } from './match-day-center';

/* ─── Mobile detection (SSR-safe) ─── */
const emptySubscribe = () => () => {};
function useIsMobile() {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia('(max-width: 767px)');
      mql.addEventListener('change', cb);
      return () => mql.removeEventListener('change', cb);
    },
    () => window.innerWidth < 768,
    () => false,
  );
}

/* ─── Division filter chips ─── */
function DivisionChips({
  division,
  setDivision,
  hideSemua = false,
}: {
  division: string;
  setDivision: (d: 'semua' | 'male' | 'female') => void;
  hideSemua?: boolean;
}) {
  const options = [
    { key: 'semua' as const, label: 'Semua' },
    { key: 'male' as const, label: 'Cowo' },
    { key: 'female' as const, label: 'Cewe' },
  ].filter(opt => !hideSemua || opt.key !== 'semua');

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-idm-gold-warm/5 border border-idm-gold-warm/10 shrink-0">
      {options.map(div => (
        <button
          key={div.key}
          onClick={() => setDivision(div.key)}
          className={`compact-pill px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
            division === div.key
              ? 'bg-idm-gold-warm/15 text-idm-gold-warm shadow-sm shadow-idm-gold-warm/10 border border-idm-gold-warm/25'
              : 'text-muted-foreground/70 hover:text-foreground border border-idm-gold-warm/10 hover:bg-muted/40 animate-pulse'
          }`}
        >
          {div.label}
        </button>
      ))}
    </div>
  );
}

/* ═══ Shared header component for both Hasil & Bracket views ═══ */
function ViewHeader({
  icon: Icon,
  title,
  subtitle,
  division,
  setDivision,
  hideSemua = false,
}: {
  icon: typeof Radio;
  title: string;
  subtitle: string;
  division: string;
  setDivision: (d: 'semua' | 'male' | 'female') => void;
  hideSemua?: boolean;
}) {
  return (
    <div className="border-b border-idm-gold-warm/10 bg-gradient-to-b from-idm-gold-warm/[0.03] to-transparent">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Row 1: Title */}
        <div className="flex items-center gap-2.5 pt-3 sm:pt-4">
          <div className="w-8 h-8 rounded-lg bg-idm-gold-warm/15 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-idm-gold-warm" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">{title}</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight hidden sm:block">{subtitle}</p>
          </div>
        </div>

        {/* Row 2: Division chips */}
        <div className="flex items-center justify-end gap-2 py-2.5 overflow-x-auto">
          <DivisionChips division={division} setDivision={setDivision} hideSemua={hideSemua} />
        </div>
      </div>
    </div>
  );
}

/* ═══ Content renderer — shared logic for both views ═══ */
function ViewContent({
  mode,
  division,
}: {
  mode: 'results' | 'bracket';
  division: string;
}) {
  const divisionProp = division === 'female' ? 'female' as const : 'male' as const;
  const showBoth = division === 'semua';
  const ContentComponent = mode === 'results' ? ResultsContent : BracketContent;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
      <div className="mt-4 pb-6 space-y-4">
        {showBoth ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ContentComponent divisionProp="male" />
            <ContentComponent divisionProp="female" />
          </div>
        ) : (
          <ContentComponent divisionProp={divisionProp} />
        )}
      </div>
    </div>
  );
}

/* ═══ HASIL PAGE — Shows match results only (no tabs) ═══ */
export function HasilPage() {
  const { division, setDivision } = useAppStore();

  return (
    <div className="min-h-screen bg-background">
      <ViewHeader
        icon={Swords}
        title="Hasil"
        subtitle="Hasil pertandingan tarkam"
        division={division}
        setDivision={setDivision}
      />
      <ViewContent mode="results" division={division} />
    </div>
  );
}

/* ═══ BRACKET PAGE — Shows bracket tree only (no tabs) ═══ */
export function BracketPage() {
  const { division, setDivision } = useAppStore();
  const isMobile = useIsMobile();

  /* On mobile: default to 'male' if division is 'semua' — no "Semua" tab on mobile bracket */
  const effectiveDivision = isMobile && division === 'semua' ? 'male' : division;

  /* Allow body overflow for bracket zoom/pan — prevents clipping */
  useEffect(() => {
    document.body.classList.add('bracket-overflow-active');
    return () => document.body.classList.remove('bracket-overflow-active');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <ViewHeader
        icon={Trophy}
        title="Bracket"
        subtitle="Struktur bracket tarkam"
        division={effectiveDivision}
        setDivision={setDivision}
        hideSemua={isMobile}
      />
      <ViewContent mode="bracket" division={effectiveDivision} />
    </div>
  );
}
