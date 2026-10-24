import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CoachService } from './coach.service';
import { CreateCoachDto, UpdateCoachDto } from './dto/create-coach.dto';
import { CreateCourseDto, UpdateCourseDto } from './dto/create-course.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';
import {
  AuditCoachDto,
  ReplyReviewDto,
  UpdateCoachStatusDto,
  UpdateCourseStatusDto,
} from './dto/audit-coach.dto';
import {
  UpdateAppointmentPayStatusDto,
  UpdateAppointmentStatusDto,
} from './dto/query-appointment.dto';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

/**
 * 后台教练 / 课程 / 排班 / 预约 / 评价管理
 */
@ApiTags('教练-管理后台')
@ApiBearerAuth('JWT')
@Controller('api/admin/coach')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class CoachAdminController {
  constructor(private readonly coachService: CoachService) {}

  // ============== 教练 ==============

  /** 1. 教练分页 */
  @ApiOperation({ summary: '教练分页列表' })
  @Get('list')
  async list(
    @Query('page', new DefaultValuePipe('1'), ParseIntPipe) page = '1',
    @Query('pageSize', new DefaultValuePipe('20'), ParseIntPipe) pageSize = '20',
    @Query('keyword') keyword?: string,
    @Query('venueId', new ParseIntPipe({ optional: true }))
    venueId?: string,
    @Query('auditStatus', new ParseIntPipe({ optional: true }))
    auditStatus?: string,
    @Query('status', new ParseIntPipe({ optional: true })) status?: string,
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
    return this.coachService.listAdmin(
      pageNumber,
      pageSizeNumber,
      keyword,
      venueId === undefined ? undefined : Number(venueId),
      auditStatus === undefined ? undefined : Number(auditStatus),
      status === undefined ? undefined : Number(status),
    );
  }

  /** 2. 创建教练（可关联 userId） */
  @ApiOperation({ summary: '创建教练' })
  @Post()
  async createCoach(@Body() dto: CreateCoachDto) {
    return this.coachService.createCoach(dto);
  }

  /** 3. 更新教练 */
  @ApiOperation({ summary: '更新教练信息' })
  @Put(':id')
  async updateCoach(@Param('id') id: number, @Body() dto: UpdateCoachDto) {
    return this.coachService.updateCoach(Number(id), dto);
  }

  /** 4. 教练审核（auditStatus + auditRemark） */
  @ApiOperation({ summary: '审核教练' })
  @Put(':id/audit')
  async auditCoach(@Param('id') id: number, @Body() dto: AuditCoachDto) {
    return this.coachService.auditCoach(Number(id), dto);
  }

  /** 5. 教练上架/下架 */
  @ApiOperation({ summary: '教练上架/下架' })
  @Put(':id/status')
  async updateCoachStatus(
    @Param('id') id: number,
    @Body() dto: UpdateCoachStatusDto,
  ) {
    return this.coachService.updateCoachStatus(Number(id), dto);
  }

  /** 6. 教练软删除 */
  @ApiOperation({ summary: '删除教练（软删除）' })
  @Delete(':id')
  async deleteCoach(@Param('id') id: number) {
    await this.coachService.deleteCoach(Number(id));
    return { success: true };
  }

  // ============== 课程 ==============

  /** 7. 创建课程 */
  @ApiOperation({ summary: '创建课程' })
  @Post(':coachId/course')
  async createCourse(@Body() dto: CreateCourseDto) {
    return this.coachService.createCourse(dto);
  }

  /** 8. 更新课程 */
  @ApiOperation({ summary: '更新课程' })
  @Put('course/:courseId')
  async updateCourse(
    @Param('courseId') courseId: number,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.coachService.updateCourse(Number(courseId), dto);
  }

  /** 9. 课程上下架 */
  @ApiOperation({ summary: '课程上架/下架' })
  @Put('course/:courseId/status')
  async updateCourseStatus(
    @Param('courseId') courseId: number,
    @Body() dto: UpdateCourseStatusDto,
  ) {
    return this.coachService.updateCourseStatus(Number(courseId), dto);
  }

  /** 10. 删除课程 */
  @ApiOperation({ summary: '删除课程' })
  @Delete('course/:courseId')
  async deleteCourse(@Param('courseId') courseId: number) {
    await this.coachService.deleteCourse(Number(courseId));
    return { success: true };
  }

  // ============== 排班 ==============

  /** 11. 批量创建排班（coachId, courseId?, venueId?, dates[], startTime, endTime） */
  @ApiOperation({ summary: '批量创建排班' })
  @Post('schedule')
  async createSchedules(@Body() dto: CreateScheduleDto) {
    return this.coachService.batchCreateSchedules(dto);
  }

  /** 12. 删除排班 */
  @ApiOperation({ summary: '删除排班' })
  @Delete('schedule/:id')
  async deleteSchedule(@Param('id') id: number) {
    await this.coachService.deleteSchedule(Number(id));
    return { success: true };
  }

  // ============== 预约 ==============

  /** 13. 预约单分页（status/payStatus 过滤） */
  @ApiOperation({ summary: '预约单分页列表' })
  @Get('appointments')
  async listAppointments(@Query() query: QueryAppointmentDto) {
    return this.coachService.listAppointments(query);
  }

  /** 14. 修改预约状态（教练确认/完成/取消/爽约） */
  @ApiOperation({ summary: '修改预约状态' })
  @Put('appointment/:id/status')
  async updateAppointmentStatus(
    @Param('id') id: number,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.coachService.updateAppointmentStatus(Number(id), dto);
  }

  /** 15. 标记已支付（payStatus=1, payTime, transactionId） */
  @ApiOperation({ summary: '标记预约单已支付' })
  @Put('appointment/:id/pay-status')
  async updateAppointmentPayStatus(
    @Param('id') id: number,
    @Body() dto: UpdateAppointmentPayStatusDto,
  ) {
    return this.coachService.updateAppointmentPayStatus(Number(id), dto);
  }

  // ============== 评价 ==============

  /** 16. 教练/管理员回复评价（reply, repliedAt） */
  @ApiOperation({ summary: '回复教练评价' })
  @Put('review/:id/reply')
  async replyReview(
    @Param('id') id: number,
    @Body() dto: ReplyReviewDto,
  ) {
    return this.coachService.replyReview(Number(id), dto);
  }
}
