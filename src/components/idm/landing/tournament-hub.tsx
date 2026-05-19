'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Swords, Music, Shield, Crown, Users, Building2, Gamepad2, ArrowRight, Play, UserPlus, CreditCard, Calendar, Clock, MapPin, Heart, UserCheck, X, Zap, Flag, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { AnimatedSection, SectionHeader } from './shared';
import { formatCurrency, parseWitaDate, formatWIBWeekdayShort, formatWIBTime } from '@/lib/utils';
import type { StatsData } from '@/types/stats';

interface TournamentHubProps {
  maleData: StatsData | undefined;
  femaleData: StatsData | undefined;
  leagueData: any;
  cmsSections: Record<string, any>;
  cmsSettings?: Record<string, string>;
  onEnterApp: (division: 'male' | 'female') => void;
  onRegister: (division: 'male' | 'female') => void;
  onPayment: (division: 'male' | 'female') => void;
  onDonate: (division: 'male' | 'female') => void;
  onVideoPlay?: (url: string, title: string) => void;
  maleRegOpen?: boolean;
  femaleRegOpen?: boolean;
}

/* ────────────────────────── Division Config ────────────────────────── */
const DIVISION = {
  male: {
    key: 'male' as const,
    title: 'Cowo Tarkam',
    icon: Music,
    color: '#2E9FFF',
    colorLight: '#57B5FF',
    colorRgb: '46,159,255',
    gradient: 'from-idm-male/40 via-[#1478D9]/30 to-mid',
    badgeBg: 'bg-idm-male/15',
    badgeText: 'text-idm-male',
    badgeBorder: 'border-idm-male/25',
    iconBg: 'bg-idm-male/10 border-idm-male/25',
    ctaBg: 'bg-idm-male/10 border-idm-male/25 text-idm-male hover:bg-idm-male/20',
    statBg: 'bg-idm-male/[0.06] border-idm-male/10',
    hoverBorder: 'rgba(46,159,255,0.3)',
    hoverShadow: '0 8px 40px rgba(46,159,255,0.15)',
    patternOpacity: 'opacity-[0.04]',
  },
  female: {
    key: 'female' as const,
    title: 'Cewe Tarkam',
    icon: Shield,
    color: '#FF2D78',
    colorLight: '#FF5C9A',
    colorRgb: '255,45,120',
    gradient: 'from-idm-female/40 via-[#D9165E]/30 to-mid',
    badgeBg: 'bg-idm-female/15',
    badgeText: 'text-idm-female',
    badgeBorder: 'border-idm-female/25',
    iconBg: 'bg-idm-female/10 border-idm-female/25',
    ctaBg: 'bg-idm-female/10 border-idm-female/25 text-idm-female hover:bg-idm-female/20',
    statBg: 'bg-idm-female/[0.06] border-idm-female/10',
    hoverBorder: 'rgba(255,45,120,0.3)',
    hoverShadow: '0 8px 40px rgba(255,45,120,0.15)',
    patternOpacity: 'opacity-[0.04]',
  },
} as const;

