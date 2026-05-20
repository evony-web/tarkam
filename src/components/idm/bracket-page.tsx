'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Radio, Swords, Trophy } from 'lucide-react';
import { BracketContent, ResultsContent } from './match-day-center';

/* ─── Division filter chips (extracted to avoid creating component during render) ─── */
function DivisionChips({ division, setDivision }: { division: string; setDivision: (d: 'semua' | 'male' | 'female') => void }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-idm-gold-warm/5 border border-idm-gold-warm/10 shrink-0">
      {([
        { key: 'semua' as const, label: 'Semua' },
        { key: 'male' as const, label: 'Cowo' },
        { key: 'female' as const, label: 'Cewe' },
      ]).map(div => (
        <button
          key={div.key}
          onClick={() => setDivision(div.key)}
          className={`compact-pill px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
            division === div.key
              ? 'bg-idm-gold-warm/15 text-idm-gold-warm shadow-sm shadow-idm-gold-warm/10 border border-idm-gold-warm/25'
              : 'text-muted-foreground/70 hover:text-foreground border border-transparent hover:bg-muted/40'
          }`}
        >
          {div.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Bracket sub-tabs — shown when "Semua" is selected in bracket mode ─── */
function BracketSubTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: 'male' | 'female';
  onTabChange: (tab: 'male' | 'female') => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onTabChange('male')}
        className={`compact-pill flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
          activeTab === 'male'
            ? 'bg-idm-male/15 text-idm-male border-idm-male/30 shadow-sm shadow-idm-male/10'
            : 'text-muted-foreground/60 border-transparent hover:text-foreground hover:bg-muted/40'
        }`}
      >
        <span className="text-sm">♂</span>
        Cowo
      </button>
      <button
        onClick={() => onTabChange('female')}
        className={`compact-pill flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
          activeTab === 'female'
            ? 'bg-idm-female/15 text-idm-female border-idm-female/30 shadow-sm shadow-idm-female/10'
            : 'text-muted-foreground/60 border-transparent hover:text-foreground hover:bg-muted/40'
        }`}
      >
        <span className="text-sm">♀</span>
        Cewe
      </button>
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
}: {
  icon: typeof Radio;
  title: string;
  subtitle: string;
  division: string;
  setDivision: (d: 'semua' | 'male' | 'female') => void;
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

        {/* Row 2: Division chips only */}
        <div className="flex items-center justify-end gap-2 py-2.5 overflow-x-auto">
          <DivisionChips division={division} setDivision={setDivision} />
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

  /* Bracket "Semua" uses sub-tabs (Cowo|Cewe) instead of stacking —
     both divisions get full width, no scrolling needed to find Cewe bracket */
  const [bracketSubTab, setBracketSubTab] = useState<'male' | 'female'>('male');

  // Results "Semua" uses side-by-side grid on desktop
  if (mode === 'results') {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="mt-4 pb-6 space-y-4">
          {showBoth ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ResultsContent divisionProp="male" />
              <ResultsContent divisionProp="female" />
            </div>
          ) : (
            <ResultsContent divisionProp={divisionProp} />
          )}
        </div>
      </div>
    );
  }

  /* ─── Bracket mode ─── */
  return (
    <div className="mt-4 pb-6">
      {/* When "Semua" selected, show sub-tabs so user can switch between Cowo/Cewe without scrolling */}
      {showBoth && (
        <div className="px-3 sm:px-4 lg:px-6 mb-4">
          <BracketSubTabs activeTab={bracketSubTab} onTabChange={setBracketSubTab} />
        </div>
      )}

      {/* Render only the active division's bracket — full width, no stacking */}
      <BracketContent divisionProp={showBoth ? bracketSubTab : divisionProp} />
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
        division={division}
        setDivision={setDivision}
      />
      <ViewContent mode="bracket" division={division} />
    </div>
  );
}
