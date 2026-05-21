/**
 * Tournament Utility Functions
 * Helper functions for bracket generation and tournament management
 */

import { db } from '@/lib/db';

/**
 * Recalculate streak & maxStreak for affected players from remaining match data.
 * Used after rolling back tournament stages or undoing match scores.
 * Instead of just setting streak=0, this properly recalculates from remaining
 * PlayerPoint match_win/match_loss records in chronological order.
 */
export async function recalculateStreaks(playerIds: string[], seasonId: string) {
  try {
    for (const playerId of playerIds) {
      // Get all remaining completed matches for this player in the same season
      const remainingWins = await db.playerPoint.aggregate({
        _sum: { amount: true },
        _count: { reason: true },
        where: {
          playerId,
          seasonId,
          reason: 'match_win',
        },
      });

      const remainingLosses = await db.playerPoint.count({
        where: {
          playerId,
          seasonId,
          reason: 'match_loss',
        },
      });

      const wins = remainingWins._sum.amount || 0;
      const losses = remainingLosses;

      // If no remaining matches, reset streak completely
      if (wins === 0 && losses === 0) {
        await db.player.update({
          where: { id: playerId },
          data: { streak: 0, maxStreak: 0 },
        });
        continue;
      }

      // Recalculate streak from the chronological order of remaining matches
      const matchPoints = await db.playerPoint.findMany({
        where: {
          playerId,
          seasonId,
          reason: { in: ['match_win', 'match_loss'] },
        },
        orderBy: { createdAt: 'asc' },
        select: { reason: true },
      });

      let currentStreak = 0;
      let maxStreak = 0;

      for (const mp of matchPoints) {
        if (mp.reason === 'match_win') {
          currentStreak += 1;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          // match_loss resets streak
          currentStreak = 0;
        }
      }

      await db.player.update({
        where: { id: playerId },
        data: { streak: currentStreak, maxStreak },
      });
    }
  } catch (error) {
    console.error('Streak recalculation error (non-critical):', error);
    // Non-critical — streaks can be repaired later via repair script
  }
}

/**
 * Recalculate PlayerSeasonStats for affected players.
 * Used after rolling back tournament stages or undoing match scores.
 * Ensures the season stats aggregation table stays consistent with actual data.
 */
export async function recalculateSeasonStats(playerIds: string[], seasonId: string, division: string) {
  try {
    for (const playerId of playerIds) {
      // Count season wins from PlayerPoint match_win records
      const seasonWinsResult = await db.playerPoint.aggregate({
        _sum: { amount: true },
        where: {
          playerId,
          seasonId,
          reason: 'match_win',
        },
      });

      // Count season losses from PlayerPoint match_loss records
      const seasonLosses = await db.playerPoint.count({
        where: {
          playerId,
          seasonId,
          reason: 'match_loss',
        },
      });

      const seasonWins = seasonWinsResult._sum.amount || 0;
      const seasonMatches = seasonWins + seasonLosses;

      // Calculate per-season points from PlayerPoint records (not lifetime player.points)
      const seasonPointsResult = await db.playerPoint.aggregate({
        _sum: { amount: true },
        where: {
          playerId,
          seasonId,
        },
      });
      const seasonPoints = seasonPointsResult._sum.amount || 0;

      // Get current player data for other fields
      const player = await db.player.findUnique({
        where: { id: playerId },
        select: { streak: true, maxStreak: true, tier: true },
      });

      if (!player) continue;

      // Count season MVPs from participation records
      const seasonMvpCount = await db.participation.count({
        where: {
          playerId,
          isMvp: true,
          tournament: { seasonId },
        },
      });

      // Update or create PlayerSeasonStats
      await db.playerSeasonStats.upsert({
        where: {
          playerId_seasonId: { playerId, seasonId },
        },
        create: {
          playerId,
          seasonId,
          division,
          points: seasonPoints,
          totalWins: seasonWins,
          totalMvp: seasonMvpCount,
          streak: player.streak,
          maxStreak: player.maxStreak,
          matches: seasonMatches,
          tier: player.tier,
        },
        update: {
          points: seasonPoints,
          totalWins: seasonWins,
          totalMvp: seasonMvpCount,
          streak: player.streak,
          maxStreak: player.maxStreak,
          matches: seasonMatches,
          tier: player.tier,
          division,
        },
      });
    }
  } catch (error) {
    console.error('Season stats recalculation error (non-critical):', error);
  }
}

