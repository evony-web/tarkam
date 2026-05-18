'use client';

import React, { useState, useCallback, startTransition } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crown, Music, Shield, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AvatarMedia } from '@/components/ui/avatar-media';
import type { StatsData, TopPlayer, SeasonChampionPlayer } from '@/types/stats';
import { useCommunityTheme } from '@/hooks/use-community-theme';
import { getDivisionTheme } from '@/hooks/use-division-theme';
import { getAvatarUrl, clubToString } from '@/lib/utils';

// Import champion section components
import { WeeklyChampionCard } from './community-dashboard/weekly-champion-card';
import { MvpSpotlight } from './community-dashboard/mvp-spotlight';
import { MvpHallOfFame } from './community-dashboard/mvp-hall-of-fame';
import { SharePopup } from './social-share-button';

// Lazy load section components
import dynamic from 'next/dynamic';
const PlayerProfile = dynamic(() => import('./player-profile').then(m => ({ default: m.PlayerProfile })), { ssr: false, loading: () => null });


type DivisionFilter = 'all' | 'male' | 'female';


/* ═══════════════════════════════════════════
   Champion Header — Sticky heading with division filter tabs
   ═══════════════════════════════════════════ */
const ChampionsMvpHeader = React.memo(function ChampionsMvpHeader({
  selectedDivision,
  onDivisionChange,
}: {
  selectedDivision: DivisionFilter;
  onDivisionChange: (d: DivisionFilter) => void;
}) {
  const ct = useCommunityTheme();

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className={`w-5 h-5 rounded ${ct.iconBg} flex items-center justify-center shrink-0`}>
          <Crown className={`w-3 h-3 ${ct.neonText}`} />
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-wider shrink-0" style={{
          background: 'linear-gradient(135deg, #FAF0DC 0%, #EFF923 30%, #F9CB25 50%, #F9CB25 70%, #EFF923 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>Champion</h3>
      </div>

      {/* Division pills — compact, right-aligned */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-idm-gold-warm/5 border border-idm-gold-warm/10">
        {([
          { key: 'all' as DivisionFilter, label: 'Semua' },
          { key: 'male' as DivisionFilter, label: 'Cowo' },
          { key: 'female' as DivisionFilter, label: 'Cewe' },
        ]).map(div => (
          <button
            key={div.key}
            onClick={() => onDivisionChange(div.key)}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              selectedDivision === div.key
                ? 'bg-idm-gold-warm/15 text-idm-gold-warm shadow-sm shadow-idm-gold-warm/10 border border-idm-gold-warm/25'
                : 'text-muted-foreground/70 hover:text-foreground border border-transparent hover:bg-muted/40'
            }`}
          >
            {div.label}
          </button>
        ))}
      </div>
    </div>
  );
});


/* ─── Champion Badge — Single champion compact plaque ─── */
const ChampionBadge = React.memo(function ChampionBadge({
  champion,
  seasonNumber,
  division,
  onClick,
}: {
  champion: SeasonChampionPlayer;
  seasonNumber: number;
  division: 'male' | 'female';
  onClick: () => void;
}) {
  const dt = getDivisionTheme(division);
  const avatarUrl = getAvatarUrl(champion.gamertag, division, champion.avatar);
  const DivisionIcon = division === 'male' ? Music : Shield;
  const genderSymbol = division === 'male' ? '♂' : '♀';
  const accentColor = division === 'male' ? '#2E9FFF' : '#FF2D78';

  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-3 p-4 sm:p-5 rounded-2xl border ${dt.bgSubtle} ${dt.borderSubtle} hover:${dt.border} transition-all cursor-pointer text-left w-full`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl overflow-hidden border-2 shadow-lg" style={{ borderColor: accentColor + '40' }}>
          <AvatarMedia src={avatarUrl} alt={champion.gamertag} width={48} height={48} className="w-full h-full object-cover" />
        </div>
        {/* Crown overlay */}
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg border border-yellow-400/30">
          <Crown className="w-2.5 h-2.5 text-white" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <DivisionIcon className="w-3 h-3 shrink-0" style={{ color: accentColor }} />
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>
            {division === 'male' ? 'COWO' : 'CEWE'} {genderSymbol}
          </span>
        </div>
        <p className="text-sm font-bold truncate text-foreground group-hover:text-idm-gold-warm transition-colors">
          {champion.gamertag}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-bold text-idm-gold-warm tabular-nums">{champion.points}pts</span>
          <span className="text-[10px] text-muted-foreground/70">{champion.totalWins}W</span>
        </div>
      </div>

      {/* Arrow hint */}
      <ChevronDown className="w-4 h-4 text-muted-foreground/30 -rotate-90 shrink-0 group-hover:text-idm-gold-warm/60 transition-colors" />
    </button>
  );
});


/* ─── Ghost Champion Badge — Empty state matching ChampionBadge layout ─── */
const GhostChampionBadge = React.memo(function GhostChampionBadge({ division }: { division: 'male' | 'female' }) {
  const dt = getDivisionTheme(division);
  const DivisionIcon = division === 'male' ? Music : Shield;
  const genderSymbol = division === 'male' ? '♂' : '♀';
  const accentColor = division === 'male' ? '#2E9FFF' : '#FF2D78';

  return (
    <div className={`flex items-center gap-3 p-4 sm:p-5 rounded-2xl border ${dt.bgSubtle} ${dt.borderSubtle} opacity-55`}>
      {/* Ghost avatar */}
      <div className="relative shrink-0">
        <div
          className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl overflow-hidden border-2 flex items-center justify-center"
          style={{ borderColor: accentColor + '25', background: `linear-gradient(135deg, ${accentColor}18, ${accentColor}08)` }}
        >
          <Crown className="w-4 h-4 opacity-40" style={{ color: accentColor }} />
        </div>
      </div>

      {/* Ghost info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <DivisionIcon className="w-3 h-3 shrink-0" style={{ color: accentColor }} />
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>
            {division === 'male' ? 'COWO' : 'CEWE'} {genderSymbol}
          </span>
        </div>
        <div className="h-4 w-20 rounded bg-muted/35 mb-1.5" />
        <div className="flex items-center gap-2">
          <div className="h-3 w-8 rounded bg-muted/25" />
          <div className="h-3 w-10 rounded bg-muted/25" />
        </div>
      </div>
    </div>
  );
});


/* ═══════════════════════════════════════════
   Reigning Champion Plaque — Compact trophy badge
   Shows the most recent completed season's champions.
   ═══════════════════════════════════════════ */
const ReigningChampionPlaque = React.memo(function ReigningChampionPlaque({
  maleData,
  femaleData,
  selectedDivision,
  onPlayerClick,
}: {
  maleData?: StatsData;
  femaleData?: StatsData;
  selectedDivision: DivisionFilter;
  onPlayerClick: (player: TopPlayer & { division?: string }, division: 'male' | 'female') => void;
}) {
  const ct = useCommunityTheme();

  // Extract most recent completed season champion per division
  const completedMaleSeasons = maleData?.allSeasons?.filter(s => s.status === 'completed' && s.championPlayer) || [];
  const completedFemaleSeasons = femaleData?.allSeasons?.filter(s => s.status === 'completed' && s.championPlayer) || [];

  // Sort descending by season number, take first = most recent
  const latestMale = completedMaleSeasons.sort((a, b) => b.number - a.number)[0];
  const latestFemale = completedFemaleSeasons.sort((a, b) => b.number - a.number)[0];

  const hasMale = !!latestMale?.championPlayer;
  const hasFemale = !!latestFemale?.championPlayer;
  const showMale = selectedDivision === 'all' || selectedDivision === 'male';
  const showFemale = selectedDivision === 'all' || selectedDivision === 'female';

  // Determine which season label to show
  const seasonNumber = hasMale && hasFemale
    ? Math.max(latestMale.number, latestFemale.number)
    : hasMale ? latestMale.number : hasFemale ? latestFemale.number : 0;

  // Determine grid layout
  const showBothDivisions = showMale && showFemale;

  return (
    <div className="animate-fade-enter-sm">
      <div className={`rounded-2xl ${ct.casinoCard} overflow-hidden`}>
        <div className={ct.casinoBar} />

        {/* Header — "Reigning Champion" with season badge */}
        <div className={`flex items-center gap-2.5 px-3 lg:px-5 py-2.5 border-b ${ct.borderSubtle}`}>
          <div className={`w-5 h-5 rounded ${ct.iconBg} flex items-center justify-center shrink-0`}>
            <Crown className={`w-3 h-3 ${ct.neonText}`} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-idm-gold-warm">Reigning Champion</span>
          <SharePopup
            shareUrl={typeof window !== 'undefined' ? `${window.location.origin}/?view=champion` : ''}
            title="Bagikan Juara"
            subtitle="Reigning Champion"
            shareText="Lihat juara Tarkam IDM!"
            buttonLabel="Bagikan juara"
            size="sm"
          />
          {seasonNumber > 0 ? (
            <Badge className="bg-idm-gold-warm/15 text-idm-gold-warm border border-idm-gold-warm/25 ml-auto text-[9px] font-bold">
              <Crown className="w-2.5 h-2.5 mr-0.5" />S{seasonNumber}
            </Badge>
          ) : (
            <Badge className="bg-muted/20 text-muted-foreground/40 border border-border/10 ml-auto text-[9px] font-bold">
              TBA
            </Badge>
          )}
        </div>

        {/* Plaque Content — duo or single */}
        <div className="p-3 sm:p-6">
          <div className={`grid gap-3 ${showBothDivisions ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {/* Male Champion */}
            {showMale && (
              hasMale && latestMale?.championPlayer ? (
                <ChampionBadge
                  champion={latestMale.championPlayer}
                  seasonNumber={latestMale.number}
                  division="male"
                  onClick={() => onPlayerClick({
                    ...latestMale.championPlayer!,
                    name: latestMale.championPlayer!.gamertag,
                    club: latestMale.championPlayer!.club ?? undefined,
                    division: 'male',
                  }, 'male')}
                />
              ) : (
                <GhostChampionBadge division="male" />
              )
            )}

            {/* Female Champion */}
            {showFemale && (
              hasFemale && latestFemale?.championPlayer ? (
                <ChampionBadge
                  champion={latestFemale.championPlayer}
                  seasonNumber={latestFemale.number}
                  division="female"
                  onClick={() => onPlayerClick({
                    ...latestFemale.championPlayer!,
                    name: latestFemale.championPlayer!.gamertag,
                    club: latestFemale.championPlayer!.club ?? undefined,
                    division: 'female',
                  }, 'female')}
                />
              ) : (
                <GhostChampionBadge division="female" />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
});


/* ═══════════════════════════════════════════
   Highlights (Juara) Page — Main Component
   Contains: Reigning Champion, Weekly Champions, MVP Spotlight, MVP Hall of Fame
   ═══════════════════════════════════════════ */
export function HighlightsPage() {

  // State
  const [selectedPlayer, setSelectedPlayer] = useState<(StatsData['topPlayers'][0] & { division?: string }) | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<DivisionFilter>('all');

  // Division change handler
  const handleDivisionChange = useCallback((d: DivisionFilter) => {
    startTransition(() => setSelectedDivision(d));
  }, []);

  // Player click handler
  const handlePlayerClick = useCallback((player: TopPlayer & { division?: string }, division: 'male' | 'female') => {
    setSelectedPlayer({
      ...player,
      division,
      club: clubToString(player.club as Parameters<typeof clubToString>[0]) || undefined,
    });
  }, []);

  // Data fetching — male stats
  const { data: maleData } = useQuery<StatsData>({
    queryKey: ['stats', 'male'],
    queryFn: async () => {
      const res = await fetch('/api/stats?division=male');
      return res.json();
    },
    staleTime: 120000,
    refetchInterval: 300000,
    refetchIntervalInBackground: false,
    notifyOnChangeProps: ['data', 'error'],
    refetchOnWindowFocus: true,
    gcTime: 300000,
    placeholderData: (prev) => prev,
  });

  // Data fetching — female stats
  const { data: femaleData } = useQuery<StatsData>({
    queryKey: ['stats', 'female'],
    queryFn: async () => {
      const res = await fetch('/api/stats?division=female');
      return res.json();
    },
    staleTime: 120000,
    refetchInterval: 330000,
    refetchIntervalInBackground: false,
    notifyOnChangeProps: ['data', 'error'],
    refetchOnWindowFocus: true,
    gcTime: 300000,
    placeholderData: (prev) => prev,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Content */}
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-6 py-4">

        {/* ═══ 1. Champion & MVP Sections ═══ */}
        <div className="space-y-4 sm:space-y-5">
          {/* Sticky Division Filter Header */}
          <div className="sticky top-0 z-30 -mx-1.5 sm:-mx-2 lg:-mx-3 px-1.5 sm:px-2 lg:px-3 py-2.5 bg-background/95 backdrop-blur-md border-b border-idm-gold-warm/10">
            <ChampionsMvpHeader
              selectedDivision={selectedDivision}
              onDivisionChange={handleDivisionChange}
            />
          </div>

          {/* Reigning Champion Plaque */}
          <ReigningChampionPlaque
            maleData={maleData}
            femaleData={femaleData}
            selectedDivision={selectedDivision}
            onPlayerClick={handlePlayerClick}
          />

          {/* Weekly Champions */}
          <div className="animate-fade-enter-sm">
            <WeeklyChampionCard maleData={maleData} femaleData={femaleData} selectedDivision={selectedDivision} onPlayerClick={handlePlayerClick} />
          </div>

          {/* MVP Spotlight */}
          <div className="animate-fade-enter-sm">
            <MvpSpotlight maleData={maleData} femaleData={femaleData} selectedDivision={selectedDivision} onPlayerClick={handlePlayerClick} />
          </div>

          {/* MVP Hall of Fame */}
          <div className="animate-fade-enter-sm">
            <MvpHallOfFame maleData={maleData} femaleData={femaleData} selectedDivision={selectedDivision} />
          </div>
        </div>


      </div>

      {/* Modals */}
      {selectedPlayer && (
        <PlayerProfile
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          skinMap={{ ...maleData?.skinMap, ...femaleData?.skinMap }}
        />
      )}
    </div>
  );
}
