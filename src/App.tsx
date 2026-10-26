import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import GameShell from './components/GameShell';
import OceanScene from './components/OceanScene';
import { CATEGORIES, QUESTIONS } from './data/questions';
import type { CategoryId } from './data/questions';
import { DAILY_ROUNDS, ROUND_SECONDS, evaluateAnswer, getDailyQuestions, getInfiniteQuestion, loadDailyProgress, saveDailyProgress } from './lib/game';
import type { DailyProgress, RoundResult } from './lib/game';
import { getDailyDate, loadPreferences } from './lib/preferences';
import type { Preferences } from './lib/preferences';
import { getStatistics, recordDaily, recordInfiniteRound } from './lib/statistics';

const number = (value: number) => value.toLocaleString('pt-BR');
const freshInfinite = (): DailyProgress => ({ date: getDailyDate(), started: false, results: [] });

function Help() {
  return <><p>O óbvio fica na superfície. Uma resposta rara leva você mais fundo!</p><ol>
    <li>Leia a pergunta e digite <strong>uma resposta válida em até 25 segundos</strong>. O relógio continua ao abrir menus ou sair da aba.</li>
    <li>Quanto mais rara a resposta, maior o mergulho: de <strong>100 a 1.000 metros</strong>. Resposta fora do catálogo ou tempo esgotado vale zero.</li>
    <li>No <strong>Diário</strong>, são as mesmas 7 perguntas para todos. Tente chegar a 7.000 m! O desafio muda à meia-noite de Brasília.</li>
    <li>No <strong>Infinito</strong>, escolha um assunto e mergulhe sem limite de rodadas. As perguntas se repetem depois que o catálogo escolhido se esgota.</li>
  </ol><p>Acentos e letras maiúsculas não fazem diferença. Dê apenas uma resposta por pergunta.</p><div className="game-note"><strong>Como calculamos a raridade?</strong><p>Usamos estimativas editoriais fixas, não porcentagens reais de jogadores. As respostas são conferidas em um catálogo local. Sem conta, anúncios ou pagamentos.</p></div><p className="muted">Seu progresso fica neste navegador. Esta é uma versão independente inspirada em Krillion, com textos e ilustrações próprios.</p></>;
}

function Stats({ revision }: { revision: number }) {
  void revision;
  const stats = getStatistics();
  return <><p className="muted">Cada mergulho conta. Continue explorando!</p><div className="game-stats-grid">
    <div><strong>{stats.dailyGames}</strong><span>diários concluídos</span></div>
    <div><strong>{number(stats.bestDailyDepth)} <small>m</small></strong><span>melhor diário</span></div>
    <div><strong>{stats.totalAnswers ? Math.round(stats.correctAnswers / stats.totalAnswers * 100) : 0}%</strong><span>de respostas válidas</span></div>
    <div><strong>{number(stats.infiniteDepth)} <small>m</small></strong><span>explorados no infinito</span></div>
  </div><p className="muted">Estatísticas locais, salvas apenas neste navegador.</p></>;
}

