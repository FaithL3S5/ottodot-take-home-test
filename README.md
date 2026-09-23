# Ottodot Trial Booking

A small slice of a trial booking system: a parent picks a child and a trial class, submits a booking, pays with a mock payment, and sees the booking status. An admin page shows each class roster. Trial classes are capped at 4 confirmed students.

The focus is correct backend behaviour under the required edge cases: duplicate bookings, overbooking, payment failure, and the last-seat race.

- `backend/`: NestJS 12, TypeORM, PostgreSQL, Vitest
- `frontend/`: Next.js 16, Chakra UI v3

## How to run

### Prerequisites

- Node.js 24 (tested). The backend needs at least 20.12 for `process.loadEnvFile`.
- PostgreSQL (tested on 18). Bring your own server.

### 1. Databases

Create two databases: one for the app, one for the e2e tests (the tests truncate tables).

```
createdb ottodot
createdb ottodot_test
```

### 2. Backend

```
cd backend
npm install
copy .env.example .env        (or: cp .env.example .env)
```

Edit `.env` with your credentials. Percent-encode special characters in the password (for example `?` becomes `%3F`).

```
DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/ottodot
TEST_DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/ottodot_test
PORT=3000
```

Then:

```
npm run migration:run
npm run seed
npm run start:dev
```

The API runs at `http://localhost:3000/api/v1`. `npm run seed` wipes all tables and reloads the demo data, so you can rerun it between demos.

### 3. Frontend

```
cd frontend
npm install
npm run dev
```

Open `http://localhost:3001`. The API base URL defaults to `http://localhost:3000/api/v1`; override it with `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.

### 4. Tests

```
cd backend
npm test            (unit)
npm run test:e2e    (e2e against ottodot_test; migrations run automatically)
```

## What I built

- **Booking page** (`/`): choose a parent and child, see each class with seats left, submit a booking, pay with "Pay (mock)" or "Pay (simulate failure)", and see the result. A failed payment offers "Try again". The parent's bookings are listed below, and a pending booking can be paid from there.
- **Admin pages** (`/admin`, `/admin/roster/[classId]`): all classes with confirmed counts, and the confirmed roster of one class.
- **Backend** with the invariants enforced in the database and in one locked transaction, plus e2e tests against a real Postgres.

### Demo walkthrough with the seed data

| Case                           | Steps                                                                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Class with available seats     | Kitchen Chemistry shows 3 of 4 seats left                                                                                                                                                                        |
| Class with exactly 3 confirmed | Fractions with Pizza shows 1 of 4 seats left                                                                                                                                                                     |
| Duplicate booking attempt      | Alicia Tan, Ben, book Kitchen Chemistry: "This child already has a confirmed booking" (Ben is already confirmed there)                                                                                           |
| Payment failure                | Citra Lim, Farah, book Kitchen Chemistry, "Pay (simulate failure)": status Payment failed, Farah is not on the roster. Farah also has a seeded `payment_failed` booking.                                         |
| Last-seat race                 | Budi Santoso, Eka, book Fractions with Pizza (A). Citra Lim, Gilang, book Fractions with Pizza (B). Pay B, then open A from Budi's bookings and pay: "The class filled up before payment. You were not charged." |
| Full class                     | Build a Paper Rocket shows Full and cannot be booked                                                                                                                                                             |

## Backend design

### Flow

My first sketch of the flow, drawn before implementation:

![Booking flow sketch](docs/flowchart.png)

The implementation refines it in one place: a booking is confirmed only with a successful payment **and** a free seat.

### Data model

![Table design](docs/table-design.png)

```
parents 1─* children 1─* bookings *─1 trial_classes
                         bookings 1─* payment_attempts
