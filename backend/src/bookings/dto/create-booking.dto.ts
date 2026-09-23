import { IsInt, IsPositive } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  @IsPositive()
  childId: number;

  @IsInt()
  @IsPositive()
  trialClassId: number;
}
