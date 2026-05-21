'use client';

import React, { useState, useCallback, startTransition } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crown, Music, Shield, ChevronDown, Trophy, Users, Heart, Gem, Zap, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AvatarMedia } from '@/components/ui/avatar-media';
import type { StatsData, TopPlayer, SeasonChampionPlayer, SultanOfWeekly, SultanPlayer } from '@/types/stats';
import { useCommunityTheme } from '@/hooks/use-community-theme';
import { getDivisionTheme } from '@/hooks/use-division-theme';
import { getAvatarUrl, clubToString, hexToRgba } from '@/lib/utils';
import { ClubLogoImage } from '@/components/idm/club-logo-image';
import { WeeklyChampionCard } from './community-dashboard/weekly-champion-card';
import { MvpSpotlight } from './community-dashboard/mvp-spotlight';
import { MvpHallOfFame } from './community-dashboard/mvp-hall-of-fame';
import { SharePopup } from './social-share-button';
import dynamic from 'next/dynamic';
const PlayerProfile = dynamic(() => import('./player-profile').then(m => ({ default: m.PlayerProfile })), { ssr: false, loading: () => null });

type DivisionFilter = 'all' | 'male' | 'female';


/* ═══════════════════════════════════════════
   Champion Collapsible
   ═══════════════════════════════════════════ */
