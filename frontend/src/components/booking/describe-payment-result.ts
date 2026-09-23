import type { PaymentResult } from "@/lib/api-types";

export function describePaymentResult({
  booking,
  paymentAttempt,
}: PaymentResult): string {
  switch (booking.status) {
    case "confirmed":
      return "Payment received. The seat is confirmed.";
    case "payment_failed":
      return "Payment failed. The child is not booked. You can try again.";
    case "pending_payment":
      return "The booking is waiting for payment.";
    case "seat_taken":
      if (!paymentAttempt) {
        return "The class filled up before payment. You were not charged.";
      }
      if (paymentAttempt.status === "refunded") {
        return "The class filled up during payment. Your payment was refunded.";
      }
      return "The class filled up during payment. A refund is pending.";
  }
}
