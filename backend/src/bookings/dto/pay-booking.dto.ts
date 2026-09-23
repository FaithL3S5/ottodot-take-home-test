import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import type { ChargeOutcome } from '../../payments/payment-gateway.js';

export class PayBookingDto {
  @IsIn(['succeeded', 'failed'])
  outcome: ChargeOutcome;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  idempotencyKey: string;
}
