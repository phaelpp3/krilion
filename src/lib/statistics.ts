/** Anonymous progress stays on this device; no account or network is involved. */
export interface StatisticsStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface StatisticsOptions {
  storage?: StatisticsStorage | null
  now?: Date
}

export interface Statistics {
  dailyGames: number
  totalAnswers: number
  correctAnswers: number
  bestDailyDepth: number
  infiniteDepth: number
  currentStreak: number
}

export interface RoundResult {
  points: number
  correct: boolean
}

interface StoredStatistics extends Omit<Statistics, 'currentStreak'> {
  version: 1
  dailyDates: string[]
  infiniteRoundIds: string[]
}

export const STATISTICS_STORAGE_KEY = 'krilion:statistics:v1'
const MAX_DAILY_DATES = 365
const MAX_INFINITE_IDS = 200
const MAX_RAW_LENGTH = 100_000

function emptyStatistics(): StoredStatistics {
  return {
    version: 1,
    dailyGames: 0,
    totalAnswers: 0,
    correctAnswers: 0,
    bestDailyDepth: 0,
    infiniteDepth: 0,
    dailyDates: [],
    infiniteRoundIds: [],
  }
}

function resolveStorage(options: StatisticsOptions): StatisticsStorage | null {
  if (options.storage !== undefined) return options.storage
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function isRoundId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 200
}

function isStoredStatistics(value: unknown): value is StoredStatistics {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const data = value as Record<string, unknown>
  if (data.version !== 1) return false
  for (const key of ['dailyGames', 'totalAnswers', 'correctAnswers', 'bestDailyDepth', 'infiniteDepth']) {
    if (!isCount(data[key])) return false
  }
  if ((data.correctAnswers as number) > (data.totalAnswers as number)) return false
  if (!Array.isArray(data.dailyDates) || data.dailyDates.length > MAX_DAILY_DATES || !data.dailyDates.every(isDateKey)) return false
  if (new Set(data.dailyDates).size !== data.dailyDates.length || data.dailyDates.length > (data.dailyGames as number)) return false
  if (!Array.isArray(data.infiniteRoundIds) || data.infiniteRoundIds.length > MAX_INFINITE_IDS || !data.infiniteRoundIds.every(isRoundId)) return false
  return new Set(data.infiniteRoundIds).size === data.infiniteRoundIds.length
}

function readStatistics(storage: StatisticsStorage | null): StoredStatistics {
  try {
    const raw = storage?.getItem(STATISTICS_STORAGE_KEY)
    if (!raw || raw.length > MAX_RAW_LENGTH) return emptyStatistics()
    const data: unknown = JSON.parse(raw)
    return isStoredStatistics(data) ? data : emptyStatistics()
  } catch {
    return emptyStatistics()
  }
}

function saveStatistics(storage: StatisticsStorage | null, data: StoredStatistics): void {
  try {
    storage?.setItem(STATISTICS_STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage may be disabled or full. The game remains playable.
  }
}

function addCount(left: number, right: number): number {
  return Math.min(Number.MAX_SAFE_INTEGER, left + right)
}

function previousDate(date: string): string {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() - 1)
  return value.toISOString().slice(0, 10)
}

function streak(dates: string[], now: Date): number {
  if (Number.isNaN(now.getTime())) return 0
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value
  let day = `${part('year')}-${part('month')}-${part('day')}`
  const completed = new Set(dates)
  if (!completed.has(day)) day = previousDate(day)
  let count = 0
  while (completed.has(day)) {
    count += 1
    day = previousDate(day)
  }
  return count
}

export function getStatistics(options: StatisticsOptions = {}): Statistics {
  const data = readStatistics(resolveStorage(options))
  return {
    dailyGames: data.dailyGames,
    totalAnswers: data.totalAnswers,
    correctAnswers: data.correctAnswers,
    bestDailyDepth: data.bestDailyDepth,
    infiniteDepth: data.infiniteDepth,
    currentStreak: streak(data.dailyDates, options.now ?? new Date()),
  }
}

/** Complete one daily challenge. Reloading it does not count a second game. */
export function recordDaily(date: string, results: RoundResult[], options: StatisticsOptions = {}): void {
  if (!isDateKey(date) || !Array.isArray(results) || results.length === 0 || results.length > 1_000) return
  if (!results.every((result) => result && isCount(result.points) && typeof result.correct === 'boolean')) return
  const storage = resolveStorage(options)
  const data = readStatistics(storage)
  if (data.dailyDates.includes(date)) return
  const depth = results.reduce((total, result) => addCount(total, result.points), 0)
  data.dailyGames = addCount(data.dailyGames, 1)
  data.totalAnswers = addCount(data.totalAnswers, results.length)
  data.correctAnswers = addCount(data.correctAnswers, results.filter((result) => result.correct).length)
  data.bestDailyDepth = Math.max(data.bestDailyDepth, depth)
  data.dailyDates = [...data.dailyDates, date].sort().slice(-MAX_DAILY_DATES)
  saveStatistics(storage, data)
}

/** Keep recent round IDs to prevent repeated effects from double-counting. */
export function recordInfiniteRound(roundId: string, points: number, correct: boolean, options: StatisticsOptions = {}): void {
  if (!isRoundId(roundId) || !isCount(points) || typeof correct !== 'boolean') return
  const storage = resolveStorage(options)
  const data = readStatistics(storage)
  if (data.infiniteRoundIds.includes(roundId)) return
  data.totalAnswers = addCount(data.totalAnswers, 1)
  data.correctAnswers = addCount(data.correctAnswers, correct ? 1 : 0)
  data.infiniteDepth = addCount(data.infiniteDepth, points)
  data.infiniteRoundIds = [...data.infiniteRoundIds, roundId].slice(-MAX_INFINITE_IDS)
  saveStatistics(storage, data)
}
