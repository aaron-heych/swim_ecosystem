import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  OaFollower,
  MessageTemplate,
  UserSubscribe,
  NotificationLog,
  Announcement,
  AnnouncementRecipient,
} from './notification.entity';
import { User } from '../user/user.entity';
import { AssociationMember } from '../association/association.entity';
import { NotificationService } from './notification.service';
import { AnnouncementService } from './announcement.service';
import { NotificationController } from './notification.controller';
import { NotificationAdminController } from './notification.admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OaFollower,
      MessageTemplate,
      UserSubscribe,
      NotificationLog,
      Announcement,
      AnnouncementRecipient,
      User,
      AssociationMember,
    ]),
  ],
  controllers: [NotificationController, NotificationAdminController],
  providers: [NotificationService, AnnouncementService],
  exports: [NotificationService, AnnouncementService],
})
export class NotificationModule {}
