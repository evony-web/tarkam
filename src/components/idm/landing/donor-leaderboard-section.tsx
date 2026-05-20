'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, HandCoins, Crown, Sparkles, Users } from 'lucide-react';
import { formatCurrencyShort } from '@/lib/utils';
import { getSawerTier } from '@/lib/skin-utils';
import { SectionHeader, AnimatedSection } from './shared';
import type { StatsData, SultanOfWeekly, TopDonor } from '@/types/stats';

/* ═══════════════════════════════════════════════════════
   DONOR LEADERBOARD SECTION — Landing Page
   Premium Apple-style "Leaderboard Penyawer" with
   Sultan of the Week hero card + top 8 donors list
   ═══════════════════════════════════════════════════════ */

interface DonorLeaderboardSectionProps {
  maleData?: StatsData;
  femaleData?: StatsData;
  isDataLoading?: boolean;
  onSawer?: () => void;
}

/* ─── Constants ─── */
const MAROON = '#800020';
const MAROON_LIGHT = '#d4576a';
const RANK_MEDALS = ['🥇', '🥈', '🥉'];

type DivisionFilter = 'all' | 'male' | 'female';

/* ─── Enriched donor with per-division breakdown ─── */
interface DivisionDonor extends TopDonor {
  maleAmount: number;
  femaleAmount: number;
  divisions: ('male' | 'female')[];
}

/* ─── Helpers ─── */

