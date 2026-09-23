import { Alert, Button, Card, HStack, Text } from "@chakra-ui/react";
import type { Booking, ChargeOutcome } from "@/lib/api-types";
import { BookingStatusBadge } from "./booking-status-badge";

interface PaymentPanelProps {
  booking: Booking;
  bookingLabel: string;
  resultMessage: string | null;
  isSubmitting: boolean;
  onPay: (outcome: ChargeOutcome) => void;
  onTryAgain: () => void;
}

export function PaymentPanel({
  booking,
  bookingLabel,
  resultMessage,
  isSubmitting,
  onPay,
  onTryAgain,
}: PaymentPanelProps) {
  return (
    <Card.Root>
      <Card.Header>
        <HStack justify="space-between">
          <Card.Title>Booking #{booking.id}</Card.Title>
          <BookingStatusBadge status={booking.status} />
        </HStack>
        <Text textStyle="sm" color="fg.muted">
          {bookingLabel}
        </Text>
      </Card.Header>
      <Card.Body gap="4">
        {resultMessage && (
          <Alert.Root
            status={booking.status === "confirmed" ? "success" : "info"}
          >
            <Alert.Indicator />
            <Alert.Title>{resultMessage}</Alert.Title>
          </Alert.Root>
        )}

        {booking.status === "pending_payment" && (
          <HStack gap="2" flexWrap="wrap">
            <Button loading={isSubmitting} onClick={() => onPay("succeeded")}>
              Pay (mock)
            </Button>
            <Button
              variant="outline"
              colorPalette="red"
              disabled={isSubmitting}
              onClick={() => onPay("failed")}
            >
              Pay (simulate failure)
            </Button>
          </HStack>
        )}

        {booking.status === "payment_failed" && (
          <Button
            alignSelf="start"
            loading={isSubmitting}
            onClick={onTryAgain}
          >
            Try again
          </Button>
        )}
      </Card.Body>
    </Card.Root>
  );
}
