import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/api-auth';

/**
 * POST /api/admin/backfill-match-losses
 *
 * One-time migration: creates match_loss PlayerPoint records for all
 * existing completed matches where a player's team lost.
 *
 * This is needed because historically, losses were only tracked via
 * the Player.totalLosses counter (lifetime), with no per-season audit trail.
 * The new system creates match_loss PlayerPoint records (amount: 0) for
 * each loss, enabling per-season loss tracking.
 *
 * Idempotent: skips matches that already have match_loss records.
 * Admin-only: requires admin session cookie.
 */
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized — Admin login required' }, { status: 401 });
  }

  try {
    // Find all completed matches with a winner (meaning there's also a loser)
    const completedMatches = await db.match.findMany({
      where: {
        status: 'completed',
        winnerId: { not: null },
        team1Id: { not: null },
        team2Id: { not: null },
      },
      include: {
        tournament: { select: { id: true, seasonId: true } },
        team1: {
          include: {
            teamPlayers: { select: { playerId: true } },
          },
        },
        team2: {
          include: {
            teamPlayers: { select: { playerId: true } },
          },
        },
      },
    });

    // Get existing match_loss records to avoid duplicates
    const existingLossRecords = await db.playerPoint.findMany({
      where: { reason: 'match_loss' },
      select: { matchId: true, playerId: true },
    });
    const existingKeySet = new Set(
      existingLossRecords.map(r => `${r.matchId}:${r.playerId}`)
    );

    let created = 0;
    let skipped = 0;

    for (const match of completedMatches) {
      if (!match.tournament?.seasonId) {
        skipped++;
        continue;
      }

      // Determine losing team
      const losingTeam =
        match.winnerId === match.team1Id ? match.team2 : match.team1;

      if (!losingTeam) {
        skipped++;
        continue;
      }

      // Get match label for description
      const matchLabel = match.groupLabel || `R${match.round}`;

      for (const tp of losingTeam.teamPlayers) {
        const key = `${match.id}:${tp.playerId}`;
        if (existingKeySet.has(key)) {
          skipped++;
          continue;
        }

        await db.playerPoint.create({
          data: {
            playerId: tp.playerId,
            amount: 0,
            reason: 'match_loss',
            description: `Kalah match ${matchLabel} (backfill)`,
            tournamentId: match.tournamentId,
            matchId: match.id,
            seasonId: match.tournament.seasonId,
          },
        });

        existingKeySet.add(key); // Prevent re-creation in this run
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Backfill complete: ${created} match_loss records created, ${skipped} skipped`,
      created,
      skipped,
      totalCompletedMatches: completedMatches.length,
    });
  } catch (error) {
    console.error('[Admin Backfill] Error:', error);
    return NextResponse.json(
      { error: 'Backfill failed', details: String(error) },
      { status: 500 }
    );
  }
}
