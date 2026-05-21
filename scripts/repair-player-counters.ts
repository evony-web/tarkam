/**
 * Repair Player counters — sync totalWins/totalLosses/matches with actual match data
 * 
 * Run with: bun run scripts/repair-player-counters.ts
 * 
 * This script recalculates Player.totalWins, totalLosses, and matches
 * from actual Match records, fixing any phantom/wrong counter values.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Starting player counter repair...\n');

  const players = await prisma.player.findMany({
    where: { isActive: true },
    select: {
      id: true,
      gamertag: true,
      totalWins: true,
      totalLosses: true,
      matches: true,
      teamPlayers: {
        select: { teamId: true },
      },
    },
  });

  let fixed = 0;
  let unchanged = 0;

  for (const player of players) {
    const teamIds = player.teamPlayers.map(tp => tp.teamId);
    if (teamIds.length === 0) {
      unchanged++;
      continue;
    }

    // Find all completed matches involving this player's teams
    const matches = await prisma.match.findMany({
      where: {
        status: 'completed',
        winnerId: { not: null },
        OR: [
          { team1Id: { in: teamIds } },
          { team2Id: { in: teamIds } },
        ],
      },
      select: {
        team1Id: true,
        team2Id: true,
        winnerId: true,
      },
    });

    let actualWins = 0;
    let actualLosses = 0;

    for (const match of matches) {
      const isTeam1 = teamIds.includes(match.team1Id ?? '');
      const playerTeamId = isTeam1 ? match.team1Id : match.team2Id;
      
      if (match.winnerId === playerTeamId) {
        actualWins++;
      } else {
        actualLosses++;
      }
    }

    const actualMatches = actualWins + actualLosses;

    if (
      player.totalWins !== actualWins ||
      player.totalLosses !== actualLosses ||
      player.matches !== actualMatches
    ) {
      console.log(`📝 ${player.gamertag}: ` +
        `W ${player.totalWins}→${actualWins}, ` +
        `L ${player.totalLosses}→${actualLosses}, ` +
        `M ${player.matches}→${actualMatches}`
      );

      await prisma.player.update({
        where: { id: player.id },
        data: {
          totalWins: actualWins,
          totalLosses: actualLosses,
          matches: actualMatches,
        },
      });

      fixed++;
    } else {
      unchanged++;
    }
  }

  console.log(`\n✅ Repair complete!`);
  console.log(`   Fixed: ${fixed} players`);
  console.log(`   Unchanged: ${unchanged} players`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Repair failed:', e);
  prisma.$disconnect();
  process.exit(1);
});
