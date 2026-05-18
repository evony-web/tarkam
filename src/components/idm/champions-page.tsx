'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { ArrowLeft, Trophy } from 'lucide-react';
import type { StatsData } from '@/types/stats';

// Lazy load section components
import dynamic from 'next/dynamic';
const SeasonChampionSection = dynamic(() => import('./landing/season-champion-section').then(m => ({ default: m.SeasonChampionSection })), { ssr: false, loading: () => <div className="h-[400px]" /> });
const PlayerProfile = dynamic(() => import('./player-profile').then(m => ({ default: m.PlayerProfile })), { ssr: false, loading: () => null });
const ClubProfile = dynamic(() => import('./club-profile').then(m => ({ default: m.ClubProfile })), { ssr: false, loading: () => null });

export function ChampionsPage() {
  const { setCurrentView } = useAppStore();

  // State
  const [selectedPlayer, setSelectedPlayer] = useState<StatsData['topPlayers'][0] & { division?: string } | null>(null);
  const [selectedClub, setSelectedClub] = useState<(StatsData['clubs'][0] & { division?: string; members?: any[] }) | null>(null);

  // Data fetching — male stats
  const { data: maleData, isLoading: isMaleLoading, isFetching: isMaleFetching, isPlaceholderData: isMalePlaceholder } = useQuery<StatsData>({
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
  const { data: femaleData, isLoading: isFemaleLoading, isFetching: isFemaleFetching, isPlaceholderData: isFemalePlaceholder } = useQuery<StatsData>({
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

  // Data fetching — league data
  const { data: leagueData } = useQuery<{ hasData: boolean; clubs?: any[]; stats?: any; preSeason?: boolean; reason?: string; season?: any; tarkamChampion?: any }>({
    queryKey: ['league-landing'],
    queryFn: async () => {
      const res = await fetch('/api/league');
      if (!res.ok) throw new Error('League API failed');
      return res.json();
    },
    staleTime: 300000,
    gcTime: 300000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 660000,
    refetchIntervalInBackground: false,
  });

  const isDataLoading = isMaleLoading || isFemaleLoading;
  const isSeasonDataPlaceholder = isMalePlaceholder || isFemalePlaceholder;

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-idm-gold-warm/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button
            onClick={() => setCurrentView('landing')}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted/60 transition-colors"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5 text-idm-gold-warm" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Season Champion</h1>
            <p className="text-xs text-muted-foreground">Juara Season Tarkam</p>
          </div>
          <div className="ml-auto">
            <Trophy className="w-5 h-5 text-idm-gold-warm/40" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        <SeasonChampionSection
          maleData={maleData}
          femaleData={femaleData}
          isDataLoading={isDataLoading}
          setSelectedPlayer={setSelectedPlayer}
          setSelectedClub={setSelectedClub}
          leagueData={leagueData}
          skinMap={{ ...maleData?.skinMap, ...femaleData?.skinMap }}
          isSeasonDataPlaceholder={isSeasonDataPlaceholder}
        />
      </div>

      {/* Modals */}
      {selectedPlayer && (
        <PlayerProfile
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          skinMap={{ ...maleData?.skinMap, ...femaleData?.skinMap }}
        />
      )}

      {selectedClub && (
        <ClubProfile
          club={selectedClub}
          onClose={() => setSelectedClub(null)}
        />
      )}
    </div>
  );
}
