// pendulum-canvas.jsx
// React component that renders the live pendulum + trail + cursor feedback.
// Used by the game screen and as a background "ambient" simulation on title.

const { useEffect, useRef, useState } = React;

function PendulumCanvas({
  lengths = [1, 0.7],
  initialAngles = null,
  accent = '#00ff88',
  trailStyle = 'glow',
  feedbackStyle = 'ring',
  showCursor = true,
  paused = false,
  onScoreChange = null,
  className = '',
  ambient = false,
  trailScoring = false,           // if true, also reward proximity to recent trail
  onTipPosition = null,           // optional: receive {x,y} of tip in CSS pixels
}) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const trailRef = useRef([]);
  const cursorRef = useRef({ x: -9999, y: -9999, inside: false });
  const lastScoreRef = useRef(0);
  const rafRef = useRef(0);

  // Initialize physics state when number of bobs changes — preserve angles when shrinking/growing
  useEffect(() => {
    const n = lengths.length;
    const masses = lengths.map(() => 1);
    let angles;
    if (initialAngles) {
      angles = initialAngles;
    } else {
      angles = lengths.map(() => Math.PI + (Math.random() - 0.5) * 1.2);
    }
    const s = new Array(n * 2).fill(0);
    for (let i = 0; i < n; i++) {
      s[2*i] = angles[i];
      s[2*i+1] = 0;
    }
    stateRef.current = { s, lengths: [...lengths], masses };
    trailRef.current = [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lengths.length]);

  // Seamless updates: when lengths or initial angles change, patch existing state in place
  useEffect(() => {
    const st = stateRef.current;
    if (!st || st.lengths.length !== lengths.length) return;
    st.lengths = [...lengths];
    if (initialAngles) {
      for (let i = 0; i < initialAngles.length; i++) {
        // only update angle when sim is paused (so live runs aren't yanked)
        if (paused) {
          st.s[2*i] = initialAngles[i];
          st.s[2*i+1] = 0;
        }
      }
      if (paused) trailRef.current = [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(lengths), JSON.stringify(initialAngles), paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let lastT = performance.now();

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(r.width * dpr);
      canvas.height = Math.floor(r.height * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      cursorRef.current.x = e.clientX - r.left;
      cursorRef.current.y = e.clientY - r.top;
      cursorRef.current.inside = true;
    };
    const onLeave = () => { cursorRef.current.inside = false; };
    if (showCursor && !ambient) {
      window.addEventListener('mousemove', onMove);
      canvas.addEventListener('mouseleave', onLeave);
    }

    const draw = (now) => {
      let dt = Math.min((now - lastT) / 1000, 1/30);
      lastT = now;

      const st = stateRef.current;
      if (!st) { rafRef.current = requestAnimationFrame(draw); return; }

      if (paused) dt = 0;
      else st.s = window.stepPendulum(st.s, dt, st.lengths, st.masses, 8);

      const w = canvas.width, h = canvas.height;
      const cx = w / 2, cy = h / 2;
      const totalLen = st.lengths.reduce((a, b) => a + b, 0);
      const fieldRadius = Math.min(w, h) * 0.42;
      const scale = fieldRadius / totalLen;

      const bobs = window.bobPositions(st.s, st.lengths).map(p => ({
        x: cx + p.x * scale, y: cy + p.y * scale,
      }));
      const tip = bobs[bobs.length - 1];

      // Push tip into trail only when running, and clear trail entirely when paused
      if (paused) {
        // shift timestamps so trail doesn't age out during pause
        const trailArr = trailRef.current;
        for (let i = 0; i < trailArr.length; i++) trailArr[i].t = now - (i * 16);
      } else {
        trailRef.current.push({ x: tip.x, y: tip.y, t: now });
      }
      const cutoff = now - 500; // shorter trail life so old paths don't visually pollute
      while (trailRef.current.length && trailRef.current[0].t < cutoff) trailRef.current.shift();
      const trail = trailRef.current;

      const sigmaPx = totalLen * scale * 0.06; // halved hit radius — tighter precision
      let score = 0;
      const c = cursorRef.current;
      const cursorOnCanvas = showCursor && !ambient && c.inside;
      const cursorPx = { x: c.x * dpr, y: c.y * dpr };
      const distToTip = Math.hypot(cursorPx.x - tip.x, cursorPx.y - tip.y);
      const inField = Math.hypot(cursorPx.x - cx, cursorPx.y - cy) <= fieldRadius;
      if (cursorOnCanvas && inField && !paused) {
        let tipScore = 0;
        if (distToTip < sigmaPx * 3) {
          tipScore = Math.exp(-(distToTip * distToTip) / (sigmaPx * sigmaPx));
        }
        let trailScore = 0;
        if (trailScoring && trail.length > 1) {
          const sigmaTrail = sigmaPx * 1.5;
          let minD = Infinity;
          // sample every other point for perf
          for (let i = 1; i < trail.length; i += 1) {
            const ax = trail[i-1].x, ay = trail[i-1].y;
            const bx = trail[i].x, by = trail[i].y;
            const dx = bx - ax, dy = by - ay;
            const len2 = dx*dx + dy*dy;
            let tParam = 0;
            if (len2 > 1e-6) tParam = ((cursorPx.x - ax)*dx + (cursorPx.y - ay)*dy) / len2;
            tParam = Math.max(0, Math.min(1, tParam));
            const px = ax + tParam*dx, py = ay + tParam*dy;
            const d = Math.hypot(cursorPx.x - px, cursorPx.y - py);
            if (d < minD) minD = d;
          }
          if (minD < sigmaTrail * 3) {
            trailScore = Math.exp(-(minD * minD) / (sigmaTrail * sigmaTrail)) * 0.55;
          }
        }
        score = Math.max(tipScore, trailScore);
      }
      lastScoreRef.current = score;
      onScoreChange && onScoreChange(score);
      // Report tip position in CSS pixels for overlays
      if (onTipPosition) onTipPosition({ x: tip.x / dpr, y: tip.y / dpr });

      // ─── Draw ──────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, w, h);

      // Field circle (very subtle)
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1 * dpr;
      ctx.setLineDash([4 * dpr, 6 * dpr]);
      ctx.beginPath();
      ctx.arc(cx, cy, fieldRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Pivot dot
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy, 3 * dpr, 0, Math.PI * 2);
      ctx.fill();

      // Trail (shorter life: cutoff = now - 500ms)
      if (trail.length > 1) {
        const trailWindow = 500;
        if (trailStyle === 'glow' || trailStyle === 'dual') {
          ctx.save();
          ctx.shadowColor = accent;
          ctx.shadowBlur = (ambient ? 6 : 14) * dpr;
          ctx.strokeStyle = accent;
          ctx.lineWidth = 1.5 * dpr;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          for (let i = 1; i < trail.length; i++) {
            const a = (trail[i].t - cutoff) / trailWindow;
            ctx.globalAlpha = Math.max(0, Math.min(1, a)) * (ambient ? 0.45 : 0.85);
            ctx.beginPath();
            ctx.moveTo(trail[i-1].x, trail[i-1].y);
            ctx.lineTo(trail[i].x, trail[i].y);
            ctx.stroke();
          }
          ctx.restore();
        }
        if (trailStyle === 'particles') {
          for (let i = 0; i < trail.length; i++) {
            const a = (trail[i].t - cutoff) / trailWindow;
            ctx.fillStyle = accent;
            ctx.globalAlpha = a * 0.9;
            ctx.beginPath();
            ctx.arc(trail[i].x, trail[i].y, (1.6 + a * 1.4) * dpr, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
        if (trailStyle === 'dual') {
          ctx.save();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 0.8 * dpr;
          ctx.lineCap = 'round';
          for (let i = 1; i < trail.length; i++) {
            const a = (trail[i].t - cutoff) / trailWindow;
            ctx.globalAlpha = a * 0.7;
            ctx.beginPath();
            ctx.moveTo(trail[i-1].x, trail[i-1].y);
            ctx.lineTo(trail[i].x, trail[i].y);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // Rods
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1.2 * dpr;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bobs[0].x, bobs[0].y);
      for (let i = 1; i < bobs.length; i++) ctx.lineTo(bobs[i].x, bobs[i].y);
      ctx.stroke();
      ctx.restore();

      // Bobs (intermediate)
      for (let i = 1; i < bobs.length - 1; i++) {
        ctx.fillStyle = '#e8e8e6';
        ctx.beginPath();
        ctx.arc(bobs[i].x, bobs[i].y, 5 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tip bob (target)
      const tipR = 8 * dpr;
      ctx.save();
      ctx.shadowColor = accent;
      ctx.shadowBlur = 10 * dpr * (0.4 + score * 0.6);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, tipR, 0, Math.PI * 2);
      ctx.fill();
      // accent inner ring
      ctx.shadowBlur = 0;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.2 * dpr;
      ctx.globalAlpha = 0.7 + score * 0.3;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, tipR + 3 * dpr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Cursor feedback
      if (cursorOnCanvas) {
        const showRing = feedbackStyle === 'ring' || feedbackStyle === 'all';
        const showLine = feedbackStyle === 'line' || feedbackStyle === 'all';
        const showPulse = feedbackStyle === 'pulse' || feedbackStyle === 'all';

        if (showLine && score > 0.01) {
          ctx.save();
          ctx.strokeStyle = accent;
          ctx.globalAlpha = 0.35 + score * 0.55;
          ctx.lineWidth = 1 * dpr;
          ctx.setLineDash([2 * dpr, 3 * dpr]);
          ctx.beginPath();
          ctx.moveTo(cursorPx.x, cursorPx.y);
          ctx.lineTo(tip.x, tip.y);
          ctx.stroke();
          ctx.restore();
        }
        if (showRing) {
          // ring radius shrinks as score rises (feels like locking on)
          const baseR = sigmaPx * 1.2;
          const r = baseR * (1 - score * 0.5);
          ctx.save();
          ctx.strokeStyle = score > 0.05 ? accent : 'rgba(255,255,255,0.35)';
          ctx.shadowColor = accent;
          ctx.shadowBlur = score * 18 * dpr;
          ctx.globalAlpha = 0.4 + score * 0.5;
          ctx.lineWidth = (1 + score * 1.5) * dpr;
          ctx.beginPath();
          ctx.arc(cursorPx.x, cursorPx.y, r, 0, Math.PI * 2);
          ctx.stroke();
          // inner crosshair tick
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.arc(cursorPx.x, cursorPx.y, 2 * dpr, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        if (showPulse && score > 0.1) {
          // Vignette pulse — handled in CSS overlay (see GameScreen)
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }, [accent, trailStyle, feedbackStyle, showCursor, paused, ambient, onScoreChange, trailScoring, onTipPosition]);

  return <canvas ref={canvasRef} className={className} style={{ width: '100%', height: '100%', display: 'block' }} />;
}

window.PendulumCanvas = PendulumCanvas;
