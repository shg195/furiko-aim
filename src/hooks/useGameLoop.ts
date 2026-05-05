// useGameLoop.ts — 60秒タイマー・3-2-1 カウントダウン・一時停止・累積スコア
//
// PendulumCanvas の onScoreChange に handleScoreChange を渡し、
// canvas に paused = isPaused、feedbackStyle = phase==='playing' ? 'ring' : 'none' を渡す想定。

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  COUNTDOWN_SECONDS,
  SCORE_SCALE,
  TOTAL_SECONDS,
} from '../constants';
import type { GamePhase } from '../types';

type Options = {
  /** 試合の長さ（秒）。既定 TOTAL_SECONDS=60 */
  total?: number;
  /** スコアを累積するか。false の場合は live のみ更新（カスタムでも累積は true 想定） */
  scorable: boolean;
  /** 残時間が 0 になった時に最終スコアで呼ばれる */
  onFinish: (finalScore: number) => void;
};

type Result = {
  phase: GamePhase;
  /** カウントダウン中の表示数字（3, 2, 1, 0=GO 直前） */
  count: number;
  /** 残時間（秒） */
  remain: number;
  /** 累積スコア（整数化前） */
  score: number;
  /** 直近フレームの 0..1 スコア（HUD precision 用） */
  live: number;
  /** PendulumCanvas に渡す paused プロパティ：countdown 中も physics 凍結 */
  isPaused: boolean;
  /** PAUSE ↔ RESUME のトグル */
  togglePause: () => void;
  /** PendulumCanvas の onScoreChange に渡す。per-frame 呼び出し */
  handleScoreChange: (s: number) => void;
};

export function useGameLoop({
  total = TOTAL_SECONDS,
  scorable,
  onFinish,
}: Options): Result {
  const [phase, setPhase] = useState<GamePhase>('countdown');
  const [count, setCount] = useState(COUNTDOWN_SECONDS);
  const [remain, setRemain] = useState(total);
  const [score, setScore] = useState(0);
  const [live, setLive] = useState(0);

  const startRef = useRef(0);
  const pausedAtRef = useRef(0);
  const totalPausedRef = useRef(0);
  const scoreAccRef = useRef(0);
  const lastTickRef = useRef(0);
  const finishedRef = useRef(false);

  // カウントダウン進行：phase=countdown のとき 1秒ごとに count を減算、count=0 で playing へ
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (count <= 0) {
      const isResume = startRef.current !== 0;
      if (isResume) {
        // pause + countdown 時間を totalPausedRef に積む（経過時間から除外）
        totalPausedRef.current += performance.now() - pausedAtRef.current;
      } else {
        startRef.current = performance.now();
        totalPausedRef.current = 0;
      }
      lastTickRef.current = performance.now();
      setPhase('playing');
      return;
    }
    const id = window.setTimeout(() => setCount((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [phase, count]);

  // プレイ中の tick：requestAnimationFrame で残時間・スコアを更新
  useEffect(() => {
    if (phase !== 'playing') return;
    let raf = 0;
    const tick = (now: number) => {
      const elapsed =
        (now - startRef.current - totalPausedRef.current) / 1000;
      const left = Math.max(0, total - elapsed);
      setRemain(left);
      setScore(scoreAccRef.current);
      if (left <= 0 && !finishedRef.current) {
        finishedRef.current = true;
        onFinish(scoreAccRef.current);
        setPhase('ending');
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, total, onFinish]);

  const togglePause = useCallback(() => {
    if (phase === 'playing') {
      pausedAtRef.current = performance.now();
      setPhase('paused');
    } else if (phase === 'paused') {
      // 再開時は 3 秒カウントダウンを挟む（spec 2.12）
      setCount(COUNTDOWN_SECONDS);
      setPhase('countdown');
    }
  }, [phase]);

  // ESC / SPACE で一時停止トグル
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        if (e.key === ' ') e.preventDefault();
        if (phase === 'playing' || phase === 'paused') togglePause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, togglePause]);

  // PendulumCanvas から per-frame でスコアを受け取る
  const handleScoreChange = useCallback(
    (s: number) => {
      setLive(s);
      if (scorable && phase === 'playing') {
        const now = performance.now();
        const dt = Math.min((now - lastTickRef.current) / 1000, 1 / 30);
        lastTickRef.current = now;
        scoreAccRef.current += s * dt * SCORE_SCALE;
      }
    },
    [scorable, phase],
  );

  const isPaused = phase === 'paused' || phase === 'countdown';

  return {
    phase,
    count,
    remain,
    score,
    live,
    isPaused,
    togglePause,
    handleScoreChange,
  };
}
