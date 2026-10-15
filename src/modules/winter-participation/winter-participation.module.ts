import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  WinterParticipant,
  WinterParticipation,
} from './winter-participation.entity';
import { WinterParticipationService } from './winter-participation.service';
import { WinterParticipationAdminController } from './winter-participation.admin.controller';
import { AssociationMember } from '../association/association.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WinterParticipation,
      WinterParticipant,
      AssociationMember,
    ]),
  ],
  controllers: [WinterParticipationAdminController],
  providers: [WinterParticipationService],
  exports: [WinterParticipationService],
})
export class WinterParticipationModule {}
