'use client';

import React, { useState, useCallback, startTransition } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crown, Music, Shield, ChevronDown, Trophy, Users, Heart, Gem } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AvatarMedia } from '@/components/ui/avatar-media';
import type { StatsData, TopPlayer, SeasonChampionPlayer, SultanOfWeekly, SultanPlayer } from '@/types/stats';
import { useCommunityTheme } from '@/hooks/use-community-theme';
import { getDivisionTheme } from '@/hooks/use-division-theme';
import { getAvatarUrl, clubToString, hexToRgba } from '@/lib/utils';
import { ClubLogoImage } from '@/components/idm/club-logo-image';

// Import champion section components
import { WeeklyChampionCard } from './community-dashboard/weekly-champion-card';
import { MvpSpotlight } from './community-dashboard/mvp-spotlight';
import { MvpHallOfFame } from './community-dashboard/mvp-hall-of-fame';
import { SharePopup } from './social-share-button';

/** color-mix shorthand for theme-aware transparency */
const cm = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

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


/* ─── Club Champion Member type ─── */
interface ClubChampionMember {
  id: string;
  gamertag: string;
  avatar?: string | null;
  tier: string;
  points: number;
  division: 'male' | 'female';
}

/* ═══════════════════════════════════════════
   Season 1 Club Champion Card
   Premium showcase of the club that won Season 1
   ═══════════════════════════════════════════ */
