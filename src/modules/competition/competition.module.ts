import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  WinterCompetition,
  WinterCompetitionGroup,
  WinterCompetitionResult,
  WinterCompetitionScoreRule,
  WinterCompetitionSponsor,
} from './competition.entity';
import { CompetitionService } from './competition.service';
import { CompetitionAdminController } from './competition.admin.controller';
import { CompetitionResultAdminController } from './competition-result.admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WinterCompetition,
      WinterCompetitionGroup,
      WinterCompetitionResult,
      WinterCompetitionSponsor,
      WinterCompetitionScoreRule,
    ]),
  ],
  controllers: [CompetitionAdminController, CompetitionResultAdminController],
  providers: [CompetitionService],
  exports: [CompetitionService],
})
export class CompetitionModule {}