export default function App() {
  const [mode, setMode] = useState<'daily' | 'infinite'>('daily');
  const [daily, setDaily] = useState(loadDailyProgress);
  const [infinite, setInfinite] = useState(freshInfinite);
  const [category, setCategory] = useState<CategoryId>('todos');
  const [answer, setAnswer] = useState('');
  const [clock, setClock] = useState(Date.now());
  const [notice, setNotice] = useState('');
  const [saveFailed, setSaveFailed] = useState(false);
  const [shareFallback, setShareFallback] = useState('');
  const [statsRevision, setStatsRevision] = useState(0);
  const answerInput = useRef<HTMLInputElement>(null);
  const submitLock = useRef(false);
  const audio = useRef<AudioContext | null>(null);
  const preferences = useRef(loadPreferences());
  const sessionId = useRef(`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const progress = mode === 'daily' ? daily : infinite;
  const sessionRef = useRef(progress);
  sessionRef.current = progress;
  const question = QUESTIONS.find((item) => item.id === progress.activeQuestionId);
  const active = Boolean(question && progress.deadline);
  const completed = mode === 'daily' && progress.results.length === DAILY_ROUNDS;
  const depth = progress.results.reduce((sum, result) => sum + result.points, 0);
  const last = progress.results.at(-1);
  const lastQuestion = QUESTIONS.find((item) => item.id === last?.questionId);
  const rarityLabel = last?.correct && lastQuestion ? evaluateAnswer(lastQuestion, last.answerLabel ?? last.input).label : '';
  const seconds = Math.max(0, Math.min(ROUND_SECONDS, Math.ceil(((progress.deadline ?? clock) - clock) / 1000)));
  const today = getDailyDate(new Date(clock));
  const dateLabel = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: 'America/Sao_Paulo' }).format(new Date(`${daily.date}T15:00:00Z`));

  const updateProgress = useCallback((next: DailyProgress) => {
    sessionRef.current = next;
    if (mode === 'daily') {
      setDaily(next);
      if (!saveDailyProgress(next)) setSaveFailed(true);
    } else setInfinite(next);
  }, [mode]);

  function playSound(correct: boolean) {
    if (!preferences.current.sound) return;
    try {
      audio.current ??= new AudioContext();
      const context = audio.current;
      void context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(correct ? 440 : 190, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(correct ? 880 : 130, context.currentTime + .25);
      gain.gain.setValueAtTime(.05, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .35);
      oscillator.start(); oscillator.stop(context.currentTime + .36);
    } catch { /* Audio is optional when unsupported by the browser. */ }
  }

  const finish = useCallback((input: string, timeout = false) => {
    const current = sessionRef.current;
    const currentQuestion = QUESTIONS.find((item) => item.id === current.activeQuestionId);
    if (!currentQuestion || !current.deadline || submitLock.current) return;
    submitLock.current = true;
    const timedOut = timeout || Date.now() >= current.deadline;
    const evaluated = evaluateAnswer(currentQuestion, timedOut ? '' : input);
    const result: RoundResult = { questionId: currentQuestion.id, input: timedOut ? '' : input.trim(), answerLabel: evaluated.answerLabel, points: evaluated.points, rarity: evaluated.rarity, correct: evaluated.correct, timedOut };
    const next: DailyProgress = { date: current.date, started: true, results: [...current.results, result] };
    updateProgress(next);
    if (mode === 'infinite') recordInfiniteRound(`${sessionId.current}:${next.results.length}`, result.points, result.correct);
    if (mode === 'daily' && next.results.length === DAILY_ROUNDS) recordDaily(next.date, next.results);
    setStatsRevision((value) => value + 1);
    setAnswer('');
    playSound(result.correct);
  }, [mode, updateProgress]);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setClock(now);
      if (sessionRef.current.deadline && now >= sessionRef.current.deadline) finish('', true);
    };
    tick();
    const timer = window.setInterval(tick, 150);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, [finish]);

  useEffect(() => {
    if (active) answerInput.current?.focus();
  }, [active, progress.activeQuestionId]);

  useEffect(() => {
    const onPreferences = (event: Event) => { preferences.current = (event as CustomEvent<Preferences>).detail; };
    window.addEventListener('krilion:preferences', onPreferences);
    return () => window.removeEventListener('krilion:preferences', onPreferences);
  }, []);

  useEffect(() => {
    if (!active && progress.results.length && !document.querySelector('dialog[open]')) {
      const heading = document.querySelector<HTMLElement>('.game-feedback h1, .game-complete h1');
      heading?.setAttribute('tabindex', '-1');
      heading?.focus({ preventScroll: true });
    }
  }, [active, progress.results.length]);

  useEffect(() => {
    if (daily.results.length === DAILY_ROUNDS) recordDaily(daily.date, daily.results);
  }, [daily]);

  function nextQuestion() {
    const current = sessionRef.current;
    const poolSize = QUESTIONS.filter((item) => category === 'todos' || item.category === category).length;
    const cycleOffset = Math.floor(current.results.length / poolSize) * poolSize;
    const next = mode === 'daily' ? getDailyQuestions(current.date)[current.results.length] : getInfiniteQuestion(category, current.results.slice(cycleOffset).map((result) => result.questionId));
    if (!next) return;
    submitLock.current = false;
    const deadline = Date.now() + ROUND_SECONDS * 1000;
    setClock(Date.now()); setAnswer(''); setNotice('');
    updateProgress({ ...current, started: true, activeQuestionId: next.id, deadline });
  }

  function changeMode(nextMode: 'daily' | 'infinite') {
    if (mode === nextMode) return;
    if (active) { setNotice('Termine esta pergunta para trocar de modo. O relógio continua!'); return; }
    setMode(nextMode); setNotice(''); setShareFallback('');
    submitLock.current = false;
  }

  async function share() {
    const squares = progress.results.map((result) => !result.correct ? '⬜' : result.points >= 750 ? '🟪' : result.points >= 450 ? '🟦' : '🟩').join('');
    const text = `Krilion · ${mode === 'daily' ? daily.date : 'Modo infinito'}\n${number(depth)} m ${mode === 'daily' ? '/ 7.000 m' : 'de profundidade'}\n${squares}\nRespostas raras, mergulhos profundos. 🦐`;
    try { await navigator.clipboard.writeText(text); setNotice('Resultado copiado! Cole onde quiser compartilhar.'); }
    catch { setShareFallback(text); setNotice('Selecione e copie seu resultado abaixo.'); }
  }

  function submit(event: FormEvent) { event.preventDefault(); if (answer.trim()) finish(answer); }

  return <GameShell mode={mode} onModeChange={changeMode} help={<Help />} stats={<Stats revision={statsRevision} />}>
    <div className="game-layout">
      <section className="game-panel" aria-label="Desafio de respostas raras">
        <div className="game-heading"><span className="eyebrow">{mode === 'daily' ? 'EXPEDIÇÃO DO DIA' : 'O OCEANO É SEU'}</span><span className="game-date">{mode === 'daily' ? dateLabel : 'Sem limite de rodadas'}</span></div>
        {!progress.started && <div className="game-welcome">
          <h1>Pense além<br />do <span>óbvio.</span></h1>
          <p className="game-intro">Respostas comuns ficam na superfície.<br className="game-desktop-break" /> As raras levam você mais fundo.</p>
          <div className="game-facts"><div><span>{mode === 'daily' ? '07' : '∞'}</span><strong>{mode === 'daily' ? 'perguntas' : 'perguntas sem fim'}</strong></div><div><span>25<span className="game-unit">s</span></span><strong>por resposta</strong></div><div><span>{mode === 'daily' ? '7.000' : '1.000'}<span className="game-unit">m</span></span><strong>{mode === 'daily' ? 'para explorar' : 'por mergulho'}</strong></div></div>
          {mode === 'infinite' && <div className="game-categories"><label htmlFor="category">O que vamos explorar?</label><select id="category" value={category} onChange={(event) => setCategory(event.target.value as CategoryId)}>{CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.icon} {item.label}</option>)}</select></div>}
          <button className="primary-button game-start" onClick={nextQuestion}>Começar a mergulhar <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m5 5 14 14M6 19h13V6" /></svg></button>
          <p className="game-under-button">{mode === 'daily' ? 'O mesmo desafio para todo mundo. Um mergulho só seu.' : 'Escolha um assunto. Descubra até onde você consegue ir.'}</p>
          <div className="game-tip"><span aria-hidden="true">✧</span><p><strong>O segredo está no inesperado.</strong> Pense naquela resposta que quase ninguém lembraria.</p></div>
        </div>}

        {active && question && <div className="game-round" key={question.id}>
          <div className="game-round-top"><span className="game-category">{CATEGORIES.find((item) => item.id === question.category)?.label}</span><span className="game-round-number">Pergunta {progress.results.length + 1}{mode === 'daily' ? ' de 7' : ''}</span></div>
          <div className={`game-timer ${seconds <= 5 ? 'urgent' : ''}`} role="timer" aria-label={`${seconds} segundos restantes`}><div className="game-timer-track"><div style={{ '--remaining': `${seconds / ROUND_SECONDS * 100}%` } as CSSProperties} /></div><span>{seconds}<small>s</small></span></div>
          <h1 className="game-question">{question.prompt}</h1><p className="game-hint">{question.hint}</p>
          <form onSubmit={submit} className="game-answer-form"><label htmlFor="answer">Sua resposta mais rara</label><input id="answer" ref={answerInput} value={answer} onChange={(event) => setAnswer(event.target.value)} maxLength={100} autoComplete="off" autoCapitalize="sentences" spellCheck={false} placeholder="Vá além da primeira ideia…" /><button type="submit" className="primary-button" disabled={!answer.trim()}>Mergulhar <span aria-hidden="true">↓</span></button></form>
          <div className="game-answer-meta"><span>Uma resposta. Sem se preocupar com acentos.</span><button className="game-text-button" onClick={() => finish('')}>Pular pergunta</button></div>
          <p className="game-timer-help" role="status">{seconds <= 5 ? "Restam menos de 6 segundos. Envie sua resposta!" : "Seu tempo continua se você sair desta tela."}</p>
        </div>}

        {!active && progress.started && !completed && last && <div className="game-feedback" key={progress.results.length} aria-live="polite">
          <span className={`game-result-icon ${last.correct ? 'success' : ''}`} aria-hidden="true">{last.correct ? '↓' : '≈'}</span>
          <span className="eyebrow">{last.correct ? last.rarity >= .8 ? 'UM ACHADO NAS PROFUNDEZAS' : 'MAIS FUNDO NO OCEANO' : last.timedOut ? 'O TEMPO PASSOU' : 'FAZ PARTE DA EXPLORAÇÃO'}</span>
          <h1>{last.correct ? last.rarity >= .8 ? 'Que resposta rara!' : 'Bom mergulho!' : last.timedOut ? 'O relógio venceu.' : last.input ? 'Não foi desta vez.' : 'Vamos à próxima?'}</h1>
          <div className="game-points">+{number(last.points)} <span>m</span></div>
          <p className="game-result-answer">{last.correct ? <><strong>{last.answerLabel}</strong> levou você mais fundo.</> : last.input ? <><strong>“{last.input}”</strong> não está entre as respostas aceitas para esta pergunta.</> : 'Sem resposta nesta rodada. Ainda há muito para descobrir.'}</p>
          {last.correct && <span className="game-rarity">{rarityLabel} <span>· raridade estimada</span></span>}
          {lastQuestion && <details className="game-answer-details"><summary>Explorar respostas desta pergunta</summary><p>{lastQuestion.prompt}</p><div>{[...lastQuestion.answers].sort((a, b) => b.rarity - a.rarity).map((item) => <span key={item.label}>{item.label}</span>)}</div></details>}
          <button className="primary-button game-start" onClick={nextQuestion}>{mode === 'daily' ? `Próxima pergunta · ${progress.results.length + 1}/7` : 'Continuar mergulhando'} <span aria-hidden="true">↓</span></button>
          {mode === 'infinite' && <button className="game-text-button game-change-category" onClick={() => { setInfinite(freshInfinite()); sessionId.current = `${Date.now()}-${Math.random()}`; }}>Escolher outro assunto</button>}
        </div>}

        {completed && <div className="game-complete" aria-live="polite"><span className="game-result-icon success" aria-hidden="true">✦</span><span className="eyebrow">EXPEDIÇÃO CONCLUÍDA</span><h1>Você foi<br /><span>além da superfície.</span></h1><div className="game-total">{number(depth)} <span>m</span></div><p>de 7.000 metros possíveis · {progress.results.filter((result) => result.correct).length} de 7 respostas válidas</p><div className="game-result-bars" aria-label="Metros em cada pergunta">{progress.results.map((result, index) => <div key={index}><div className="game-result-bar"><i style={{ height: `${Math.max(4, result.points / 10)}%` }} /></div><strong>{result.points}</strong><span>{index + 1}ª</span></div>)}</div><button className="primary-button game-start" onClick={() => void share()}>Compartilhar resultado <span aria-hidden="true">↗</span></button><button className="secondary-button game-start" onClick={() => changeMode('infinite')}>Continuar no modo infinito <span aria-hidden="true">∞</span></button><p className="game-under-button">Um novo diário à meia-noite de Brasília.</p>
          <details className="game-answer-details"><summary>Rever minhas respostas</summary>{progress.results.map((result, index) => <p key={result.questionId}><strong>{index + 1}. {QUESTIONS.find((item) => item.id === result.questionId)?.prompt}</strong><br />{result.timedOut ? 'Tempo esgotado' : result.answerLabel || result.input || 'Pergunta pulada'} · {result.points} m</p>)}</details>
        </div>}
        {mode === 'daily' && today !== daily.date && !active && <button className="secondary-button game-start" onClick={() => { setDaily(loadDailyProgress(today)); submitLock.current = false; }}>Abrir o desafio de hoje</button>}
        {shareFallback && <textarea className="game-share-text" aria-label="Resultado para copiar" readOnly value={shareFallback} onFocus={(event) => event.target.select()} />}
        {saveFailed && <p className="game-warning">Seu navegador bloqueou o armazenamento. O progresso desta sessão funciona, mas pode não ser recuperado ao fechar a página.</p>}
        {notice && <p className="game-notice" role="status">{notice}</p>}
      </section>

      <aside className="game-ocean-panel" aria-label="Seu mergulho"><OceanScene depth={depth} maxDepth={mode === 'daily' ? 7000 : Math.max(7000, Math.ceil((depth + 1) / 7000) * 7000)} diving={!active && Boolean(last?.correct)} /></aside>
    </div>
    <section className="game-bottom-row" aria-label="Resumo da expedição"><div><span className="game-small-label">{mode === 'daily' ? 'SEU CAMINHO ATÉ O FUNDO' : 'MERGULHOS DESTA SESSÃO'}</span><div className="game-steps">{Array.from({ length: mode === 'daily' ? 7 : Math.max(1, Math.min(7, progress.results.length + 1)) }, (_, index) => <span key={index} className={index < progress.results.length ? 'done' : index === progress.results.length && active ? 'current' : ''} title={progress.results[index] ? `${progress.results[index].points} metros` : `Pergunta ${index + 1}`}>{index < progress.results.length ? progress.results[index].correct ? '↓' : '·' : index + 1}</span>)}</div></div><p><span aria-hidden="true">✧</span> A curiosidade é sua<br /><strong>melhor companhia.</strong></p></section>
    <p className="game-editorial-note">Raridade estimada por curadoria · {QUESTIONS.length} perguntas em português · Tudo gratuito</p>
  </GameShell>;
}
