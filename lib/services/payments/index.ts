import { selectProvider } from "../factory";
import type { PaymentsService } from "./types";
import { mockPayments } from "./mock";

export * from "./types";

export const payments = selectProvider<PaymentsService>("PAYMENTS_PROVIDER", {
  mock: () => mockPayments,
});
