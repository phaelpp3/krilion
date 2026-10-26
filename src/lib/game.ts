import { QUESTIONS } from '../data/questions';
import type { CategoryId, Question } from '../data/questions';
import { createSeededRandom, getDailyDate, getDailySeed } from './preferences';
import type { PreferenceStorage } from './preferences';

export const ROUND_SECONDS = 25;
export const DAILY_ROUNDS = 7;
export const DAILY_STORAGE_PREFIX = 'krilion.daily.v1:';

export interface AnswerEvaluation {
  correct: boolean;
  answerLabel: string | null;
  points: number;
  rarity: number;
  label: string;
}

export interface RoundResult {
  questionId: string;
  input: string;
  answerLabel: string | null;
  points: number;
  rarity: number;
  correct: boolean;
  timedOut: boolean;
}

export interface DailyProgress {
  date: string;
  results: RoundResult[];
  started: boolean;
  activeQuestionId?: string;
  /** Absolute timestamp: a reload or a background tab must not restart the timer. */
  deadline?: number;
}

/** Accepts accents, casing and punctuation variations without approximate matching. */
export function normalizeAnswer(input: string): string {
  return input.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR')
    .replace(/[^\p{L}\p{N}]/gu, '');
}

/** Rarity values are editorial estimates, never measured player percentages. */
export function evaluateAnswer(question: Question, input: string): AnswerEvaluation {
  const normalized = normalizeAnswer(input);
  const answer = normalized ? question.answers.find((candidate) =>
    [candidate.label, ...(candidate.aliases ?? [])]
      .some((alias) => normalizeAnswer(alias) === normalized)) : undefined;
  if (!answer) {
    return {
      correct: false, answerLabel: null, points: 0, rarity: 0,
      label: normalized ? 'Fora do catálogo' : 'Sem resposta',
    };
  }
  const rarity = Math.min(1, Math.max(0, answer.rarity));
  return {
    correct: true,
    answerLabel: answer.label,
    points: Math.round(100 + rarity * 900),
    rarity,
    label: rarity >= 0.8 ? 'Muito rara' : rarity >= 0.5 ? 'Rara'
      : rarity >= 0.25 ? 'Pouco comum' : 'Conhecida',
  };
}

/** The same catalog version and São Paulo date always produce the same seven questions. */
export function getDailyQuestions(dateKey: string = getDailyDate()): Question[] {
  const questions = [...QUESTIONS].sort((left, right) => left.id.localeCompare(right.id, 'en'));
  if (questions.length < DAILY_ROUNDS) throw new Error('O catálogo precisa de pelo menos sete perguntas.');
  const random = createSeededRandom(getDailySeed(dateKey));
  for (let i = questions.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }
  return questions.slice(0, DAILY_ROUNDS);
}

/** Repeats become eligible only after every question in the chosen subject was seen. */
export function getInfiniteQuestion(
  category: CategoryId = 'todos',
  seenIds: readonly string[] = [],
  random: () => number = Math.random,
): Question {
  const pool = QUESTIONS.filter((question) => category === 'todos' || question.category === category);
  if (pool.length === 0) throw new Error('Não há perguntas disponíveis neste assunto.');
  const seen = new Set(seenIds);
  const unseen = pool.filter((question) => !seen.has(question.id));
  const available = unseen.length ? unseen : pool;
  const index = Math.max(0, Math.min(available.length - 1, Math.floor(random() * available.length)));
  return available[index];
}

function browserStorage(): PreferenceStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function validDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validResult(value: unknown, expectedId: string): value is RoundResult {
  if (!isRecord(value) || value.questionId !== expectedId
    || typeof value.input !== 'string' || value.input.length > 500
    || typeof value.correct !== 'boolean' || typeof value.timedOut !== 'boolean'
    || typeof value.points !== 'number' || !Number.isInteger(value.points)
    || typeof value.rarity !== 'number' || !Number.isFinite(value.rarity)
    || value.rarity < 0 || value.rarity > 1) return false;
  if (value.correct) {
    return !value.timedOut && typeof value.answerLabel === 'string' && value.answerLabel.length > 0
      && value.points >= 100 && value.points <= 1000;
  }
  return value.answerLabel === null && value.points === 0 && value.rarity === 0;
}

function validProgress(value: unknown, dateKey: string): value is DailyProgress {
  if (!isRecord(value) || value.date !== dateKey || !validDateKey(value.date)
    || typeof value.started !== 'boolean' || !Array.isArray(value.results)
    || value.results.length > DAILY_ROUNDS) return false;
  const questions = getDailyQuestions(dateKey);
  if (!value.results.every((result, index) => validResult(result, questions[index].id))) return false;
  if (!value.started && (value.results.length > 0 || value.activeQuestionId !== undefined)) return false;
  if (value.activeQuestionId !== undefined || value.deadline !== undefined) {
    return value.started && value.results.length < DAILY_ROUNDS
      && value.activeQuestionId === questions[value.results.length].id
      && typeof value.deadline === 'number' && Number.isFinite(value.deadline) && value.deadline > 0;
  }
  return true;
}

export function loadDailyProgress(
  dateKey: string = getDailyDate(),
  storage: PreferenceStorage | null = browserStorage(),
): DailyProgress {
  const empty: DailyProgress = { date: dateKey, results: [], started: false };
  if (!validDateKey(dateKey)) return empty;
  try {
    const saved = storage?.getItem(`${DAILY_STORAGE_PREFIX}${dateKey}`);
    const value: unknown = saved ? JSON.parse(saved) : null;
    return validProgress(value, dateKey) ? value : empty;
  } catch {
    return empty;
  }
}

/** False means the current session can continue, but reload persistence is unavailable. */
export function saveDailyProgress(
  progress: DailyProgress,
  storage: PreferenceStorage | null = browserStorage(),
): boolean {
  if (!storage) return false;
  try {
    if (!validProgress(progress, progress.date)) return false;
    storage.setItem(`${DAILY_STORAGE_PREFIX}${progress.date}`, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
