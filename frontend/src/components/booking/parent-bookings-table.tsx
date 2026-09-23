import { Button, Table, Text } from "@chakra-ui/react";
import type { ParentBooking } from "@/lib/api-types";
import { formatDateTime } from "@/lib/format-date-time";
import { BookingStatusBadge } from "./booking-status-badge";

interface ParentBookingsTableProps {
  bookings: ParentBooking[];
  onOpenBooking: (booking: ParentBooking) => void;
}

export function ParentBookingsTable({
  bookings,
  onOpenBooking,
}: ParentBookingsTableProps) {
  if (bookings.length === 0) {
    return <Text color="fg.muted">No bookings yet.</Text>;
  }

  return (
    <Table.Root size="sm" variant="outline">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Child</Table.ColumnHeader>
          <Table.ColumnHeader>Class</Table.ColumnHeader>
          <Table.ColumnHeader>Starts</Table.ColumnHeader>
          <Table.ColumnHeader>Status</Table.ColumnHeader>
          <Table.ColumnHeader />
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {bookings.map((booking) => (
          <Table.Row key={booking.id}>
            <Table.Cell>{booking.child.name}</Table.Cell>
            <Table.Cell>{booking.trialClass.title}</Table.Cell>
            <Table.Cell>{formatDateTime(booking.trialClass.startsAt)}</Table.Cell>
            <Table.Cell>
              <BookingStatusBadge status={booking.status} />
            </Table.Cell>
            <Table.Cell textAlign="end">
              {booking.status === "pending_payment" && (
                <Button size="xs" onClick={() => onOpenBooking(booking)}>
                  Pay
                </Button>
              )}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
