// app.jsx — main React app for 振り子エイム prototype
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ─── Tweakable defaults ────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#d21e1e",
  "trailStyle": "glow",
  "feedbackStyle": "ring",
  "monoNumerics": true,
  "trailScoring": true
}/*EDITMODE-END*/;

// ─── Difficulty profiles — 3 tiers, separately configurable for 2-bob and 3-bob
const PROFILES = {
  '2-easy':   { bobs: 2, label: 'EASY',   tier: 'easy',   lengths: [1.0, 0.8],      jitterDeg: 90 },
  '2-normal': { bobs: 2, label: 'NORMAL', tier: 'normal', lengths: [1.0, 0.6],      jitterDeg: 60 },
  '2-hard':   { bobs: 2, label: 'HARD',   tier: 'hard',   lengths: [1.0, 0.4],      jitterDeg: 45 },
  '3-easy':   { bobs: 3, label: 'EASY',   tier: 'easy',   lengths: [1.0, 0.8, 0.6], jitterDeg: 75 },
  '3-normal': { bobs: 3, label: 'NORMAL', tier: 'normal', lengths: [1.0, 0.7, 0.5], jitterDeg: 50 },
  '3-hard':   { bobs: 3, label: 'HARD',   tier: 'hard',   lengths: [1.0, 0.5, 0.3], jitterDeg: 35 },
};

const HS_KEY = 'furiko-aim-highscores-v2';
const loadHS = () => { try { return JSON.parse(localStorage.getItem(HS_KEY) || '{}'); } catch { return {}; } };
const saveHS = (data) => { try { localStorage.setItem(HS_KEY, JSON.stringify(data)); } catch {} };
const seedDemoHS = () => {
  const cur = loadHS();
  const seeds = { '2-easy': 4823, '2-normal': 3127, '2-hard': 2045, '3-easy': 2890, '3-normal': 2104, '3-hard': 1342 };
  for (const k in seeds) if (!cur[k]) cur[k] = seeds[k];
  saveHS(cur);
  return cur;
};

