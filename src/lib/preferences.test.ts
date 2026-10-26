import { describe, expect, it } from 'vitest';
import {
  createSeededRandom,
  DEFAULT_PREFERENCES,
  getDailyDate,
  getDailySeed,
  loadPreferences,
  PREFERENCES_KEY,
  savePreferences,
  THEMES,
  type Preferences,
  type PreferenceStorage,
} from './preferences';

function memoryStorage(): PreferenceStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
  };
}

describe('preferências locais', () => {
  it('persiste cada tema, som e movimento reduzido entre sessões', () => {
    const storage = memoryStorage();
    for (const theme of THEMES) {
      const preferences: Preferences = { theme: theme.id, sound: true, reducedMotion: true };
      expect(savePreferences(preferences, storage)).toBe(true);
      expect(loadPreferences(storage)).toEqual(preferences);
    }
  });

  it('continua funcionando sem armazenamento ou quando o navegador o bloqueia', () => {
    const blocked: PreferenceStorage = {
      getItem: () => { throw new Error('Storage blocked'); },
      setItem: () => { throw new Error('Storage full'); },
    };
    expect(loadPreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(loadPreferences(blocked)).toEqual(DEFAULT_PREFERENCES);
    expect(savePreferences({ ...DEFAULT_PREFERENCES }, null)).toBe(false);
    expect(savePreferences({ ...DEFAULT_PREFERENCES }, blocked)).toBe(false);
  });

  it('recupera dados corrompidos e valida os campos individualmente', () => {
    const storage = memoryStorage();
    for (const raw of ['{', 'null', '[]', '42', '"text"']) {
      storage.setItem(PREFERENCES_KEY, raw);
      expect(loadPreferences(storage)).toEqual(DEFAULT_PREFERENCES);
    }
    storage.setItem(PREFERENCES_KEY, JSON.stringify({ theme: 'unknown', sound: 'false', reducedMotion: true }));
    expect(loadPreferences(storage)).toEqual({ ...DEFAULT_PREFERENCES, reducedMotion: true });
    storage.setItem(PREFERENCES_KEY, JSON.stringify({ theme: 'lavanda', sound: true }));
    expect(loadPreferences(storage)).toEqual({ theme: 'lavanda', sound: true, reducedMotion: false });
  });
});

describe('desafio diário', () => {
  it('muda a data à meia-noite de São Paulo, independentemente do fuso da máquina', () => {
    expect(getDailyDate(new Date('2026-10-26T02:59:59.999Z'))).toBe('2026-10-25');
    expect(getDailyDate(new Date('2026-10-26T03:00:00.000Z'))).toBe('2026-10-26');
    expect(getDailyDate(new Date('2027-01-01T02:00:00.000Z'))).toBe('2026-12-31');
  });

  it('produz a mesma sequência no mesmo dia e outra sequência no dia seguinte', () => {
    const first = createSeededRandom(getDailySeed('2026-10-26'));
    const second = createSeededRandom(getDailySeed('2026-10-26'));
    const nextDay = createSeededRandom(getDailySeed('2026-10-27'));
    const sequence = Array.from({ length: 30 }, first);
    expect(Array.from({ length: 30 }, second)).toEqual(sequence);
    expect(Array.from({ length: 30 }, nextDay)).not.toEqual(sequence);
    expect(sequence.every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it('aceita seed zero sem travar em uma sequência constante', () => {
    const random = createSeededRandom(0);
    const sequence = Array.from({ length: 100 }, random);
    expect(new Set(sequence).size).toBe(100);
    expect(sequence.every((value) => value >= 0 && value < 1)).toBe(true);
  });
});
