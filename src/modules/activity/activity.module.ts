import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinterActivity } from './activity.entity';
import { ActivityService } from './activity.service';
import { ActivityAdminController } from './activity.admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WinterActivity])],
  controllers: [ActivityAdminController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class WinterActivityModule {}
