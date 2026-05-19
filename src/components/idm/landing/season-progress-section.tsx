'use client';

import React from 'react';
import { Calendar, Flag, Zap, Target } from 'lucide-react';
import { AnimatedSection } from './shared';
import { getSeasonPhase } from '@/lib/points-system';

/* ─── Phase config ─── */
const PHASE_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; text: string }> = {
  registration: { label: 'Registrasi', icon: Flag, color: '#3B82F6', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  competition: { label: 'Kompetisi', icon: Zap, color: '#22C55E', bg: 'bg-green-500/10', text: 'text-green-400' },
  playoffs: { label: 'Playoff', icon: Target, color: '#F59E0B', bg: 'bg-amber-500/10', text: 'text-amber-400' },
};

/* ─── Season Progress Section ─── */
export function SeasonProgressSection({ maleData, femaleData }: {
  maleData: any;
  femaleData: any;
}) {
  // Use male data as primary (both divisions share same season)
  const season = maleData?.season;
  const seasonProgress = maleData?.seasonProgress;

  if (!season || !seasonProgress) return null;

  const { totalWeeks, completedWeeks, percentage } = seasonProgress;
  const currentWeek = maleData?.activeTournament?.weekNumber || (completedWeeks + 1);
  const phase = getSeasonPhase(Math.min(currentWeek, totalWeeks), totalWeeks);
  const phaseConfig = PHASE_CONFIG[phase] || PHASE_CONFIG.competition;
  const PhaseIcon = phaseConfig.icon;

  // Is there an active (not yet completed) week?
  const hasActiveWeek = currentWeek <= totalWeeks && currentWeek > completedWeeks;

  // Build week dots
  const weeks = Array.from({ length: totalWeeks }, (_, i) => {
    const weekNum = i + 1;
    const isCompleted = weekNum <= completedWeeks;
    const isCurrent = weekNum === currentWeek && hasActiveWeek;
    const isUpcoming = weekNum > currentWeek;
    return { weekNum, isCompleted, isCurrent, isUpcoming };
  });

  return (
    <section
      role="region"
      aria-label="Progress Season"
      className="landing-section relative py-5 sm:py-8 px-4 sm:px-6 lg:px-8 overflow-hidden bg-deep border-y border-border/10 dark:border-y-0"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle, rgba(239,249,35,0.4) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-idm-gold-warm/20 to-transparent" aria-hidden="true" />

      <div className="relative z-10 max-w-3xl mx-auto">
        <AnimatedSection>
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-idm-gold-warm/10 flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5 text-idm-gold-warm" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">{season.name || `Season ${season.number}`}</h3>
                <p className="text-[10px] text-muted-foreground">Progress musim ini</p>
              </div>
            </div>

            {/* Phase badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${phaseConfig.bg} ${phaseConfig.text} border-current/15`}>
              <PhaseIcon className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{phaseConfig.label}</span>
            </div>
          </div>

          {/* Week timeline */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-3">
            {weeks.map(({ weekNum, isCompleted, isCurrent }) => (
              <div key={weekNum} className="flex-1 flex flex-col items-center gap-1">
                {/* Week dot / bar */}
                <div className="relative w-full h-2 sm:h-2.5 rounded-full overflow-hidden bg-muted/20">
                  {isCompleted && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-idm-gold-warm to-idm-gold-warm/80 transition-all duration-500" />
                  )}
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full bg-idm-gold-warm/30 animate-pulse" />
                  )}
                </div>
                {/* Week number label */}
                <span className={`text-[8px] sm:text-[9px] font-medium tabular-nums ${
                  isCompleted ? 'text-idm-gold-warm' :
                  isCurrent ? 'text-idm-gold-warm/70 font-bold' :
                  'text-muted-foreground/40'
                }`}>
                  {weekNum}
                </span>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">
                <span className="text-idm-gold-warm font-bold">{completedWeeks}</span> / {totalWeeks} minggu selesai
              </span>
              {hasActiveWeek && (
                <span className="text-idm-gold-warm/60">
                  · Minggu <span className="font-bold text-idm-gold-warm">{currentWeek}</span> berlangsung
                </span>
              )}
            </div>
            <span className="text-idm-gold-warm font-bold tabular-nums">{percentage}%</span>
          </div>

          {/* Progress bar (overall) */}
          <div className="mt-2 h-1 rounded-full bg-muted/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-idm-gold-warm/60 via-idm-gold-warm to-idm-gold-warm/80 transition-all duration-700 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