/**
 * Calculate total rounds needed for a single elimination bracket
 */
export function calculateTotalRounds(teamCount: number): number {
  if (teamCount <= 1) return 0
  return Math.ceil(Math.log2(teamCount))
}

/**
 * Check if a number is a power of two
 */
export function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0
}

/**
 * Get the next power of two greater than or equal to n
 */
export function getNextPowerOfTwo(n: number): number {
  if (n <= 1) return 1
  if (isPowerOfTwo(n)) return n
  return Math.pow(2, Math.ceil(Math.log2(n)))
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Calculate the number of byes needed for a bracket
 */
export function calculateByes(teamCount: number): number {
  const nextPower = getNextPowerOfTwo(teamCount)
  return nextPower - teamCount
}

/**
 * Get the number of matches in a single elimination bracket
 */
export function getSingleEliminationMatchCount(teamCount: number): number {
  return teamCount - 1
}

/**
 * Get the number of matches in a double elimination bracket
 */
export function getDoubleEliminationMatchCount(teamCount: number): number {
  // Upper bracket: n-1 matches
  // Lower bracket: 2*(n-1) matches
  // Grand final: 1 or 2 matches (we assume 1 for now)
  return (teamCount - 1) + 2 * (teamCount - 1) + 1
}

/**
 * Calculate round robin match count
 */
export function getRoundRobinMatchCount(teamCount: number): number {
  return (teamCount * (teamCount - 1)) / 2
}

/**
 * Get teams per group for group stage
 */
export function getTeamsPerGroup(teamCount: number, groupCount: number): number[] {
  const base = Math.floor(teamCount / groupCount)
  const remainder = teamCount % groupCount
  
  const groups: number[] = []
  for (let i = 0; i < groupCount; i++) {
    groups.push(base + (i < remainder ? 1 : 0))
  }
  return groups
}

/**
 * Generate a unique slug from name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Math.random().toString(36).substring(2, 8)
}

/**
 * Get match label for display (e.g., "Round 1 - Match 1")
 */
export function getMatchLabel(round: number, matchNumber: number, totalRounds: number): string {
  if (round === totalRounds) {
    return 'Final'
  } else if (round === totalRounds - 1) {
    return `Semi-Final ${matchNumber}`
  } else if (round === totalRounds - 2) {
    return `Quarter-Final ${matchNumber}`
  }
  return `Round ${round} - Match ${matchNumber}`
}

/**
 * Calculate Swiss round pairings
 */
export function getSwissPairings(
  teams: { id: string; wins: number; losses: number; points: number }[],
  previousPairings: Set<string>
): [string, string][] {
  // Sort teams by points (descending)
  const sortedTeams = [...teams].sort((a, b) => b.points - a.points)
  
  const pairings: [string, string][] = []
  const used = new Set<string>()
  
  for (const team of sortedTeams) {
    if (used.has(team.id)) continue
    
    // Find the best opponent with same/similar points that hasn't played
    for (const opponent of sortedTeams) {
      if (opponent.id === team.id) continue
      if (used.has(opponent.id)) continue
      
      const pairingKey = [team.id, opponent.id].sort().join('-')
      if (previousPairings.has(pairingKey)) continue
      
      pairings.push([team.id, opponent.id])
      used.add(team.id)
      used.add(opponent.id)
      break
    }
  }
  
  return pairings
}

/**
 * Calculate standings for a group or tournament
 */
export interface StandingEntry {
  teamId: string
  played: number
  won: number
  drawn: number
  lost: number
  points: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
}

export function sortStandings(entries: StandingEntry[]): StandingEntry[] {
  return [...entries].sort((a, b) => {
    // Sort by points, then goal difference, then goals for
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
    return b.goalsFor - a.goalsFor
  })
}
