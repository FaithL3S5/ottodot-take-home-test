export const paymentAttemptStatuses = [
  'pending',
  'succeeded',
  'failed',
  'refunded',
] as const;

export type PaymentAttemptStatus = (typeof paymentAttemptStatuses)[number];
