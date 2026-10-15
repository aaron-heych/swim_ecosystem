import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Venue,
  Coach,
  CoachCourse,
  CoachSchedule,
  CoachAppointment,
  CoachReview,
} from './venue.entity';
import { VenueService } from './venue.service';
import { CoachService } from './coach.service';
import { VenueController } from './venue.controller';
import { CoachController } from './coach.controller';
import { VenueAdminController } from './venue.admin.controller';
import { CoachAdminController } from './coach.admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Venue,
      Coach,
      CoachCourse,
      CoachSchedule,
      CoachAppointment,
      CoachReview,
    ]),
  ],
  controllers: [
    VenueController,
    CoachController,
    VenueAdminController,
    CoachAdminController,
  ],
  providers: [VenueService, CoachService],
  exports: [VenueService, CoachService],
})
export class VenueModule {}
