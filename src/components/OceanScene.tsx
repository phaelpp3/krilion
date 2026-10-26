import { useId } from 'react';
import type { CSSProperties } from 'react';
import '../ocean.css';

type OceanSceneProps = { depth: number; maxDepth?: number; diving?: boolean };

function ShrimpExplorer() {
  return <svg className="ocean-explorer" viewBox="0 0 240 180" fill="none" aria-hidden="true">
    <ellipse cx="119" cy="158" rx="55" ry="8" fill="#021d2e" opacity=".17" />
    <path d="M88 112c-15 2-34-5-39-17-3-7-9-7-11-1-4 16 9 35 29 41l30-4" fill="#ee826f" stroke="#9e4f53" strokeWidth="2" />
    <path d="M54 110 43 114m22 5-6 13m18-11-3 15" stroke="#b45858" strokeWidth="3" strokeLinecap="round" />
    <path d="M41 98c-8 1-15-6-14-14 10-3 17 3 18 10m-2 6c-8 7-19 5-21-1 7-7 14-7 21-4" fill="#ffac8d" stroke="#ab5e60" strokeWidth="2" />
    <path d="M145 112c11 2 16 0 21-8m-9 16 20-1" stroke="#f6957d" strokeWidth="9" strokeLinecap="round" />
    <path d="M119 126c-3 15-8 20-17 22m24-19c2 10 5 14 12 17m-3-21c4 5 9 9 16 10" stroke="#f6a086" strokeWidth="5" strokeLinecap="round" />
    <path d="M93 87c-15 11-16 30-3 40 13 10 34 11 49 1 13-9 17-28 6-39" fill="#ffab8e" stroke="#ac5960" strokeWidth="2" />
    <path d="M87 103c12 5 32 7 49 1m-49 11c12 6 30 6 44 1m-35 11c11 3 21 2 28-1" stroke="#d77970" strokeWidth="2" strokeLinecap="round" />
    <path d="M143 76h13a7 7 0 0 1 7 7v27a7 7 0 0 1-7 7h-13" fill="#628b8a" stroke="#264f5b" strokeWidth="3" />
    <path d="M159 84v18" stroke="#aac4b0" strokeWidth="4" strokeLinecap="round" />
    <path d="M140 82c13-4 13-17 8-24" stroke="#46767a" strokeWidth="5" strokeLinecap="round" />
    <path d="M98 41c-1-16-15-25-28-21m37 18c6-20 20-26 34-23" stroke="#ffd3aa" strokeWidth="3" strokeLinecap="round" />
    <circle cx="71" cy="20" r="3" fill="#ffbc91" /><circle cx="141" cy="15" r="3" fill="#ffbc91" />
    <circle cx="112" cy="70" r="43" fill="#baf2e5" fillOpacity=".16" stroke="#a7e4dc" strokeWidth="2" />
    <path d="M81 48a36 36 0 0 1 20-12" stroke="#e1fff0" strokeWidth="5" strokeLinecap="round" opacity=".72" />
    <path d="M88 62c0-18 13-27 27-25 18 3 27 17 23 35-3 16-15 24-29 22-14-2-23-15-21-32Z" fill="#ffb195" />
    <path d="M94 47c5-5 13-7 20-5" stroke="#ffd3b1" strokeWidth="4" strokeLinecap="round" />
    <rect x="89" y="53" width="52" height="27" rx="13" fill="#285365" stroke="#e8c897" strokeWidth="4" />
    <path d="M115 54v25" stroke="#e8c897" strokeWidth="3" />
    <circle cx="103" cy="65" r="4" fill="#e9fff6" /><circle cx="129" cy="65" r="4" fill="#e9fff6" />
    <circle cx="104" cy="65" r="2" fill="#19384c" /><circle cx="130" cy="65" r="2" fill="#19384c" />
    <path d="M110 86c4 3 8 3 11-1" stroke="#a45a5b" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="97" cy="82" r="4" fill="#f58d83" /><circle cx="132" cy="81" r="4" fill="#f58d83" />
    <path d="M78 94c22 17 50 19 69 1" stroke="#bdd6b8" strokeWidth="7" strokeLinecap="round" />
    <path d="M92 114c-10 3-19 0-23-7" stroke="#ffb195" strokeWidth="9" strokeLinecap="round" />
    <path d="m65 99 3 9-9-2" stroke="#ffc9a4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="170" cy="74" r="5" stroke="#9ae2dc" strokeWidth="1.5" opacity=".8" /><circle cx="181" cy="55" r="3" stroke="#9ae2dc" opacity=".55" />
  </svg>;
}

