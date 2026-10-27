import { memo, useMemo, useState } from 'react';
import type { Question } from '../data/questions';
import { normalizeAnswer } from '../lib/game';

export default memo(function AnswerExplorer({ question }: { question: Question }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(60);
  const answers = useMemo(() => open ? [...question.answers]
    .sort((a, b) => b.rarity - a.rarity || a.label.localeCompare(b.label, 'pt-BR'))
    .map(answer => ({ ...answer, searchable: [answer.label, ...(answer.aliases ?? [])].map(normalizeAnswer) })) : [], [question, open]);
  const matches = useMemo(() => {
    const query = normalizeAnswer(search);
    return query ? answers.filter(answer => answer.searchable.some(name => name.includes(query))) : answers;
  }, [answers, search]);

  return <details className="game-answer-details" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>Explorar respostas desta pergunta</summary>
    {open && <>
      <p>{question.prompt}</p>
      <label className="game-answer-search-label" htmlFor={`search-${question.id}`}>Buscar entre {question.answers.length.toLocaleString('pt-BR')} respostas</label>
      <input id={`search-${question.id}`} className="game-answer-search" type="search" placeholder="Digite uma palavra…" value={search} onChange={event => { setSearch(event.target.value); setLimit(60); }} />
      <p className="game-search-count" role="status">{matches.length ? `Mostrando ${Math.min(limit, matches.length)} de ${matches.length.toLocaleString('pt-BR')} respostas.` : 'Nenhuma resposta encontrada nesta busca.'}</p>
      <div className="game-answer-list">{matches.slice(0, limit).map(answer => <span key={answer.label}>{answer.label}</span>)}</div>
      {matches.length > limit && <button type="button" className="game-text-button" onClick={() => setLimit(value => value + 60)}>Mostrar mais respostas</button>}
      <p>O catálogo reúne muitas possibilidades, mas ainda pode faltar uma resposta válida.</p>
    </>}
  </details>;
});
