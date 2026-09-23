import type {
  Booking,
  ChargeOutcome,
  Parent,
  ParentBooking,
  PaymentResult,
  Roster,
  TrialClassWithSeatsLeft,
} from "./api-types";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
  }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const body = await response.json();

  if (!response.ok) {
    const message = Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message;
    throw new ApiError(message ?? response.statusText, response.status);
  }
  return body as T;
}

export const apiClient = {
  listParents: () => apiRequest<Parent[]>("/parents"),

  listParentBookings: (parentId: number) =>
    apiRequest<ParentBooking[]>(`/parents/${parentId}/bookings`),

  listTrialClasses: () =>
    apiRequest<TrialClassWithSeatsLeft[]>("/trial-classes"),

  getRoster: (trialClassId: number) =>
    apiRequest<Roster>(`/trial-classes/${trialClassId}/roster`),

  submitBooking: (childId: number, trialClassId: number) =>
    apiRequest<Booking>("/bookings", {
      method: "POST",
      body: JSON.stringify({ childId, trialClassId }),
    }),

  payBooking: (bookingId: number, outcome: ChargeOutcome) =>
    apiRequest<PaymentResult>(`/bookings/${bookingId}/payments`, {
      method: "POST",
      body: JSON.stringify({ outcome, idempotencyKey: crypto.randomUUID() }),
    }),
};
