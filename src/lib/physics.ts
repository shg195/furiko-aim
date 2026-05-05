// physics.ts — n 振り子の運動方程式と RK4 数値積分（純関数）
//
// 状態は平坦配列 [θ1, ω1, θ2, ω2, ..., θn, ωn] で扱う（types.ts: PendulumState）。
// 角度の符号：鉛直下向きを θ=0、反時計回りを正（spec 4.1）。

import { GRAVITY, RK4_SUBSTEPS } from '../constants';
import type { PendulumState, Vec2 } from '../types';

/**
 * 状態 `state` の時間微分 `[ω1, α1, ω2, α2, ...]` を返す。
 * 一般化座標を θ_i として、ラグランジアンから導かれる質量行列 `M(θ)` と
 * RHS `b(θ, ω)` を組み立て、`M α = b` をガウス消去で解く。n=2,3 で動作。
 */
export function derivN(
  state: PendulumState,
  lengths: number[],
  masses: number[],
): PendulumState {
  const n = lengths.length;
  const theta = new Array<number>(n);
  const omega = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    theta[i] = state[2 * i];
    omega[i] = state[2 * i + 1];
  }

  const M: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  const b = new Array<number>(n).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let mSum = 0;
      for (let k = Math.max(i, j); k < n; k++) mSum += masses[k];
      M[i][j] = mSum * lengths[j] * Math.cos(theta[i] - theta[j]);
    }
    let bi = 0;
    for (let j = 0; j < n; j++) {
      let mSum = 0;
      for (let k = Math.max(i, j); k < n; k++) mSum += masses[k];
      bi -= mSum * lengths[j] * omega[j] * omega[j] * Math.sin(theta[i] - theta[j]);
    }
    let mTail = 0;
    for (let k = i; k < n; k++) mTail += masses[k];
    bi -= mTail * GRAVITY * Math.sin(theta[i]);
    b[i] = bi;
  }

  // 拡大係数行列 A = [M | b] でガウス消去（部分ピボット選択）
  const A: number[][] = M.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[pivot][i])) pivot = k;
    }
    [A[i], A[pivot]] = [A[pivot], A[i]];
    for (let k = i + 1; k < n; k++) {
      const f = A[k][i] / A[i][i];
      for (let j = i; j <= n; j++) A[k][j] -= f * A[i][j];
    }
  }
  const alpha = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = A[i][n];
    for (let j = i + 1; j < n; j++) s -= A[i][j] * alpha[j];
    alpha[i] = s / A[i][i];
  }

  const out = new Array<number>(2 * n);
  for (let i = 0; i < n; i++) {
    out[2 * i] = omega[i];
    out[2 * i + 1] = alpha[i];
  }
  return out;
}

/** 1 ステップ分の RK4 積分。`dt` は秒。 */
export function rk4Step(
  state: PendulumState,
  dt: number,
  lengths: number[],
  masses: number[],
): PendulumState {
  const f = (s: PendulumState) => derivN(s, lengths, masses);
  const add = (a: PendulumState, b: PendulumState, k: number) =>
    a.map((v, i) => v + k * b[i]);
  const k1 = f(state);
  const k2 = f(add(state, k1, dt / 2));
  const k3 = f(add(state, k2, dt / 2));
  const k4 = f(add(state, k3, dt));
  return state.map(
    (v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]),
  );
}

/**
 * 状態を `dt` 秒進める。`subSteps` 回の RK4 サブステップで分割する。
 * 既定値は spec 2.3 の RK4_SUBSTEPS（=8）。
 */
export function stepPendulum(
  state: PendulumState,
  dt: number,
  lengths: number[],
  masses: number[],
  subSteps: number = RK4_SUBSTEPS,
): PendulumState {
  const h = dt / subSteps;
  let s = state;
  for (let i = 0; i < subSteps; i++) s = rk4Step(s, h, lengths, masses);
  return s;
}

/**
 * 各おもりの位置（物理座標、原点 = 振り子固定点、y 軸下向きが正）を返す。
 * 戻り値の先頭は固定点 `(0, 0)`、続いて bob 1, bob 2, ..., bob n。
 */
export function bobPositions(
  state: PendulumState,
  lengths: number[],
): Vec2[] {
  const n = lengths.length;
  const out: Vec2[] = [{ x: 0, y: 0 }];
  let x = 0, y = 0;
  for (let i = 0; i < n; i++) {
    const t = state[2 * i];
    x += lengths[i] * Math.sin(t);
    y += lengths[i] * Math.cos(t);
    out.push({ x, y });
  }
  return out;
}

/**
 * 系の運動エネルギー・位置エネルギー・総エネルギー。
 * 位置の基準は固定点（y 下向きが正なので、おもりが下にあるほど PE は小さい）。
 * spec 4.4 のエネルギー保存検証や、M7 のカオス保証で使う。
 */
export function pendulumEnergy(
  state: PendulumState,
  lengths: number[],
  masses: number[],
): { kinetic: number; potential: number; total: number } {
  const n = lengths.length;
  // 各おもりの直交速度成分
  let vx = 0, vy = 0;
  let x = 0, y = 0;
  let kinetic = 0;
  let potential = 0;
  for (let i = 0; i < n; i++) {
    const t = state[2 * i];
    const w = state[2 * i + 1];
    vx += lengths[i] * Math.cos(t) * w;
    vy += -lengths[i] * Math.sin(t) * w;
    x += lengths[i] * Math.sin(t);
    y += lengths[i] * Math.cos(t);
    kinetic += 0.5 * masses[i] * (vx * vx + vy * vy);
    potential += -masses[i] * GRAVITY * y;
  }
  return { kinetic, potential, total: kinetic + potential };
}
