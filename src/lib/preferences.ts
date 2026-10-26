export const THEMES = [
  { id: 'oceano', label: 'Oceano à noite', swatch: '#0e7490' },
  { id: 'claro', label: 'Dia claro', swatch: '#e2e8f0' },
  { id: 'floresta', label: 'Floresta', swatch: '#3f7d58' },
  { id: 'por-do-sol', label: 'Pôr do sol', swatch: '#ef9064' },
  { id: 'lavanda', label: 'Lavanda', swatch: '#a78bfa' },
  { id: 'alto-contraste', label: 'Alto contraste', swatch: '#ffe600' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

export interface Preferences {
  theme: ThemeId;
  sound: boolean;
  reducedMotion: boolean;
}

export interface PreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const PREFERENCES_KEY = 'krilion.preferences.v1';
export const DAILY_TIME_ZONE = 'America/Sao_Paulo';
export const DEFAULT_PREFERENCES: Readonly<Preferences> = {
  theme: 'oceano',
  sound: false,
  reducedMotion: false,
};

function browserStorage(): PreferenceStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    // Browsers can reject storage access in private or restricted contexts.
    return null;
  }
}

function normalizePreferences(value: unknown): Preferences {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...DEFAULT_PREFERENCES };
  }
  const candidate = value as Record<string, unknown>;
  const theme = THEMES.find((item) => item.id === candidate.theme)?.id;
  return {
    theme: theme ?? DEFAULT_PREFERENCES.theme,
    sound: typeof candidate.sound === 'boolean' ? candidate.sound : DEFAULT_PREFERENCES.sound,
    reducedMotion: typeof candidate.reducedMotion === 'boolean'
      ? candidate.reducedMotion
      : DEFAULT_PREFERENCES.reducedMotion,
  };
}

/** Returns safe defaults when storage is missing, inaccessible, or malformed. */
export function loadPreferences(storage: PreferenceStorage | null = browserStorage()): Preferences {
  try {
    const stored = storage?.getItem(PREFERENCES_KEY);
    return stored ? normalizePreferences(JSON.parse(stored)) : { ...DEFAULT_PREFERENCES };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

/** Returns whether persistence succeeded; preferences can still live in React state. */
export function savePreferences(
  preferences: Preferences,
  storage: PreferenceStorage | null = browserStorage(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(PREFERENCES_KEY, JSON.stringify(normalizePreferences(preferences)));
    return true;
  } catch {
    return false;
  }
}

/** Stable YYYY-MM-DD key. The daily challenge turns over at midnight in São Paulo. */
export function getDailyDate(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: DAILY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((value) => value.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

/** A deterministic, non-cryptographic seed for the same day's challenge. */
export function getDailySeed(dateKey: string = getDailyDate()): number {
  let hash = 2166136261;
  for (const character of `krilion:daily:v1:${dateKey}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Mulberry32: returns reproducible values in [0, 1), including for a zero seed. */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
