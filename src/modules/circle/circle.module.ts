/**
 * 圈子模块 — type=1代刷卡 / type=2约搭子 / type=3活动 / type=4动态
 *
 * 注册实体：CirclePost / CardShare / BuddyInvitation / Activity
 *           ActivityParticipant / CircleComment / CircleLike / CircleFavorite / Report
 * 服务：CircleService（主表 + 评论/点赞/收藏/举报）、PostExtService（扩展表 + 报名/加入/成交）
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CirclePost,
  CardShare,
  BuddyInvitation,
  Activity,
  ActivityParticipant,
  CircleComment,
  CircleLike,
  CircleFavorite,
  Report,
} from './circle.entity';
import { CircleService } from './circle.service';
import { PostExtService } from './post-ext.service';
import { CircleController } from './circle.controller';
import { CircleAdminController } from './circle.admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CirclePost,
      CardShare,
      BuddyInvitation,
      Activity,
      ActivityParticipant,
      CircleComment,
      CircleLike,
      CircleFavorite,
      Report,
    ]),
  ],
  controllers: [CircleController, CircleAdminController],
  providers: [CircleService, PostExtService],
  exports: [CircleService, PostExtService],
})
export class CircleModule {}
