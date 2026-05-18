'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { ArrowLeft, Shield } from 'lucide-react';
import type { StatsData } from '@/types/stats';

// Lazy load section components
import dynamic from 'next/dynamic';
const ClubsSection = dynamic(() => import('./landing/clubs-section').then(m => ({ default: m.ClubsSection })), { ssr: false, loading: () => <div className="h-[400px]" /> });
const ClubProfile = dynamic(() => import('./club-profile').then(m => ({ default: m.ClubProfile })), { ssr: false, loading: () => null });

export function ClubsPage() {
  const { setCurrentView } = useAppStore();

  // State
  const [selectedClub, setSelectedClub] = useState<(StatsData['clubs'][0] & { division?: string; members?: any[] }) | null>(null);
  const [showAllClubs, setShowAllClubs] = useState(false);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);

  // Data fetching — male stats
  const { data: maleData, isLoading: isMaleLoading } = useQuery<StatsData>({
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

  // Data fetching — female stats
  const { data: femaleData, isLoading: isFemaleLoading } = useQuery<StatsData>({
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

  // Data fetching — league data
  const { data: leagueData } = useQuery<{ hasData: boolean; clubs?: any[]; stats?: { totalClubs: number }; preSeason?: boolean; reason?: string; season?: any; tarkamChampion?: any }>({
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

  // CMS data for section customization
  const { data: cmsData } = useQuery({
    queryKey: ['cms-content'],
    queryFn: async () => {
      const res = await fetch('/api/cms/content');
      if (!res.ok) return { settings: {}, sections: {} };
      return res.json();
    },
    staleTime: 300000,
    refetchInterval: 600000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    gcTime: 300000,
  });

  const cmsSections = cmsData?.sections || {};
  const isDataLoading = isMaleLoading || isFemaleLoading;

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
            <h1 className="text-lg font-bold text-foreground">Club</h1>
            <p className="text-xs text-muted-foreground">Club Peserta Tarkam</p>
          </div>
          <div className="ml-auto">
            <Shield className="w-5 h-5 text-idm-gold-warm/40" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        <ClubsSection
          maleData={maleData}
          femaleData={femaleData}
          isDataLoading={isDataLoading}
          cmsSections={cmsSections}
          leagueData={leagueData}
          setSelectedClub={setSelectedClub}
          showAllClubs={showAllClubs}
          setShowAllClubs={setShowAllClubs}
          selectedSeasonId={selectedSeasonId}
          setSelectedSeasonId={setSelectedSeasonId}
          isHistorical={maleData?.isHistorical || femaleData?.isHistorical || false}
        />
      </div>

      {/* Modals */}
      {selectedClub && (
        <ClubProfile
          club={selectedClub}
          onClose={() => setSelectedClub(null)}
        />
      )}
    </div>
  );
}
