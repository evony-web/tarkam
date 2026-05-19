'use client';

import { useAppStore } from '@/lib/store';
import { Radio, Swords, Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
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
          className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
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

export function BracketPage() {
  const { division, setDivision, initialBracketTab, setInitialBracketTab } = useAppStore();

  // Primary tab: 'results' or 'bracket' — initialized from store for deep-linking
  // The store value is set before navigation (by landing CTA), so the initializer
  // captures it on mount. The effect below handles cleanup (scroll + clear store).
  const [primaryTab, setPrimaryTab] = useState(() => initialBracketTab || 'results');

  // Consume initialBracketTab — scroll to top and clear the store value
  useEffect(() => {
    if (initialBracketTab) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const timer = setTimeout(() => setInitialBracketTab(null), 100);
      return () => clearTimeout(timer);
    }
  }, [initialBracketTab, setInitialBracketTab]);

  // Resolve the effective division prop for content components
  const divisionProp = division === 'female' ? 'female' as const : 'male' as const;
  const showBoth = division === 'semua';

  return (
    <div className="min-h-screen bg-background">
      {/* ═══ Header: Title + Primary Tabs in one row ═══ */}
      <div className="border-b border-idm-gold-warm/10 bg-gradient-to-b from-idm-gold-warm/[0.03] to-transparent">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          {/* Row 1: Division filter chips — full width, left-aligned */}
          <div className="pt-3 sm:pt-4">
            <DivisionChips division={division} setDivision={setDivision} />
          </div>

          {/* Row 2: Title + Hasil/Bracket tabs */}
          <div className="flex items-center justify-between gap-3 py-2.5">
            {/* Title */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-idm-gold-warm/15 flex items-center justify-center shrink-0">
                <Radio className="w-4 h-4 text-idm-gold-warm" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">Bracket</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight hidden sm:block">Hasil & bracket tarkam</p>
              </div>
            </div>

            {/* Primary Tabs: Hasil | Bracket — inline with title */}
            <Tabs value={primaryTab} onValueChange={setPrimaryTab} className="w-auto">
              <TabsList className="bg-transparent h-auto p-0 gap-0 rounded-none">
                {[
                  { value: 'results', label: 'Hasil', icon: Swords },
                  { value: 'bracket', label: 'Bracket', icon: Trophy },
                ].map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="relative px-3 py-2 sm:px-4 text-[11px] sm:text-xs font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-idm-gold-warm data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-idm-gold-warm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 inline" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* ═══ Tab Content ═══ */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {primaryTab === 'results' ? (
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
        ) : (
          <div className="mt-4 pb-6 space-y-4">
            {showBoth ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <BracketContent divisionProp="male" />
                <BracketContent divisionProp="female" />
              </div>
            ) : (
              <BracketContent divisionProp={divisionProp} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
