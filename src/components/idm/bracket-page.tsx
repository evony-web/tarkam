'use client';

import { useAppStore } from '@/lib/store';
import { Radio } from 'lucide-react';
import { MatchDayContent } from './match-day-center';

export function BracketPage() {
  const { division, setDivision } = useAppStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-4 sm:space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-idm-gold-warm/15 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4 text-idm-gold-warm" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-idm-gold-warm">Bracket & Hasil</h2>
              <p className="text-[10px] text-muted-foreground/60">Bagan pertandingan & hasil Tarkam IDM</p>
            </div>
          </div>
        </div>

        {/* Division Selector */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-muted/20 border border-border/10">
            {([
              { key: 'semua' as const, label: 'Semua' },
              { key: 'male' as const, label: 'Cowo' },
              { key: 'female' as const, label: 'Cewe' },
            ]).map(div => (
              <button
                key={div.key}
                onClick={() => setDivision(div.key)}
                className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  division === div.key
                    ? div.key === 'semua'
                      ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm'
                      : div.key === 'male'
                        ? 'bg-idm-male/15 text-idm-male border border-idm-male/30 shadow-sm'
                        : 'bg-idm-female/15 text-idm-female border border-idm-female/30 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'
                }`}
              >
                {div.label}
              </button>
            ))}
          </div>
        </div>

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
