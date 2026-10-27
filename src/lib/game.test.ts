import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '../data/questions';
import type { Question } from '../data/questions';
import {
  DAILY_ROUNDS, DAILY_STORAGE_PREFIX, ROUND_SECONDS, evaluateAnswer, getDailyQuestions,
  getInfiniteQuestion, loadDailyProgress, normalizeAnswer, saveDailyProgress,
  hasPreviousCatalogProgress,
} from './game';
import type { DailyProgress, RoundResult } from './game';
import type { PreferenceStorage } from './preferences';

const fixture: Question = {
  id: 'fixture', category: 'geografia', prompt: 'Um estado brasileiro', hint: '',
  answers: [
    { label: 'São Paulo', aliases: ['SP'], rarity: 0 },
    { label: 'Amapá', aliases: ['AP'], rarity: 1 },
    { label: 'Rondônia', rarity: 0.5 },
  ],
};

function memoryStorage(): PreferenceStorage {
  const entries = new Map<string, string>();
  return { getItem: (key) => entries.get(key) ?? null, setItem: (key, value) => { entries.set(key, value); } };
}

function resultFor(question: Question): RoundResult {
  const input = question.answers[0].label;
  const evaluation = evaluateAnswer(question, input);
  return { questionId: question.id, input, answerLabel: evaluation.answerLabel,
    correct: evaluation.correct, rarity: evaluation.rarity, points: evaluation.points, timedOut: false };
}

describe('answers and depth', () => {
  it('accepts Portuguese accents, case, punctuation, spacing and explicit aliases', () => {
    expect(normalizeAnswer(' SÃO— PAULO! ')).toBe('saopaulo');
    for (const input of ['São Paulo', 'sao paulo', ' SÃO-PAULO ', 'sp']) {
      expect(evaluateAnswer(fixture, input)).toMatchObject({ correct: true, answerLabel: 'São Paulo', points: 100 });
    }
  });

  it('gives editorial rarities a depth between 100 and 1000 meters', () => {
    expect(evaluateAnswer(fixture, 'ap')).toMatchObject({ points: 1000, rarity: 1, label: 'Muito rara' });
    expect(evaluateAnswer(fixture, 'Rondonia')).toMatchObject({ points: 550, label: 'Rara' });
    expect(DAILY_ROUNDS * 1000).toBe(7000);
    expect(ROUND_SECONDS).toBe(25);
  });

  it('does not award points for partial, approximate or missing answers', () => {
    for (const input of ['São', 'Amap', 'Atlantis', '---', '']) {
      expect(evaluateAnswer(fixture, input)).toMatchObject({ correct: false, points: 0, answerLabel: null });
    }
  });
});

describe('question selection', () => {
  it('has unambiguous answers and valid editorial rarity values throughout the catalog', () => {
    expect(new Set(QUESTIONS.map((question) => question.id)).size).toBe(QUESTIONS.length);
    for (const question of QUESTIONS) {
      expect(question.answers.length).toBeGreaterThan(0);
      const labels = new Map<string, string>();
      for (const answer of question.answers) {
        expect(answer.rarity).toBeGreaterThanOrEqual(0);
        expect(answer.rarity).toBeLessThanOrEqual(1);
        for (const variant of [answer.label, ...(answer.aliases ?? [])]) {
          const normalized = normalizeAnswer(variant);
          const existing = labels.get(normalized);
          if (existing) expect(existing).toBe(answer.label);
          labels.set(normalized, answer.label);
          expect(evaluateAnswer(question, variant).answerLabel).toBe(answer.label);
        }
      }
    }
  });

  it('gives all players the same seven distinct questions for the date', () => {
    const one = getDailyQuestions('2026-10-26');
    expect(one).toEqual(getDailyQuestions('2026-10-26'));
    expect(one).toHaveLength(7);
    expect(new Set(one.map((question) => question.id)).size).toBe(7);
    expect(one).not.toEqual(getDailyQuestions('2026-10-27'));
    expect(one.every((question) => QUESTIONS.includes(question))).toBe(true);
  });

  it('respects the selected subject and exhausts unseen questions before a repeat', () => {
    const pool = QUESTIONS.filter((question) => question.category === 'geografia');
    expect(pool.length).toBeGreaterThan(1);
    const seen: string[] = [];
    for (let index = 0; index < pool.length; index += 1) {
      const question = getInfiniteQuestion('geografia', seen, () => 0.5);
      expect(question.category).toBe('geografia');
      expect(seen).not.toContain(question.id);
      seen.push(question.id);
    }
    expect(seen).toContain(getInfiniteQuestion('geografia', seen, () => 0.5).id);
  });
});

