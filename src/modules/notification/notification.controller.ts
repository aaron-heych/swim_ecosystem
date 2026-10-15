import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubscribeDto } from './dto/subscribe.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AnnouncementService } from './announcement.service';
import {
  AnnouncementAttendanceDto,
  QueryAnnouncementsDto,
} from './dto/announcement.dto';

/**
 * C 端 — 微信通知（仅订阅授权记录）
 */
@ApiTags('消息通知-小程序')
@ApiBearerAuth('JWT')
@Controller('api/notification')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly announcementService: AnnouncementService,
  ) {}

  /** 用户接受订阅授权 */
  @ApiOperation({ summary: '订阅消息授权' })
  @Post('subscribe')
  async subscribe(
    @CurrentUser('userId') userId: number,
    @Body() dto: SubscribeDto,
  ) {
    await this.notificationService.subscribe(userId, dto);
    return { success: true };
  }

  /** 我的订阅列表（含 templateCode、剩余 quota） */
  @ApiOperation({ summary: '我的订阅列表' })
  @Get('my-subscribes')
  async mySubscribes(
    @CurrentUser('userId') userId: number,
    @Query() query: PaginationDto,
  ) {
    return this.notificationService.findMySubscribes(userId, query);
  }

  @Get('announcements')
  @ApiOperation({ summary: '我的通知公告列表' })
  myAnnouncements(
    @CurrentUser('userId') userId: number,
    @Query() query: QueryAnnouncementsDto,
  ) {
    return this.announcementService.findMyAnnouncements(userId, query);
  }

  @Get('announcements/:id')
  @ApiOperation({ summary: '通知公告详情并标记已读' })
  myAnnouncement(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.announcementService.findMyAnnouncement(id, userId);
  }

  @Post('announcements/:id/attendance')
  @ApiOperation({ summary: '确认或拒绝参加通知活动' })
  respondAnnouncementAttendance(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AnnouncementAttendanceDto,
  ) {
    return this.announcementService.respondAttendance(id, userId, dto);
  }
}
