export const bookingStatuses = [
  'pending_payment',
  'confirmed',
  'payment_failed',
  'seat_taken',
] as const;

export type BookingStatus = (typeof bookingStatuses)[number];