/* ────────────────────────── Tournament Card ────────────────────────── */
/* ─── Participants Modal ─── */
function ParticipantsModal({
  open,
  onOpenChange,
  division,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  division: typeof DIVISION.male | typeof DIVISION.female;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['tournament-participants', division.key],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments/participants?division=${division.key}`);
      if (!res.ok) throw new Error('Gagal memuat data');
      return res.json();
    },
    enabled: open,
    staleTime: 30000,
  });

  const participants = data?.participants || [];
  const counts = data?.counts || { pending: 0, approved: 0, total: 0 };
  const tournamentName = data?.tournamentName;
  const weekNumber = data?.weekNumber;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-lg p-0 overflow-hidden border-border/50 bg-background max-h-[85vh] flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Pendaftar Turnamen</DialogTitle>
          <DialogDescription>Daftar pemain yang mendaftar/daftar ulang turnamen {division.title}</DialogDescription>
        </DialogHeader>

        {/* Modal Header */}
        <div className={`relative h-16 bg-gradient-to-br ${division.key === 'male' ? 'from-idm-male via-idm-male/80 to-idm-male-light/60' : 'from-idm-female via-idm-female/80 to-idm-female-light/60'} overflow-hidden shrink-0`}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 flex items-center justify-between h-full px-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Pendaftar Turnamen</h2>
                <p className="text-[10px] text-white/70">{tournamentName ? `${tournamentName} • W${weekNumber}` : division.title}</p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Tutup"
              className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center hover:bg-black/40 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Count pills */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/30 bg-muted/20">
          <Badge className="bg-blue-500/15 text-blue-400 border-0 text-[9px] gap-1"><Clock className="w-2.5 h-2.5" />{counts.pending} Pending</Badge>
          <Badge className="bg-green-500/15 text-green-400 border-0 text-[9px] gap-1"><UserCheck className="w-2.5 h-2.5" />{counts.approved} Approved</Badge>
          <Badge className="bg-muted/30 text-muted-foreground border-0 text-[9px] ml-auto">{counts.total} Total</Badge>
        </div>

        {/* Modal Body — scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          {isLoading ? (
            <div className="py-10 text-center">
              <div className="animate-spin-slow inline-block mb-3">
                <Users className={`w-8 h-8 ${division.key === 'male' ? 'text-idm-male' : 'text-idm-female'}`} />
              </div>
              <p className="text-sm text-muted-foreground">Memuat data peserta...</p>
            </div>
          ) : participants.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">Belum ada pendaftar</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Belum ada pemain yang mendaftar atau daftar ulang</p>
            </div>
          ) : (
            <div className="space-y-1">
              {participants.map((p: { id: string; gamertag: string; name: string; city: string; status: string; tier: string; createdAt: string }, idx: number) => {
                const isPending = p.status === 'pending';
                const isApproved = p.status === 'approved';
                return (
                  <div key={p.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${
                    isPending ? 'border-blue-500/15 bg-blue-500/[0.03]' :
                    `border-green-500/10 bg-green-500/[0.03]`
                  }`}>
                    {/* Number */}
                    <span className="text-[10px] font-bold text-muted-foreground/50 w-5 text-right tabular-nums">{idx + 1}</span>
                    {/* Avatar placeholder */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isPending ? 'bg-blue-500/10 text-blue-400' :
                      'bg-green-500/10 text-green-400'
                    }`}>
                      {p.gamertag.charAt(0).toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{p.gamertag}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{p.name}{p.city ? ` • ${p.city}` : ''}</p>
                    </div>
                    {/* Status badge */}
                    <Badge className={`${
                      isPending ? 'bg-blue-500/15 text-blue-400' :
                      'bg-green-500/15 text-green-400'
                    } border-0 text-[8px] shrink-0`}>
                      {isPending ? 'Pending' : 'Approved'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ────────────────────────── Tournament Card ────────────────────────── */
function TournamentCard({
  division,
  data,
  cmsSections,
  cmsSettings,
  onEnterApp,
  onRegister,
  onPayment,
  onDonate,
  onVideoPlay,
  isRegOpen,
}: {
  division: typeof DIVISION.male | typeof DIVISION.female;
  data: StatsData | undefined;
  cmsSections: Record<string, any>;
  cmsSettings?: Record<string, string>;
  onEnterApp: (division: 'male' | 'female') => void;
  onRegister: (division: 'male' | 'female') => void;
  onPayment: (division: 'male' | 'female') => void;
  onDonate: (division: 'male' | 'female') => void;
  onVideoPlay?: (url: string, title: string) => void;
  isRegOpen?: boolean;
}) {
  const Icon = division.icon;
  // Show current running week (not completed count) — e.g. "Week 2" when week 2 is active
  const currentWeek = data?.activeTournament?.weekNumber || (data?.seasonProgress?.completedWeeks ? data.seasonProgress.completedWeeks + 1 : 0);
  const totalPlayers = data?.totalPlayers || 0;
  const totalClubs = data?.clubs?.length || 0;
  const totalMatches = data?.recentMatches?.length || 0;

  /* ─── Participants modal state + count query ─── */
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const { data: participantsData } = useQuery({
    queryKey: ['tournament-participants-count', division.key],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments/participants?division=${division.key}`);
      if (!res.ok) throw new Error('Gagal memuat data');
      return res.json();
    },
    staleTime: 60000,
    select: (d: any) => d.counts?.total ?? 0,
  });
  const participantCount = participantsData ?? 0;
  // PrizePool: use per-tournament prize pool (resets each week), fallback to season aggregate
  // Uses ?? (not ||) so that activeTournamentPrizePool=0 (week completed, no new week yet)
  // is respected as a valid value and does NOT fall through to the season aggregate.
  const prizePool = data?.activeTournamentPrizePool ?? (division.key === 'female'
    ? (data?.femalePrizePool || data?.totalPrizePool || 0)
    : (data?.malePrizePool || data?.totalPrizePool || 0));

  // Check if registration is open for this division
  // Priority: 1) Full stats data (most accurate), 2) Fast tournament-status prop (fallback during loading)
  // This prevents the button from being disabled while the heavy /api/stats is still loading
  const tournamentStatus = data?.activeTournament?.status;
  const isRegistrationOpen = tournamentStatus === 'registration' || tournamentStatus === 'approval' || isRegOpen || false;

  // CMS text fields with fallbacks
  const cardTitle = cmsSettings?.[`kompetisi_${division.key}_title`] || division.title;
  const cardBadge = cmsSettings?.[`kompetisi_${division.key}_badge`] || 'Weekly Tournament';
  const cardFormat = cmsSettings?.[`kompetisi_${division.key}_format`] || 'Bracket elimination — 1 tim, 3 pemain';
  const cardDescription = cmsSettings?.[`kompetisi_${division.key}_description`] ||
    `Turnamen mingguan dengan format bracket elimination. Peserta tarkam ${division.key === 'male' ? 'putra' : 'putri'} bertanding setiap minggu. Juara weekly berhak atas prize pool dan gelar champion.`;

  // Video URL extraction
  const videoUrl =
    cmsSettings?.[`kompetisi_${division.key}_video_url`] ||
    cmsSections.kompetisi?.cards?.find(
      (c: { division?: string; videoUrl?: string }) => c.division === division.key && c.videoUrl
    )?.videoUrl;

  return (
    <div
      className="group tournament-card-tilt ios-tournament-card relative overflow-hidden"
      style={
        {
          '--division-color': division.color,
          '--division-color-rgb': division.colorRgb,
          background: `linear-gradient(165deg, rgba(${division.colorRgb},0.08) 0%, var(--bg-mid) 35%, rgba(${division.colorRgb},0.04) 100%)`,
        } as React.CSSProperties
      }
    >
      {/* ═══ iOS-style gold accent line at top ═══ */}
      <div className="ios-gold-line" aria-hidden="true" />
      {/* ── Image Area ── */}
      <div className={`relative h-40 sm:h-52 overflow-hidden tournament-header-mesh ${division.key === 'male' ? 'tournament-header-mesh-male' : 'tournament-header-mesh-female'}`}>
        {/* Pattern overlay */}
        <div
          className={`absolute inset-0 ${division.patternOpacity}`}
          style={{
            backgroundImage: `radial-gradient(circle, ${division.color} 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Large watermark icon */}
        <Icon
          className="absolute -right-6 -bottom-6 w-40 h-40 text-white/[0.04] tournament-watermark-float"
          strokeWidth={0.5}
        />

        {/* Decorative grid lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(${division.color} 1px, transparent 1px), linear-gradient(90deg, ${division.color} 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }}
        />

        {/* Badge overlay — top left */}
        <div className="absolute top-4 left-4 z-10">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${division.badgeBg} border ${division.badgeBorder}`}
          >
            <Swords className="w-3 h-3 text-idm-gold-warm" />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${division.badgeText}`}>
              {cardBadge}
            </span>
          </div>
        </div>

        {/* Tournament count — top right */}
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-foreground/5 dark:bg-black/50 border border-border/40">
            <Gamepad2 className="w-3 h-3 text-idm-gold-warm" />
            <span className="text-[10px] font-bold text-foreground/80">
              {currentWeek > 0 ? `Week ${currentWeek}` : 'TBA'}
            </span>
          </div>
        </div>

        {/* Video play button — premium pulsing design */}
        {videoUrl && onVideoPlay && (
          <button
            onClick={() => onVideoPlay(videoUrl, cardTitle)}
            className="absolute bottom-4 right-4 z-10 group/play cursor-pointer"
            aria-label={`Play ${division.title} video`}
          >
            {/* Outer pulsing ring */}
            <span className="absolute inset-0 rounded-full play-btn-pulse-ring" style={{ background: `rgba(${division.colorRgb},0.25)` }} />
            {/* Mid glow */}
            <span className="absolute -inset-1.5 rounded-full play-btn-pulse-glow" style={{ background: `radial-gradient(circle, rgba(${division.colorRgb},0.2) 0%, transparent 70%)` }} />
            {/* Button body */}
            <span className="relative flex items-center justify-center w-11 h-11 rounded-full backdrop-blur-sm border transition-all duration-300 group-hover/play:scale-110 group-hover/play:border-idm-gold-warm/50"
              style={{
                background: `linear-gradient(135deg, rgba(${division.colorRgb},0.25) 0%, rgba(0,0,0,0.7) 100%)`,
                borderColor: `rgba(${division.colorRgb},0.35)`,
                boxShadow: `0 0 20px rgba(${division.colorRgb},0.15), inset 0 1px 0 rgba(255,255,255,0.1)`,
              }}
            >
              <Play className="w-4 h-4 text-idm-gold-warm dark:text-white fill-idm-gold-warm dark:fill-white ml-0.5 drop-shadow-[0_0_4px_rgba(239,249,35,0.3)] dark:drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]" />
            </span>
            {/* Label tooltip on hover */}
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wider text-foreground dark:text-white/80 bg-background/90 dark:bg-black/70 border border-border/20 dark:border-0 px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/play:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={{ backdropFilter: 'blur(4px)' }}
            >
              Watch Video
            </span>
          </button>
        )}

        {/* Gradient overlay at bottom — smoother blend into card body */}
        <div className="absolute inset-x-0 bottom-0 h-28" style={{ background: 'linear-gradient(to top, var(--bg-mid), transparent)' }} />

        {/* Division glow line at header bottom — content area accent */}
        <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: `linear-gradient(90deg, transparent 5%, rgba(${division.colorRgb},0.3) 30%, rgba(${division.colorRgb},0.5) 50%, rgba(${division.colorRgb},0.3) 70%, transparent 95%)` }} />

        {/* Subtle shine sweep on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(105deg, transparent 40%, rgba(${division.colorRgb},0.05) 45%, rgba(${division.colorRgb},0.1) 50%, rgba(${division.colorRgb},0.05) 55%, transparent 60%)`,
              transform: 'translateX(-100%)',
              animation: 'card-shine-sweep 1.5s ease-in-out forwards',
            }}
          />
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="p-4 sm:p-6">
        {/* Icon + Title row — iOS clean hierarchy */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-10 h-10 rounded-xl ${division.iconBg} flex items-center justify-center shrink-0`}
            style={{ boxShadow: `0 0 20px rgba(${division.colorRgb},0.1)` }}
          >
            <Icon className="w-5 h-5 tournament-icon-pulse" style={{ color: division.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground dark:text-white truncate ios-heading">{cardTitle}</h3>
            <p className="text-[11px] text-muted-foreground dark:text-[#a09880]">{cardFormat}</p>
          </div>
          {/* List Peserta CTA */}
          {participantCount > 0 && (
            <button
              onClick={() => setParticipantsModalOpen(true)}
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/30 bg-muted/20 text-[10px] font-semibold text-muted-foreground hover:text-idm-gold-warm hover:border-idm-gold-warm/30 hover:bg-idm-gold-warm/5 transition-all cursor-pointer active:scale-95"
              title="Lihat list peserta"
            >
              <Users className="w-3 h-3" />
              <span className="tabular-nums">{participantCount}</span>
              <span className="hidden sm:inline">Peserta</span>
            </button>
          )}
        </div>

        {/* Description — iOS lighter secondary text */}
        <p className="text-sm text-muted-foreground dark:text-[#a09880] leading-relaxed mb-4">
          {cardDescription}
        </p>

        {/* Info row — Date/Time, Arena, BPM (like dashboard hero) */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 mb-4">
          <div className="ios-card relative p-2 sm:p-3 text-center tournament-stat-item tournament-stat-separator overflow-hidden" style={{ background: `linear-gradient(135deg, rgba(${division.colorRgb},0.06) 0%, rgba(${division.colorRgb},0.02) 100%)`, borderColor: `rgba(${division.colorRgb},0.1)` }}>
            <Calendar className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-[0.06]" style={{ color: division.color }} />
            <p className="relative text-xs sm:text-sm font-bold tabular-nums" style={{ color: division.color }}>
              {data?.activeTournament?.scheduledAt ? formatWIBWeekdayShort(parseWitaDate(data.activeTournament.scheduledAt)!) : '–'}
            </p>
            <p className="relative text-[9px] sm:text-[10px] text-muted-foreground dark:text-[#a09880] flex items-center justify-center gap-1 mt-0.5">
              <Clock className="w-2.5 h-2.5" />
              {data?.activeTournament?.scheduledAt ? formatWIBTime(parseWitaDate(data.activeTournament.scheduledAt)!) : 'TBA'}
            </p>
          </div>
          <div className="ios-card relative p-2 sm:p-3 text-center tournament-stat-item tournament-stat-separator overflow-hidden" style={{ background: `linear-gradient(135deg, rgba(${division.colorRgb},0.06) 0%, rgba(${division.colorRgb},0.02) 100%)`, borderColor: `rgba(${division.colorRgb},0.1)` }}>
            <MapPin className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-[0.06]" style={{ color: division.color }} />
            <p className="relative text-xs sm:text-sm font-bold" style={{ color: division.color }}>
              {data?.activeTournament?.location || 'Online'}
            </p>
            <p className="relative text-[9px] sm:text-[10px] text-muted-foreground dark:text-[#a09880] flex items-center justify-center gap-1 mt-0.5">
              <MapPin className="w-2.5 h-2.5" />
              Arena
            </p>
          </div>
          <div className="ios-card relative p-2 sm:p-3 text-center tournament-stat-item overflow-hidden" style={{ background: `linear-gradient(135deg, rgba(${division.colorRgb},0.06) 0%, rgba(${division.colorRgb},0.02) 100%)`, borderColor: `rgba(${division.colorRgb},0.1)` }}>
            <Heart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-[0.06]" style={{ color: division.color }} />
            <p className="relative text-xs sm:text-sm font-bold tabular-nums" style={{ color: division.color }}>
              {data?.activeTournament?.bpm || '–'}
            </p>
            <p className="relative text-[9px] sm:text-[10px] text-muted-foreground dark:text-[#a09880] flex items-center justify-center gap-1 mt-0.5">
              <Heart className="w-2.5 h-2.5" />
              BPM
            </p>
          </div>
        </div>

        {/* Prize pool highlight — iOS frosted glass */}
        {prizePool > 0 && (
          <div className="ios-card flex items-center gap-2 mb-4 px-3 py-2" style={{ background: 'rgba(239,249,35,0.06)', borderColor: 'rgba(239,249,35,0.1)' }}>
            <Crown className="w-3.5 h-3.5 text-idm-gold-warm" />
            <span className="text-[11px] text-muted-foreground dark:text-[#a09880]">Prize Pool</span>
            <span className="text-sm font-bold text-gradient-champion ml-auto">
              {formatCurrency(prizePool)}
            </span>
          </div>
        )}

        {/* Season Progress — compact timeline inside division card */}
        {data?.seasonProgress && (() => {
          const { totalWeeks, completedWeeks, percentage } = data.seasonProgress;
          const curWeek = data?.activeTournament?.weekNumber || (completedWeeks + 1);
          const hasActive = curWeek <= totalWeeks && curWeek > completedWeeks;
          // Phase config
          const phase = curWeek <= 2 ? 'registration' : curWeek <= totalWeeks - 2 ? 'competition' : 'playoffs';
          const phaseCfg = {
            registration: { label: 'Registrasi', Icon: Flag, bg: 'bg-blue-500/10', text: 'text-blue-400' },
            competition: { label: 'Kompetisi', Icon: Zap, bg: 'bg-green-500/10', text: 'text-green-400' },
            playoffs: { label: 'Playoff', Icon: Target, bg: 'bg-amber-500/10', text: 'text-amber-400' },
          }[phase];
          const PhaseIcon = phaseCfg.Icon;
          return (
            <div className="mt-4 pt-3 pb-4 border-t border-border/10">
              {/* Header: season name + phase badge */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  <span className="font-semibold text-foreground/80">{data.season?.name || `Season ${data.season?.number || ''}`}</span>
                </span>
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${phaseCfg.bg} ${phaseCfg.text}`}>
                  <PhaseIcon className="w-2.5 h-2.5" />
                  <span className="text-[8px] font-bold uppercase tracking-wider">{phaseCfg.label}</span>
                </div>
              </div>
              {/* Week timeline bars */}
              <div className="flex items-center gap-1 mb-1.5">
                {Array.from({ length: totalWeeks }, (_, i) => {
                  const wn = i + 1;
                  const done = wn <= completedWeeks;
                  const active = wn === curWeek && hasActive;
                  return (
                    <div key={wn} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="relative w-full h-1.5 rounded-full overflow-hidden bg-muted/15">
                        {done && (
                          <div className="absolute inset-0 rounded-full transition-all duration-500" style={{ background: `linear-gradient(90deg, ${division.color}, ${division.color}cc)` }} />
                        )}
                        {active && (
                          <div className="absolute inset-0 rounded-full animate-pulse" style={{ backgroundColor: `${division.color}40` }} />
                        )}
                      </div>
                      <span className={`text-[7px] font-medium tabular-nums ${
                        done ? '' : active ? 'font-bold' : 'text-muted-foreground/30'
                      }`} style={done || active ? { color: division.color } : undefined}>
                        {wn}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Stats row */}
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-muted-foreground">
                  <span className="font-bold" style={{ color: division.color }}>{completedWeeks}</span>/{totalWeeks} minggu
                  {hasActive && <> · Minggu <span className="font-bold" style={{ color: division.color }}>{curWeek}</span></>}
                </span>
                <span className="font-bold tabular-nums" style={{ color: division.color }}>{percentage}%</span>
              </div>
            </div>
          );
        })()}

        {/* CTA buttons — stacked on mobile, side-by-side on sm+ */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => onDonate(division.key)}
            className="flex-1 py-3 min-h-[44px] rounded-2xl text-sm font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 text-white hover:opacity-90 active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${division.color} 0%, ${division.colorLight} 100%)`,
              boxShadow: `0 4px 15px rgba(${division.colorRgb},0.25)`,
            }}
          >
            <Heart className="w-4 h-4" />
            <span>Sawer</span>
          </button>
          <button
            onClick={() => isRegistrationOpen && onRegister(division.key)}
            disabled={!isRegistrationOpen}
            className={`flex-1 py-3 min-h-[44px] rounded-2xl border text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden ${
              isRegistrationOpen
                ? `tournament-cta-secondary cursor-pointer ${division.ctaBg}`
                : 'bg-gray-500/10 border-gray-500/20 text-gray-500 cursor-not-allowed opacity-60'
            }`}
            title={isRegistrationOpen ? 'Daftar sekarang' : 'Pendaftaran belum dibuka'}
          >
            <UserPlus className="w-4 h-4" />
            <span>{isRegistrationOpen ? 'Daftar' : 'Belum Buka'}</span>
          </button>
        </div>

        {/* Payment button */}
        <button
          onClick={() => onPayment(division.key)}
          className="mt-2.5 w-full py-2.5 rounded-2xl border text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer bg-idm-gold-warm/5 border-idm-gold-warm/20 text-idm-gold-warm hover:bg-idm-gold-warm/15 hover:border-idm-gold-warm/35 active:scale-[0.98]"
          title="Info pembayaran registrasi"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Pembayaran</span>
        </button>
      </div>

      {/* Participants Modal */}
      <ParticipantsModal
        open={participantsModalOpen}
        onOpenChange={setParticipantsModalOpen}
        division={division}
      />
    </div>
  );
}