function ChampionCollapsible({
  icon: Icon,
  iconColor,
  title,
  badge,
  summary,
  defaultOpen = false,
  children,
}: {
  icon: typeof Crown;
  iconColor: string;
  title: string;
  badge?: React.ReactNode;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-idm-gold-warm/10 bg-card/60 overflow-hidden transition-all duration-300">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 lg:px-5 py-2.5 cursor-pointer hover:bg-idm-gold-warm/[0.03] transition-colors"
      >
        <div
          className="w-5 h-5 rounded flex items-center justify-center shrink-0"
          style={{ backgroundColor: hexToRgba(iconColor, 0.15), border: `1px solid ${hexToRgba(iconColor, 0.25)}` }}
        >
          <Icon className="w-3 h-3" style={{ color: iconColor }} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: iconColor }}>
          {title}
        </span>
        {summary && (
          <span className="text-[10px] text-muted-foreground/60 truncate flex-1 text-right">
            {summary}
          </span>
        )}
        {badge && (
          <span className="ml-auto">{badge}</span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground/50 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="border-t border-idm-gold-warm/8">
          {children}
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   Champion Header — division filter tabs
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


/* ═══════════════════════════════════════════
   Champion Division Card — MVP-style horizontal layout
   ═══════════════════════════════════════════ */
const ChampionDivisionCard = React.memo(function ChampionDivisionCard({
  champion,
  seasonNumber,
  division,
  onPlayerClick,
  bare = false,
}: {
  champion: SeasonChampionPlayer;
  seasonNumber: number;
  division: 'male' | 'female';
  onPlayerClick: (player: TopPlayer & { division?: string }, division: 'male' | 'female') => void;
  bare?: boolean;
}) {
  const dt = getDivisionTheme(division);
  const emoji = division === 'male' ? '🕺' : '💃';
  const DivisionIcon = division === 'male' ? Music : Shield;
  const genderSymbol = division === 'male' ? '♂' : '♀';
  const accentColor = division === 'male' ? '#2E9FFF' : '#FF2D78';
  const divisionGradient = division === 'male'
    ? 'from-idm-male/25 to-idm-male/5'
    : 'from-idm-female/25 to-idm-female/5';

  const clubName = clubToString(champion.club as Parameters<typeof clubToString>[0]);

  const stats = [
    { label: 'Points', value: champion.points, icon: Trophy, color: 'text-idm-gold-warm' },
    { label: 'Wins', value: champion.totalWins, icon: Crown, color: 'text-green-400' },
    { label: 'Season', value: `S${seasonNumber}`, icon: Calendar, color: 'text-idm-gold-warm/80' },
  ];

  const content = (
    <div className="p-4 lg:p-6">
      {bare && (
        <div className="flex items-center gap-1.5 mb-3">
          <DivisionIcon className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>
            {division === 'male' ? 'COWO' : 'CEWE'} {genderSymbol}
          </span>
        </div>
      )}

      <div className="flex gap-3 sm:gap-4 items-stretch">
        <div
          className={`relative w-28 sm:w-36 lg:w-40 shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br ${divisionGradient}`}
          style={{ aspectRatio: '3/4' }}
        >
          <AvatarMedia
            src={getAvatarUrl(champion.gamertag, division, champion.avatar)}
            alt={champion.gamertag}
            width={128}
            height={200}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          <div className="absolute top-2 right-2 z-10">
            <div className="w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-idm-gold-warm flex items-center justify-center shadow-[0_0_12px_rgba(239,249,35,0.4)]">
              <Crown className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-background" />
            </div>
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
            <Badge className={`${dt.badgeBg} text-[7px] lg:text-[8px] border py-0 px-1.5 whitespace-nowrap`}>
              {emoji} {division === 'male' ? 'Cowo' : 'Cewe'}
            </Badge>
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <h3 className="text-sm lg:text-base font-black truncate">{champion.gamertag}</h3>
            <div className="flex items-center gap-1.5 mb-3">
              {clubName && (
                <span className="text-[9px] lg:text-[10px] text-muted-foreground/70 truncate">{clubName}</span>
              )}
              <Badge className={`${dt.badgeBg} text-[7px] lg:text-[8px] border py-0 px-1.5`}>
                {emoji} {division === 'male' ? 'Cowo' : 'Cewe'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-2xl ${dt.bgSubtle} border ${dt.borderSubtle}`}
              >
                <stat.icon className={`w-3 h-3 shrink-0 ${stat.color}`} />
                <div className="min-w-0">
                  <p className={`text-[10px] sm:text-xs font-black tabular-nums ${stat.color} leading-tight`}>
                    {stat.value}
                  </p>
                  <p className="text-[7px] sm:text-[8px] text-muted-foreground/60 uppercase tracking-wider font-semibold leading-tight">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onPlayerClick({
              ...champion,
              name: champion.gamertag,
              club: champion.club ?? undefined,
              division,
            }, division)}
            className={`w-full py-1.5 rounded-lg bg-gradient-to-r ${
              division === 'male'
                ? 'from-idm-male/20 to-idm-male-light/10 border-idm-male/20'
                : 'from-idm-female/20 to-idm-female-light/10 border-idm-female/20'
            } border text-[9px] sm:text-[10px] font-bold ${dt.text} hover:brightness-110 transition-all flex items-center justify-center gap-1 cursor-pointer`}
          >
            <Zap className="w-2.5 h-2.5" />
            Lihat Profil
          </button>
        </div>
      </div>
    </div>
  );

  if (bare) {
    return (
      <div className={`rounded-2xl border ${dt.borderSubtle} ${dt.bgSubtle} dashboard-card-glow overflow-hidden`}>
        {content}
      </div>
    );
  }

  return content;
});


/* ─── Ghost Champion Division Card ─── */
const GhostChampionDivisionCard = React.memo(function GhostChampionDivisionCard({
  division,
  bare = false,
}: {
  division: 'male' | 'female';
  bare?: boolean;
}) {
  const dt = getDivisionTheme(division);
  const DivisionIcon = division === 'male' ? Music : Shield;
  const genderSymbol = division === 'male' ? '♂' : '♀';
  const accentColor = division === 'male' ? '#2E9FFF' : '#FF2D78';
  const divisionGradient = division === 'male'
    ? 'from-idm-male/20 to-idm-male/5'
    : 'from-idm-female/20 to-idm-female/5';

  const content = (
    <div className="p-4 lg:p-6">
      {bare && (
        <div className="flex items-center gap-1.5 mb-3">
          <DivisionIcon className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>
            {division === 'male' ? 'COWO' : 'CEWE'} {genderSymbol}
          </span>
        </div>
      )}

      <div className="flex gap-3 sm:gap-4 items-stretch opacity-50">
        <div
          className={`relative w-28 sm:w-36 lg:w-40 shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br ${divisionGradient} border`}
          style={{ borderColor: accentColor + '20', aspectRatio: '3/4' }}
        >
          <Crown className="w-10 h-10 mx-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-25" style={{ color: accentColor }} />
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <div className="h-5 w-24 rounded bg-muted/35 mb-2" />
            <div className="h-3 w-16 rounded bg-muted/25 mb-4" />
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-3">
            {[
              { color: 'bg-idm-gold-warm/20' },
              { color: 'bg-green-400/20' },
              { color: 'bg-idm-gold-warm/15' },
            ].map((stat, idx) => (
              <div key={idx} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-2xl ${dt.bgSubtle} border ${dt.borderSubtle}`}>
                <div className={`w-3 h-3 rounded ${stat.color} shrink-0`} />
                <div className="min-w-0">
                  <div className="h-3 w-6 rounded bg-muted/30 mb-0.5" />
                  <div className="h-2 w-8 rounded bg-muted/20" />
                </div>
              </div>
            ))}
          </div>

          <div className="w-full h-7 rounded-lg bg-muted/20 border border-border/10" />
        </div>
      </div>
    </div>
  );

  if (bare) {
    return (
      <div className={`rounded-2xl border ${dt.borderSubtle} ${dt.bgSubtle} overflow-hidden opacity-55`}>
        {content}
      </div>
    );
  }

  return <div className="opacity-55">{content}</div>;
});