```

Differences from the diagram: the amount is stored as `amount_cents integer` (not `double`), and the unique index on `(child_id, trial_class_id)` is partial, covering only active bookings.

| Table              | Columns                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| `parents`          | `id`, `name`, `email` (unique)                                                                       |
| `children`         | `id`, `parent_id`, `name`                                                                            |
| `trial_classes`    | `id`, `title`, `starts_at`, `capacity` (default 4, `CHECK > 0`)                                      |
| `bookings`         | `id`, `child_id`, `trial_class_id`, `status`, `created_at`, `confirmed_at`                           |
| `payment_attempts` | `id`, `booking_id`, `status`, `amount_cents`, `idempotency_key` (unique), `created_at`, `updated_at` |

Constraints (see `backend/src/database/migrations/1790141544779-initial-schema.ts`):

- Partial unique index on `bookings (child_id, trial_class_id) WHERE status IN ('pending_payment', 'confirmed')`: at most one active booking per child and class.
- `CHECK` on both `status` columns.
- `CHECK ((status = 'confirmed') = (confirmed_at IS NOT NULL))`.
- Unique `payment_attempts.idempotency_key`.

A booking and a payment are separate: one booking can have several payment attempts, and the attempt keeps the money side of the story. This matters for the race: a payer can have a succeeded (then refunded) charge on a booking that did not get a seat.

### Statuses

```
booking:  pending_payment -> confirmed | payment_failed | seat_taken
attempt:  pending -> succeeded | failed ; succeeded -> refunded
```

- `pending_payment`: submitted, not paid. It does **not** hold a seat.
- `confirmed`: paid and holds a seat. Only these count toward capacity and appear on the roster.
- `payment_failed`: final. A retry creates a new booking.
- `seat_taken`: the class filled up before this booking could be confirmed. Either no charge happened, or the charge was refunded.

### API (prefix `/api/v1`)

| Method and path                                             | Purpose                                                                                |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `GET /parents`                                              | Parents with their children                                                            |
| `GET /parents/:id/bookings`                                 | All bookings of the parent's children, newest first                                    |
| `GET /trial-classes`                                        | Classes with `seatsLeft`                                                               |
| `GET /trial-classes/:id/roster`                             | Confirmed students of a class                                                          |
| `POST /bookings` `{ childId, trialClassId }`                | Submit a booking. 201 `pending_payment`. 409 if already confirmed or the class is full |
| `GET /bookings/:id`                                         | Booking status                                                                         |
| `POST /bookings/:id/payments` `{ outcome, idempotencyKey }` | Mock payment. Returns `{ booking, paymentAttempt }`                                    |

`outcome` is `succeeded` or `failed` and tells the mock gateway what to return.

### Preventing duplicate bookings

- The partial unique index is the guarantee: two active bookings for the same child and class cannot exist, even under concurrent requests.
- `POST /bookings` checks first for a friendly answer: a confirmed booking returns 409, and a pending booking is returned as is (resubmitting is idempotent). A unique violation from a concurrent insert (`23505`) goes through the same check.
- Because the index covers only active statuses, a child can book again after `payment_failed` or `seat_taken`.

### Payment failure

The mock gateway returns `failed`. In one transaction the attempt becomes `failed` and the booking becomes `payment_failed`. The child never reaches `confirmed`, so they never appear on the roster or count toward capacity. The parent retries with a new booking ("Try again" in the UI).

### Last-seat race

**Approach.** Selecting a slot does not reserve it. `POST /bookings/:id/payments` runs:

1. **Pre-check without a lock.** If the class is already full, the booking becomes `seat_taken` and nothing is charged. This covers the scenario in the brief: B pays first, then A pays and is rejected before any charge.
2. **Insert the attempt as `pending`** with its idempotency key. A duplicate key returns the stored result without charging again.
3. **Charge through the gateway, outside any transaction.**
4. **Confirm in one transaction.** Lock the `trial_classes` row (`SELECT ... FOR UPDATE`), then the booking row. Count the confirmed bookings. If there is a free seat, the booking becomes `confirmed`. Otherwise it becomes `seat_taken`.
5. **Refund after commit** when no seat was granted. The attempt becomes `refunded`.

**Why.**

- The brief's scenario (A selects, B selects, B pays, A pays) only works without a reservation, so seats are counted from confirmed bookings only.
- The class row is the single point where confirmations for one class serialize. Locking booking rows would not work: the competing booking is not confirmed yet, so it is a phantom to the count query.
- A real payment gateway is outside our system, and a database lock must not be held across a network call. So the charge happens first, the seat check happens under the lock, and a refund covers the payer who loses.
- Lock order is always class, then booking, to avoid deadlocks.

**Tradeoffs accepted.**

- A payer can be charged and then refunded if two payments arrive at nearly the same moment. The pre-check makes this rare. A real gateway would use authorize then capture: authorize, confirm the seat, then capture or void, so the parent is never actually charged.
- Confirmations for the same class run one at a time. With 4 seats per class this costs nothing.
- If the refund call fails, the attempt stays `succeeded` on a non-confirmed booking. That is visible in monitoring (see below) instead of being retried automatically.
- No seat hold, so a parent can reach the payment step and still lose the seat.

### Where each check lives

| Layer                      | Checks                                                                                                                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI                         | Disable "Book trial" on full classes and while a request runs; one idempotency key per pay click; close the payment panel when the parent or child changes. Convenience only, never trusted. |
| Backend                    | Request validation (`class-validator`), existence checks, duplicate and full-class answers, the payment flow, the locked capacity check.                                                     |
| Database                   | Partial unique index (duplicates), unique idempotency key, status `CHECK`s, `confirmed_at` consistency, row locks that serialize confirmations.                                              |
| Background job (not built) | Expire old `pending_payment` bookings; retry failed refunds.                                                                                                                                 |

## Core vs extra

**Core (required by the brief):** booking submission, mock payment with recorded attempts, booking status, roster, the duplicate index, the capacity check, payment failure handling, the sequential last-seat scenario, and the four seed cases.

**Extra (beyond the brief):**

- Concurrent last-seat race: two payments at the same moment. The class-row lock handles it, and a test holds both charges at a barrier so both payers pass the pre-check.
- Charge-then-confirm with a mock refund.
- Payment idempotency keys, including a 409 when a key is reused on another booking.
- Parent bookings list (`GET /parents/:id/bookings` and the table with "Pay").
- Resubmitting returns the existing pending booking.
- "Try again" after a failed payment.
- Seat pre-check at submit and at pay time.
- API versioning under `/api/v1`.
- Admin class overview page.
- A third seed class that is already full.
- `CHECK` tying `confirmed_at` to the `confirmed` status.

## Tests

e2e tests run against a real Postgres (`backend/test/`), because locking cannot be proven with mocks.

| File                           | Covers                                                                                                                                                    |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bookings.e2e-spec.ts`         | Pending booking created; duplicate confirmed returns 409; resubmitting returns the same pending booking; full class returns 409; invalid body returns 400 |
| `booking-payments.e2e-spec.ts` | Successful payment confirms; failed payment stays off the roster and a retry works; same idempotency key charges once; sequential last-seat scenario      |
| `last-seat-race.e2e-spec.ts`   | Concurrent payments for the last seat: exactly one confirmed, one `seat_taken` and refunded                                                               |
| `parent-bookings.e2e-spec.ts`  | A parent sees only their own children's bookings; unknown parent returns 404                                                                              |