export default function OceanScene({ depth, maxDepth = 7000, diving = false }: OceanSceneProps) {
  const id = useId().replaceAll(':', '');
  const safeDepth = Number.isFinite(depth) ? Math.max(0, depth) : 0;
  const maximum = Number.isFinite(maxDepth) && maxDepth > 0 ? maxDepth : 7000;
  const progress = Math.min(1, safeDepth / maximum);
  const zone = safeDepth === 0 ? 'Superfície' : safeDepth < 1000 ? 'Zona iluminada' : safeDepth < 3000 ? 'Zona do crepúsculo' : safeDepth < 6000 ? 'Zona abissal' : 'O grande abismo';
  const tickStep = Math.ceil(maximum / 7000) * 1000;
  const ticks = Array.from({ length: Math.floor(maximum / tickStep) + 1 }, (_, index) => index * tickStep);
  if (ticks[ticks.length - 1] !== maximum) ticks.push(maximum);
  const formattedDepth = new Intl.NumberFormat('pt-BR').format(safeDepth);

  return <section className={`ocean-scene ${diving ? 'is-diving' : ''}`} aria-label={`Sua expedição: ${formattedDepth} metros. ${zone}.`} style={{ '--dive-progress': progress } as CSSProperties}>
    <div className="ocean-scene-heading"><span className="ocean-kicker"><span />SUA EXPEDIÇÃO</span><span className="ocean-compass" aria-hidden="true">N <svg viewBox="0 0 24 24" width="17" height="17"><path d="m12 2 5 16-5-3-5 3Z" fill="currentColor" /><path d="M12 3v12" stroke="#063245" /></svg></span></div>
    <div className="ocean-depth"><strong>{formattedDepth}<span> m</span></strong><span>{zone}</span></div>
    <svg className="ocean-backdrop" viewBox="0 0 420 600" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-ray`} x1="0" y1="0" x2=".3" y2="1"><stop stopColor="#b8fff0" stopOpacity=".18" /><stop offset="1" stopColor="#99ede8" stopOpacity="0" /></linearGradient>
        <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#174d56" /><stop offset="1" stopColor="#092b39" /></linearGradient>
      </defs>
      <g className="ocean-light-rays" fill={`url(#${id}-ray)`}><path d="m90 0 150 0 85 460-200 0Z" /><path d="m20 0 35 0 75 410-100 0Z" /><path d="m300 0 24 0 96 310-58 50Z" /></g>
      <g className="ocean-waves" fill="none" stroke="#99ede8"><path d="M-20 154q48-13 96 0t96 0 96 0 96 0 96 0" opacity=".25" /><path d="M-40 163q60-13 120 0t120 0 120 0 120 0" opacity=".12" /></g>
      <g className="ocean-fish-school" fill="#a4e3d5" opacity=".25"><path d="m290 253 10-6v12Zm10 0c5-8 18-8 24 0-6 8-19 8-24 0m-20 22 8-5v10Zm8 0c4-6 15-6 20 0-5 6-16 6-20 0m39-8 8-5v10Zm8 0c4-6 15-6 20 0-5 6-16 6-20 0" /><path d="m69 384-9-5v10Zm-9 0c-5-7-17-7-23 0 6 7 18 7 23 0m27 20-7-4v8Zm-7 0c-4-5-13-5-17 0 4 5 13 5 17 0" opacity=".5" /></g>
      <g fill="#8ecfc6"><circle cx="77" cy="230" r="1.2" opacity=".6" /><circle cx="219" cy="270" r="1" opacity=".5" /><circle cx="324" cy="349" r="1.2" opacity=".4" /><circle cx="164" cy="437" r="1.3" opacity=".45" /><circle cx="278" cy="477" r="1" opacity=".7" /><circle cx="112" cy="326" r="1" opacity=".4" /><circle cx="355" cy="190" r="1" opacity=".4" /><circle cx="246" cy="365" r="1" opacity=".4" /></g>
      <path d="M-10 557c52-25 78 10 129 1 59-11 104-6 148-1 59 6 96-14 163-6v59H-10Z" fill={`url(#${id}-floor)`} />
      <g className="ocean-seaweed" stroke="#397679" strokeWidth="5" strokeLinecap="round" fill="none" opacity=".65"><path d="M27 569c13-32-8-47 3-70m4 69c24-33 1-47 15-61m-27 58c-7-25-19-29-12-50" /><path d="M377 570c-11-29 11-47 2-73m8 71c11-20-2-35 12-50m-29 50c-18-17-5-33-17-45" /></g>
      <g stroke="#ac7d79" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".65"><path d="M81 570v-33m0 18-13-12v-10m13 14 13-14m-13 4-7-9m20 5v-10m-13 46 16-12" /></g>
      <path d="m316 561 5-9 5 8 10 1-8 6 1 10-8-5-9 5 2-10-8-6Z" fill="#b88b71" opacity=".7" />
      <ellipse cx="175" cy="576" rx="18" ry="5" fill="#537679" opacity=".4" /><ellipse cx="251" cy="587" rx="24" ry="4" fill="#537679" opacity=".3" />
    </svg>
    <div className="ocean-ruler" aria-hidden="true">{ticks.map((tick) => <span className="ocean-tick" style={{ top: `${tick / maximum * 100}%` }} key={tick}><i /><span>{new Intl.NumberFormat('pt-BR').format(tick)}</span></span>)}<span className="ocean-depth-marker" /></div>
    <div className="ocean-diver-position"><div className="ocean-diver-bob"><ShrimpExplorer /></div><span className="ocean-diver-glow" /></div>
    <div className="ocean-bubbles" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <i key={index} style={{ '--bubble-index': index } as CSSProperties} />)}</div>
    <div className="ocean-bottom-label"><span aria-hidden="true">✦</span> Um palpite. Um mergulho.</div>
  </section>;
}
