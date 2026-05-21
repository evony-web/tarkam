// ============================================
// IDM LEAGUE - POINTS & RANKING SYSTEM
// ============================================

import { db } from '@/lib/db';

// ===== TIER SYSTEM =====
// Tier is managed manually by admin — no automatic upgrade based on points.
// Admin assigns tier when approving player participation in tournaments.
// The tier can also be overridden per-tournament via Participation.tierOverride.

export const TIER_ORDER = { S: 3, A: 2, B: 1 } as const;

export type Tier = 'S' | 'A' | 'B';

/**
 * Award points to a player with full audit trail via PlayerPoint record.
 * Also updates the player's total (lifetime) points.
 */
export async function awardPoints(params: {
  playerId: string;
  amount: number;
  reason: string;
  description: string;
  tournamentId?: string;
  matchId?: string;
  seasonId?: string;
}) {
  const { playerId, amount, reason, description, tournamentId, matchId, seasonId } = params;

  // Create audit record
  await db.playerPoint.create({
    data: {
      playerId,
      amount,
      reason,
      description,
      tournamentId: tournamentId || null,
      matchId: matchId || null,
      seasonId: seasonId || null,
    },
  });

  // Update player total points (lifetime) — use increment to avoid race conditions
  await db.player.update({
    where: { id: playerId },
    data: { points: { increment: amount } },
  });
}

/**
 * Recalculate all player points from scratch using PlayerPoint audit trail.
 * This is a safety net for data integrity.
 * Also fixes totalWins, totalLosses, matches, and streak values.
 */
export async function recalculateAllPoints(division?: string) {
  const where: Record<string, string> = {};
  if (division) where.division = division;

  const players = await db.player.findMany({ where });

  const results: {
    playerId: string;
    gamertag: string;
    oldPoints: number;
    newPoints: number;
    diff: number;
  }[] = [];

  for (const player of players) {
    // Step 1: Recalculate lifetime points from audit trail
    const pointRecords = await db.playerPoint.findMany({
      where: { playerId: player.id },
    });

    const calculatedPoints = pointRecords.reduce((sum, r) => sum + r.amount, 0);
    const diff = calculatedPoints - player.points;

    // Step 2: Recalculate totalWins from match_win records
    const matchWinRecords = pointRecords.filter(r => r.reason === 'match_win');
    const calculatedWins = matchWinRecords.length;

    // Step 3: Recalculate totalLosses from matches where player's team lost
    // Count matches the player participated in (from participations) minus wins
    const playerParticipations = await db.participation.findMany({
      where: { playerId: player.id, status: { in: ['approved', 'assigned'] } },
      select: { tournamentId: true },
    });
    const tournamentIds = playerParticipations.map(p => p.tournamentId);

    // Get all completed matches in those tournaments where the player was on a team
    const teamPlayers = await db.teamPlayer.findMany({
      where: { playerId: player.id },
      select: { teamId: true },
    });
    const teamIds = teamPlayers.map(tp => tp.teamId);

    const totalMatchesPlayed = await db.match.count({
      where: {
        tournamentId: { in: tournamentIds },
        status: 'completed',
        OR: [
          { team1Id: { in: teamIds } },
          { team2Id: { in: teamIds } },
        ],
      },
    });

    const calculatedLosses = Math.max(0, totalMatchesPlayed - calculatedWins);

    // Step 4: Build update data
    const updateData: Record<string, any> = {};
    if (diff !== 0) updateData.points = calculatedPoints;
    if (player.totalWins !== calculatedWins) updateData.totalWins = calculatedWins;
    if (player.totalLosses !== calculatedLosses) updateData.totalLosses = calculatedLosses;
    if (player.matches !== totalMatchesPlayed) updateData.matches = totalMatchesPlayed;

    if (Object.keys(updateData).length > 0) {
      await db.player.update({
        where: { id: player.id },
        data: updateData,
      });
    }

    results.push({
      playerId: player.id,
      gamertag: player.gamertag,
      oldPoints: player.points,
      newPoints: calculatedPoints,
      diff,
    });
  }

  return results;
}
