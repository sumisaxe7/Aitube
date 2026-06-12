// Tiny shared helpers for the mock service implementations. No external deps.

export const round = (n: number, dp = 3): number => Number(n.toFixed(dp));

export const pick = <T>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

export const randInt = (min: number, max: number): number =>
  Math.floor(min + Math.random() * (max - min + 1));

export const randomId = (): string => Math.random().toString(36).slice(2, 10);

export const nowIso = (): string => new Date().toISOString();
