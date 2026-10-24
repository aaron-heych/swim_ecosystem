import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CoachService } from './coach.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * C 端教练 + 课程 + 排班 + 预约 + 评价
 */
@ApiTags('教练预约-小程序')
@Controller('api/coach')
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  /** 1. 教练列表（venueId / keyword / strokes 过滤） */
  @ApiOperation({ summary: '教练分页列表' })
  @Public()
  @Get('list')
  async list(
    @Query('page', new DefaultValuePipe('1'), ParseIntPipe) page = '1',
    @Query('pageSize', new DefaultValuePipe('20'), ParseIntPipe) pageSize = '20',
    @Query('keyword') keyword?: string,
    @Query('venueId', new ParseIntPipe({ optional: true }))
    venueId?: string,
    @Query('strokes') strokes?: string,
  ) {
    const pageNumber = Number(page);
    const pageSizeNumber = Number(pageSize);
    if (
      !Number.isInteger(pageNumber) ||
      !Number.isInteger(pageSizeNumber) ||
      pageNumber < 1 ||
      pageSizeNumber < 1 ||
      pageSizeNumber > 100
    ) {
      throw new BadRequestException('page must be >= 1 and pageSize must be 1-100');
    }
    const strokeArr = strokes ? strokes.split(',') : undefined;
    return this.coachService.listPublic(
      pageNumber,
      pageSizeNumber,
      keyword,
      venueId === undefined ? undefined : Number(venueId),
      strokeArr,
    );
  }

  /** 2. 教练详情（含 courses[]） */
  @ApiOperation({ summary: '教练详情' })
  @Public()
  @Get(':id')
  async detail(@Param('id') id: number) {
    return this.coachService.findPublicDetail(Number(id));
  }

  /** 3. 教练排班列表（按日期范围 startDate ~ endDate） */
  @ApiOperation({ summary: '教练排班列表' })
  @Public()
  @Get(':id/schedules')
  async schedules(
    @Param('id') id: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.coachService.listSchedules(
      Number(id),
      startDate,
      endDate,
    );
  }

  /** 4. 课程详情 */
  @ApiOperation({ summary: '课程详情' })
  @Public()
  @Get('course/:courseId')
  async courseDetail(@Param('courseId') courseId: number) {
    return this.coachService.findCourseDetail(Number(courseId));
  }

  /** 5. 创建预约（需登录） */
  @ApiOperation({ summary: '预约教练（创建预约单）' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Post('appointment')
  async createAppointment(
    @CurrentUser('userId') userId: number,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.coachService.createAppointment(userId, dto);
  }

  /** 6. 我的预约列表 */
  @ApiOperation({ summary: '我的预约列表' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Get('appointment/my')
  async myAppointments(
    @CurrentUser('userId') userId: number,
    @Query() query: QueryAppointmentDto,
  ) {
    return this.coachService.listMyAppointments(userId, query);
  }

  /** 7. 预约详情 */
  @ApiOperation({ summary: '预约详情' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Get('appointment/:orderNo')
  async appointmentDetail(
    @CurrentUser('userId') userId: number,
    @Param('orderNo') orderNo: string,
  ) {
    return this.coachService.findAppointmentByOrderNo(orderNo, userId);
  }

  /** 8. 用户取消预约（status=3, cancelBy=1, schedule.status=0 释放） */
  @ApiOperation({ summary: '取消预约' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Post('appointment/:orderNo/cancel')
  async cancelAppointment(
    @CurrentUser('userId') userId: number,
    @Param('orderNo') orderNo: string,
  ) {
    return this.coachService.cancelByUser(orderNo, userId);
  }

  /** 9. 提交评价（每预约单只能评一次） */
  @ApiOperation({ summary: '提交教练评价' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Post('review')
  async createReview(
    @CurrentUser('userId') userId: number,
    @Body() dto: CreateReviewDto,
  ) {
    return this.coachService.createReview(userId, dto);
  }

  /** 10. 教练评价列表 */
  @ApiOperation({ summary: '教练评价列表' })
  @Public()
  @Get(':id/reviews')
  async reviews(
    @Param('id') id: number,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
  ) {
    return this.coachService.listCoachReviews(
      Number(id),
      Number(page) || 1,
      Number(pageSize) || 20,
    );
  }
}
