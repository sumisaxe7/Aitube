// Revenue math — pure and tested (tests/revenue.test.ts). One home for every
// money split so the ledger, the payments mock, and Phase 5 co-creator splits all
// agree to the cent.

// AItube's platform fee. Intentionally far below YouTube's 30–45% — the "paid
// fairly" promise. Configurable via env.
export const PLATFORM_FEE_RATE = Number(process.env.PLATFORM_FEE_RATE ?? 0.1);

export interface Split {
  grossCents: number;
  platformFeeCents: number;
  netCents: number;
}

/**
 * Split a gross amount into platform fee + creator net. `netCents` is always
 * `gross - fee` (never computed independently) so net + fee === gross exactly —
 * no rounding leakage, which matters for an auditable ledger.
 */
export function computeSplit(
  grossCents: number,
  feeRate: number = PLATFORM_FEE_RATE,
): Split {
  if (!Number.isInteger(grossCents) || grossCents < 0) {
    throw new Error("grossCents must be a non-negative integer");
  }
  if (feeRate < 0 || feeRate > 1) {
    throw new Error("feeRate must be within [0, 1]");
  }
  const platformFeeCents = Math.round(grossCents * feeRate);
  const netCents = grossCents - platformFeeCents;
  return { grossCents, platformFeeCents, netCents };
}

/** Whole-percent share the creator keeps — for the "you keep X%" UI. */
export function creatorSharePct(feeRate: number = PLATFORM_FEE_RATE): number {
  return Math.round((1 - feeRate) * 100);
}

export interface Share {
  id: string;
  pct: number; // 0..100; the set must sum to 100
}

export interface Allocation {
  id: string;
  amountCents: number;
}

/**
 * Distribute an integer amount across shares by percentage with NO rounding
 * leakage (largest-remainder / Hamilton method): floor every share, then hand the
 * leftover cents to the largest fractional remainders. Sum of allocations always
 * equals the input amount. Used by Phase 5 co-creator revenue splits.
 */
export function distributeByShares(
  amountCents: number,
  shares: Share[],
): Allocation[] {
  if (shares.length === 0) return [];
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    throw new Error("amountCents must be a non-negative integer");
  }
  const totalPct = shares.reduce((s, x) => s + x.pct, 0);
  if (Math.abs(totalPct - 100) > 1e-9) {
    throw new Error(`shares must sum to 100, got ${totalPct}`);
  }

  const floored = shares.map((s) => {
    const exact = (amountCents * s.pct) / 100;
    const base = Math.floor(exact);
    return { id: s.id, amountCents: base, remainder: exact - base };
  });

  const allocated = floored.reduce((s, x) => s + x.amountCents, 0);
  let leftover = amountCents - allocated;

  const byRemainder = [...floored].sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; i < byRemainder.length && leftover > 0; i++, leftover--) {
    byRemainder[i].amountCents += 1;
  }

  return floored.map((f) => ({ id: f.id, amountCents: f.amountCents }));
}
