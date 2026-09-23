import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { BookingPaymentService } from './booking-payment.service.js';
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { PayBookingDto } from './dto/pay-booking.dto.js';

@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly bookingPaymentService: BookingPaymentService,
  ) {}

  @Post()
  submitBooking(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.submitBooking(createBookingDto);
  }

  @Get(':id')
  getBooking(@Param('id', ParseIntPipe) bookingId: number) {
    return this.bookingsService.getBooking(bookingId);
  }

  @Post(':id/payments')
  @HttpCode(200)
  payBooking(
    @Param('id', ParseIntPipe) bookingId: number,
    @Body() payBookingDto: PayBookingDto,
  ) {
    return this.bookingPaymentService.payBooking(bookingId, payBookingDto);
  }
}
