import { Booking } from './booking.entity.js';
import { Child } from './child.entity.js';
import { Parent } from './parent.entity.js';
import { PaymentAttempt } from './payment-attempt.entity.js';
import { TrialClass } from './trial-class.entity.js';

export { Booking, Child, Parent, PaymentAttempt, TrialClass };

export const entities = [Parent, Child, TrialClass, Booking, PaymentAttempt];
