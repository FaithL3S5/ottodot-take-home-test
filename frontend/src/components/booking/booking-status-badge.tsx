import { Badge } from "@chakra-ui/react";
import type { BookingStatus } from "@/lib/api-types";

const badgeByStatus: Record<
  BookingStatus,
  { label: string; colorPalette: string }
> = {
  pending_payment: { label: "Pending payment", colorPalette: "yellow" },
  confirmed: { label: "Confirmed", colorPalette: "green" },
  payment_failed: { label: "Payment failed", colorPalette: "red" },
  seat_taken: { label: "Seat taken", colorPalette: "gray" },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { label, colorPalette } = badgeByStatus[status];
  return <Badge colorPalette={colorPalette}>{label}</Badge>;
}
