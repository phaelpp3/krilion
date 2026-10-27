import { cultureQuestions } from './culture';
import { everydayQuestions } from './everyday';
import { geographyQuestions } from './geography';
import { natureQuestions } from './nature';
import type { CategoryId, Question } from './catalog';

export { CATALOG_VERSION } from './catalog';
export type { Answer, CategoryId, Question } from './catalog';

export const CATEGORIES: { id: CategoryId; label: string; icon: string }[] = [
  { id: 'todos', label: 'Todos os assuntos', icon: '✦' },
  { id: 'cotidiano', label: 'Dia a dia', icon: '☀' },
  { id: 'cultura', label: 'Comida e diversão', icon: '🎭' },
  { id: 'natureza', label: 'Natureza', icon: '🌿' },
  { id: 'geografia', label: 'Lugares do mundo', icon: '🌎' },
];

// Everyday prompts with many familiar entry points: rarity is the challenge.
export const QUESTIONS: Question[] = [
  ...everydayQuestions, ...cultureQuestions, ...natureQuestions, ...geographyQuestions,
];
