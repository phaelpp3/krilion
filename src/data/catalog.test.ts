import { describe, expect, it } from 'vitest';
import { QUESTIONS } from './questions';
import { evaluateAnswer, getDailyQuestions, normalizeAnswer } from '../lib/game';

describe('perguntas familiares e abertas', () => {
  it('oferece pelo menos 80 respostas distintas e várias respostas familiares em cada pergunta', () => {
    const counts = QUESTIONS.map((q) => ({ id: q.id, count: q.answers.length, familiar: q.answers.filter(a => a.rarity <= .35).length }));
    for (const count of counts) {
      expect(count.count, count.id).toBeGreaterThanOrEqual(80);
      expect(count.familiar, count.id).toBeGreaterThanOrEqual(10);
    }
    for (const question of QUESTIONS) expect(question.answers.some(a => a.rarity === 1), question.id).toBe(true);
  });

  it('não confunde sinônimos de respostas diferentes', () => {
    const collisions: string[] = [];
    for (const q of QUESTIONS) {
      const index = new Map<string, string>();
      for (const answer of q.answers) for (const variant of [answer.label, ...(answer.aliases ?? [])]) {
        const key = normalizeAnswer(variant);
        if (index.has(key) && index.get(key) !== answer.label) collisions.push(`${q.id}: ${index.get(key)} / ${answer.label} (${variant})`);
        index.set(key, answer.label);
      }
    }
    expect(collisions).toEqual([]);
  });

  it.each([
    ['natureza-animais', ['cachorro', 'gato', 'elefante', 'formiga', 'tubarão']],
    ['natureza-frutas', ['banana', 'maçã', 'morango', 'mexerica', 'melancia']],
    ['natureza-horta', ['cenoura', 'alface', 'batata', 'macaxeira', 'coentro']],
    ['natureza-aves', ['galinha', 'pombo', 'papagaio', 'pato', 'beija-flor']],
    ['natureza-mar', ['tubarão', 'baleia', 'camarão', 'polvo', 'sardinha']],
    ['natureza-plantas', ['rosa', 'girassol', 'cacto', 'samambaia', 'babosa']],
    ['cotidiano-cozinha', ['panela', 'garfo', 'geladeira', 'prato', 'liquidificador']],
    ['cotidiano-escola', ['lápis', 'borracha', 'caderno', 'caneta', 'mochila']],
    ['cotidiano-profissoes', ['professora', 'médica', 'dentista', 'motorista', 'enfermeira']],
    ['cotidiano-roupas', ['camiseta', 'calça', 'vestido', 'tenis', 'boné']],
    ['cotidiano-materiais', ['madeira', 'plástico', 'vidro', 'ferro', 'algodão']],
    ['cotidiano-bolsa', ['celular', 'carteira', 'chaves', 'batom', 'caderno']],
    ['cotidiano-corpo', ['mão', 'cabeça', 'coração', 'pé', 'olho']],
    ['cotidiano-transporte', ['carro', 'ônibus', 'bike', 'moto', 'avião']],
    ['cultura-esportes', ['futebol', 'basquete', 'vôlei', 'natação', 'tênis']],
    ['cultura-instrumentos', ['violão', 'piano', 'bateria', 'flauta', 'sanfona']],
    ['cultura-comidas', ['arroz', 'feijão', 'pizza', 'banana', 'sushi']],
    ['cultura-doces', ['brigadeiro', 'pudim', 'chocolate', 'sorvete', 'bolo']],
    ['cultura-bebidas', ['água', 'café', 'leite', 'suco', 'refrigerante']],
    ['cultura-desenhos', ['bob esponja', 'tom e jerry', 'peppa pig', 'naruto', 'pica pau']],
    ['cultura-jogos', ['esconde-esconde', 'minecraft', 'roblox', 'uno', 'xadrez']],
    ['cultura-filmes', ['titanic', 'shrek', 'barbie', 'toy story', 'avatar']],
    ['geo-paises-territorios', ['brasil', 'frança', 'japão', 'eua', 'argentina']],
    ['geo-cidades-brasil', ['sao paulo', 'recife', 'rio', 'bh', 'Manaus AM']],
    ['geo-cidades-mundo', ['paris', 'londres', 'nova york', 'tokyo', 'lisboa']],
    ['geo-lugares-cidade', ['escola', 'hospital', 'padaria', 'cinema', 'praça']],
    ['geo-pontos-turisticos', ['cristo redentor', 'torre eiffel', 'big ben', 'coliseu', 'pão de açúcar']],
  ])('%s aceita opções comuns de entrada', (id, examples) => {
    const question = QUESTIONS.find(q => q.id === id)!;
    expect(question).toBeDefined();
    for (const input of examples) expect(evaluateAnswer(question, input).correct, input).toBe(true);
  });

  it('varia o diário entre quatro assuntos, com no máximo duas perguntas de cada um', () => {
    for (let day = 1; day <= 28; day++) {
      const questions = getDailyQuestions(`2026-11-${String(day).padStart(2, '0')}`);
      const categories = questions.map(q => q.category);
      expect(new Set(categories).size).toBe(4);
      for (const category of categories) expect(categories.filter(c => c === category).length).toBeLessThanOrEqual(2);
    }
  });

  it('distingue municípios cujo nome se parece com o nome de outro município seguido de UF', () => {
    const question = QUESTIONS.find(q => q.id === 'geo-cidades-brasil')!;
    for (const name of ['Aracatu', 'Araçatuba', 'Itagi', 'Itagibá', 'Poá', 'Porto Alegre']) {
      expect(evaluateAnswer(question, name).answerLabel).toBe(name);
    }
  });
});