const SETTINGS_KEY = 'furiko-aim-settings-v1';
const loadSettings = () => {
  try { return { mouseSensitivity: 1.0, countdown: 3, showFps: false, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; }
  catch { return { mouseSensitivity: 1.0, countdown: 3, showFps: false }; }
};
const saveSettings = (s) => { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {} };

// ═══════════════════════════════════════════════════════════════════════════
// App
// ═══════════════════════════════════════════════════════════════════════════
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useState('title');
  const [mode, setMode] = useState(null);
  const [diffBobs, setDiffBobs] = useState(2);
  const [diffTier, setDiffTier] = useState('normal');
  const profileKey = `${diffBobs}-${diffTier}`;
  const [customCfg, setCustomCfg] = useState({
    bobs: 2,
    lengths: [1.0, 0.7, 0.5],
    angles: [Math.PI - 0.6, Math.PI + 0.4, Math.PI - 0.2],
  });
  const [lastResult, setLastResult] = useState(null);
  const [hs, setHS] = useState(() => seedDemoHS());
  const settings = { mouseSensitivity: 1.0, countdown: 3 };

  const runConfig = useMemo(() => {
    if (mode === 'custom') {
      return {
        lengths: customCfg.lengths.slice(0, customCfg.bobs),
        angles: customCfg.angles.slice(0, customCfg.bobs),
        label: 'CUSTOM',
        scorable: true,
        profileKey: `custom-${customCfg.bobs}`,
      };
    }
    const p = PROFILES[profileKey];
    if (!p) return null;
    const jitter = (p.jitterDeg * Math.PI) / 180;
    const angles = p.lengths.map(() => Math.PI + (Math.random() - 0.5) * 2 * jitter);
    return {
      lengths: p.lengths,
      angles,
      label: `${p.bobs}-${p.label}`,
      scorable: true,
      profileKey,
    };
  }, [mode, profileKey, customCfg, screen === 'game']);

  const finishGame = (finalScore) => {
    let isNew = false;
    if (runConfig && runConfig.profileKey) {
      const cur = loadHS();
      if (!cur[runConfig.profileKey] || finalScore > cur[runConfig.profileKey]) {
        cur[runConfig.profileKey] = Math.round(finalScore);
        saveHS(cur); setHS(cur); isNew = true;
      }
    }
    setLastResult({ score: Math.round(finalScore), isNew, mode, profileKey: runConfig ? runConfig.profileKey : null });
    setScreen('result');
  };

  const goTitle = () => { setScreen('title'); setMode(null); };
  const tweakProps = { accent: t.accent, trailStyle: t.trailStyle, feedbackStyle: t.feedbackStyle, trailScoring: t.trailScoring };

  return (
    <div className="app" data-mono={t.monoNumerics ? 'true' : 'false'} style={{ '--accent': t.accent }}>
      <BackdropGrid />

      {screen === 'title' && <TitleScreen onStart={() => setScreen('mode')} tweakProps={tweakProps} />}
      {screen === 'mode' && <ModeScreen
        onPick={(m) => { setMode(m); setScreen(m === 'normal' ? 'difficulty' : 'custom'); }}
        onBack={goTitle} />}
      {screen === 'difficulty' && <DifficultyScreen
        hs={hs} bobs={diffBobs} tier={diffTier}
        onSetBobs={setDiffBobs} onSetTier={setDiffTier}
        onStart={() => setScreen('game')} onBack={() => setScreen('mode')}
        tweakProps={tweakProps} />}
      {screen === 'custom' && <CustomScreen
        cfg={customCfg} onChange={setCustomCfg}
        onStart={() => setScreen('game')} onBack={() => setScreen('mode')}
        tweakProps={tweakProps} />}
      {screen === 'game' && runConfig && <GameScreen
        config={runConfig} tweakProps={tweakProps} settings={settings}
        modeLabel={mode === 'custom' ? 'CUSTOM' : runConfig.label}
        onFinish={finishGame} onAbort={goTitle} />}
      {screen === 'result' && lastResult && <ResultScreen
        result={lastResult} hs={hs} tweakProps={tweakProps}
        onRetry={() => setScreen('game')} onTitle={goTitle} />}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Visuals" />
        <TweakColor label="Accent" value={t.accent} onChange={(v) => setTweak('accent', v)} />
        <TweakSelect label="Trail style" value={t.trailStyle}
          options={[
            {value:'glow', label:'Glow line'},
            {value:'particles', label:'Particles'},
            {value:'dual', label:'Dual (white core)'},
          ]} onChange={(v) => setTweak('trailStyle', v)} />
        <TweakSelect label="Feedback" value={t.feedbackStyle}
          options={[
            {value:'ring', label:'Cursor ring'},
            {value:'line', label:'Tether line'},
            {value:'pulse', label:'Vignette pulse'},
            {value:'all', label:'All combined'},
            {value:'none', label:'None (minimal)'},
          ]} onChange={(v) => setTweak('feedbackStyle', v)} />
        <TweakToggle label="Mono numerics" value={t.monoNumerics} onChange={(v) => setTweak('monoNumerics', v)} />
        <TweakSection label="Scoring" />
        <TweakToggle label="Trail-tracing scoring" value={t.trailScoring} onChange={(v) => setTweak('trailScoring', v)} />
      </TweaksPanel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Shared icons & chrome
// ═══════════════════════════════════════════════════════════════════════════
function BackdropGrid() { return <div className="backdrop" aria-hidden="true" />; }
function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}
function PauseIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>; }
function PlayIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z"/></svg>; }

