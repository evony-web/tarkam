'use client';

import { useAppStore } from '@/lib/store';
import {
  Trophy, BookOpen, Scale,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { SectionHeader } from './shared';

/* ═══════════════════════════════════════════════════════════════
   PERATURAN SECTION — Landing Page
   Tournament rules and scoring format
   Reads from CMS settings (prefix: peraturan_)
   Moved from LeagueView (admin-only) to Beranda for all users
   ═══════════════════════════════════════════════════════════════ */

/* ─── Parse JSON items from CMS setting string ─── */
function parseItems(value: string | undefined, fallback: { label: string; value: string; highlight: boolean }[]): { label: string; value: string; highlight: boolean }[] {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
    return fallback;
  } catch {
    return fallback;
  }
}

/* ─── Default fallback data — sesuai logika backend score/route.ts ─── */
const DEFAULTS = {
  peraturan_subtitle: 'Panduan lengkap sistem poin dan peraturan pertandingan Tarkam IDM. Pastikan Anda memahami semua aturan sebelum bertanding.',
  peraturan_poin_title: 'Sistem Poin Tarkam',
  peraturan_poin_items: JSON.stringify([
    { label: 'Menang Pertandingan', value: '+2 Poin', highlight: true },
    { label: 'Partisipasi Turnamen', value: '+1 Poin (sekali/tournament)', highlight: true },
    { label: 'Seri / Draw (Grup)', value: '+1 Poin', highlight: false },
    { label: 'Kalah Pertandingan', value: '0 Poin', highlight: false },
    { label: 'MVP Turnamen', value: 'Sesuai Hadiah', highlight: true },
    { label: 'Juara 1/2/3', value: 'Sesuai Hadiah', highlight: true },
  ]),
  peraturan_match_title: 'Peraturan Pertandingan',
  peraturan_match_items: JSON.stringify([
    { label: 'Peserta wajib hadir', value: 'Tepat Waktu', highlight: true },
    { label: 'Penilaian', value: 'Oleh Juri', highlight: false },
    { label: 'Keputusan Juri', value: 'Final & Binding', highlight: true },
    { label: 'MVP Dipilih', value: 'Oleh Organizer', highlight: false },
    { label: 'Hasil Diumumkan', value: 'Real-time', highlight: true },
  ]),
};

/* ─── Rule Card ─── */
function RuleCard({ icon: Icon, title, items }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: { label: string; value: string; highlight?: boolean }[];
}) {
  return (
    <Card className="overflow-hidden border border-idm-gold-warm/10 bg-idm-gold-warm/[0.03] hover:border-idm-gold-warm/20 transition-colors">
      <div className="h-1 bg-gradient-to-r from-idm-gold-warm/60 via-idm-gold-warm to-idm-gold-warm/60" />
      <CardContent className="p-0 relative z-10">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/50">
          <div className="w-6 h-6 rounded bg-idm-gold-warm/15 flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5 text-idm-gold-warm" />
          </div>
          <h3 className="text-sm font-semibold uppercase tracking-wider">{title}</h3>
        </div>
        <div className="p-5 space-y-2.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 px-4 rounded-lg bg-muted/30">
              <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
              <span className={`text-sm font-bold ${item.highlight ? 'text-idm-gold-warm' : 'text-foreground'}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface PeraturanSectionProps {
  cmsSettings?: Record<string, string>;
}

export function PeraturanSection({ cmsSettings }: PeraturanSectionProps) {
  const { division } = useAppStore();

  /* ── Fetch CMS settings if not provided ── */
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['cms-settings'],
    queryFn: async () => {
      const res = await fetch('/api/cms/settings');
      return res.json() as Promise<{ settings: { id: string; key: string; value: string; type: string }[]; map: Record<string, string> }>;
    },
    staleTime: 60_000,
    enabled: !cmsSettings || Object.keys(cmsSettings).length === 0,
  });

  // ★ CMS props come with full keys (e.g. "peraturan_subtitle").
  // API response map also uses full keys. Don't strip the prefix —
  // access with full key consistently.
  const settingsMap = cmsSettings && Object.keys(cmsSettings).length > 0
    ? cmsSettings
    : settingsData?.map || {};

  /* ── Parsed items from CMS ── */
  const subtitle = settingsMap.peraturan_subtitle || DEFAULTS.peraturan_subtitle;
  const poinTitle = settingsMap.peraturan_poin_title || DEFAULTS.peraturan_poin_title;
  const poinItems = parseItems(settingsMap.peraturan_poin_items, parseItems(DEFAULTS.peraturan_poin_items, []));
  const matchTitle = settingsMap.peraturan_match_title || DEFAULTS.peraturan_match_title;
  const matchItems = parseItems(settingsMap.peraturan_match_items, parseItems(DEFAULTS.peraturan_match_items, []));

  const divisionLabel = division === 'male' ? 'Cowo' : division === 'female' ? 'Cewe' : 'Semua';

  if (isLoading) {
    return (
      <section id="peraturan" className="landing-section relative py-8 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-idm-gold-warm" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="peraturan" className="landing-section relative py-8 sm:py-12 px-4 overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-48 bg-idm-gold-warm/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <SectionHeader
          icon={BookOpen}
          label="Peraturan"
          title="Aturan & Sistem Poin"
          subtitle={subtitle}
        />

        {/* Division badge */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-idm-gold-warm/15 bg-idm-gold-warm/[0.04]">
            <Scale className="w-3 h-3 text-idm-gold-warm" />
            <span className="text-[10px] font-semibold text-idm-gold-warm/80 uppercase tracking-wider">Divisi {divisionLabel}</span>
          </div>
        </div>

        {/* Rules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          {/* Scoring Format */}
          <div className="reveal reveal-fade-up reveal-delay-1">
            <RuleCard
              icon={Trophy}
              title={poinTitle}
              items={poinItems}
            />
          </div>

          {/* Match Rules */}
          <div className="reveal reveal-fade-up reveal-delay-2">
            <RuleCard
              icon={Scale}
              title={matchTitle}
              items={matchItems}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