describe('daily session persistence', () => {
  const date = '2026-10-26';

  it('keeps legacy data intact while starting the new catalog in its own namespace', () => {
    const storage = memoryStorage();
    const old = JSON.stringify({ date, started: true, results: [], activeQuestionId: 'ciencia-planetas', deadline: 123456 });
    storage.setItem(`krilion.daily.v1:${date}`, old);
    expect(hasPreviousCatalogProgress(date, storage)).toBe(true);
    expect(loadDailyProgress(date, storage)).toEqual({ date, started: false, results: [] });
    expect(saveDailyProgress(loadDailyProgress(date, storage), storage)).toBe(true);
    expect(storage.getItem(`krilion.daily.v1:${date}`)).toBe(old);
    expect(hasPreviousCatalogProgress(date, null)).toBe(false);
  });

  it('restores answers and the original absolute timer deadline after a reload', () => {
    const storage = memoryStorage();
    const questions = getDailyQuestions(date);
    const progress: DailyProgress = {
      date, started: true, results: [resultFor(questions[0])],
      activeQuestionId: questions[1].id, deadline: 123456,
    };
    expect(saveDailyProgress(progress, storage)).toBe(true);
    expect(loadDailyProgress(date, storage)).toEqual(progress);
    expect(loadDailyProgress('2026-10-27', storage)).toEqual({ date: '2026-10-27', started: false, results: [] });
  });

  it('keeps a completed daily challenge completed', () => {
    const storage = memoryStorage();
    const progress: DailyProgress = { date, started: true, results: getDailyQuestions(date).map(resultFor) };
    expect(saveDailyProgress(progress, storage)).toBe(true);
    expect(loadDailyProgress(date, storage).results).toHaveLength(7);
  });

  it('handles malformed or inaccessible storage without crashing', () => {
    const storage = memoryStorage();
    const empty = { date, started: false, results: [] };
    for (const bad of ['{invalid', 'null', '[]', JSON.stringify({ date, started: true, results: [null] })]) {
      storage.setItem(`${DAILY_STORAGE_PREFIX}${date}`, bad);
      expect(loadDailyProgress(date, storage)).toEqual(empty);
    }
    const throwing: PreferenceStorage = { getItem: () => { throw new Error('Denied'); }, setItem: () => { throw new Error('Full'); } };
    expect(loadDailyProgress(date, throwing)).toEqual(empty);
    expect(saveDailyProgress(empty, throwing)).toBe(false);
    expect(saveDailyProgress(empty, null)).toBe(false);
  });

  it('rejects impossible dates, unordered answers, partial timers and more than seven results', () => {
    const storage = memoryStorage();
    const questions = getDailyQuestions(date);
    const invalid: DailyProgress[] = [
      { date: '2026-02-30', started: false, results: [] },
      { date, started: true, results: [resultFor(questions[1])] },
      { date, started: true, results: [], activeQuestionId: questions[0].id },
      { date, started: true, results: [], deadline: 1000 },
      { date, started: true, results: [...questions, questions[0]].map(resultFor) },
    ];
    for (const progress of invalid) expect(saveDailyProgress(progress, storage)).toBe(false);
  });
});
