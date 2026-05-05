// pendulum-physics.jsx
// Real double/triple pendulum simulation (RK4) used for the visual demo
// in the game screen. Pure functions — no React.

const G = 9.81;

// State: [θ1, ω1, θ2, ω2, ...] for n bobs
// Equations of motion derived from standard Lagrangian for an n-pendulum.
// For simplicity & correctness we use the closed-form double pendulum case
// (most relevant for the prototype), and a generic numeric solver for n=3.

function derivDouble(state, L1, L2, m1, m2) {
  const [t1, w1, t2, w2] = state;
  const d = t2 - t1;
  const sinD = Math.sin(d), cosD = Math.cos(d);
  const denom1 = (m1 + m2) * L1 - m2 * L1 * cosD * cosD;
  const denom2 = (L2 / L1) * denom1;

  const a1 = (m2 * L1 * w1 * w1 * sinD * cosD
            + m2 * G * Math.sin(t2) * cosD
            + m2 * L2 * w2 * w2 * sinD
            - (m1 + m2) * G * Math.sin(t1)) / denom1;

  const a2 = (-m2 * L2 * w2 * w2 * sinD * cosD
            + (m1 + m2) * G * Math.sin(t1) * cosD
            - (m1 + m2) * L1 * w1 * w1 * sinD
            - (m1 + m2) * G * Math.sin(t2)) / denom2;

  return [w1, a1, w2, a2];
}

// Generic n-pendulum acceleration solver via mass matrix (works for n=2 or 3).
function derivN(state, lengths, masses) {
  const n = lengths.length;
  const theta = [], omega = [];
  for (let i = 0; i < n; i++) { theta[i] = state[2*i]; omega[i] = state[2*i+1]; }

  // Build mass matrix M[i][j] and RHS b[i] s.t. M·alpha = b
  const M = Array.from({length:n}, () => new Array(n).fill(0));
  const b = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      // sum of masses from max(i,j) to n-1
      let mSum = 0;
      for (let k = Math.max(i,j); k < n; k++) mSum += masses[k];
      M[i][j] = mSum * lengths[j] * Math.cos(theta[i] - theta[j]);
    }
    let bi = 0;
    for (let j = 0; j < n; j++) {
      let mSum = 0;
      for (let k = Math.max(i,j); k < n; k++) mSum += masses[k];
      bi -= mSum * lengths[j] * omega[j] * omega[j] * Math.sin(theta[i] - theta[j]);
    }
    let mTail = 0;
    for (let k = i; k < n; k++) mTail += masses[k];
    bi -= mTail * G * Math.sin(theta[i]);
    b[i] = bi;
  }

  // Solve M·alpha = b via Gaussian elimination (n is 2 or 3)
  const A = M.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let k = i+1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[pivot][i])) pivot = k;
    [A[i], A[pivot]] = [A[pivot], A[i]];
    for (let k = i+1; k < n; k++) {
      const f = A[k][i] / A[i][i];
      for (let j = i; j <= n; j++) A[k][j] -= f * A[i][j];
    }
  }
  const alpha = new Array(n).fill(0);
  for (let i = n-1; i >= 0; i--) {
    let s = A[i][n];
    for (let j = i+1; j < n; j++) s -= A[i][j] * alpha[j];
    alpha[i] = s / A[i][i];
  }

  const out = new Array(2*n);
  for (let i = 0; i < n; i++) {
    out[2*i] = omega[i];
    out[2*i+1] = alpha[i];
  }
  return out;
}

function rk4Step(state, dt, lengths, masses) {
  const f = (s) => derivN(s, lengths, masses);
  const add = (a, b, k) => a.map((v, i) => v + k * b[i]);
  const k1 = f(state);
  const k2 = f(add(state, k1, dt/2));
  const k3 = f(add(state, k2, dt/2));
  const k4 = f(add(state, k3, dt));
  return state.map((v, i) => v + (dt/6) * (k1[i] + 2*k2[i] + 2*k3[i] + k4[i]));
}

// Public step API: advances `state` by `dt` (seconds) using `subSteps` RK4 substeps.
function stepPendulum(state, dt, lengths, masses, subSteps = 6) {
  const h = dt / subSteps;
  let s = state;
  for (let i = 0; i < subSteps; i++) s = rk4Step(s, h, lengths, masses);
  return s;
}

// Compute bob positions in physics coords (origin at pivot, y down = positive)
function bobPositions(state, lengths) {
  const n = lengths.length;
  const out = [{x: 0, y: 0}]; // pivot
  let x = 0, y = 0;
  for (let i = 0; i < n; i++) {
    const t = state[2*i];
    x += lengths[i] * Math.sin(t);
    y += lengths[i] * Math.cos(t);
    out.push({x, y});
  }
  return out;
}

Object.assign(window, { stepPendulum, bobPositions, derivDouble });
