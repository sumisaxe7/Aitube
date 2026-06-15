import { selectProvider } from "../factory";
import type { PaymentsService } from "./types";
import { mockPayments } from "./mock";
import { stripePayments } from "./stripe";

export * from "./types";

export const payments = selectProvider<PaymentsService>("PAYMENTS_PROVIDER", {
  mock: () => mockPayments,
  stripe: () => stripePayments,
});
