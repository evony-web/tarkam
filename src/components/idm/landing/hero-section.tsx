'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { Star, Eye, ArrowRight, Users, Trophy, Swords, PenLine, X, Music } from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';
import type { StatsData } from '@/types/stats';

/* ═══════════════════════════════════════════════════════════════
   TARKAM IDM — TARKAM ARENA HERO
   International esports tournament aesthetic
   Inspired by Valorant Champions / LoL Worlds / BLAST Premier
   Performance-optimized for mid-range devices
   ═══════════════════════════════════════════════════════════════ */

interface HeroSectionProps {
  maleData: StatsData | undefined;
  femaleData: StatsData | undefined;
  leagueData: any;
  cmsSections: Record<string, any>;
  cmsSettings: Record<string, string>;
  onEnterApp: (division: 'male' | 'female') => void;
  onEnterCommunity: () => void;
  onRegister: (division: 'male' | 'female') => void;
  onViewBracket: (division: 'male' | 'female') => void;
  onVideoPlay?: (url: string, title: string) => void;
  /** True when showing stale data from a previous season during a season switch.
   *  Used to show skeleton instead of old champion avatar. */
  isSeasonDataPlaceholder?: boolean;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN HERO SECTION
   ═══════════════════════════════════════════════════════════════ */

export function HeroSection({
  maleData,
  femaleData,
  leagueData,
  cmsSections,
  cmsSettings,
  onEnterApp,
  onEnterCommunity,
  onRegister,
  onViewBracket,
  onVideoPlay,
  isSeasonDataPlaceholder = false,
}: HeroSectionProps) {
  /* ─── Extract CMS content ─── */
  // ★ No hardcoded fallback text — SSR provides CMS data via React Query cache.
  // This prevents "stale flash" where old text appears before fresh data loads.
  const hasCms = Object.keys(cmsSettings).length > 0;
  const siteTitle = cmsSettings.site_title || 'TARKAM IDM';
  const heroTitle = cmsSettings.hero_title || '';
  const heroSubtitle = cmsSettings.hero_subtitle || '';
  const heroTagline = cmsSettings.hero_tagline || '';
  const heroBgDesktop = cmsSettings.hero_bg_desktop || '';
  const heroBgMobile = cmsSettings.hero_bg_mobile || '';
  const heroBgVideo = cmsSettings.hero_bg_video || '';

  /* ─── Bracket division picker modal state ─── */
  const [showBracketPicker, setShowBracketPicker] = useState(false);

  /* ─── YouTube iframe facade — defer loading until after LCP ─── */
  // ★ OPTIMIZED: Disable YouTube on mobile entirely — heavy JS (500KB+) blocks main thread causing high INP
  const isMobile = useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia('(max-width: 767px)');
      mql.addEventListener('change', callback);
      return () => mql.removeEventListener('change', callback);
    },
    () => window.innerWidth < 768,
    () => false // SSR fallback
  );
  const [ytIframeReady, setYtIframeReady] = useState(false);
  useEffect(() => {
    // Defer YouTube iframe load — 5s on desktop (was 3s), skip on mobile
    if (!isMobile) {
      const timer = setTimeout(() => setYtIframeReady(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  /* ─── Compute stats ─── */
  const malePlayers = maleData?.totalPlayers || 0;
  const femalePlayers = femaleData?.totalPlayers || 0;
  const maleClubs = maleData?.clubs?.length || 0;
  const femaleClubs = femaleData?.clubs?.length || 0;
  const maleMatches = (maleData?.recentMatches?.length || 0) + (maleData?.upcomingMatches?.length || 0);
  const femaleMatches = (femaleData?.recentMatches?.length || 0) + (femaleData?.upcomingMatches?.length || 0);
  const totalPlayers = malePlayers + femalePlayers;
  const totalClubs = maleClubs + femaleClubs;
  const totalMatches = maleMatches + femaleMatches;

  /* ─── Season Champions (latest completed season) ─── */
  const maleChampionSeason = !isSeasonDataPlaceholder ? maleData?.allSeasons?.find(s => s.status === 'completed' && s.championPlayer) : undefined;
  const femaleChampionSeason = !isSeasonDataPlaceholder ? femaleData?.allSeasons?.find(s => s.status === 'completed' && s.championPlayer) : undefined;
  const maleChampion = maleChampionSeason?.championPlayer ?? null;
  const femaleChampion = femaleChampionSeason?.championPlayer ?? null;
  const maleChampionAvatar = maleChampion ? getAvatarUrl(maleChampion.gamertag, 'male', maleChampion.avatar) : '';
  const femaleChampionAvatar = femaleChampion ? getAvatarUrl(femaleChampion.gamertag, 'female', femaleChampion.avatar) : '';
  // Club champion — prefer male season, fallback to female
  const championClub = maleChampionSeason?.championClub ?? femaleChampionSeason?.championClub ?? null;
  const hasChampions = !!(maleChampion || femaleChampion);
  // Show skeleton when data is placeholder (season switch) OR when still loading
  const showChampionSkeleton = isSeasonDataPlaceholder || (!maleData && !femaleData);
  // Gold skin visual constants for season champion avatars
  const CHAMPION_GOLD = '#EFF923';
  const maleHasSkin = maleChampion?.hasSeasonChampionSkin ?? false;
  const femaleHasSkin = femaleChampion?.hasSeasonChampionSkin ?? false;

  return (
    <>
      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section
        id="hero"
        className="relative min-h-[92vh] sm:min-h-screen flex flex-col items-center justify-center"
        aria-label="Tarkam IDM Hero"
      >
        {/* ── Background Layers ── */}

        {/* Base: Deep dark gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, var(--bg-deep) 0%, var(--bg-mid) 40%, var(--background) 100%)`,
          }}
        />

        {/* CMS Video Background — takes priority over images when set */}
        {heroBgVideo && !isMobile ? (
          (() => {
            // Detect YouTube URL and extract video ID + optional start time
            const ytMatch = heroBgVideo.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            const startTimeMatch = heroBgVideo.match(/[?&]t=(\d+)/);
            const startTime = startTimeMatch ? `&start=${startTimeMatch[1]}` : '';

            if (ytMatch) {
              // YouTube embed — deferred facade: only load iframe AFTER LCP completes
              // This prevents YouTube's heavy JS from blocking initial paint
              return (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {ytIframeReady ? (
                    <div className="absolute inset-0" style={{ width: '177.78vh', height: '56.25vw', minWidth: '100%', minHeight: '100%', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&fs=0&iv_load_policy=3${startTime}`}
                        title="Hero background video"
                        allow="autoplay; encrypted-media"
                        className="w-full h-full"
                        style={{ border: 'none', opacity: 0.3 }}
                        aria-hidden="true"
                      />
                    </div>
                  ) : (
                    /* Placeholder — static dark gradient while iframe loads */
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, var(--bg-deep) 0%, var(--bg-mid) 40%, var(--background) 100%)' }} />
                  )}
                </div>
              );
            }
            // Direct video URL (MP4, WebM, etc.)
            return (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                  aria-hidden="true"
                >
                  <source src={heroBgVideo} type="video/mp4" />
                  <source src={heroBgVideo} type="video/webm" />
                </video>
              </div>
            );
          })()
        ) : (
          /* Fallback: CMS Background Images (only shown when no video) */
          (heroBgDesktop || heroBgMobile) ? (
            <>
              {/* Desktop — landscape hero image */}
              {heroBgDesktop && (
                <div className="absolute inset-0 hidden sm:block">
                  <Image src={heroBgDesktop} alt="" fill priority sizes="100vw" className="object-cover opacity-80" aria-hidden="true" />
                </div>
              )}
              {/* Mobile — use mobile-optimized image if available, else desktop image */}
              {(heroBgMobile || heroBgDesktop) && (
                <div className="absolute inset-0 sm:hidden">
                  <Image src={heroBgMobile || heroBgDesktop!} alt="" fill priority sizes="100vw" className="object-cover object-center opacity-80" aria-hidden="true" />
                </div>
              )}
            </>
          ) : null
        )}

        {/* Decorative glow layers — hidden on mobile to reduce paint cost */}
        {!heroBgVideo && (
          <div
            className="hidden sm:block absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse at 50% 45%, rgba(239,249,35,0.02) 0%, transparent 65%),
                radial-gradient(ellipse at 15% 30%, rgba(46,159,255,0.04) 0%, transparent 50%),
                radial-gradient(ellipse at 85% 70%, rgba(255,45,120,0.04) 0%, transparent 50%)
              `,
            }}
          />
        )}

        {/* 7. Cinematic Vignette — Blue-tinted, darker edges */}
        <div className="hero-vignette-cinematic" />
        {/* Original vignette fallback for video bg */}
        {heroBgVideo && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 20%, rgba(4,6,16,0.8) 100%)',
            }}
          />
        )}

        {/* Grid overlay — subtle esports tech feel — only when no video, hidden on mobile */}
        {!heroBgVideo && (
          <div
            className="hidden sm:block absolute inset-0 pointer-events-none opacity-[0.015]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(239,249,35,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(239,249,35,0.3) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
        )}

        {/* Decorative elements — hidden on mobile for performance */}
        <div className="hidden sm:block" aria-hidden="true">
          <div className="hero-diagonal-line hero-diagonal-line-1" />
          <div className="hero-diagonal-line hero-diagonal-line-2" />
          <div className="hero-diagonal-line hero-diagonal-line-3" />
          <div className="hero-geo-accent hero-geo-diamond-1" />
          <div className="hero-geo-accent hero-geo-diamond-2" />
          <div className="hero-geo-accent hero-geo-hex" />
        </div>




        {/* ═══════════════ HERO CONTENT ═══════════════ */}
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto w-full flex-1 flex flex-col items-center justify-center pt-[8vh] sm:pt-[18vh] pb-20 sm:pb-24">

          {/* ── iOS Frosted Glass Badge ── */}
          <div className="hero-enter-1 mb-5 sm:mb-7">
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-12 sm:w-24 bg-gradient-to-r from-transparent to-idm-gold-warm/50" />
              <div className="ios-badge frost-glass flex items-center gap-2 px-4 py-1.5" style={{ borderColor: 'rgba(239,249,35,0.2)', background: 'rgba(239,249,35,0.06)' }}>
                <Star className="w-3 h-3 text-idm-gold-warm/80" />
                <span className="text-[10px] sm:text-[11px] text-idm-gold-warm/80 font-bold tracking-[0.2em] uppercase">
                  {siteTitle}
                </span>
                <Star className="w-3 h-3 text-idm-gold-warm/80" />
              </div>
              <div className="h-px w-12 sm:w-24 bg-gradient-to-l from-transparent to-idm-gold-warm/50" />
            </div>
          </div>

          {/* ── Main Title — Gold gradient with dramatic letter-spacing entrance ── */}
          <div className="hero-enter-2 relative mb-3 sm:mb-4">
            {/* Subtle breathing gold glow behind title — CSS only, opacity-based for performance */}
            <div
              className="absolute inset-0 -top-8 -bottom-8 pointer-events-none hero-title-breath"
              aria-hidden="true"
            />

            <h1
              className="hero-title-entrance hero-title-glow-enhanced ios-heading relative text-4xl sm:text-6xl md:text-7xl uppercase leading-[1.05] min-h-[3.5rem]"
              style={{
                background: 'linear-gradient(135deg, #FAF0DC 0%, #EFF923 30%, #F9CB25 50%, #F9CB25 70%, #EFF923 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
              }}
            >
              {heroTitle}
            </h1>

            {/* 6. Dramatic underline with shimmer sweep */}
            <div className="hero-underline-dramatic mx-auto mt-3 sm:mt-4" style={{ width: '60%' }} />
          </div>

          {/* ── Subtitle — Clean Apple typography ── */}
          <p className="hero-enter-3 text-base sm:text-xl lg:text-2xl font-light tracking-widest uppercase mb-2 min-h-[1.5rem] leading-normal text-foreground/70 dark:text-[#e8d5a3]/80">
            {heroSubtitle}
          </p>

          {/* ── Tagline — Lighter weight, iOS style ── */}
          <p className="hero-enter-4 text-sm sm:text-base max-w-xl mx-auto mb-6 sm:mb-8 leading-relaxed text-muted-foreground dark:text-muted-foreground/70">
            {heroTagline}
          </p>

          {/* ═══════════════ SEASON CLUB CHAMPION ═══════════════ */}
          {showChampionSkeleton ? (
            /* ─── Skeleton placeholder during season switch / initial load ─── */
            <div className="hero-enter-5 flex items-center justify-center mb-6 sm:mb-10">
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-idm-gold-warm/10 bg-idm-gold-warm/[0.03]">
                <div className="w-10 h-10 rounded-xl bg-idm-gold-warm/10" />
                <div className="space-y-1.5">
                  <div className="w-16 h-2 rounded bg-idm-gold-warm/10" />
                  <div className="w-10 h-1.5 rounded bg-idm-gold-warm/5" />
                </div>
              </div>
            </div>
          ) : championClub ? (
            /* ─── Season Club Champion Card ─── */
            <div className="hero-enter-5 flex items-center justify-center mb-6 sm:mb-10">
              <div className="relative flex items-center gap-2 sm:gap-2.5 p-4 sm:p-5 rounded-2xl border" style={{ background: 'rgba(239,249,35,0.06)', borderColor: 'rgba(239,249,35,0.2)', boxShadow: '0 0 20px rgba(239,249,35,0.08)' }}>
                {/* Club Logo */}
                {championClub?.logo ? (
                  <div className="relative w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl overflow-hidden shrink-0" style={{ boxShadow: '0 0 12px rgba(239,249,35,0.15)' }}>
                    <Image src={championClub.logo} alt={championClub.name} fill sizes="48px" className="object-cover" loading="lazy" />
                  </div>
                ) : (
                  <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(239,249,35,0.1)' }}>
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-idm-gold-warm/60" />
                  </div>
                )}

                {/* Club Name + Season label */}
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-xs md:text-sm font-black tracking-wider uppercase text-idm-gold-warm/80 leading-tight">
                    {championClub?.name || 'Champion'}
                  </span>
                  <span className="text-[7px] sm:text-[8px] md:text-[9px] font-bold tracking-[0.15em] uppercase text-idm-gold-warm/35">
                    Season Club
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {/* ═══════════════ CTA BUTTONS ═══════════════ */}
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-[18px] sm:gap-4 mx-auto mb-6 sm:mb-10 ${championClub ? '' : 'hero-enter-5'}`}>
            {/* Daftar Tarkam — Primary CTA → Registration */}
            <button
              onClick={() => onRegister('male')}
              className="btn-press hero-cta-breath group relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-idm-gold-warm/50 focus-visible:ring-offset-2 focus-visible:ring-offset-deep"
            >
              {/* Pulse glow ring */}
              <div className="absolute -inset-0.5 rounded-2xl" style={{ background: 'rgba(239,249,35,0.06)', boxShadow: '0 0 10px rgba(239,249,35,0.12)' }} />
              {/* Glow background */}
              <div className="absolute -inset-1 rounded-2xl blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-500" style={{ background: 'rgba(239,249,35,0.18)' }} />
              <div className="relative flex items-center justify-center gap-2.5 px-6 sm:px-7 py-2.5 sm:py-3 min-h-[44px] sm:min-h-[48px] rounded-xl sm:rounded-2xl font-bold text-[13px] sm:text-sm tracking-wide uppercase transition-all duration-300 hero-cta-primary-inner"
                style={{
                  background: 'linear-gradient(135deg, #EFF923 0%, #F9CB25 50%, #F9CB25 100%)',
                  color: '#1c1917',
                  boxShadow: '0 4px 14px rgba(239,249,35,0.25), inset 0 1px 0 rgba(255,255,255,0.3)',
                }}
              >
                <PenLine className="w-4 h-4" />
                Daftar Tarkam
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Lihat Bracket — Secondary CTA → Show division picker modal */}
            <button
              onClick={() => setShowBracketPicker(true)}
              className="btn-press hero-cta-breath group relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-idm-gold-warm/50 focus-visible:ring-offset-2 focus-visible:ring-offset-deep"
            >
              {/* Glow on hover */}
              <div className="absolute -inset-1 rounded-2xl blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-500" style={{ background: 'rgba(239,249,35,0.10)' }} />
              <div className="relative flex items-center justify-center gap-2.5 px-6 sm:px-7 py-2.5 sm:py-3 min-h-[44px] sm:min-h-[48px] rounded-xl sm:rounded-2xl font-bold text-[13px] sm:text-sm tracking-wide uppercase border transition-all duration-300 hero-cta-secondary-inner"
                style={{
                  background: 'rgba(239,249,35,0.08)',
                  borderColor: 'rgba(239,249,35,0.3)',
                  color: '#EFF923',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(239,249,35,0.1)',
                }}
              >
                <Eye className="w-4 h-4" />
                Lihat Bracket
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>

          {/* 3. iOS Frosted Glass Stats Counter Bar — compact on mobile */}
          <div className="ios-hero-stats mt-4 sm:mt-8 mx-auto max-w-md px-3 sm:px-6 py-2 sm:py-3">
            <div className="flex items-center justify-center gap-1.5 sm:gap-4">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-idm-gold-warm/50" />
                <span className="text-xs sm:text-sm font-bold text-idm-gold-warm/80 tabular-nums">{totalPlayers}</span>
                <span className="text-[9px] sm:text-[10px] text-idm-gold-warm/40 uppercase tracking-wider font-semibold">Pemain</span>
              </div>
              <div className="hero-stats-dot" />
              <div className="flex items-center gap-1">
                <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-idm-gold-warm/50" />
                <span className="text-xs sm:text-sm font-bold text-idm-gold-warm/80 tabular-nums">{totalClubs}</span>
                <span className="text-[9px] sm:text-[10px] text-idm-gold-warm/40 uppercase tracking-wider font-semibold">Club</span>
              </div>
              <div className="hero-stats-dot" />
              <div className="flex items-center gap-1">
                <Swords className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-idm-gold-warm/50" />
                <span className="text-xs sm:text-sm font-bold text-idm-gold-warm/80 tabular-nums">{totalMatches}</span>
                <span className="text-[9px] sm:text-[10px] text-idm-gold-warm/40 uppercase tracking-wider font-semibold">Match</span>
              </div>
            </div>
          </div>




        </div>

        {/* 4. Premium Scroll Indicator — Mouse icon + pulsing line */}
        <div className="absolute bottom-20 sm:bottom-10 left-1/2 -translate-x-1/2 z-10" style={{ animation: 'reveal-fade-up 0.5s 2s cubic-bezier(0.16,1,0.3,1) both' }} aria-hidden="true">
          <div className="flex flex-col items-center gap-3">
            <span className="text-[10px] text-idm-gold-warm/40 uppercase tracking-[0.2em] font-semibold">Explore</span>
            <div className="hero-scroll-mouse">
              <div className="hero-scroll-mouse-dot" />
            </div>
          </div>
        </div>

        {/* Bottom fade gradient to next section */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to top, var(--background), transparent)',
          }}
        />
      </section>

      {/* ══════ BRACKET DIVISION PICKER MODAL ══════ */}
      {showBracketPicker && typeof document !== 'undefined' && createPortal(
        <div
          className="modal-backdrop modal-backdrop-enter z-[9999] p-3 sm:p-4"
          onClick={() => setShowBracketPicker(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Pilih Divisi Bracket"
        >
          <div
            className="modal-container modal-container-md modal-enter-slide"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-idm-gold-warm/10">
                  <Eye className="w-5 h-5 text-idm-gold-warm" />
                </div>
                <div className="min-w-0">
                  <h2 className="modal-header-title text-gradient-fury">Lihat Bracket</h2>
                  <p className="modal-header-subtitle">Pilih divisi untuk melihat bracket</p>
                </div>
              </div>
              <button
                onClick={() => setShowBracketPicker(false)}
                aria-label="Tutup"
                className="modal-close"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Division Cards */}
            <div className="modal-body">
              <div className="grid grid-cols-2 gap-4">
                {/* Cowo Division Card */}
                <button
                  onClick={() => { setShowBracketPicker(false); onViewBracket('male'); }}
                  className="group relative flex flex-col items-center gap-3 p-5 sm:p-6 rounded-2xl border-2 border-idm-male/20 bg-idm-male/5 hover:border-idm-male/50 hover:bg-idm-male/10 transition-all duration-300 cursor-pointer active:scale-95"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-idm-male/15 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Music className="w-7 h-7 sm:w-8 sm:h-8 text-idm-male" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-base sm:text-lg font-black text-idm-male uppercase tracking-wider">Cowo</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Divisi Laki-laki</p>
                  </div>
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 24px rgba(46,159,255,0.15)' }} />
                </button>

                {/* Cewe Division Card */}
                <button
                  onClick={() => { setShowBracketPicker(false); onViewBracket('female'); }}
                  className="group relative flex flex-col items-center gap-3 p-5 sm:p-6 rounded-2xl border-2 border-idm-female/20 bg-idm-female/5 hover:border-idm-female/50 hover:bg-idm-female/10 transition-all duration-300 cursor-pointer active:scale-95"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-idm-female/15 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-7 h-7 sm:w-8 sm:h-8 text-idm-female" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-base sm:text-lg font-black text-idm-female uppercase tracking-wider">Cewe</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Divisi Perempuan</p>
                  </div>
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 24px rgba(255,45,120,0.15)' }} />
                </button>
              </div>

              <p className="text-[10px] text-muted-foreground/50 text-center mt-1">
                Pilih divisi untuk melihat bracket pertandingan
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
