import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Association, AssociationMember } from './association.entity';
import { AssociationService } from './association.service';
import { AssociationController } from './association.controller';
import { AssociationAdminController } from './association.admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Association, AssociationMember])],
  controllers: [AssociationController, AssociationAdminController],
  providers: [AssociationService],
  exports: [AssociationService],
})
export class AssociationModule {}
