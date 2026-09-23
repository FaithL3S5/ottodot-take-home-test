"use client";

import { Alert, Heading, Spinner, Stack } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { useApiData } from "@/hooks/use-api-data";
import { useBookingFlow } from "@/hooks/use-booking-flow";
import { apiClient } from "@/lib/api-client";
import type { Child, Parent } from "@/lib/api-types";
import { ParentBookingsTable } from "./parent-bookings-table";
import { ParentChildPicker } from "./parent-child-picker";
import { PaymentPanel } from "./payment-panel";
import { TrialClassList } from "./trial-class-list";

export function BookingFlow() {
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  const parents = useApiData(apiClient.listParents);
  const trialClasses = useApiData(apiClient.listTrialClasses);
  const loadParentBookings = useMemo(
    () =>
      selectedParent
        ? () => apiClient.listParentBookings(selectedParent.id)
        : null,
    [selectedParent],
  );
  const parentBookings = useApiData(loadParentBookings);

  const bookingFlow = useBookingFlow(() => {
    trialClasses.reload();
    parentBookings.reload();
  });

  const loadErrorMessage =
    parents.errorMessage ?? trialClasses.errorMessage ?? bookingFlow.errorMessage;

  if (!parents.data || !trialClasses.data) {
    return loadErrorMessage ? (
      <ErrorAlert message={loadErrorMessage} />
    ) : (
      <Spinner />
    );
  }

  return (
    <Stack gap="8">
      <Stack gap="4">
        <Heading size="md">1. Choose parent and child</Heading>
        <ParentChildPicker
          parents={parents.data}
          selectedParent={selectedParent}
          selectedChild={selectedChild}
          onParentChange={(parent) => {
            setSelectedParent(parent);
            setSelectedChild(null);
            bookingFlow.closeBooking();
          }}
          onChildChange={(child) => {
            setSelectedChild(child);
            bookingFlow.closeBooking();
          }}
        />
      </Stack>

      <Stack gap="4">
        <Heading size="md">2. Pick a trial class</Heading>
        <TrialClassList
          trialClasses={trialClasses.data}
          isBookingDisabled={!selectedChild || bookingFlow.isSubmitting}
          onBook={(trialClass) =>
            selectedChild &&
            bookingFlow.submitBooking(
              selectedChild.id,
              trialClass.id,
              `${selectedChild.name} · ${trialClass.title}`,
            )
          }
        />
      </Stack>

      {loadErrorMessage && <ErrorAlert message={loadErrorMessage} />}

      {bookingFlow.activeBooking && (
        <Stack gap="4">
          <Heading size="md">3. Pay</Heading>
          <PaymentPanel
            booking={bookingFlow.activeBooking.booking}
            bookingLabel={bookingFlow.activeBooking.label}
            resultMessage={bookingFlow.resultMessage}
            isSubmitting={bookingFlow.isSubmitting}
            onPay={bookingFlow.pay}
            onTryAgain={bookingFlow.tryAgain}
          />
        </Stack>
      )}

      {selectedParent && parentBookings.data && (
        <Stack gap="4">
          <Heading size="md">{selectedParent.name}&apos;s bookings</Heading>
          <ParentBookingsTable
            bookings={parentBookings.data}
            onOpenBooking={(booking) =>
              bookingFlow.openBooking(
                booking,
                `${booking.child.name} · ${booking.trialClass.title}`,
              )
            }
          />
        </Stack>
      )}
    </Stack>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert.Root status="error">
      <Alert.Indicator />
      <Alert.Title>{message}</Alert.Title>
    </Alert.Root>
  );
}
