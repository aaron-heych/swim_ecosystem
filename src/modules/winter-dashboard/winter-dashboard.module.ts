import { Module } from '@nestjs/common';
import { WinterDashboardController } from './winter-dashboard.controller';
import { WinterDashboardService } from './winter-dashboard.service';

@Module({
  controllers: [WinterDashboardController],
  providers: [WinterDashboardService],
})
export class WinterDashboardModule {}
