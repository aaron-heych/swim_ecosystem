import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Region } from './region.entity';
import { RegionService } from './region.service';
import { RegionController } from './region.controller';
import { RegionAdminController } from './region.admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Region])],
  controllers: [RegionController, RegionAdminController],
  providers: [RegionService],
  exports: [RegionService],
})
export class RegionModule {}