function TopChrome({ left, right }) {
  return (
    <div className="chrome">
      <div className="chrome-l">{left}</div>
      <div className="chrome-r">{right}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Title — chrome stripped
// ═══════════════════════════════════════════════════════════════════════════
function TitleScreen({ onStart, tweakProps }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Enter') onStart(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStart]);

  return (
    <div className="screen title-screen">
      <div className="title-stage">
        <div className="title-pendulum">
          <PendulumCanvas
            lengths={[1, 0.7]} ambient showCursor={false}
            accent={tweakProps.accent} trailStyle={tweakProps.trailStyle} feedbackStyle="none" />
        </div>
        <div className="title-text">
          <h1 className="hero-title">
            振<span className="accent">り</span>子<br/>エイム
          </h1>
          <p className="hero-sub">予測不能な振り子の軌跡を辿る</p>
          <div className="cta-row">
            <button className="btn btn-primary" onClick={onStart}>
              <span>START</span><span className="btn-arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. Mode
// ═══════════════════════════════════════════════════════════════════════════
function ModeScreen({ onPick, onBack }) {
  return (
    <div className="screen pad">
      <TopChrome
        left={<button className="link-back" onClick={onBack}>← BACK</button>}
        right={<span className="muted mono small">02 / MODE</span>} />
      <div className="centered-stack">
        <div className="kicker mono">SELECT MODE</div>
        <h2 className="screen-title">どう遊ぶ？</h2>
        <div className="mode-grid">
          <ModeCard tag="01" title="NORMAL" jp="ノーマル"
            desc="プリセット難易度で挑戦。ハイスコア記録対象。"
            meta={['2-BOB / 3-BOB × EASY · NORMAL · HARD', 'CHAOS-VERIFIED', 'HIGH SCORE: ON']}
            onClick={() => onPick('normal')} primary />
          <ModeCard tag="02" title="CUSTOM" jp="カスタム"
            desc="おもり数・ロッド長・初期角度を自由設定。記録対象外。"
            meta={['BOBS: 2 / 3', 'LENGTHS · ANGLES', 'HIGH SCORE: OFF']}
            onClick={() => onPick('custom')} />
        </div>
      </div>
    </div>
  );
}
function ModeCard({ tag, title, jp, desc, meta, onClick, primary }) {
  return (
    <button className={`mode-card${primary ? ' primary' : ''}`} onClick={onClick}>
      <div className="mode-card-top">
        <span className="mono small muted">{tag}</span>
        <span className="mode-card-arrow">→</span>
      </div>
      <div className="mode-card-titles">
        <div className="mode-card-jp">{jp}</div>
        <div className="mode-card-en mono">{title}</div>
      </div>
      <p className="mode-card-desc">{desc}</p>
      <ul className="mode-card-meta mono small">
        {meta.map((m, i) => <li key={i}>· {m}</li>)}
      </ul>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. Difficulty — 2×3 grid (rows = bob count, cols = tier)
// ═══════════════════════════════════════════════════════════════════════════
function DifficultyScreen({ hs, bobs, tier, onSetBobs, onSetTier, onStart, onBack }) {
  const sel = PROFILES[`${bobs}-${tier}`];
  return (
    <div className="screen pad">
      <TopChrome
        left={<button className="link-back" onClick={onBack}>← BACK</button>}
        right={<span className="muted mono small">03 / DIFFICULTY</span>} />
      <div className="centered-stack wide">
        <div className="kicker mono">NORMAL MODE</div>
        <h2 className="screen-title">難易度を選択</h2>

        <div className="bobs-toggle">
          <span className="bobs-toggle-lbl mono small muted">PENDULUM</span>
          <div className="seg lg-seg">
            {[2, 3].map(n => (
              <button key={n} className={`seg-btn${bobs === n ? ' on' : ''}`}
                onClick={() => onSetBobs(n)}>{n}-BOB</button>
            ))}
          </div>
        </div>

        <div className="diff-grid">
          {['easy', 'normal', 'hard'].map(t => {
            const key = `${bobs}-${t}`;
            const data = PROFILES[key];
            return (
              <DifficultyCard key={key} dKey={key} data={data}
                selected={tier === t} hs={hs[key]} onClick={() => onSetTier(t)} />
            );
          })}
        </div>

        <div className="diff-cta">
          <span className="muted mono small">SELECTED · {sel.bobs}-{sel.label}</span>
          <button className="btn btn-primary lg" onClick={onStart}>
            <span>START</span><span className="btn-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function DifficultyCard({ dKey, data, selected, hs, onClick }) {
  return (
    <button className={`diff-card${selected ? ' selected' : ''}`} onClick={onClick}>
      <DiffPreview lengths={data.lengths} jitterDeg={data.jitterDeg} />
      <div className="diff-card-foot">
        <div className="diff-foot-row">
          <span className="muted mono xs">RATIO</span>
          <span className="mono xs">{data.lengths.join(':')}</span>
        </div>
        <div className="diff-foot-row">
          <span className="muted mono xs">JITTER</span>
          <span className="mono xs">±{data.jitterDeg}°</span>
        </div>
        <div className="diff-foot-row hi">
          <span className="muted mono xs">HI-SCORE</span>
          <span className="mono xs accent-text">{hs ? hs.toLocaleString() : '—'}</span>
        </div>
      </div>
      {selected && <div className="diff-selected-bar" />}
    </button>
  );
}

function DiffPreview({ lengths, jitterDeg }) {
  const svgSize = 120;
  const total = lengths.reduce((a,b)=>a+b,0);
  const r = svgSize * 0.40;
  const scale = r / total;
  const cx = svgSize/2, cy = svgSize/2;
  let x = cx, y = cy;
  const pts = [{x, y}];
  for (const L of lengths) { y -= L * scale; pts.push({x, y}); }
  const jitter = (jitterDeg * Math.PI)/180;
  const arcX1 = cx + Math.sin(-jitter) * r;
  const arcY1 = cy - Math.cos(-jitter) * r;
  const arcX2 = cx + Math.sin(jitter) * r;
  const arcY2 = cy - Math.cos(jitter) * r;
  const largeArc = jitterDeg > 90 ? 1 : 0;
  return (
    <div className="diff-preview">
      <svg viewBox={`0 0 ${svgSize} ${svgSize}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 3"/>
        <path d={`M ${arcX1} ${arcY1} A ${r} ${r} 0 ${largeArc} 1 ${arcX2} ${arcY2}`}
          stroke="var(--accent)" strokeWidth="1.2" fill="none" opacity="0.5"/>
        {pts.slice(1).map((p, i) => (
          <line key={i} x1={pts[i].x} y1={pts[i].y} x2={p.x} y2={p.y}
            stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
        ))}
        {pts.map((p, i) => (
          <circle key={`b${i}`} cx={p.x} cy={p.y}
            r={i === 0 ? 1.6 : (i === pts.length-1 ? 3.5 : 2.6)}
            fill={i === pts.length-1 ? '#fff' : 'rgba(255,255,255,0.65)'}/>
        ))}
        {pts.length > 1 && (
          <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="5.5"
            fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.7"/>
        )}
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. Custom — frozen by default, freeze toggle, START as floating CTA
// ═══════════════════════════════════════════════════════════════════════════
function CustomScreen({ cfg, onChange, onStart, onBack, tweakProps }) {
  const [previewPlaying, setPreviewPlaying] = useState(false);

  const setBobs = (n) => onChange({ ...cfg, bobs: n });
  const setLength = (i, v) => {
    const lengths = [...cfg.lengths]; lengths[i] = v;
    onChange({ ...cfg, lengths });
  };
  const setAngle = (i, rad) => {
    const angles = [...cfg.angles]; angles[i] = rad;
    onChange({ ...cfg, angles });
  };

  return (
    <div className="screen pad">
      <TopChrome
        left={<button className="link-back" onClick={onBack}>← BACK</button>}
        right={<span className="muted mono small">02b / CUSTOM</span>} />

      <div className="custom-layout">
        <div className="custom-controls">
          <div className="kicker mono">CUSTOM SETUP</div>
          <h2 className="screen-title">パラメータを設定</h2>

          <div className="ctrl-block">
            <div className="ctrl-label">
              <span>おもり数</span>
              <span className="muted mono small">N = {cfg.bobs}</span>
            </div>
            <div className="seg">
              {[2, 3].map(n => (
                <button key={n} className={`seg-btn${cfg.bobs === n ? ' on' : ''}`}
                  onClick={() => setBobs(n)}>{n}</button>
              ))}
            </div>
          </div>

          {Array.from({ length: cfg.bobs }).map((_, i) => (
            <div key={i} className="ctrl-block">
              <div className="ctrl-label">
                <span>ロッド {i + 1} <span className="muted mono small">L<sub>{i+1}</sub></span></span>
                <span className="mono small accent-text">{cfg.lengths[i].toFixed(2)}</span>
              </div>
              <CustomSlider min={0.3} max={1.5} step={0.05} value={cfg.lengths[i]}
                onChange={(v) => setLength(i, v)} />
              <div className="ctrl-label tight">
                <span>初期角度 <span className="muted mono small">θ<sub>{i+1}</sub></span></span>
                <span className="mono small accent-text">{Math.round(((cfg.angles[i] - Math.PI) * 180) / Math.PI)}°</span>
              </div>
              <AngleDial angle={cfg.angles[i]} onChange={(rad) => setAngle(i, rad)} />
            </div>
          ))}
        </div>

        <div className="custom-preview">
          <div className="preview-frame">
            <div className="preview-canvas">
              <PendulumCanvas
                lengths={cfg.lengths.slice(0, cfg.bobs)}
                initialAngles={cfg.angles.slice(0, cfg.bobs)}
                ambient showCursor={false}
                paused={!previewPlaying}
                accent={tweakProps.accent} trailStyle={tweakProps.trailStyle} feedbackStyle="none" />
            </div>
            <div className="preview-meta-bar mono small muted">
              <span>N={cfg.bobs}</span>
              <span>{previewPlaying ? '◉ LIVE' : '◯ STILL'}</span>
            </div>
          </div>

          <div className="custom-cta-row">
            <button className={`preview-toggle-pill${previewPlaying ? ' on' : ''}`}
              onClick={() => setPreviewPlaying(p => !p)}>
              {previewPlaying ? <PauseIcon /> : <PlayIcon />}
              <span className="mono small">{previewPlaying ? 'STOP' : 'PREVIEW'}</span>
            </button>
            <button className="btn btn-primary lg start-glow" onClick={onStart}>
              <span>START</span><span className="btn-arrow">→</span>
            </button>
          </div>
          <div className="custom-cta-meta muted mono xs">
            記録対象 / HIGH SCORE TRACKED · CUSTOM-{cfg.bobs}
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomSlider({ min, max, step, value, onChange }) {
  const trackRef = useRef(null);
  const dragging = useRef(false);
  const pct = ((value - min) / (max - min)) * 100;

  const updateFromX = (clientX) => {
    if (!trackRef.current) return;
    const r = trackRef.current.getBoundingClientRect();
    let f = (clientX - r.left) / r.width;
    f = Math.max(0, Math.min(1, f));
    let v = min + f * (max - min);
    v = Math.round(v / step) * step;
    onChange(parseFloat(v.toFixed(4)));
  };
  useEffect(() => {
    const onMove = (e) => { if (dragging.current) updateFromX(e.clientX); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  });

  // tick marks
  const ticks = 11;
  return (
    <div className="cslider" ref={trackRef}
         onMouseDown={(e) => { dragging.current = true; updateFromX(e.clientX); }}>
      <div className="cslider-track">
        {Array.from({ length: ticks }).map((_, i) => (
          <span key={i} className="cslider-tick" style={{ left: `${(i / (ticks - 1)) * 100}%` }} />
        ))}
        <div className="cslider-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="cslider-handle" style={{ left: `${pct}%` }}>
        <span className="cslider-handle-line" />
      </div>
    </div>
  );
}

function AngleDial({ angle, onChange }) {
  const ref = useRef(null);
  const dragging = useRef(false);
  const size = 110;

  const updateFromEvent = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    onChange(Math.atan2(dx, dy));
  };
  useEffect(() => {
    const onMove = (e) => { if (dragging.current) updateFromEvent(e); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const r = size * 0.40;
  const cx = size/2, cy = size/2;
  const bx = cx + Math.sin(angle) * r;
  const by = cy + Math.cos(angle) * r;

  return (
    <div className="angle-dial" ref={ref}
         onMouseDown={(e) => { dragging.current = true; updateFromEvent(e); }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)"/>
        {/* tick marks every 30° */}
        {Array.from({length:12}).map((_,i)=>{
          const a = (i*30*Math.PI)/180;
          const x1 = cx + Math.sin(a)*(r-3);
          const y1 = cy - Math.cos(a)*(r-3);
          const x2 = cx + Math.sin(a)*(r+1);
          const y2 = cy - Math.cos(a)*(r+1);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.18)" strokeWidth="0.6"/>
        })}
        <text x={cx} y={cy-r-4} textAnchor="middle" fill="rgba(255,255,255,0.4)"
              fontSize="7" fontFamily="JetBrains Mono, monospace">UP</text>
        <line x1={cx} y1={cy} x2={bx} y2={by} stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r="2" fill="rgba(255,255,255,0.5)"/>
        <circle cx={bx} cy={by} r="5" fill="#fff"/>
        <circle cx={bx} cy={by} r="8" fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.7"/>
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. Game — countdown, pause, ESC, top-right precision
// ═══════════════════════════════════════════════════════════════════════════
function GameScreen({ config, tweakProps, settings, modeLabel, onFinish, onAbort }) {
  const TOTAL = 60;
  const [phase, setPhase] = useState('countdown'); // countdown | playing | paused | ending
  const [count, setCount] = useState(settings.countdown || 3);
  const [remain, setRemain] = useState(TOTAL);
  const [score, setScore] = useState(0);
  const [live, setLive] = useState(0);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });
  const startRef = useRef(0);
  const pausedAtRef = useRef(0);
  const totalPausedRef = useRef(0);
  const scoreAccRef = useRef(0);
  const lastTickRef = useRef(performance.now());
  const finishedRef = useRef(false);

  // Countdown: 3 → 2 → 1 → GO → playing
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (count <= 0) {
      const isResume = startRef.current !== 0;
      if (isResume) {
        // include this countdown time in paused offset so timer doesn't lose seconds
        totalPausedRef.current += performance.now() - pausedAtRef.current;
      } else {
        startRef.current = performance.now();
        totalPausedRef.current = 0;
      }
      lastTickRef.current = performance.now();
      setPhase('playing');
      return;
    }
    const id = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, count]);

  // Game tick
  useEffect(() => {
    if (phase !== 'playing') return;
    let raf;
    const tick = (now) => {
      const elapsed = (now - startRef.current - totalPausedRef.current) / 1000;
      const left = Math.max(0, TOTAL - elapsed);
      setRemain(left);
      setScore(scoreAccRef.current);
      if (left <= 0 && !finishedRef.current) {
        finishedRef.current = true;
        onFinish(scoreAccRef.current);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, onFinish]);

  // Resume: re-trigger 3-2-1 countdown
  const togglePause = () => {
    if (phase === 'playing') { setPhase('paused'); pausedAtRef.current = performance.now(); }
    else if (phase === 'paused') {
      // pausedAtRef stays — countdown effect will roll the full pause+countdown duration into totalPausedRef
      setCount(3);
      setPhase('countdown');
    }
  };

  // ESC handler
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (phase === 'playing') togglePause();
        else if (phase === 'paused') togglePause();
      } else if (e.key === ' ') {
        e.preventDefault();
        if (phase === 'playing' || phase === 'paused') togglePause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  const onScoreChange = useCallback((s) => {
    setLive(s);
    if (config.scorable && phase === 'playing') {
      const now = performance.now();
      const dt = Math.min((now - lastTickRef.current) / 1000, 1/30);
      lastTickRef.current = now;
      scoreAccRef.current += s * dt * 100;
    }
  }, [config.scorable, phase]);

  const showVignette = tweakProps.feedbackStyle === 'pulse' || tweakProps.feedbackStyle === 'all';
  const isPaused = phase === 'paused' || phase === 'countdown';

  return (
    <div className="screen game-screen">
      <div className="game-canvas-wrap">
        <PendulumCanvas
          lengths={config.lengths} initialAngles={config.angles}
          accent={tweakProps.accent} trailStyle={tweakProps.trailStyle}
          feedbackStyle={phase === 'playing' ? tweakProps.feedbackStyle : 'none'}
          paused={isPaused}
          showCursor={phase === 'playing'}
          trailScoring={tweakProps.trailScoring && phase === 'playing'}
          onScoreChange={onScoreChange}
          onTipPosition={setTipPos} />
        {showVignette && phase === 'playing' && (
          <div className="vignette-pulse"
               style={{ opacity: live * 0.85, '--accent': tweakProps.accent }} />
        )}
      </div>

      {/* HUD top */}
      <div className="hud hud-top">
        <div className="hud-block">
          <div className="hud-label mono">MODE</div>
          <div className="hud-value">{modeLabel}</div>
        </div>
        <div className="hud-center">
          <div className="hud-label mono">TIME</div>
          <div className="hud-time mono">{remain.toFixed(1)}<span className="hud-unit">s</span></div>
          <TimeBar pct={remain / TOTAL} />
        </div>
        <div className="hud-block right">
          <div className="hud-label mono">SCORE</div>
          <div className="hud-score mono">{Math.round(score).toLocaleString()}</div>
          <div className="hud-precision">
            <PrecisionMeter value={live} accent={tweakProps.accent} />
            <span className="mono xs">{(live*100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* HUD bottom — controls only */}
      <div className="hud hud-bottom">
        <button className="ctrl-pill" onClick={togglePause}
          disabled={phase === 'countdown'}>
          {phase === 'paused' ? <PlayIcon /> : <PauseIcon />}
          <span className="mono small">{phase === 'paused' ? 'RESUME' : 'PAUSE'}</span>
          <span className="kbd mono xs">ESC</span>
        </button>
        <button className="ctrl-pill ghost" onClick={onAbort}>
          <span className="mono small">ABORT</span>
        </button>
      </div>

      {/* Countdown overlay (initial + resume) — pivot stays fully visible; marker tracks the tip */}
      {phase === 'countdown' && (
        <div className="countdown-overlay">
          <div className="tip-marker" style={{ left: tipPos.x, top: tipPos.y }}>
            <div className="tip-marker-ring" />
            <div className="tip-marker-label">AIM HERE</div>
          </div>
          <div className="countdown-num mono" key={count}>
            {count > 0 ? count : 'GO'}
          </div>
          <div className="countdown-sub mono small muted">{remain < TOTAL ? 'RESUMING' : 'GET READY'} · {modeLabel}</div>
        </div>
      )}

      {/* Pause overlay */}
      {phase === 'paused' && (
        <div className="pause-overlay">
          <div className="pause-card">
            <div className="kicker mono">PAUSED</div>
            <div className="pause-stats">
              <div><div className="muted mono xs">TIME LEFT</div><div className="mono lg">{remain.toFixed(1)}s</div></div>
              <div><div className="muted mono xs">SCORE</div><div className="mono lg accent-text">{Math.round(score).toLocaleString()}</div></div>
            </div>
            <div className="pause-actions">
              <button className="btn btn-primary" onClick={togglePause}>
                <span>RESUME</span><span className="btn-arrow">→</span>
              </button>
              <button className="btn btn-ghost" onClick={onAbort}>ABORT</button>
            </div>
            <div className="muted mono xs">[ESC] / [SPACE] to resume</div>
          </div>
        </div>
      )}
    </div>
  );
}

function TimeBar({ pct }) {
  return (
    <div className="time-bar">
      <div className="time-bar-fill" style={{ transform: `scaleX(${pct})` }} />
    </div>
  );
}

function PrecisionMeter({ value, accent }) {
  const cells = 16;
  const lit = Math.round(value * cells);
  return (
    <div className="meter">
      {Array.from({ length: cells }).map((_, i) => (
        <div key={i} className={`meter-cell${i < lit ? ' on' : ''}`} style={{ '--accent': accent }} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. Result
// ═══════════════════════════════════════════════════════════════════════════
function ResultScreen({ result, hs, tweakProps, onRetry, onTitle }) {
  const isCustom = result.mode === 'custom';
  const profile = result.profileKey ? PROFILES[result.profileKey] : null;
  const prevHS = !isCustom && result.profileKey ? (hs[result.profileKey] || 0) : null;
  return (
    <div className="screen pad">
      <TopChrome
        left={<span className="muted mono small">06 / RESULT</span>}
        right={<span className="muted mono small">{isCustom ? 'CUSTOM' : (profile ? `${profile.bobs}-${profile.label}` : '')}</span>} />
      <div className="result-layout">
        <div className="result-main">
          {result.isNew && (
            <div className="new-record">
              <span className="new-record-dot" /><span className="mono">NEW RECORD</span>
            </div>
          )}
          <div className="kicker mono">FINAL SCORE</div>
          <div className="big-score mono">{result.score.toLocaleString()}</div>
          <div className="result-meta">
            {isCustom ? (
              <div className="result-meta-row">
                <span className="muted">記録対象外</span><span className="mono">CUSTOM RUN</span>
              </div>
            ) : (
              <>
                <div className="result-meta-row">
                  <span className="muted">難易度</span>
                  <span className="mono">{profile ? `${profile.bobs}-${profile.label}` : ''}</span>
                </div>
                <div className="result-meta-row">
                  <span className="muted">ハイスコア</span>
                  <span className="mono">
                    {result.isNew ? <span className="accent-text">{result.score.toLocaleString()}</span> : prevHS.toLocaleString()}
                  </span>
                </div>
                <div className="result-meta-row">
                  <span className="muted">プレイ時間</span><span className="mono">60.0s</span>
                </div>
              </>
            )}
          </div>
          <div className="result-cta">
            <button className="btn btn-primary" onClick={onRetry}>
              <span>RETRY</span><span className="btn-arrow">↻</span>
            </button>
            <button className="btn btn-ghost" onClick={onTitle}>BACK TO TITLE</button>
          </div>
        </div>

        <div className="result-side">
          <div className="result-stat">
            <div className="muted mono small">PERFECT SCORE</div>
            <div className="mono lg">6,000</div>
            <div className="muted mono small">100% × 60s</div>
          </div>
          <div className="result-bar">
            <div className="result-bar-fill" style={{ width: `${Math.min(100, (result.score/6000)*100).toFixed(1)}%` }} />
          </div>
          <div className="result-pct mono">
            {((result.score/6000)*100).toFixed(1)}<span className="muted">% of perfect</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Settings modal
// ═══════════════════════════════════════════════════════════════════════════
function _SettingsModal_unused({ settings, updateSetting, onClose, onResetHS }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="kicker mono" style={{margin:0}}>SETTINGS</div>
          <button className="modal-x" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-section">
          <div className="modal-section-h mono small">GAMEPLAY</div>
          <div className="modal-row">
            <div>
              <div className="modal-row-h">マウス感度</div>
              <div className="muted xs">表示用カーソルの追従感（1.0 = 等倍）</div>
            </div>
            <div className="modal-row-control">
              <CustomSlider min={0.5} max={2.0} step={0.05}
                value={settings.mouseSensitivity}
                onChange={(v) => updateSetting('mouseSensitivity', v)} />
              <span className="mono small accent-text">{settings.mouseSensitivity.toFixed(2)}×</span>
            </div>
          </div>

          <div className="modal-row">
            <div>
              <div className="modal-row-h">カウントダウン</div>
              <div className="muted xs">スタート前の準備時間</div>
            </div>
            <div className="seg">
              {[0, 3, 5].map(n => (
                <button key={n} className={`seg-btn${settings.countdown === n ? ' on' : ''}`}
                  onClick={() => updateSetting('countdown', n)}>{n}s</button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-section">
          <div className="modal-section-h mono small">DATA</div>
          <div className="modal-row">
            <div>
              <div className="modal-row-h">ハイスコア</div>
              <div className="muted xs">localStorageに保存。すべての難易度をリセット。</div>
            </div>
            <button className="btn btn-ghost small" onClick={onResetHS}>RESET</button>
          </div>
        </div>

        <div className="modal-foot muted mono xs">[ESC] to close</div>
      </div>
    </div>
  );
}

// ─── Mount ─────────────────────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
