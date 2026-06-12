import type { PaymentResult, PaymentsService } from "./types";
import { nowIso, randInt, randomId } from "../_util";
import { computeSplit } from "@/lib/revenue";

// Simulates the payment processor (later: Stripe Connect). The authoritative
// money split is lib/revenue.computeSplit — the same function the ledger uses —
// so the mock and the recorded ledger rows never disagree.
function settle(gross: number, type: PaymentResult["type"]): PaymentResult {
  const split = computeSplit(gross);
  return {
    id: `${type === "tip" ? "tip" : "sub"}_${randomId()}`,
    type,
    grossCents: split.grossCents,
    platformFeeCents: split.platformFeeCents,
    netCents: split.netCents,
    currency: "USD",
    createdAt: nowIso(),
  };
}

export const mockPayments: PaymentsService = {
  async createSubscription({ priceCents }) {
    return settle(priceCents, "subscription");
  },
  async createTip({ amountCents }) {
    return settle(amountCents, "tip");
  },
  async getBalance(creatorId) {
    return {
      creatorId,
      availableCents: randInt(0, 50_000),
      pendingCents: randInt(0, 20_000),
      currency: "USD",
    };
  },
};
