import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EventService } from './event.service';
import { QueryEventDto } from './dto/query-event.dto';
import { RegisterEventDto } from './dto/register-event.dto';
import { QueryRegistrationDto } from './dto/query-registration.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * C 端赛事浏览 + 报名
 * 注意：具体路径（list / my-registrations / registration/...）必须在 :id 之前注册，
 * 否则会被 :id 路径参数捕获。
 */
@ApiTags('赛事-小程序')
@Controller('api/event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  /** 1. 赛事列表（公开） */
  @ApiOperation({ summary: '赛事分页列表' })
  @Public()
  @Get('list')
  async list(@Query() query: QueryEventDto) {
    return this.eventService.listPublic(query);
  }

  /** 4. 我的报名记录（需登录，必须放在 :id 之前） */
  @ApiOperation({ summary: '我的报名记录' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Get('my-registrations')
  async myRegistrations(
    @CurrentUser('userId') userId: number,
    @Query() query: QueryRegistrationDto,
  ) {
    return this.eventService.listMyRegistrations(userId, query);
  }

  /** 5. 报名单详情（按订单号，需登录） */
  @ApiOperation({ summary: '报名单详情' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Get('registration/:orderNo')
  async registrationDetail(
    @CurrentUser('userId') userId: number,
    @Param('orderNo') orderNo: string,
  ) {
    return this.eventService.findRegistrationByOrderNo(orderNo, userId);
  }

  /** 6. 取消报名（仅未支付时） */
  @ApiOperation({ summary: '取消报名' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Post('registration/:orderNo/cancel')
  async cancelRegistration(
    @CurrentUser('userId') userId: number,
    @Param('orderNo') orderNo: string,
  ) {
    return this.eventService.cancelByUser(orderNo, userId);
  }

  /** 2. 赛事详情（公开，含 groups[]、source、viewCount++） */
  @ApiOperation({ summary: '赛事详情' })
  @Public()
  @Get(':id')
  async detail(@Param('id') id: number) {
    return this.eventService.findPublicDetail(Number(id));
  }

  /** 3. 提交报名（需登录） */
  @ApiOperation({ summary: '提交赛事报名' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Post(':id/register')
  async register(
    @CurrentUser('userId') userId: number,
    @Param('id') id: number,
    @Body() dto: RegisterEventDto,
  ) {
    return this.eventService.register(userId, Number(id), dto);
  }
}
