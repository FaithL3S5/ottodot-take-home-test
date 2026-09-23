"use client";

import { useState } from "react";
import { describePaymentResult } from "@/components/booking/describe-payment-result";
import { apiClient } from "@/lib/api-client";
import type { Booking, ChargeOutcome } from "@/lib/api-types";

export interface ActiveBooking {
  booking: Booking;
  label: string;
}

export function useBookingFlow(onBookingChanged: () => void) {
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(
    null,
  );
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function runAction(action: () => Promise<void>) {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await action();
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setIsSubmitting(false);
      onBookingChanged();
    }
  }

  function openBooking(booking: Booking, label: string) {
    setActiveBooking({ booking, label });
    setResultMessage(null);
    setErrorMessage(null);
  }

  function submitBooking(childId: number, trialClassId: number, label: string) {
    return runAction(async () => {
      const booking = await apiClient.submitBooking(childId, trialClassId);
      openBooking(booking, label);
    });
  }

  function pay(outcome: ChargeOutcome) {
    if (!activeBooking) return;
    return runAction(async () => {
      const paymentResult = await apiClient.payBooking(
        activeBooking.booking.id,
        outcome,
      );
      setActiveBooking({ ...activeBooking, booking: paymentResult.booking });
      setResultMessage(describePaymentResult(paymentResult));
    });
  }

  function tryAgain() {
    if (!activeBooking) return;
    const { booking, label } = activeBooking;
    return submitBooking(booking.childId, booking.trialClassId, label);
  }

  return {
    activeBooking,
    resultMessage,
    errorMessage,
    isSubmitting,
    openBooking,
    submitBooking,
    pay,
    tryAgain,
  };
}
