export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "payment_failed"
  | "seat_taken";

export type PaymentAttemptStatus =
  | "pending"
  | "succeeded"
  | "failed"
  | "refunded";

export type ChargeOutcome = "succeeded" | "failed";

export interface Child {
  id: number;
  parentId: number;
  name: string;
}

export interface Parent {
  id: number;
  name: string;
  email: string;
  children: Child[];
}

export interface TrialClass {
  id: number;
  title: string;
  startsAt: string;
  capacity: number;
}

export interface TrialClassWithSeatsLeft extends TrialClass {
  seatsLeft: number;
}

export interface Booking {
  id: number;
  childId: number;
  trialClassId: number;
  status: BookingStatus;
  createdAt: string;
  confirmedAt: string | null;
}

export interface ParentBooking extends Booking {
  child: Child;
  trialClass: TrialClass;
}

export interface PaymentAttempt {
  id: number;
  bookingId: number;
  status: PaymentAttemptStatus;
  amountCents: number;
}

export interface PaymentResult {
  booking: Booking;
  paymentAttempt: PaymentAttempt | null;
}

export interface Roster {
  trialClass: TrialClass;
  students: {
    bookingId: number;
    childId: number;
    childName: string;
    confirmedAt: string;
  }[];
}
