import { describe, expect, it } from 'vitest'
import { getStatistics, recordDaily, recordInfiniteRound, STATISTICS_STORAGE_KEY } from './statistics'
import type { StatisticsStorage } from './statistics'

function memoryStorage(): StatisticsStorage {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
  }
}

describe('statistics', () => {
  it('counts daily and infinite results once and keeps their depth separate', () => {
    const storage = memoryStorage()
    const options = { storage, now: new Date('2026-10-26T15:00:00Z') }
    const results = [{ points: 150, correct: true }, { points: 0, correct: false }]
    recordDaily('2026-10-26', results, options)
    recordDaily('2026-10-26', results, options)
    recordInfiniteRound('one', 50, true, options)
    recordInfiniteRound('one', 50, true, options)
    recordInfiniteRound('two', 0, false, options)
    expect(getStatistics(options)).toEqual({ dailyGames: 1, totalAnswers: 4, correctAnswers: 2, bestDailyDepth: 150, infiniteDepth: 50, currentStreak: 1 })
  })

  it('retains the highest daily depth', () => {
    const options = { storage: memoryStorage() }
    recordDaily('2026-10-24', [{ points: 200, correct: true }], options)
    recordDaily('2026-10-25', [{ points: 50, correct: true }], options)
    expect(getStatistics(options).bestDailyDepth).toBe(200)
    expect(getStatistics(options).dailyGames).toBe(2)
  })

  it('uses the São Paulo date rather than the UTC day for streaks', () => {
    const options = { storage: memoryStorage() }
    for (const day of ['2026-10-23', '2026-10-24', '2026-10-25']) {
      recordDaily(day, [{ points: 1, correct: true }], options)
    }
    expect(getStatistics({ ...options, now: new Date('2026-10-27T01:00:00Z') }).currentStreak).toBe(3)
    expect(getStatistics({ ...options, now: new Date('2026-10-27T04:00:00Z') }).currentStreak).toBe(0)
  })

  it('stops a streak at a missing day and includes today', () => {
    const options = { storage: memoryStorage(), now: new Date('2026-10-26T15:00:00Z') }
    for (const day of ['2026-10-22', '2026-10-24', '2026-10-25', '2026-10-26']) {
      recordDaily(day, [{ points: 1, correct: true }], options)
    }
    expect(getStatistics(options).currentStreak).toBe(3)
  })

  it('bounds duplicate histories while keeping aggregate totals', () => {
    const storage = memoryStorage()
    const options = { storage }
    for (let index = 0; index < 210; index += 1) recordInfiniteRound(`round-${index}`, 10, true, options)
    for (let index = 0; index < 370; index += 1) {
      const date = new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10)
      recordDaily(date, [{ points: 1, correct: true }], options)
    }
    const stored = JSON.parse(storage.getItem(STATISTICS_STORAGE_KEY)!)
    expect(stored.dailyDates).toHaveLength(365)
    expect(stored.infiniteRoundIds).toHaveLength(200)
    expect(getStatistics(options)).toMatchObject({ dailyGames: 370, totalAnswers: 580, correctAnswers: 580, infiniteDepth: 2100 })
    recordInfiniteRound('round-209', 10, true, options)
    expect(getStatistics(options).totalAnswers).toBe(580)
  })

  it.each(['{broken', 'null', '[]', '{"version":99}', '{"version":1,"dailyGames":-1}', 'x'.repeat(100_001)])('ignores invalid stored data', (raw) => {
    const storage = memoryStorage()
    storage.setItem(STATISTICS_STORAGE_KEY, raw)
    expect(getStatistics({ storage }).totalAnswers).toBe(0)
    recordInfiniteRound('recovery', 10, true, { storage })
    expect(getStatistics({ storage }).totalAnswers).toBe(1)
  })

  it('rejects inconsistent stored totals and invalid dates', () => {
    const storage = memoryStorage()
    recordDaily('2026-10-26', [{ points: 10, correct: true }], { storage })
    const valid = JSON.parse(storage.getItem(STATISTICS_STORAGE_KEY)!)
    storage.setItem(STATISTICS_STORAGE_KEY, JSON.stringify({ ...valid, correctAnswers: 100 }))
    expect(getStatistics({ storage }).totalAnswers).toBe(0)
    storage.setItem(STATISTICS_STORAGE_KEY, JSON.stringify({ ...valid, dailyDates: ['2026-02-30'] }))
    expect(getStatistics({ storage }).dailyGames).toBe(0)
  })

  it('rejects malformed incoming rounds without corrupting progress', () => {
    const options = { storage: memoryStorage() }
    recordDaily('2026-02-30', [{ points: 1, correct: true }], options)
    recordDaily('2026-10-26', [], options)
    recordDaily('2026-10-26', [{ points: -1, correct: true }], options)
    recordInfiniteRound('', 10, true, options)
    recordInfiniteRound('nan', NaN, true, options)
    recordInfiniteRound('infinity', Infinity, true, options)
    expect(getStatistics(options).totalAnswers).toBe(0)
  })

  it('remains safe with unavailable, full or blocked storage and server rendering', () => {
    const storage: StatisticsStorage = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('full') } }
    expect(() => recordDaily('2026-10-26', [{ points: 1, correct: true }], { storage })).not.toThrow()
    expect(() => recordInfiniteRound('one', 1, true, { storage })).not.toThrow()
    expect(getStatistics({ storage }).totalAnswers).toBe(0)
    expect(getStatistics({ storage: null }).totalAnswers).toBe(0)
    expect(getStatistics().totalAnswers).toBe(0)
  })
})
