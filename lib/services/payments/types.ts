// Subscriptions, tips, payouts. Real later: Stripe Connect.
// NOTE: Phase 3 builds the auditable immutable ledger + the pure revenue-split
// function. This mock only returns Stripe-shaped objects so UI can be built first.
export type Currency = "USD";

export interface CreateSubscriptionInput {
  creatorId: string;
  subscriberId: string;
  priceCents: number;
}

export interface CreateTipInput {
  creatorId: string;
  fromUserId: string;
  amountCents: number;
}

export interface PaymentResult {
  id: string;
  type: "subscription" | "tip";
  grossCents: number;
  platformFeeCents: number;
  netCents: number;
  currency: Currency;
  createdAt: string;
}

export interface Balance {
  creatorId: string;
  availableCents: number;
  pendingCents: number;
  currency: Currency;
}

export interface PaymentsService {
  createSubscription(input: CreateSubscriptionInput): Promise<PaymentResult>;
  createTip(input: CreateTipInput): Promise<PaymentResult>;
  getBalance(creatorId: string): Promise<Balance>;
}
