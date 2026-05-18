'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crown } from 'lucide-react';
import type { StatsData } from '@/types/stats';

// Lazy load section components
import dynamic from 'next/dynamic';
const HighlightsSection = dynamic(() => import('./landing/highlights-section').then(m => ({ default: m.HighlightsSection })), { ssr: false, loading: () => <div className="h-[360px]" /> });
const PlayerProfile = dynamic(() => import('./player-profile').then(m => ({ default: m.PlayerProfile })), { ssr: false, loading: () => null });
const VideoModal = dynamic(() => import('./video-modal').then(m => ({ default: m.VideoModal })), { ssr: false, loading: () => null });

export function HighlightsPage() {

  // State
  const [selectedPlayerRaw, setSelectedPlayerRaw] = useState<StatsData['topPlayers'][0] & { division?: string } | null>(null);
  const [preferredSkinType, setPreferredSkinType] = useState<string | null>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoModalUrl, setVideoModalUrl] = useState('');
  const [videoModalTitle, setVideoModalTitle] = useState('');

  // Wrapper: always clear preferredSkinType when selecting from non-MVP contexts
  const setSelectedPlayer = useCallback((player: typeof selectedPlayerRaw) => {
    setSelectedPlayerRaw(player);
    setPreferredSkinType(null);
  }, []);

  const openVideoModal = useCallback((url: string, title: string) => {
    setVideoModalUrl(url);
    setVideoModalTitle(title);
    setVideoModalOpen(true);
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
  const cmsSettings = cmsData?.settings || {};

  return (
    <div className="min-h-screen bg-background">
      {/* Page Title Banner */}
      <div className="border-b border-idm-gold-warm/10 bg-gradient-to-b from-idm-gold-warm/[0.03] to-transparent px-4 py-4 sm:py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <Crown className="w-5 h-5 text-idm-gold-warm" /> Juara
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Puncak Prestasi Tarkam</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        <HighlightsSection
          maleData={maleData}
          femaleData={femaleData}
          leagueData={leagueData}
          cmsSections={cmsSections}
          cmsSettings={cmsSettings}
          onVideoPlay={openVideoModal}
          setSelectedPlayer={setSelectedPlayer}
          setPreferredSkinType={setPreferredSkinType}
          hideHeader
        />
      </div>

      {/* Modals */}
      {selectedPlayerRaw && (
        <PlayerProfile
          player={selectedPlayerRaw}
          onClose={() => setSelectedPlayerRaw(null)}
          skinMap={{ ...maleData?.skinMap, ...femaleData?.skinMap }}
          preferredSkinType={preferredSkinType ?? undefined}
        />
      )}

      <VideoModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        videoUrl={videoModalUrl}
        title={videoModalTitle}
      />
    </div>
  );
}
