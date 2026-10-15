import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Banner,
  Feedback,
  SmsCode,
  SysConfig,
  OperationLog,
  AccessStat,
} from './system.entity';
import { SystemService } from './system.service';
import { SmsService } from './sms.service';
import { SystemController } from './system.controller';
import { SystemAdminController } from './system.admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Banner,
      Feedback,
      SmsCode,
      SysConfig,
      OperationLog,
      AccessStat,
    ]),
  ],
  controllers: [SystemController, SystemAdminController],
  providers: [SystemService, SmsService],
  exports: [SystemService, SmsService],
})
export class SystemModule {}
