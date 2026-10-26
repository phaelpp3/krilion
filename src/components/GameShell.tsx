import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { THEMES, loadPreferences, savePreferences } from '../lib/preferences';

type GameShellProps = {
  mode: 'daily' | 'infinite';
  onModeChange: (mode: 'daily' | 'infinite') => void;
  children: ReactNode;
  help: ReactNode;
  stats: ReactNode;
};

type ModalName = 'help' | 'stats' | 'appearance';

function Icon({ name }: { name: 'help' | 'stats' | 'palette' | 'close' | 'sun' | 'infinity' | 'check' }) {
  const paths = {
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 .3c0 1.7-2.5 1.9-2.5 3.7M12 16h.01" /></>,
    stats: <><path d="M5 20V11M12 20V4M19 20v-6M3 20h18" /></>,
    palette: <><path d="M21 12a9 9 0 1 0-9 9h1.5a2.2 2.2 0 0 0 1.6-3.7 1.2 1.2 0 0 1 .9-2H18a3 3 0 0 0 3-3.3Z" /><path d="M7.5 10h.01M11 6.5h.01M16 8h.01M6.5 14.5h.01" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
    infinity: <path d="M12 12c-2.5-4-4-5-6-5a5 5 0 0 0 0 10c2 0 3.5-1 6-5s4-5 6-5a5 5 0 0 1 0 10c-2 0-3.5-1-6-5Z" />,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function GameShell({ mode, onModeChange, children, help, stats }: GameShellProps) {
  const [preferences, setPreferences] = useState(loadPreferences);
  const [preferencesSaved, setPreferencesSaved] = useState(true);
  const [modal, setModal] = useState<ModalName | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.dataset.reducedMotion = String(preferences.reducedMotion);
    setPreferencesSaved(savePreferences(preferences));
    window.dispatchEvent(new CustomEvent('krilion:preferences', { detail: preferences }));
  }, [preferences]);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (modal && !element.open) element.showModal();
    else if (!modal && element.open) element.close();
    if (modal) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = previousOverflow; };
    }
  }, [modal]);

  const modalTitles = { help: 'Como jogar', stats: 'Sua jornada', appearance: 'Do seu jeito' };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#jogo">Ir para o jogo</a>
      <header className="site-header">
        <div className="brand" aria-label="Krilion — início">
          <span className="brand-symbol" aria-hidden="true"><svg viewBox="0 0 48 48" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M32 19c-3-7-12-8-18-3-6 5-6 14 0 18 5 4 13 2 15-3-6 3-11 0-11-4 0-3 3-5 6-4l8-4Z" fill="currentColor" fillOpacity=".12"/><path d="m30 20 8-3m-9-1c5-9 12-9 12-5m-15 4c1-7 5-10 8-9M15 17l6 7m-10 0 7 3m-6 5 7-2m4 4 1-5M20 25l3 3m1-5 3 3m2-5 3 3m-3 7 7-1-3 6-7-1"/><circle cx="27" cy="18" r="1.3" fill="currentColor" stroke="none"/></svg></span>
          <div className="brand-copy"><span className="brand-name">krilion<span className="brand-dot">.</span></span><span className="brand-tagline">Um pequeno desafio. Muitas possibilidades.</span></div>
        </div>
        <nav className="header-actions" aria-label="Opções do jogo">
          <span className="free-badge"><span aria-hidden="true" />100% grátis</span>
          <button className="icon-button" type="button" onClick={() => setModal('help')} aria-label="Como jogar" title="Como jogar"><Icon name="help" /></button>
          <button className="icon-button" type="button" onClick={() => setModal('stats')} aria-label="Estatísticas" title="Estatísticas"><Icon name="stats" /></button>
          <button className="icon-button" type="button" onClick={() => setModal('appearance')} aria-label="Aparência e preferências" title="Aparência e preferências"><Icon name="palette" /></button>
        </nav>
      </header>

      <main id="jogo" className="main-content" tabIndex={-1}>
        <div className="mode-bar">
          <div className="mode-switch" role="group" aria-label="Modo de jogo">
            <button type="button" className={mode === 'daily' ? 'mode-button active' : 'mode-button'} aria-pressed={mode === 'daily'} onClick={() => onModeChange('daily')}><Icon name="sun" /><span>Diário</span></button>
            <button type="button" className={mode === 'infinite' ? 'mode-button active' : 'mode-button'} aria-pressed={mode === 'infinite'} onClick={() => onModeChange('infinite')}><Icon name="infinity" /><span>Infinito</span></button>
          </div>
          <span className="mode-caption">{mode === 'daily' ? 'Um novo desafio a cada dia' : 'Quantas partidas você quiser'}</span>
        </div>
        <div className="game-content" key={mode}>{children}</div>
      </main>

      <footer className="site-footer"><span><span className="footer-star" aria-hidden="true">✦</span> Feito para jogar no seu ritmo.</span><span>Versão independente e gratuita <span aria-hidden="true">·</span> Português</span></footer>

      <dialog className="modal" ref={dialog} aria-labelledby={titleId} onClose={() => setModal(null)} onCancel={() => setModal(null)} onClick={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
        <div className="modal-inner">
          <div className="modal-header"><div><span className="eyebrow">KRILION</span><h2 id={titleId}>{modal ? modalTitles[modal] : ''}</h2></div><button type="button" className="icon-button" aria-label="Fechar janela" onClick={() => setModal(null)} autoFocus><Icon name="close" /></button></div>
          {modal === 'help' && <div className="modal-body">{help}</div>}
          {modal === 'stats' && <div className="modal-body">{stats}</div>}
          {modal === 'appearance' && <div className="modal-body">
            <p className="muted">Encontre as cores e o ritmo da sua próxima partida.</p>
            <fieldset className="theme-fieldset"><legend>Tema visual</legend><div className="theme-grid">{THEMES.map((theme) => <button key={theme.id} type="button" className={`theme-option ${preferences.theme === theme.id ? 'selected' : ''}`} aria-pressed={preferences.theme === theme.id} onClick={() => setPreferences((current) => ({ ...current, theme: theme.id }))}><span className="theme-swatch" style={{ background: theme.swatch }} /> <span>{theme.label}</span>{preferences.theme === theme.id && <Icon name="check" />}</button>)}</div></fieldset>
            <label className="setting-row"><span><strong>Efeitos sonoros</strong><small>Sons suaves durante a partida.</small></span><input type="checkbox" role="switch" checked={preferences.sound} onChange={(event) => setPreferences((current) => ({ ...current, sound: event.target.checked }))} /><span className="toggle-track" aria-hidden="true" /></label>
            <label className="setting-row"><span><strong>Reduzir movimentos</strong><small>Uma experiência com menos animações.</small></span><input type="checkbox" role="switch" checked={preferences.reducedMotion} onChange={(event) => setPreferences((current) => ({ ...current, reducedMotion: event.target.checked }))} /><span className="toggle-track" aria-hidden="true" /></label>
            <p className="settings-note" role="status">{preferencesSaved ? 'Suas preferências ficam salvas neste navegador.' : 'O navegador bloqueou o armazenamento. Suas preferências valem apenas nesta sessão.'}</p>
          </div>}
        </div>
      </dialog>
    </div>
  );
}