const SeasonOneClubChampion = React.memo(function SeasonOneClubChampion({
  maleData,
  femaleData,
  selectedDivision,
}: {
  maleData?: StatsData;
  femaleData?: StatsData;
  selectedDivision: DivisionFilter;
}) {
  const ct = useCommunityTheme();

  // Find season 1 completed data from both divisions
  const maleSeason1 = maleData?.allSeasons?.find(s => s.number === 1 && s.status === 'completed' && s.championClub);
  const femaleSeason1 = femaleData?.allSeasons?.find(s => s.number === 1 && s.status === 'completed' && s.championClub);

  // Merge champion club entries from both divisions
  const clubEntries: { club: NonNullable<StatsData['allSeasons']>[0]['championClub']; division: 'male' | 'female' }[] = [];
  if (maleSeason1?.championClub) clubEntries.push({ club: maleSeason1.championClub, division: 'male' });
  if (femaleSeason1?.championClub) clubEntries.push({ club: femaleSeason1.championClub, division: 'female' });

  const hasData = clubEntries.length > 0;

  // Check division filter
  const showMale = selectedDivision === 'all' || selectedDivision === 'male';
  const showFemale = selectedDivision === 'all' || selectedDivision === 'female';
  const filteredEntries = hasData ? clubEntries.filter(e => (e.division === 'male' ? showMale : showFemale)) : [];

  // Merge members from all filtered entries (deduplicate by id, sum points)
  const memberMap = new Map<string, ClubChampionMember>();
  for (const entry of filteredEntries) {
    if (entry.club?.members) {
      for (const m of entry.club.members) {
        const existing = memberMap.get(m.id);
        if (existing) {
          existing.points += m.points;
        } else {
          memberMap.set(m.id, { ...m });
        }
      }
    }
  }
  const allMembers = Array.from(memberMap.values()).sort((a, b) => b.points - a.points);
  const clubData = filteredEntries[0]?.club;

  const totalPoints = clubData?.totalPoints || allMembers.reduce((s, m) => s + m.points, 0);
  const memberCount = allMembers.length;
  const maleMembers = allMembers.filter(m => m.division === 'male');
  const femaleMembers = allMembers.filter(m => m.division === 'female');
  const captainMember = allMembers[0];

  return (
    <div className="animate-fade-enter-sm">
      <div className={`rounded-2xl ${ct.casinoCard} overflow-hidden ${!hasData ? 'opacity-55' : ''}`}>
        <div className={ct.casinoBar} />

        {/* Header */}
        <div className={`flex items-center gap-2.5 px-3 lg:px-5 py-2.5 border-b ${ct.borderSubtle}`}>
          <div className={`w-5 h-5 rounded ${ct.iconBg} flex items-center justify-center shrink-0`}>
            <Trophy className={`w-3 h-3 ${ct.neonText}`} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-idm-gold-warm">Season 1 Club Champion</span>
          {hasData ? (
            <Badge className="bg-idm-gold-warm/15 text-idm-gold-warm border border-idm-gold-warm/25 ml-auto text-[9px] font-bold">
              <Trophy className="w-2.5 h-2.5 mr-0.5" />S1
            </Badge>
          ) : (
            <Badge className="bg-muted/20 text-muted-foreground/40 border border-border/10 ml-auto text-[9px] font-bold">
              TBA
            </Badge>
          )}
        </div>

        {hasData && clubData ? (
          /* ═══ Data State — Full club champion display ═══ */
          <div className="p-3 sm:p-5">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
              {/* Club Logo + Crown */}
              <div className="relative shrink-0">
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-idm-gold-warm/15 bg-white/[0.02]"
                  style={{ boxShadow: '0 0 24px rgba(239,249,35,0.06)' }}
                >
                  <ClubLogoImage clubName={clubData.name} dbLogo={clubData.logo} alt={clubData.name} width={96} height={96} className="w-full h-full object-cover" />
                </div>
                {/* Crown badge */}
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-idm-gold-warm/80 flex items-center justify-center" style={{ boxShadow: '0 0 12px rgba(239,249,35,0.3)' }}>
                  <Crown className="w-3 h-3 text-[#080a14]" />
                </div>
              </div>

              {/* Club Info */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <h4 className="text-lg sm:text-xl font-black uppercase tracking-wide text-foreground">
                  {clubData.name}
                </h4>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  Club terbaik Tarkam IDM Season 1
                </p>

                {/* Stats row */}
                <div className="flex items-center gap-2 mt-2.5 justify-center sm:justify-start flex-wrap">
                  <span className="bg-idm-gold-warm/10 text-idm-gold-warm text-[10px] border border-idm-gold-warm/15 px-2 py-0.5 rounded-md font-bold tabular-nums">
                    {totalPoints}pts
                  </span>
                  {maleMembers.length > 0 && (
                    <span className="bg-idm-male/8 text-idm-male-light text-[10px] border border-idm-male/12 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                      <Users className="w-3 h-3" />{maleMembers.length} Cowo
                    </span>
                  )}
                  {femaleMembers.length > 0 && (
                    <span className="bg-idm-female/8 text-idm-female-light text-[10px] border border-idm-female/12 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                      <Users className="w-3 h-3" />{femaleMembers.length} Cewe
                    </span>
                  )}
                  <span className="bg-muted/5 text-muted-foreground text-[10px] border border-border/15 px-2 py-0.5 rounded-md font-bold">
                    {memberCount} Total
                  </span>
                </div>
              </div>
            </div>

            {/* Top Performers — member avatars */}
            {allMembers.length > 0 && (
              <div className="mt-4 pt-3 border-t border-idm-gold-warm/8">
                <p className="text-[9px] text-muted-foreground/40 uppercase tracking-wider font-semibold mb-2.5">Top Performers</p>
                <div className="flex flex-wrap gap-2">
                  {allMembers.slice(0, 5).map((member) => (
                    <div key={member.id} className="group/member relative flex flex-col items-center">
                      <div
                        className={`w-11 h-11 rounded-xl overflow-hidden border transition-all duration-200 ${
                          member.division === 'male'
                            ? 'border-idm-male/15'
                            : 'border-idm-female/15'
                        } ${captainMember?.id === member.id ? 'ring-1 ring-idm-gold-warm/30 border-idm-gold-warm/20' : ''}`}
                      >
                        <AvatarMedia
                          src={getAvatarUrl(member.gamertag, member.division, member.avatar)}
                          alt={member.gamertag}
                          width={44}
                          height={44}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* Captain badge */}
                        {captainMember?.id === member.id && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-idm-gold-warm/70 flex items-center justify-center z-10">
                            <Crown className="w-2 h-2 text-[#080a14]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[8px] font-bold mt-0.5 truncate max-w-[44px] text-center text-foreground/60">{member.gamertag}</p>
                      <p className="text-[7px] font-black tabular-nums" style={{ color: member.division === 'male' ? 'var(--idm-male-light)' : 'var(--idm-female-light)' }}>{member.points}pts</p>
                    </div>
                  ))}
                  {allMembers.length > 5 && (
                    <div className="flex flex-col items-center">
                      <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center border border-dashed border-border/30 bg-muted/5">
                        <span className="text-[10px] font-black text-muted-foreground/50">+{allMembers.length - 5}</span>
                      </div>
                      <p className="text-[8px] font-bold mt-0.5 text-muted-foreground/40">lainnya</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ═══ Ghost Empty State — Matching layout with skeleton placeholders ═══ */
          <div className="p-3 sm:p-5">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
              {/* Ghost Club Logo */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-idm-gold-warm/8 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(239,249,35,0.06), rgba(239,249,35,0.02))' }}>
                  <Trophy className="w-8 h-8 text-idm-gold-warm/20" />
                </div>
                {/* Ghost crown */}
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-muted/30 flex items-center justify-center">
                  <Crown className="w-3 h-3 text-muted-foreground/30" />
                </div>
              </div>

              {/* Ghost Club Info */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="h-6 w-36 rounded bg-muted/30 mx-auto sm:mx-0 mb-2" />
                <div className="h-3 w-48 rounded bg-muted/20 mx-auto sm:mx-0" />

                {/* Ghost Stats row */}
                <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
                  <div className="h-5 w-14 rounded-md bg-muted/20" />
                  <div className="h-5 w-16 rounded-md bg-muted/15" />
                  <div className="h-5 w-16 rounded-md bg-muted/15" />
                  <div className="h-5 w-14 rounded-md bg-muted/10" />
                </div>
              </div>
            </div>

            {/* Ghost Top Performers */}
            <div className="mt-4 pt-3 border-t border-idm-gold-warm/5">
              <p className="text-[9px] text-muted-foreground/25 uppercase tracking-wider font-semibold mb-2.5">Top Performers</p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={`ghost-member-${i}`} className="flex flex-col items-center">
                    <div className="w-11 h-11 rounded-xl bg-muted/15 border border-muted/10" />
                    <div className="h-2 w-8 rounded bg-muted/15 mt-1" />
                    <div className="h-2 w-6 rounded bg-muted/10 mt-0.5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});


/* ═══════════════════════════════════════════
   Sultan of the Week Card — Compact plaque for HighlightsPage
   Shows the top penyawer from the latest week
   ═══════════════════════════════════════════ */
const MAROON = '#800020';
const MAROON_LIGHT = '#d4576a';

function SultanOfWeekCard({
  sultan,
  onPlayerClick,
}: {
  sultan: SultanOfWeekly;
  onPlayerClick: (player: TopPlayer & { division?: string }, division: 'male' | 'female') => void;
}) {
  const ct = useCommunityTheme();
  const sultanDivision = sultan.tournamentDivision as 'male' | 'female';
  const divisionAccent = sultanDivision === 'male' ? '#2E9FFF' : '#FF2D78';
  const divisionLabel = sultanDivision === 'male' ? 'COWO' : 'CEWE';
  const DivisionIcon = sultanDivision === 'male' ? Music : Shield;
  const hasPlayer = !!sultan.player;

  return (
    <div className="animate-fade-enter-sm">
      <div className={`rounded-2xl ${ct.casinoCard} overflow-hidden`}
        style={{ borderColor: hexToRgba(MAROON, 0.2) }}>
        {/* Maroon accent bar */}
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${MAROON}, ${MAROON_LIGHT}, ${MAROON})` }} />

        {/* Header */}
        <div className={`flex items-center gap-2.5 px-3 lg:px-5 py-2.5 border-b ${ct.borderSubtle}`}>
          <div className="w-5 h-5 rounded flex items-center justify-center shrink-0"
            style={{ backgroundColor: hexToRgba(MAROON, 0.15), border: `1px solid ${hexToRgba(MAROON, 0.25)}` }}>
            <Heart className="w-3 h-3" style={{ color: MAROON_LIGHT }} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: MAROON_LIGHT }}>
            Sultan of the Week
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <Badge className="text-[8px] font-bold border" style={{
              color: divisionAccent, backgroundColor: hexToRgba(divisionAccent, 0.1),
              borderColor: hexToRgba(divisionAccent, 0.2) }}>
              {divisionLabel}
            </Badge>
            <Badge className="text-[8px] font-bold border" style={{
              color: MAROON_LIGHT, backgroundColor: hexToRgba(MAROON, 0.1),
              borderColor: hexToRgba(MAROON, 0.2) }}>
              W{sultan.weekNumber}
            </Badge>
          </div>
        </div>

        {/* Body */}
        <div className="p-3 sm:p-5">
          {hasPlayer ? (
            <button
              onClick={() => onPlayerClick({
                ...sultan.player!,
                name: sultan.player!.gamertag,
                club: sultan.player!.club ?? undefined,
                division: sultanDivision,
              }, sultanDivision)}
              className="flex items-center gap-3 sm:gap-4 w-full text-left cursor-pointer group/sultan"
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2"
                  style={{ borderColor: hexToRgba(MAROON, 0.4), boxShadow: `0 0 12px ${hexToRgba(MAROON, 0.15)}` }}>
                  <AvatarMedia
                    src={getAvatarUrl(sultan.player!.gamertag, sultanDivision, sultan.player!.avatar)}
                    alt={sultan.player!.gamertag}
                    width={64} height={64}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                {/* Crown badge */}
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${MAROON_LIGHT}, ${MAROON})` }}>
                  <Heart className="w-2.5 h-2.5 text-white" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate group-hover/sultan:text-idm-gold-warm transition-colors">
                  {sultan.player!.gamertag}
                </p>
                <p className="text-[9px] text-muted-foreground/60 mt-0.5">Top Penyawer Week {sultan.weekNumber}</p>
                {(sultan.player!.city || sultan.player!.club) && (
                  <p className="text-[8px] text-muted-foreground/40 truncate mt-0.5">
                    {[sultan.player!.city, typeof sultan.player!.club === 'string' ? sultan.player!.club : sultan.player!.club?.name].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="shrink-0 flex flex-col items-end gap-1">
                <span className="text-[10px] font-black tabular-nums" style={{ color: MAROON_LIGHT }}>
                  Rp {sultan.totalAmount >= 1000 ? `${(sultan.totalAmount / 1000).toFixed(0)}K` : sultan.totalAmount}
                </span>
                <span className="text-[9px] text-muted-foreground/50 tabular-nums">{sultan.donationCount}x sawer</span>
              </div>
            </button>
          ) : (
            /* No player matched — show donor name only */
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center border-2"
                style={{ borderColor: hexToRgba(MAROON, 0.2), background: hexToRgba(MAROON, 0.06) }}>
                <Heart className="w-5 h-5" style={{ color: hexToRgba(MAROON, 0.4) }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{sultan.donorName}</p>
                <p className="text-[9px] text-muted-foreground/60 mt-0.5">Top Penyawer Week {sultan.weekNumber}</p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                <span className="text-[10px] font-black tabular-nums" style={{ color: MAROON_LIGHT }}>
                  Rp {sultan.totalAmount >= 1000 ? `${(sultan.totalAmount / 1000).toFixed(0)}K` : sultan.totalAmount}
                </span>
                <span className="text-[9px] text-muted-foreground/50 tabular-nums">{sultan.donationCount}x sawer</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   Sultan of Season Card — Emerald theme for HighlightsPage
   Shows the top penyawer from the latest completed season
   ═══════════════════════════════════════════ */
const EMERALD = '#43A047';
const EMERALD_LIGHT = '#66BB6A';

function SultanOfSeasonCardPage({
  sultans,
  onPlayerClick,
}: {
  sultans: { seasonNumber: number; sultan: SultanPlayer }[];
  onPlayerClick: (player: TopPlayer & { division?: string }, division: 'male' | 'female') => void;
}) {
  const ct = useCommunityTheme();
  const latestSultan = sultans[0];
  if (!latestSultan) return null;

  const { sultan, seasonNumber } = latestSultan;

  return (
    <div className="animate-fade-enter-sm">
      <div className={`rounded-2xl ${ct.casinoCard} overflow-hidden`}
        style={{ borderColor: hexToRgba(EMERALD, 0.2) }}>
        {/* Emerald accent bar */}
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${EMERALD}, ${EMERALD_LIGHT}, ${EMERALD})` }} />

        {/* Header */}
        <div className={`flex items-center gap-2.5 px-3 lg:px-5 py-2.5 border-b ${ct.borderSubtle}`}>
          <div className="w-5 h-5 rounded flex items-center justify-center shrink-0"
            style={{ backgroundColor: hexToRgba(EMERALD, 0.15), border: `1px solid ${hexToRgba(EMERALD, 0.25)}` }}>
            <Gem className="w-3 h-3" style={{ color: EMERALD_LIGHT }} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: EMERALD_LIGHT }}>
            Sultan of Season
          </span>
          <Badge className="bg-idm-gold-warm/15 text-idm-gold-warm border border-idm-gold-warm/25 ml-auto text-[9px] font-bold">
            <Gem className="w-2.5 h-2.5 mr-0.5" />S{seasonNumber}
          </Badge>
        </div>

        {/* Body */}
        <div className="p-3 sm:p-5">
          <button
            onClick={() => onPlayerClick({
              id: sultan.id,
              name: sultan.gamertag,
              gamertag: sultan.gamertag,
              avatar: sultan.avatar,
              tier: sultan.tier,
              points: sultan.points,
              totalWins: 0,
              streak: 0,
              maxStreak: 0,
              totalMvp: 0,
              matches: 0,
              division: (sultan.division === 'female' ? 'female' : 'male') as 'male' | 'female',
              city: sultan.city ?? undefined,
              club: sultan.club?.name ?? undefined,
            }, (sultan.division === 'female' ? 'female' : 'male') as 'male' | 'female')}
            className="flex items-center gap-3 sm:gap-4 w-full text-left cursor-pointer group/sultan-season"
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2"
                style={{ borderColor: EMERALD, boxShadow: `0 0 12px ${hexToRgba(EMERALD, 0.25)}` }}>
                <AvatarMedia
                  src={getAvatarUrl(sultan.gamertag, sultan.division === 'female' ? 'female' : 'male', sultan.avatar)}
                  alt={sultan.gamertag}
                  width={64} height={64}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              {/* Emerald gem badge */}
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: `linear-gradient(135deg, ${EMERALD_LIGHT}, ${EMERALD})` }}>
                <Gem className="w-2.5 h-2.5 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate group-hover/sultan-season:text-idm-gold-warm transition-colors"
                style={{ color: EMERALD_LIGHT }}>
                {sultan.gamertag}
              </p>
              <p className="text-[9px] text-muted-foreground/60 mt-0.5">Top Penyawer Season {seasonNumber}</p>
              {sultan.club?.name && (
                <p className="text-[8px] text-muted-foreground/40 truncate mt-0.5">{sultan.club.name}</p>
              )}
            </div>

            {/* Emerald icon */}
            <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: hexToRgba(EMERALD, 0.1), border: `1px solid ${hexToRgba(EMERALD, 0.2)}` }}>
              <span className="text-base">💵</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   Highlights (Juara) Page — Main Component
   Contains: Reigning Champion, Season 1 Club Champion, Weekly Champions, MVP Spotlight, MVP Hall of Fame
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

  // ─── Sultan of the Week data ───
  const maleSultanList = maleData?.sultanOfWeekly || [];
  const femaleSultanList = femaleData?.sultanOfWeekly || [];
  const latestMaleSultan = maleSultanList.length > 0 ? maleSultanList[maleSultanList.length - 1] : null;
  const latestFemaleSultan = femaleSultanList.length > 0 ? femaleSultanList[femaleSultanList.length - 1] : null;
  // Pick the Sultan with the highest totalAmount across both divisions
  const topSultanOfWeek: SultanOfWeekly | null = latestMaleSultan && latestFemaleSultan
    ? (latestMaleSultan.totalAmount >= latestFemaleSultan.totalAmount ? latestMaleSultan : latestFemaleSultan)
    : latestMaleSultan || latestFemaleSultan;
  // Filter by selected division
  const showSultanOfWeek = topSultanOfWeek && (
    selectedDivision === 'all' ||
    topSultanOfWeek.tournamentDivision === selectedDivision
  );

  // ─── Sultan of Season data ───
  const seasonSultans = React.useMemo(() => {
    const sultans: { seasonNumber: number; sultan: SultanPlayer }[] = [];
    const seenSeasonNumbers = new Set<number>();
    const allSeasons = [...(maleData?.allSeasons || []), ...(femaleData?.allSeasons || [])];
    for (const season of allSeasons) {
      if (season.status === 'completed' && season.sultanPlayer && !seenSeasonNumbers.has(season.number)) {
        seenSeasonNumbers.add(season.number);
        sultans.push({ seasonNumber: season.number, sultan: season.sultanPlayer });
      }
    }
    sultans.sort((a, b) => b.seasonNumber - a.seasonNumber);
    // Filter by division
    if (selectedDivision !== 'all') {
      return sultans.filter(s => s.sultan.division === selectedDivision);
    }
    return sultans;
  }, [maleData, femaleData, selectedDivision]);

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

          {/* Season 1 Club Champion */}
          <SeasonOneClubChampion
            maleData={maleData}
            femaleData={femaleData}
            selectedDivision={selectedDivision}
          />

          {/* Weekly Champions */}
          <div className="animate-fade-enter-sm">
            <WeeklyChampionCard maleData={maleData} femaleData={femaleData} selectedDivision={selectedDivision} onPlayerClick={handlePlayerClick} />
          </div>

          {/* Sultan of the Week */}
          {showSultanOfWeek && topSultanOfWeek && (
            <SultanOfWeekCard
              sultan={topSultanOfWeek}
              onPlayerClick={handlePlayerClick}
            />
          )}

          {/* Sultan of Season */}
          {seasonSultans.length > 0 && (
            <SultanOfSeasonCardPage
              sultans={seasonSultans}
              onPlayerClick={handlePlayerClick}
            />
          )}

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
