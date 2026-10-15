import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  EventSource,
  CrawlLog,
  Event,
  EventGroup,
  EventRegistration,
  EventRegistrationItem,
} from './event.entity';
import { EventService } from './event.service';
import { EventSourceService } from './event-source.service';
import { EventController } from './event.controller';
import { EventAdminController } from './event.admin.controller';
import {
  EventSourceAdminController,
  CrawlLogAdminController,
} from './event-source.admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventSource,
      CrawlLog,
      Event,
      EventGroup,
      EventRegistration,
      EventRegistrationItem,
    ]),
  ],
  controllers: [
    EventController,
    EventAdminController,
    EventSourceAdminController,
    CrawlLogAdminController,
  ],
  providers: [EventService, EventSourceService],
  exports: [EventService, EventSourceService],
})
export class EventModule {}
