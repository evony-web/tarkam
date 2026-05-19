'use client';

import { useAppStore } from '@/lib/store';
import { Radio } from 'lucide-react';
import { MatchDayContent } from './match-day-center';

export function BracketPage() {
  const { division, setDivision } = useAppStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Page Title Banner — scrolls away */}
      <div className="border-b border-idm-gold-warm/10 bg-gradient-to-b from-idm-gold-warm/[0.03] to-transparent px-4 py-5 sm:py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-idm-gold-warm/15 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4 text-idm-gold-warm" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">Bracket</h1>
              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">Bracket & hasil tarkam</p>
            </div>
          </div>
        </div>
      </div>

      {/* Division pills — sticky below fixed nav (h-14 = 56px) */}
      <div className="sticky top-14 z-30 border-b border-idm-gold-warm/10 bg-background/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-end">
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
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-4 sm:space-y-5">

        {/* Content: Both divisions or Single */}
        {division === 'semua' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <MatchDayContent divisionProp="male" />
            <MatchDayContent divisionProp="female" />
          </div>
        ) : (
          <MatchDayContent divisionProp={division === 'female' ? 'female' : 'male'} />
        )}
      </div>
    </div>
  );
}
