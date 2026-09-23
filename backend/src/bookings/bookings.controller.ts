import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  submitBooking(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.submitBooking(createBookingDto);
  }

  @Get(':id')
  getBooking(@Param('id', ParseIntPipe) bookingId: number) {
    return this.bookingsService.getBooking(bookingId);
  }
}
