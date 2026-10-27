export const CATALOG_VERSION = 2;
export type CategoryId = 'todos' | 'geografia' | 'cotidiano' | 'cultura' | 'natureza';
export interface Answer { label: string; aliases?: string[]; rarity: number }
export interface Question {
  id: string;
  category: Exclude<CategoryId, 'todos'>;
  prompt: string;
  hint: string;
  answers: Answer[];
}

/** Each group is curated from familiar to rare. A pipe separates explicit synonyms.
 * Scores express editorial familiarity, never measured player frequencies.
 * Singular/plural forms are explicit: no fuzzy matching that accepts unrelated words.
 */
export function answerGroups(...groups: string[]): Answer[] {
  const rarities = [.08, .32, .6, .85, 1];
  return groups.flatMap((group, index) => group.split(';').map((entry) => {
    const [label, ...aliases] = entry.split('|').map((value) => value.trim());
    return { label, aliases, rarity: rarities[index] ?? 1 };
  }).filter((answer) => answer.label));
}

export function question(id: string, category: Question['category'], prompt: string, hint: string, ...groups: string[]): Question {
  return { id, category, prompt, hint, answers: answerGroups(...groups) };
}