/* ═══════════════════════════════════════════
   Reigning Champion Plaque
   ═══════════════════════════════════════════ */
const ReigningChampionPlaque = React.memo(function ReigningChampionPlaque({
  maleData,
  femaleData,
  selectedDivision,
  onPlayerClick,
  bare = false,
}: {
  maleData?: StatsData;
  femaleData?: StatsData;
  selectedDivision: DivisionFilter;
  onPlayerClick: (player: TopPlayer & { division?: string }, division: 'male' | 'female') => void;
  bare?: boolean;
}) {
  const ct = useCommunityTheme();

  const maleSeasonsWithChampion = maleData?.allSeasons?.filter(s => s.championPlayer) || [];
  const femaleSeasonsWithChampion = femaleData?.allSeasons?.filter(s => s.championPlayer) || [];

  const latestMale = maleSeasonsWithChampion.sort((a, b) => b.number - a.number)[0];
  const latestFemale = femaleSeasonsWithChampion.sort((a, b) => b.number - a.number)[0];

  const hasMale = !!latestMale?.championPlayer;
  const hasFemale = !!latestFemale?.championPlayer;
  const showMale = selectedDivision === 'all' || selectedDivision === 'male';
  const showFemale = selectedDivision === 'all' || selectedDivision === 'female';

  const seasonNumber = hasMale && hasFemale
    ? Math.max(latestMale.number, latestFemale.number)
    : hasMale ? latestMale.number : hasFemale ? latestFemale.number : 0;

  const content = (
    <>
      {!bare && (
        <>
          <div className={ct.casinoBar} />
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
        </>
      )}

      {selectedDivision === 'all' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {showMale && (
            <div className={`border-b lg:border-b-0 lg:border-r ${ct.borderSubtle}`}>
              {hasMale && latestMale?.championPlayer ? (
                <ChampionDivisionCard champion={latestMale.championPlayer} seasonNumber={latestMale.number} division="male" onPlayerClick={onPlayerClick} bare />
              ) : (
                <GhostChampionDivisionCard division="male" bare />
              )}
            </div>
          )}
          {showFemale && (
            <div>
              {hasFemale && latestFemale?.championPlayer ? (
                <ChampionDivisionCard champion={latestFemale.championPlayer} seasonNumber={latestFemale.number} division="female" onPlayerClick={onPlayerClick} bare />
              ) : (
                <GhostChampionDivisionCard division="female" bare />
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          {showMale && (
            hasMale && latestMale?.championPlayer ? (
              <ChampionDivisionCard champion={latestMale.championPlayer} seasonNumber={latestMale.number} division="male" onPlayerClick={onPlayerClick} />
            ) : (
              <GhostChampionDivisionCard division="male" />
            )
          )}
          {showFemale && (
            hasFemale && latestFemale?.championPlayer ? (
              <ChampionDivisionCard champion={latestFemale.championPlayer} seasonNumber={latestFemale.number} division="female" onPlayerClick={onPlayerClick} />
            ) : (
              <GhostChampionDivisionCard division="female" />
            )
          )}
        </div>
      )}
    </>
  );

  if (bare) return content;

  return (
    <div className="animate-fade-enter-sm">
      <div className={`rounded-2xl ${ct.casinoCard} overflow-hidden`}>
        {content}
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
   ═══════════════════════════════════════════ */
const SeasonOneClubChampion = React.memo(function SeasonOneClubChampion({
  maleData,
  femaleData,
  selectedDivision,
  bare = false,
}: {
  maleData?: StatsData;
  femaleData?: StatsData;
  selectedDivision: DivisionFilter;
  bare?: boolean;
}) {
  const ct = useCommunityTheme();

  const maleSeason1 = maleData?.allSeasons?.find(s => s.number === 1 && s.status === 'completed' && s.championClub);
  const femaleSeason1 = femaleData?.allSeasons?.find(s => s.number === 1 && s.status === 'completed' && s.championClub);

  const clubEntries: { club: NonNullable<StatsData['allSeasons']>[0]['championClub']; division: 'male' | 'female' }[] = [];
  if (maleSeason1?.championClub) clubEntries.push({ club: maleSeason1.championClub, division: 'male' });
  if (femaleSeason1?.championClub) clubEntries.push({ club: femaleSeason1.championClub, division: 'female' });

  const hasData = clubEntries.length > 0;

  const showMale = selectedDivision === 'all' || selectedDivision === 'male';
  const showFemale = selectedDivision === 'all' || selectedDivision === 'female';
  const filteredEntries = hasData ? clubEntries.filter(e => (e.division === 'male' ? showMale : showFemale)) : [];

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

  const headerSection = !bare ? (
    <>
      <div className={ct.casinoBar} />
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
    </>
  ) : null;

  const content = (
    <>
      {headerSection}
      {hasData && clubData ? (
        <div className="p-3 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-idm-gold-warm/15 bg-white/[0.02]"
                style={{ boxShadow: '0 0 24px rgba(239,249,35,0.06)' }}
              >
                <ClubLogoImage clubName={clubData.name} dbLogo={clubData.logo} alt={clubData.name} width={96} height={96} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-idm-gold-warm/80 flex items-center justify-center" style={{ boxShadow: '0 0 12px rgba(239,249,35,0.3)' }}>
                <Crown className="w-3 h-3 text-[#080a14]" />
              </div>
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h4 className="text-lg sm:text-xl font-black uppercase tracking-wide text-foreground">
                {clubData.name}
              </h4>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                Club terbaik Tarkam IDM Season 1
              </p>

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
        <div className="p-3 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-idm-gold-warm/8 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(239,249,35,0.06), rgba(239,249,35,0.02))' }}>
                <Trophy className="w-8 h-8 text-idm-gold-warm/20" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-muted/30 flex items-center justify-center">
                <Crown className="w-3 h-3 text-muted-foreground/30" />
              </div>
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="h-6 w-36 rounded bg-muted/30 mx-auto sm:mx-0 mb-2" />
              <div className="h-3 w-48 rounded bg-muted/20 mx-auto sm:mx-0" />
              <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
                <div className="h-5 w-14 rounded-md bg-muted/20" />
                <div className="h-5 w-16 rounded-md bg-muted/15" />
                <div className="h-5 w-16 rounded-md bg-muted/15" />
                <div className="h-5 w-14 rounded-md bg-muted/10" />
              </div>
            </div>
          </div>
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
    </>
  );

  if (bare) return content;

  return (
    <div className="animate-fade-enter-sm">
      <div className={`rounded-2xl ${ct.casinoCard} overflow-hidden ${!hasData ? 'opacity-55' : ''}`}>
        {content}
      </div>
    </div>
  );
});


/* ═══════════════════════════════════════════
   Sultan of the Week Section
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
  const hasPlayer = !!sultan.player;

  return (
    <div className="animate-fade-enter-sm">
      <div className={`rounded-2xl ${ct.casinoCard} overflow-hidden`}
        style={{ borderColor: hexToRgba(MAROON, 0.2) }}>
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${MAROON}, ${MAROON_LIGHT}, ${MAROON})` }} />

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

        <div className="p-4 sm:p-6">
          {hasPlayer ? (
            <button
              onClick={() => onPlayerClick({
                ...sultan.player!,
                name: sultan.player!.gamertag,
                club: sultan.player!.club ?? undefined,
                maxStreak: 0,
                matches: 0,
                division: sultanDivision,
              }, sultanDivision)}
              className="flex flex-col items-center w-full cursor-pointer group/sultan"
            >
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 45%, rgba(128,0,32,0.12), transparent 60%)` }} />

                <div className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-full p-[4px]"
                  style={{
                    background: `conic-gradient(from 0deg, ${MAROON}, ${MAROON_LIGHT}, ${MAROON}, ${MAROON_LIGHT}, ${MAROON}, ${MAROON_LIGHT}, ${MAROON}, ${MAROON_LIGHT}, ${MAROON})`,
                    boxShadow: `0 0 30px ${hexToRgba(MAROON, 0.25)}, 0 6px 20px rgba(0,0,0,0.2), inset 0 1px 0 ${hexToRgba(MAROON_LIGHT, 0.3)}`,
                  }}>
                  <div className="w-full h-full rounded-full overflow-hidden border-2"
                    style={{ borderColor: hexToRgba(MAROON_LIGHT, 0.4) }}>
                    <AvatarMedia
                      src={getAvatarUrl(sultan.player!.gamertag, sultanDivision, sultan.player!.avatar)}
                      alt={sultan.player!.gamertag}
                      fill
                      sizes="(max-width: 640px) 192px, 240px"
                      className="object-cover object-top group-hover/sultan:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg border-2"
                    style={{
                      background: `linear-gradient(135deg, ${MAROON_LIGHT}, ${MAROON})`,
                      borderColor: hexToRgba(MAROON_LIGHT, 0.5),
                      boxShadow: `0 2px 8px ${hexToRgba(MAROON, 0.4)}`,
                    }}>
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="white" />
                  </div>
                </div>
              </div>

              <p className="text-base sm:text-lg font-black mt-4 group-hover/sultan:text-idm-gold-warm transition-colors text-center">
                {sultan.player!.gamertag}
              </p>
              <p className="text-[9px] text-muted-foreground/60 mt-0.5">Top Penyawer Week {sultan.weekNumber}</p>

              <div className="flex items-center gap-2 mt-2.5">
                <span className="text-[10px] font-black tabular-nums px-2.5 py-1 rounded-full"
                  style={{ color: MAROON_LIGHT, backgroundColor: hexToRgba(MAROON, 0.1), border: `1px solid ${hexToRgba(MAROON, 0.2)}` }}>
                  Rp {sultan.totalAmount >= 1000 ? `${(sultan.totalAmount / 1000).toFixed(0)}K` : sultan.totalAmount}
                </span>
                <span className="text-[9px] text-muted-foreground/50 tabular-nums">{sultan.donationCount}x sawer</span>
              </div>
            </button>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-48 h-48 sm:w-60 sm:h-60 rounded-full bg-muted/10 border border-dashed border-muted/20 flex items-center justify-center">
                <Heart className="w-10 h-10 text-muted-foreground/20" />
              </div>
              <p className="text-sm text-muted-foreground/40 mt-4">Belum ada Sultan of the Week</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/* ─── Sultan of the Week Section Wrapper ─── */
function SultanOfWeekSection({
  maleSultan,
  femaleSultan,
  selectedDivision,
  onPlayerClick,
}: {
  maleSultan: SultanOfWeekly | null;
  femaleSultan: SultanOfWeekly | null;
  selectedDivision: DivisionFilter;
  onPlayerClick: (player: TopPlayer & { division?: string }, division: 'male' | 'female') => void;
}) {
  const showMale = selectedDivision === 'all' || selectedDivision === 'male';
  const showFemale = selectedDivision === 'all' || selectedDivision === 'female';

  return (
    <div className="space-y-3">
      {selectedDivision === 'all' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {showMale && maleSultan && <SultanOfWeekCard sultan={maleSultan} onPlayerClick={onPlayerClick} />}
          {showFemale && femaleSultan && <SultanOfWeekCard sultan={femaleSultan} onPlayerClick={onPlayerClick} />}
        </div>
      ) : (
        <>
          {showMale && maleSultan && <SultanOfWeekCard sultan={maleSultan} onPlayerClick={onPlayerClick} />}
          {showFemale && femaleSultan && <SultanOfWeekCard sultan={femaleSultan} onPlayerClick={onPlayerClick} />}
        </>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════
   ChampionsPage — Full standalone page
   Shows champion data from the stats API
   ═══════════════════════════════════════════ */
export function ChampionsPage() {
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
      if (!res.ok) throw new Error(`Stats API error: ${res.status}`);
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
      if (!res.ok) throw new Error(`Stats API error: ${res.status}`);
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

  // ─── Sultan of Season data ───
  const { maleSeasonSultans, femaleSeasonSultans } = React.useMemo(() => {
    const maleSultans: { seasonNumber: number; sultan: SultanPlayer }[] = [];
    const femaleSultans: { seasonNumber: number; sultan: SultanPlayer }[] = [];

    const seenMale = new Set<number>();
    for (const season of (maleData?.allSeasons || [])) {
      if (season.status === 'completed' && season.sultanPlayer && !seenMale.has(season.number)) {
        seenMale.add(season.number);
        maleSultans.push({ seasonNumber: season.number, sultan: season.sultanPlayer });
      }
    }
    maleSultans.sort((a, b) => b.seasonNumber - a.seasonNumber);

    const seenFemale = new Set<number>();
    for (const season of (femaleData?.allSeasons || [])) {
      if (season.status === 'completed' && season.sultanPlayer && !seenFemale.has(season.number)) {
        seenFemale.add(season.number);
        femaleSultans.push({ seasonNumber: season.number, sultan: season.sultanPlayer });
      }
    }
    femaleSultans.sort((a, b) => b.seasonNumber - a.seasonNumber);

    return { maleSeasonSultans: maleSultans, femaleSeasonSultans: femaleSultans };
  }, [maleData, femaleData]);

  // ─── Summary data for collapsible headers ───
  const reigningChampionSummary = React.useMemo(() => {
    const parts: string[] = [];
    const maleSeasonsWithChampion = maleData?.allSeasons?.filter(s => s.championPlayer) || [];
    const femaleSeasonsWithChampion = femaleData?.allSeasons?.filter(s => s.championPlayer) || [];
    const latestMale = maleSeasonsWithChampion.sort((a, b) => b.number - a.number)[0];
    const latestFemale = femaleSeasonsWithChampion.sort((a, b) => b.number - a.number)[0];
    if (latestMale?.championPlayer) parts.push(latestMale.championPlayer.gamertag);
    if (latestFemale?.championPlayer) parts.push(latestFemale.championPlayer.gamertag);
    return parts.length > 0 ? parts.join(' · ') : '';
  }, [maleData, femaleData]);

  const reigningSeasonNumber = React.useMemo(() => {
    const maleSeasonsWithChampion = maleData?.allSeasons?.filter(s => s.championPlayer) || [];
    const femaleSeasonsWithChampion = femaleData?.allSeasons?.filter(s => s.championPlayer) || [];
    const m = maleSeasonsWithChampion.sort((a, b) => b.number - a.number)[0]?.number || 0;
    const f = femaleSeasonsWithChampion.sort((a, b) => b.number - a.number)[0]?.number || 0;
    return Math.max(m, f);
  }, [maleData, femaleData]);

  const clubChampionSummary = React.useMemo(() => {
    const maleSeason1 = maleData?.allSeasons?.find(s => s.number === 1 && s.status === 'completed' && s.championClub);
    const femaleSeason1 = femaleData?.allSeasons?.find(s => s.number === 1 && s.status === 'completed' && s.championClub);
    const names: string[] = [];
    if (maleSeason1?.championClub) names.push(maleSeason1.championClub.name);
    if (femaleSeason1?.championClub && femaleSeason1.championClub.name !== (maleSeason1?.championClub?.name)) names.push(femaleSeason1.championClub.name);
    return names.length > 0 ? names.join(' · ') : '';
  }, [maleData, femaleData]);

  const hasClubData = React.useMemo(() => {
    const m = maleData?.allSeasons?.find(s => s.number === 1 && s.status === 'completed' && s.championClub);
    const f = femaleData?.allSeasons?.find(s => s.number === 1 && s.status === 'completed' && s.championClub);
    return !!(m || f);
  }, [maleData, femaleData]);

  const sultanSummary = React.useMemo(() => {
    const parts: string[] = [];
    if (maleSeasonSultans.length > 0) parts.push(maleSeasonSultans[0].sultan.gamertag);
    if (femaleSeasonSultans.length > 0) parts.push(femaleSeasonSultans[0].sultan.gamertag);
    return parts.length > 0 ? parts.join(' · ') : '';
  }, [maleSeasonSultans, femaleSeasonSultans]);

  const sultanSeasonNumber = React.useMemo(() => {
    const m = maleSeasonSultans[0]?.seasonNumber || 0;
    const f = femaleSeasonSultans[0]?.seasonNumber || 0;
    return Math.max(m, f);
  }, [maleSeasonSultans, femaleSeasonSultans]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-6 py-4">

        {/* ═══ 1. Champion & MVP Sections ═══ */}
        <div className="space-y-3 sm:space-y-4">
          {/* Sticky Division Filter Header */}
          <div className="sticky top-14 z-30 -mx-1.5 sm:-mx-2 lg:-mx-3 px-1.5 sm:px-2 lg:px-3 py-2.5 bg-background/95 backdrop-blur-md border-b border-idm-gold-warm/10">
            <ChampionsMvpHeader
              selectedDivision={selectedDivision}
              onDivisionChange={handleDivisionChange}
            />
          </div>

          {/* Weekly Champions */}
          <div className="animate-fade-enter-sm">
            <WeeklyChampionCard maleData={maleData} femaleData={femaleData} selectedDivision={selectedDivision} onPlayerClick={handlePlayerClick} />
          </div>

          {/* MVP Spotlight */}
          <div className="animate-fade-enter-sm">
            <MvpSpotlight maleData={maleData} femaleData={femaleData} selectedDivision={selectedDivision} onPlayerClick={handlePlayerClick} />
          </div>

          {/* Sultan of the Week */}
          <SultanOfWeekSection
            maleSultan={latestMaleSultan}
            femaleSultan={latestFemaleSultan}
            selectedDivision={selectedDivision}
            onPlayerClick={handlePlayerClick}
          />

          {/* MVP Hall of Fame */}
          <div className="animate-fade-enter-sm">
            <MvpHallOfFame maleData={maleData} femaleData={femaleData} selectedDivision={selectedDivision} />
          </div>
        </div>

        {/* ═══ 2. Season Champions & Sultan Sections ═══ */}
        <div className="space-y-3 sm:space-y-4">
          {/* Reigning Season Champion */}
          <ChampionCollapsible
            icon={Crown}
            iconColor="#EFF923"
            title="Reigning Champion"
            summary={reigningChampionSummary || undefined}
            defaultOpen={!!reigningChampionSummary}
            badge={reigningSeasonNumber > 0 ? (
              <Badge className="bg-idm-gold-warm/15 text-idm-gold-warm border border-idm-gold-warm/25 text-[8px] font-bold">
                <Crown className="w-2.5 h-2.5 mr-0.5" />S{reigningSeasonNumber}
              </Badge>
            ) : (
              <Badge className="bg-muted/20 text-muted-foreground/40 border border-border/10 text-[8px] font-bold">TBA</Badge>
            )}
          >
            <ReigningChampionPlaque
              maleData={maleData}
              femaleData={femaleData}
              selectedDivision={selectedDivision}
              onPlayerClick={handlePlayerClick}
              bare
            />
          </ChampionCollapsible>

          {/* Sultan of Season */}
          <ChampionCollapsible
            icon={Gem}
            iconColor="#43A047"
            title="Sultan of Season"
            summary={sultanSummary || undefined}
            defaultOpen={!!sultanSummary}
            badge={sultanSeasonNumber > 0 ? (
              <Badge className="text-[8px] font-bold border" style={{
                color: '#66BB6A', backgroundColor: 'rgba(67,160,71,0.1)',
                borderColor: 'rgba(67,160,71,0.2)' }}>
                💎 S{sultanSeasonNumber}
              </Badge>
            ) : (
              <Badge className="bg-muted/20 text-muted-foreground/40 border border-border/10 text-[8px] font-bold">TBA</Badge>
            )}
          >
            {/* Sultan of Season — inline display using the same data */}
            <div className="p-3 sm:p-5">
              {(maleSeasonSultans.length > 0 || femaleSeasonSultans.length > 0) ? (
                <div className="space-y-3">
                  {(selectedDivision === 'all' || selectedDivision === 'male') && maleSeasonSultans.length > 0 && (
                    <div className="space-y-2">
                      {maleSeasonSultans.map(({ seasonNumber, sultan }) => (
                        <div key={`male-s${seasonNumber}`} className="flex items-center gap-3 p-2.5 rounded-xl bg-idm-male/5 border border-idm-male/10">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-idm-male/15 shrink-0">
                            <AvatarMedia
                              src={getAvatarUrl(sultan.gamertag, 'male', sultan.avatar)}
                              alt={sultan.gamertag}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{sultan.gamertag}</p>
                            <p className="text-[9px] text-muted-foreground/60">Sultan of Season {seasonNumber} · Cowo</p>
                          </div>
                          <Badge className="bg-idm-male/10 text-idm-male-light text-[8px] border border-idm-male/15">S{seasonNumber}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  {(selectedDivision === 'all' || selectedDivision === 'female') && femaleSeasonSultans.length > 0 && (
                    <div className="space-y-2">
                      {femaleSeasonSultans.map(({ seasonNumber, sultan }) => (
                        <div key={`female-s${seasonNumber}`} className="flex items-center gap-3 p-2.5 rounded-xl bg-idm-female/5 border border-idm-female/10">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-idm-female/15 shrink-0">
                            <AvatarMedia
                              src={getAvatarUrl(sultan.gamertag, 'female', sultan.avatar)}
                              alt={sultan.gamertag}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{sultan.gamertag}</p>
                            <p className="text-[9px] text-muted-foreground/60">Sultan of Season {seasonNumber} · Cewe</p>
                          </div>
                          <Badge className="bg-idm-female/10 text-idm-female-light text-[8px] border border-idm-female/15">S{seasonNumber}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 opacity-50">
                  <Gem className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-[10px] text-muted-foreground/50">Belum ada Sultan of Season</p>
                </div>
              )}
            </div>
          </ChampionCollapsible>

          {/* Club Champion */}
          {hasClubData && (
            <ChampionCollapsible
              icon={Trophy}
              iconColor="#EFF923"
              title="Club Champion"
              summary={clubChampionSummary || undefined}
              defaultOpen={false}
              badge={(
                <Badge className="bg-idm-gold-warm/15 text-idm-gold-warm border border-idm-gold-warm/25 text-[8px] font-bold">
                  <Trophy className="w-2.5 h-2.5 mr-0.5" />S1
                </Badge>
              )}
            >
              <SeasonOneClubChampion
                maleData={maleData}
                femaleData={femaleData}
                selectedDivision={selectedDivision}
                bare
              />
            </ChampionCollapsible>
          )}
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
