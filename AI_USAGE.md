# AI Usage

## Tools

- **Claude Code** (Claude Opus 5.5) in the terminal, for discussion, planning, code, tests, and these docs.
- **Claude in Chrome**, to click through the frontend in a real browser.
- A throwaway **puppeteer-core** script, written by the AI, to reproduce UI bugs in headless Chrome.
- DrawSQL and a hand-drawn flowchart for my own data model and flow, which I then reviewed with the AI.

## What I used AI for

- Digesting the brief and reviewing my schema drafts before writing code.
- Discussing the last-seat race, locking, and the payment design before implementation.
- Writing a plan, then implementing it step by step with one commit per step.
- Writing the backend (entities, migration, seed, services, controllers) and the e2e tests.
- Writing the frontend pages.
- Reproducing bugs I found while testing by hand.
- Drafting the README and this file.

## Where AI helped me move faster

- **Schema review.** In my first DrawSQL draft, the foreign key pointed from `trial_classes` to `bookings`, so each class belonged to one booking. The AI caught it, and in the next draft it caught a redundant `bookings.parent_id` that could disagree with `children.parent_id`.
- **Why `payment_attempts` exists.** I could not see why the suggested model had it. The explanation (one booking can have many attempts, and a payer can be charged without getting a seat) made the table click.
- **The concurrent race test.** The AI wrote a barrier gateway that holds both charges until both payers pass the pre-check, so the locked path runs every time. We then removed the lock on purpose to confirm the test fails without it.

## Where I disagreed with, corrected, or rejected AI output

- **Rejected `simulatedDelayMs`.** The AI proposed a delay parameter on the mock payment to demo the race. I pointed out that the brief's scenario is sequential (A waits in pending payment, B pays, then A pays), so a delay adds nothing. The AI agreed, and the pre-check alone handles that scenario.
- **Pushed for a mock refund.** The AI suggested charging inside the database transaction so a losing payer is never charged and no refund is needed. I argued that a real gateway sits outside our system, so we cannot hold a lock across the charge. We changed the design to charge first, check the seat under the lock, and refund the loser.
- **Caught a missing feature.** After the backend was done, I asked how a parent sees their bookings. Only `GET /bookings/:id` existed. We added `GET /parents/:id/bookings` and the bookings table.
- **Caught a UI bug the AI missed.** While testing by hand, I changed the child while a payment was pending and clicked Pay. The class became full instantly: the panel was still paying the previous child's booking. The AI had only checked the UI through API calls, not by clicking through. It reproduced the bug in headless Chrome and fixed it.
- **Scoped the extras.** I asked for features beyond the brief, such as the concurrent race, to be marked as extra in the README, so the required core stays clear.
- **Process rules.** Incremental commits, no AI co-author trailer, and asking the AI to check its own comments against my coding rules.

## What I would change in my AI workflow next time

- Have the AI drive the real UI (browser or headless) as soon as each page exists, instead of only calling the API. The panel bug would have been caught before I found it.
- Agree on "core vs extra" before implementation, not at the end, so extras are a deliberate choice.
- Plan the backend controllers more thoroughly so an important and useful endpoint like parent booking won't be missed.

## How I verified the final implementation

- **e2e tests against a real Postgres** (13 tests): duplicates, full class, payment failure and retry, idempotency, the sequential last-seat scenario, the concurrent race, and parent bookings.
- **Mutation check:** removing the `trial_classes` row lock makes the concurrent race test fail with both payers confirmed.
- **Unit tests** for the mock gateway.
- **Type check, lint, and formatting** on every step before committing (the 2 remaining frontend lint errors are in scaffold code).
- **Manual testing** with Postman and the frontend, walking through each seed case. The AI also clicked through the fail-then-pay flow in Chrome.