/* ────────────────────────── Main Component ────────────────────────── */
export function TournamentHub({
  maleData,
  femaleData,
  leagueData,
  cmsSections,
  cmsSettings,
  onEnterApp,
  onRegister,
  onPayment,
  onDonate,
  onVideoPlay,
  maleRegOpen,
  femaleRegOpen,
}: TournamentHubProps) {
  // CMS text fields with fallbacks
  const sectionLabel = cmsSettings?.kompetisi_label || 'Kompetisi';
  const sectionTitle = cmsSettings?.kompetisi_title || 'Tarkam Arena';
  const sectionSubtitle = cmsSettings?.kompetisi_subtitle || 'Weekly tournament setiap minggu — pilih tarkammu dan langsung bertanding di arena kompetisi IDM';


  return (
    <section
      id="kompetisi"
      role="region"
      aria-label={sectionLabel}
      className="landing-section relative py-6 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-hidden bg-deep border-t border-border/10 dark:border-t-0"
    >
      {/* ── Top edge glow — section boundary ── */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-idm-gold-warm/30 to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-idm-gold-warm/3 to-transparent pointer-events-none" aria-hidden="true" />

      {/* ── Background ── */}
      {/* Gold dot pattern overlay — parallax section bg */}
      <div
        className="absolute inset-0 opacity-[0.025] parallax-section-bg"
        style={{
          backgroundImage: 'radial-gradient(circle, #EFF923 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Subtle radial glow at center top — parallax section bg */}
      <div
        className="absolute inset-0 parallax-section-bg"
        style={{
          background:
            'radial-gradient(ellipse at 50% 20%, rgba(239,249,35,0.04) 0%, transparent 60%)',
        }}
      />
      {/* Bilateral division atmosphere */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 20% 50%, rgba(46,159,255,0.03) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(255,45,120,0.03) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* ── Section Header ── */}
        <AnimatedSection>
          <SectionHeader
            icon={Swords}
            label={sectionLabel}
            title={sectionTitle}
            subtitle={sectionSubtitle}
          />
        </AnimatedSection>

        {/* ── Tournament Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Male Tarkam */}
          <AnimatedSection variant="fadeLeft">
            <TournamentCard
              division={DIVISION.male}
              data={maleData}
              cmsSections={cmsSections}
              cmsSettings={cmsSettings}
              onEnterApp={onEnterApp}
              onRegister={onRegister}
              onPayment={onPayment}
              onDonate={onDonate}
              onVideoPlay={onVideoPlay}
              isRegOpen={maleRegOpen}
            />
          </AnimatedSection>

          {/* Female Tarkam */}
          <AnimatedSection variant="fadeRight">
            <TournamentCard
              division={DIVISION.female}
              data={femaleData}
              cmsSections={cmsSections}
              cmsSettings={cmsSettings}
              onEnterApp={onEnterApp}
              onRegister={onRegister}
              onPayment={onPayment}
              onDonate={onDonate}
              onVideoPlay={onVideoPlay}
              isRegOpen={femaleRegOpen}
            />
          </AnimatedSection>
        </div>


      </div>


    </section>
  );
}
