'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { ArrowLeft } from 'lucide-react';
import type { StatsData } from '@/types/stats';

// Lazy load section component
import dynamic from 'next/dynamic';
const PlayersSection = dynamic(() => import('./landing/players-section').then(m => ({ default: m.PlayersSection })), { ssr: false, loading: () => <div className="h-[480px]" /> });
const PlayerProfile = dynamic(() => import('./player-profile').then(m => ({ default: m.PlayerProfile })), { ssr: false, loading: () => null });
const RegistrationModal = dynamic(() => import('./registration-modal').then(m => ({ default: m.RegistrationModal })), { ssr: false, loading: () => null });

export function PlayersPage() {
  const { setCurrentView } = useAppStore();

  // State
  const [selectedPlayerRaw, setSelectedPlayerRaw] = useState<StatsData['topPlayers'][0] & { division?: string } | null>(null);
  const [showAllMalePlayers, setShowAllMalePlayers] = useState(false);
  const [showAllFemalePlayers, setShowAllFemalePlayers] = useState(false);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [registrationDefaultDivision, setRegistrationDefaultDivision] = useState<'male' | 'female'>('male');

  const setSelectedPlayer = useCallback((player: typeof selectedPlayerRaw) => {
    setSelectedPlayerRaw(player);
  }, []);

  // Data fetching
  const { data: maleData, isLoading: isMaleLoading, isFetching: isMaleFetching, isPlaceholderData: isMalePlaceholder } = useQuery<StatsData>({
    queryKey: ['stats', 'male', selectedSeasonId],
    queryFn: async () => {
      const url = `/api/stats?division=male${selectedSeasonId ? `&seasonId=${selectedSeasonId}` : ''}`;
      const res = await fetch(url); return res.json();
    },
    staleTime: 120000,
    refetchInterval: 300000,
    refetchIntervalInBackground: false,
    notifyOnChangeProps: ['data', 'error'],
    refetchOnWindowFocus: true,
    gcTime: 300000,
    placeholderData: (prev) => prev,
  });

  const { data: femaleData, isLoading: isFemaleLoading, isFetching: isFemaleFetching, isPlaceholderData: isFemalePlaceholder } = useQuery<StatsData>({
    queryKey: ['stats', 'female', selectedSeasonId],
    queryFn: async () => {
      const url = `/api/stats?division=female${selectedSeasonId ? `&seasonId=${selectedSeasonId}` : ''}`;
      const res = await fetch(url); return res.json();
    },
    staleTime: 120000,
    refetchInterval: 330000,
    refetchIntervalInBackground: false,
    notifyOnChangeProps: ['data', 'error'],
    refetchOnWindowFocus: true,
    gcTime: 300000,
    placeholderData: (prev) => prev,
  });

  const isDataLoading = isMaleLoading || isFemaleLoading;
  const isSeasonSwitching = !isDataLoading && (isMaleFetching || isFemaleFetching);

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
            <h1 className="text-lg font-bold text-foreground">Pemain</h1>
            <p className="text-xs text-muted-foreground">Player Tarkam IDM</p>
          </div>
          {/* Register button */}
          <button
            onClick={() => { setRegistrationDefaultDivision('male'); setRegistrationModalOpen(true); }}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-idm-gold-warm/25 text-idm-gold-warm hover:bg-idm-gold-warm/10 transition-colors cursor-pointer"
          >
            Daftar
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        <PlayersSection
          maleData={maleData}
          femaleData={femaleData}
          isDataLoading={isDataLoading}
          isSeasonSwitching={isSeasonSwitching}
          setSelectedPlayer={setSelectedPlayer}
          showAllMalePlayers={showAllMalePlayers}
          setShowAllMalePlayers={setShowAllMalePlayers}
          showAllFemalePlayers={showAllFemalePlayers}
          setShowAllFemalePlayers={setShowAllFemalePlayers}
          selectedSeasonId={selectedSeasonId}
          setSelectedSeasonId={setSelectedSeasonId}
          isHistorical={maleData?.isHistorical || femaleData?.isHistorical || false}
          maleSkinMap={maleData?.skinMap}
          femaleSkinMap={femaleData?.skinMap}
        />
      </div>

      {/* Modals */}
      {selectedPlayerRaw && (
        <PlayerProfile
          player={selectedPlayerRaw}
          onClose={() => setSelectedPlayerRaw(null)}
          skinMap={{ ...maleData?.skinMap, ...femaleData?.skinMap }}
        />
      )}

      <RegistrationModal
        open={registrationModalOpen}
        onClose={() => setRegistrationModalOpen(false)}
        defaultDivision={registrationDefaultDivision}
      />
    </div>
  );
}