function getInitials(name: string): string {
  return name
    .split(/[\s_]+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatRupiahShort(amount: number): string {
  if (amount === 0) return 'Rp0';
  if (amount >= 1_000_000) return `Rp${(amount / 1_000_000).toFixed(1).replace('.0', '')}jt`;
  if (amount >= 100_000) return `Rp${(amount / 1000).toFixed(0)}K`;
  if (amount >= 10_000) return `Rp${(amount / 1000).toFixed(0)}K`;
  return `Rp${amount.toLocaleString('id-ID')}`;
}

/** Division badge — color-coded male/female */
function DivisionBadge({ division }: { division: 'male' | 'female' }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0 rounded text-[8px] font-bold uppercase tracking-wider border ${
        division === 'male'
          ? 'bg-idm-male/10 text-idm-male-light border-idm-male/30'
          : 'bg-idm-female/10 text-idm-female-light border-idm-female/30'
      }`}
    >
      {division === 'male' ? '♂ M' : '♀ F'}
    </span>
  );
}

/** Sawer tier badge with emoji + label */
function SawerTierBadge({ amount }: { amount: number }) {
  const sawerTier = getSawerTier(amount);
  if (!sawerTier) return null;

  const tierColors: Record<string, { bg: string; border: string; text: string }> = {
    sawer_diamond: { bg: 'rgba(87,181,255,0.15)', border: 'rgba(87,181,255,0.4)', text: 'text-idm-male-light' },
    sawer_gold: { bg: 'rgba(250,204,21,0.15)', border: 'rgba(250,204,21,0.4)', text: 'text-idm-gold-warm' },
    sawer_silver: { bg: 'rgba(156,163,175,0.15)', border: 'rgba(156,163,175,0.4)', text: 'text-muted-foreground' },
    sawer_bronze: { bg: 'rgba(180,83,9,0.15)', border: 'rgba(180,83,9,0.4)', text: 'text-amber-400' },
  };
  const tc = tierColors[sawerTier] || tierColors.sawer_bronze;
  const tierLabel = sawerTier.replace('sawer_', '').charAt(0).toUpperCase() + sawerTier.replace('sawer_', '').slice(1);
  const tierEmoji = sawerTier === 'sawer_diamond' ? '💎' : sawerTier === 'sawer_gold' ? '🥇' : sawerTier === 'sawer_silver' ? '🥈' : '🥉';

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0 border ${tc.text}`}
      style={{ backgroundColor: tc.bg, borderColor: tc.border }}
      title={`Sawer ${tierLabel}`}
    >
      {tierEmoji} {tierLabel}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   SULTAN OF THE WEEK — Hero Card
   Maroon gradient with heart decorations
   ═══════════════════════════════════════════════════════ */
function SultanOfWeeklyCard({
  sultan,
  coSultans,
}: {
  sultan: SultanOfWeekly;
  coSultans?: SultanOfWeekly['coSultans'];
}) {
  const isCoSultan = sultan.isCoSultan && coSultans && coSultans.length > 0;

  // All sultans to display (primary + co-sultans)
  const allSultans = isCoSultan
    ? [
        { donorName: sultan.donorName, totalAmount: sultan.totalAmount, donationCount: sultan.donationCount, player: sultan.player },
        ...coSultans.map((cs) => ({
          donorName: cs.donorName,
          totalAmount: cs.totalAmount,
          donationCount: cs.donationCount,
          player: cs.player,
        })),
      ]
    : [{ donorName: sultan.donorName, totalAmount: sultan.totalAmount, donationCount: sultan.donationCount, player: sultan.player }];

  const divisionLabel = sultan.tournamentDivision === 'female' ? '♀ Cewe' : '♂ Cowo';
  const divisionColor = sultan.tournamentDivision === 'female' ? 'text-idm-female-light' : 'text-idm-male-light';

  return (
    <AnimatedSection variant="premium" className="mb-6">
      <div
        className="relative overflow-hidden rounded-2xl border"
        style={{
          borderColor: `rgba(128,0,32,0.25)`,
          background: `linear-gradient(135deg, rgba(128,0,32,0.12) 0%, rgba(212,87,106,0.08) 50%, rgba(128,0,32,0.06) 100%)`,
        }}
      >
        {/* Decorative heart icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <Heart
            className="absolute -top-4 -right-4 w-24 h-24 opacity-[0.04]"
            style={{ color: MAROON }}
          />
          <Heart
            className="absolute bottom-2 -left-2 w-16 h-16 opacity-[0.03]"
            style={{ color: MAROON_LIGHT }}
          />
        </div>

        {/* Top maroon accent line */}
        <div
          className="h-1"
          style={{
            background: `linear-gradient(90deg, transparent, ${MAROON}, ${MAROON_LIGHT}, ${MAROON}, transparent)`,
          }}
        />

        <div className="relative z-10 p-4 sm:p-6">
          {/* Badge row */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(128,0,32,0.15)', border: `1.5px solid rgba(128,0,32,0.3)` }}
            >
              <Crown className="w-3.5 h-3.5" style={{ color: MAROON_LIGHT }} />
            </div>
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider" style={{ color: MAROON_LIGHT }}>
              {isCoSultan ? '❤️‍🔥 Co-Sultan of the Week' : '❤️ Sultan of the Week'}
            </span>
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-full border ml-auto shrink-0"
              style={{
                color: divisionColor,
                backgroundColor: sultan.tournamentDivision === 'female' ? 'rgba(255,92,154,0.1)' : 'rgba(87,181,255,0.1)',
                borderColor: sultan.tournamentDivision === 'female' ? 'rgba(255,92,154,0.25)' : 'rgba(87,181,255,0.25)',
              }}
            >
              {divisionLabel}
            </span>
          </div>

          {/* Sultan(s) display */}
          <div className={`flex ${isCoSultan ? 'flex-row gap-4 sm:gap-6' : 'flex-row items-center gap-4'}`}>
            {allSultans.map((s, idx) => {
              const avatarInitials = getInitials(s.donorName);
              const hasPlayerAvatar = s.player?.avatar;

              return (
                <div key={`${s.donorName}-${idx}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0"
                      style={{
                        border: `2px solid rgba(128,0,32,0.3)`,
                        boxShadow: `0 0 16px rgba(128,0,32,0.15)`,
                      }}
                    >
                      {hasPlayerAvatar ? (
                        <img
                          src={s.player!.avatar!}
                          alt={s.donorName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${MAROON}, ${MAROON_LIGHT})` }}
                        >
                          <span className="text-sm font-bold text-white/90">{avatarInitials}</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-base sm:text-lg font-black truncate"
                        style={{ color: MAROON_LIGHT }}
                      >
                        {s.donorName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm sm:text-base font-bold" style={{ color: MAROON }}>
                          {formatCurrencyShort(s.totalAmount)}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">
                          {s.donationCount}x sawer
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Week info */}
          <div className="mt-3 pt-3" style={{ borderTop: `1px solid rgba(128,0,32,0.12)` }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground/60">
                {sultan.tournamentName}
              </span>
              <span className="text-[10px] font-bold" style={{ color: MAROON_LIGHT }}>
                Week {sultan.weekNumber}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export function DonorLeaderboardSection({
  maleData,
  femaleData,
  isDataLoading,
  onSawer,
}: DonorLeaderboardSectionProps) {
  const [divisionFilter, setDivisionFilter] = useState<DivisionFilter>('all');

  // ── Merged donor data ──
  // Uses per-tournament allDonors from sultanOfWeekly (guaranteed same-week data)
  // Falls back to weeklyTopDonors only if allDonors is not available
  const { donors, totalDonation, weekNumber, totalMale, totalFemale, latestSultan } = useMemo(() => {
    // ── Step 1: Collect ALL sultan entries from both divisions ──
    const allSultans: SultanOfWeekly[] = [
      ...(maleData?.sultanOfWeekly || []),
      ...(femaleData?.sultanOfWeekly || []),
    ];

    // ── Step 2: Find the latest week number ──
    const latestWeekNum = allSultans.length > 0
      ? Math.max(...allSultans.map(s => s.weekNumber))
      : 0;

    // ── Step 3: Pick the latest sultan for the Sultan card ──
    const latest = allSultans.length > 0
      ? allSultans.reduce((a, b) => (a.weekNumber >= b.weekNumber ? a : b))
      : undefined;

    // ── Step 4: Build donor list from allDonors of the LATEST week only ──
    // This ensures the leaderboard only shows donors for the displayed week,
    // not donors from previous weeks that would mix in via weeklyTopDonors.
    const donorMap = new Map<string, { donorName: string; totalAmount: number; donationCount: number; maleAmount: number; femaleAmount: number }>();

    const mergeDonorList = (donorList: SultanOfWeekly['allDonors'], division: 'male' | 'female') => {
      if (!donorList?.length) return;
      for (const d of donorList) {
        const key = d.donorName.toLowerCase().trim();
        const existing = donorMap.get(key);
        if (existing) {
          donorMap.set(key, {
            donorName: d.donorName,
            totalAmount: existing.totalAmount + d.totalAmount,
            donationCount: existing.donationCount + d.donationCount,
            maleAmount: existing.maleAmount + (division === 'male' ? d.totalAmount : 0),
            femaleAmount: existing.femaleAmount + (division === 'female' ? d.totalAmount : 0),
          });
        } else {
          donorMap.set(key, {
            donorName: d.donorName,
            totalAmount: d.totalAmount,
            donationCount: d.donationCount,
            maleAmount: division === 'male' ? d.totalAmount : 0,
            femaleAmount: division === 'female' ? d.totalAmount : 0,
          });
        }
      }
    };

    // Merge allDonors from ALL sultan entries matching the latest week
    // (handles both male and female divisions for the same week)
    let hasAllDonors = false;
    for (const sultan of allSultans) {
      if (sultan.weekNumber === latestWeekNum && sultan.allDonors?.length) {
        mergeDonorList(sultan.allDonors, sultan.tournamentDivision as 'male' | 'female');
        hasAllDonors = true;
      }
    }

    // Fallback: if no allDonors available, use weeklyTopDonors (per-division, for the active tournament)
    // This handles the transition period while data migrates
    if (!hasAllDonors) {
      const mergeFallbackDonors = (donors: TopDonor[], division: 'male' | 'female') => {
        for (const d of donors) {
          const key = d.donorName.toLowerCase().trim();
          const existing = donorMap.get(key);
          if (existing) {
            donorMap.set(key, {
              donorName: d.donorName,
              totalAmount: existing.totalAmount + d.totalAmount,
              donationCount: existing.donationCount + d.donationCount,
              maleAmount: existing.maleAmount + (division === 'male' ? d.totalAmount : 0),
              femaleAmount: existing.femaleAmount + (division === 'female' ? d.totalAmount : 0),
            });
          } else {
            donorMap.set(key, {
              donorName: d.donorName,
              totalAmount: d.totalAmount,
              donationCount: d.donationCount,
              maleAmount: division === 'male' ? d.totalAmount : 0,
              femaleAmount: division === 'female' ? d.totalAmount : 0,
            });
          }
        }
      };
      if (maleData?.weeklyTopDonors?.length) mergeFallbackDonors(maleData.weeklyTopDonors, 'male');
      if (femaleData?.weeklyTopDonors?.length) mergeFallbackDonors(femaleData.weeklyTopDonors, 'female');
    }

    const sorted: DivisionDonor[] = Array.from(donorMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .map((d) => ({
        donorName: d.donorName,
        totalAmount: d.totalAmount,
        donationCount: d.donationCount,
        maleAmount: d.maleAmount,
        femaleAmount: d.femaleAmount,
        divisions: [
          ...(d.maleAmount > 0 ? ['male' as const] : []),
          ...(d.femaleAmount > 0 ? ['female' as const] : []),
        ],
      }));

    const top8 = sorted.slice(0, 8);
    const total = top8.reduce((s, d) => s + d.totalAmount, 0);
    const tMale = top8.reduce((s, d) => s + d.maleAmount, 0);
    const tFemale = top8.reduce((s, d) => s + d.femaleAmount, 0);

    return {
      donors: top8,
      totalDonation: total,
      weekNumber: latestWeekNum || (maleData?.activeTournament?.weekNumber || femaleData?.activeTournament?.weekNumber || 0),
      totalMale: tMale,
      totalFemale: tFemale,
      latestSultan: latest,
    };
  }, [maleData, femaleData]);

  // ── Filtered donors based on division toggle ──
  const filteredDonors = useMemo(() => {
    if (divisionFilter === 'all') return donors;
    return donors.filter((d) => d.divisions.includes(divisionFilter));
  }, [donors, divisionFilter]);

  const maxAmount = filteredDonors[0]?.totalAmount || 1;

  // ── Loading skeleton ──
  if (isDataLoading) {
    return (
      <section className="relative py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <SectionHeader
            icon={HandCoins}
            label="Penyawer"
            title="🏆 Leaderboard Penyawer"
            subtitle="Dukung turnamen favoritmu!"
          />
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="skeleton-shimmer h-48 rounded-2xl" />
            <div className="skeleton-shimmer h-16 rounded-2xl" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-20 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── Empty state ──
  if (donors.length === 0) {
    return (
      <section className="relative py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <SectionHeader
            icon={HandCoins}
            label="Penyawer"
            title="🏆 Leaderboard Penyawer"
            subtitle="Dukung turnamen favoritmu!"
          />

          <AnimatedSection variant="fadeUp" className="max-w-2xl mx-auto">
            <Card className="bg-background/50 backdrop-blur-sm border border-idm-gold-warm/10 rounded-2xl">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col items-center justify-center py-10 rounded-2xl bg-idm-gold-warm/[0.03]">
                  <Heart className="w-12 h-12 mb-4 text-idm-gold-warm/20" />
                  <p className="text-sm font-semibold text-muted-foreground">Belum ada penyawer minggu ini</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Jadilah yang pertama menyawer!</p>
                  {onSawer && (
                    <button
                      onClick={onSawer}
                      className="mt-5 px-6 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-idm-gold-warm to-[#e8d5a3] text-black hover:shadow-[0_0_20px_rgba(249,203,37,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer min-h-[36px]"
                    >
                      💰 Sawer Sekarang
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-8 sm:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* ── Section Header ── */}
        <SectionHeader
          icon={HandCoins}
          label="Penyawer"
          title="🏆 Leaderboard Penyawer"
          subtitle="Dukung turnamen favoritmu!"
        />

        <div className="max-w-2xl mx-auto">
          {/* ── Week badge + Division toggle tabs ── */}
          <AnimatedSection variant="fadeUp" className="mb-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Week badge */}
              {weekNumber > 0 && (
                <Badge className="bg-idm-gold-warm/10 text-idm-gold-warm border border-idm-gold-warm/20 text-[10px] font-bold px-2.5 py-1">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Week {weekNumber}
                </Badge>
              )}

              {/* Division toggle */}
              <div className="flex items-center gap-1 p-1 rounded-full bg-idm-gold-warm/[0.06] border border-idm-gold-warm/10">
                {([
                  { key: 'all' as DivisionFilter, label: 'Semua' },
                  { key: 'male' as DivisionFilter, label: '♂ Cowo' },
                  { key: 'female' as DivisionFilter, label: '♀ Cewe' },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setDivisionFilter(key)}
                    className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      divisionFilter === key
                        ? 'bg-idm-gold-warm/15 text-idm-gold-warm shadow-[0_0_8px_color-mix(in_srgb,var(--color-idm-gold-warm)_15%,transparent)]'
                        : 'text-muted-foreground/60 hover:text-idm-gold-warm/70'
                    }`}
                    aria-pressed={divisionFilter === key}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* ── Sultan of the Week Card ── */}
          {latestSultan && (
            <SultanOfWeeklyCard
              sultan={latestSultan}
              coSultans={latestSultan.coSultans}
            />
          )}

          {/* ── Leaderboard List ── */}
          <AnimatedSection variant="fadeUp">
            <Card className="bg-background/50 backdrop-blur-sm border border-idm-gold-warm/10 rounded-2xl overflow-hidden">
              {/* Card header */}
              <div className="flex items-center gap-2.5 px-4 sm:px-6 py-3 border-b border-idm-gold-warm/10">
                <div className="w-6 h-6 rounded-lg bg-idm-gold-warm/10 flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5 text-idm-gold-warm" />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-foreground">
                  Top Saweran
                </h3>
                <Badge className="ml-auto bg-idm-gold-warm/10 text-idm-gold-warm border border-idm-gold-warm/20 text-[9px] font-bold">
                  {weekNumber > 0 ? `Week ${weekNumber}` : 'Season'}
                </Badge>
              </div>

              <CardContent className="p-3 sm:p-4">
                {filteredDonors.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-xs text-muted-foreground">Tidak ada penyawer untuk divisi ini</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 sm:max-h-[480px] sm:overflow-y-auto custom-scrollbar">
                    {filteredDonors.map((donor, i) => {
                      const progress = Math.max(5, (donor.totalAmount / maxAmount) * 100);
                      const medal = RANK_MEDALS[i] || null;

                      return (
                        <div
                          key={donor.donorName}
                          className="group p-3 sm:p-4 rounded-xl transition-colors duration-200 hover:bg-idm-gold-warm/5 animate-fade-enter-sm"
                          style={{ animationDelay: `${i * 50}ms` }}
                        >
                          {/* Row 1: Rank + Avatar + Name + Badges + Total */}
                          <div className="flex items-center gap-2.5">
                            {/* Rank */}
                            <span className="w-6 text-center text-sm shrink-0">
                              {medal || <span className="text-xs text-muted-foreground font-bold">{i + 1}</span>}
                            </span>

                            {/* Initials avatar */}
                            <div className="w-8 h-8 rounded-lg bg-idm-gold-warm/10 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-idm-gold-warm">{getInitials(donor.donorName)}</span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                {/* #1 crown */}
                                {i === 0 && (
                                  <span className="text-sm shrink-0" title="Top Saweran">👑</span>
                                )}
                                <span
                                  className={`text-sm font-semibold truncate ${
                                    i === 0
                                      ? 'text-idm-gold-warm donor-name-pulse-gold'
                                      : 'donor-name-pulse'
                                  }`}
                                >
                                  {donor.donorName}
                                </span>
                                {/* Division badges */}
                                {donor.divisions.map((div) => (
                                  <DivisionBadge key={div} division={div} />
                                ))}
                                {/* Sawer tier */}
                                <SawerTierBadge amount={donor.totalAmount} />
                                {/* Total amount */}
                                <span className="text-sm font-bold bg-gradient-to-r from-idm-gold-warm to-amber-300 bg-clip-text text-transparent shrink-0 ml-auto">
                                  {formatCurrencyShort(donor.totalAmount)}
                                </span>
                              </div>
                              {/* Row 2: Per-division breakdown + progress bar */}
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  {/* Per-division amounts */}
                                  <div className="flex items-center gap-2 mb-1">
                                    {donor.maleAmount > 0 && (
                                      <span className="text-[10px] text-idm-male-light/60">
                                        ♂ {formatRupiahShort(donor.maleAmount)}
                                      </span>
                                    )}
                                    {donor.femaleAmount > 0 && (
                                      <span className="text-[10px] text-idm-female-light/60">
                                        ♀ {formatRupiahShort(donor.femaleAmount)}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-muted-foreground/40">
                                      {donor.donationCount}x sawer
                                    </span>
                                  </div>
                                  {/* Progress bar */}
                                  <div className="h-1.5 rounded-full bg-idm-gold-warm/5 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full bg-gradient-to-r ${
                                        i === 0
                                          ? 'from-yellow-500 to-amber-400'
                                          : i === 1
                                          ? 'from-gray-300 to-gray-400'
                                          : i === 2
                                          ? 'from-amber-600 to-amber-500'
                                          : 'from-idm-gold-warm/60 to-idm-gold-warm/40'
                                      }`}
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                                {/* Donation count badge */}
                                <Badge className="text-[8px] shrink-0 bg-idm-gold-warm/10 text-idm-gold-warm border border-idm-gold-warm/15">
                                  {donor.donationCount}x
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedSection>

          {/* ── Summary Bar ── */}
          <AnimatedSection variant="fadeUp" className="mt-4">
            <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-idm-gold-warm/[0.04] border border-idm-gold-warm/10">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Total Saweran {weekNumber > 0 ? `Week ${weekNumber}` : 'Season'} → Prize Pool
                </p>
                <p className="text-lg font-black bg-gradient-to-r from-idm-gold-warm to-amber-300 bg-clip-text text-transparent">
                  {formatCurrencyShort(totalDonation || 0)}
                </p>
                {/* Mobile: per-division breakdown under total */}
                <div className="flex sm:hidden items-center gap-3 mt-1">
                  {totalMale > 0 && (
                    <span className="text-[10px] text-idm-male-light/80">
                      ♂ Cowo {formatRupiahShort(totalMale)}
                    </span>
                  )}
                  {totalFemale > 0 && (
                    <span className="text-[10px] text-idm-female-light/80">
                      ♀ Cewe {formatRupiahShort(totalFemale)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <Sparkles className="w-5 h-5 text-idm-gold-warm/30" />
                {/* Desktop: per-division breakdown on the right */}
                <div className="hidden sm:flex items-center gap-2 mt-1">
                  {totalMale > 0 && (
                    <span className="text-[10px] text-idm-male-light/80">
                      ♂ {formatRupiahShort(totalMale)}
                    </span>
                  )}
                  {totalFemale > 0 && (
                    <span className="text-[10px] text-idm-female-light/80">
                      ♀ {formatRupiahShort(totalFemale)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* ── CTA Button ── */}
          {onSawer && (
            <AnimatedSection variant="fadeUp" className="mt-4">
              <button
                onClick={onSawer}
                className="w-full py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-idm-gold-warm to-[#e8d5a3] text-black hover:shadow-[0_0_20px_rgba(249,203,37,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer min-h-[36px]"
              >
                💰 Sawer Sekarang
              </button>
            </AnimatedSection>
          )}
        </div>
      </div>
    </section>
  );
}