Removing the class-row lock makes the concurrent race test fail (both payers confirmed, 5 in a class of 4). I checked this by hand.

## Assumptions

- No authentication. Parents and children come from seed data, and the UI lets you act as any parent.
- One `trial_classes` row is one session at one time. A duplicate means the same child and the same class row. Booking two different classes at the same time is allowed.
- A trial costs a fixed 20.00 (`TRIAL_PRICE_CENTS = 2000`).
- The roster is for admins and teachers. Parents see only their own bookings.

## Deliberately cut

- Authentication and ownership checks (any caller can read or pay any booking).
- Expiry of `pending_payment` bookings.
- Refusing bookings for classes that already started.
- A refund retry job, real refunds, and authorize/capture.
- Regular enrollment, waitlists, cancellations by the parent.
- Frontend tests. The UI was verified by hand.
- CORS is open to all origins.

## What I would monitor after release

- **Refunds owed:** succeeded attempts on bookings that are not confirmed. Should be zero after refunds run.
  ```sql
  SELECT pa.* FROM payment_attempts pa JOIN bookings b ON b.id = pa.booking_id
  WHERE pa.status = 'succeeded' AND b.status <> 'confirmed';
  ```
- **Overbooking:** classes with more confirmed bookings than capacity. Must always be zero.
- Rate of `seat_taken` after a charge (how often the race actually happens) and the refund volume.
- Payment failure rate.
- Age and count of `pending_payment` bookings (abandoned checkouts).
- 409 rates on `POST /bookings`.
- Latency of the confirm transaction and lock waits on `trial_classes`.

## What I would do next

1. Authentication, and check that the booking belongs to the caller's child.
2. Authorize/capture with a real gateway and webhooks, so a losing payer is never charged.
3. A job that expires stale `pending_payment` bookings and retries failed refunds.
4. Optional short seat hold (for example 10 minutes) during checkout, built on that expiry job.
5. Reject bookings for classes that already started.
6. Frontend tests for the booking flow.

## Time spent

- Designing flow: ~35 minutes
- Designing DB tables: ~45 minutes
- Planning: ~55 minutes
- Implementation: ~30 minutes
- Testing: ~20 minutes
- Bug fixing & re-test: ~25 minutes

Total: ~3 hours 30 minutes. Writing the README and AI_USAGE took about 30 minutes.

Note: Discussion with the AI happened throughout, not in one step. I followed a trust-but-verify approach: I checked the behaviour of the AI's output by hand.
