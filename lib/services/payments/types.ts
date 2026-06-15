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
  /**
   * Set by real (redirect-based) providers: the caller must redirect the
   * browser here to complete payment. When set, `pending` is true and the
   * ledger row is NOT written yet — the Stripe webhook writes it once
   * `checkout.session.completed` fires. The mock provider never sets this;
   * it settles synchronously.
   */
  checkoutUrl?: string;
  /** True when settlement is asynchronous (awaiting checkoutUrl completion). */
  pending?: boolean;
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
