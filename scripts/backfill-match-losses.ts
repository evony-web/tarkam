/**
 * Backfill match_loss PlayerPoint records
 * 
 * Run with: bun run scripts/backfill-match-losses.ts
 * 
 * This creates match_loss PlayerPoint records (amount: 0) for all existing
 * completed matches where a player's team lost. This enables per-season
 * loss tracking that wasn't available before.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting backfill of match_loss PlayerPoint records...\n');

  // Find all completed matches with a winner
  const completedMatches = await prisma.match.findMany({
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

  console.log(`Found ${completedMatches.length} completed matches with winners`);

  // Get existing match_loss records to avoid duplicates
  const existingLossRecords = await prisma.playerPoint.findMany({
    where: { reason: 'match_loss' },
    select: { matchId: true, playerId: true },
  });
  const existingKeySet = new Set(
    existingLossRecords.map(r => `${r.matchId}:${r.playerId}`)
  );

  console.log(`Found ${existingLossRecords.length} existing match_loss records\n`);

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

    const matchLabel = match.groupLabel || `R${match.round}`;

    for (const tp of losingTeam.teamPlayers) {
      const key = `${match.id}:${tp.playerId}`;
      if (existingKeySet.has(key)) {
        skipped++;
        continue;
      }

      await prisma.playerPoint.create({
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

      existingKeySet.add(key);
      created++;
    }
  }

  console.log(`\n✅ Backfill complete!`);
  console.log(`   Created: ${created} match_loss records`);
  console.log(`   Skipped: ${skipped} (already exist or no season)`);
  console.log(`   Total completed matches: ${completedMatches.length}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Backfill failed:', e);
  prisma.$disconnect();
  process.exit(1);
});
