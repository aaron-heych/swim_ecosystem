import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EventService } from './event.service';
import {
  CreateEventDto,
  UpdateEventDto,
  UpdateEventStatusDto,
  AuditEventDto,
  UpdateEventHotDto,
} from './dto/create-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { CreateGroupDto, UpdateGroupDto } from './dto/create-group.dto';
import {
  QueryRegistrationDto,
  UpdateRegistrationPayStatusDto,
} from './dto/query-registration.dto';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * 后台赛事管理
 * 注意：具体路径（list / registrations / group/:groupId）必须在 :id 之前注册，
 * 否则会被 :id 路径参数捕获。
 */
@ApiTags('赛事-管理后台')
@ApiBearerAuth('JWT')
@Controller('api/admin/event')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class EventAdminController {
  constructor(private readonly eventService: EventService) {}

  /** 1. 赛事分页（含 auditStatus/status/keyword） */
  @ApiOperation({ summary: '赛事分页列表' })
  @Get('list')
  async list(@Query() query: QueryEventDto) {
    return this.eventService.listAdmin(query);
  }

  /** 12. 报名单分页（status/payStatus 过滤） */
  @ApiOperation({ summary: '报名单分页列表' })
  @Get('registrations')
  async listRegistrations(@Query() query: QueryRegistrationDto) {
    return this.eventService.listRegistrations(query);
  }

  /** 10. 更新组别（具体路径 group/:groupId 必须在 :id 之前） */
  @ApiOperation({ summary: '更新赛事组别' })
  @Put('group/:groupId')
  async updateGroup(
    @Param('groupId') groupId: number,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.eventService.updateGroup(Number(groupId), dto);
  }

  /** 11. 删除组别 */
  @ApiOperation({ summary: '删除赛事组别' })
  @Delete('group/:groupId')
  async deleteGroup(@Param('groupId') groupId: number) {
    await this.eventService.deleteGroup(Number(groupId));
    return { success: true };
  }

  /** 2. 手工创建赛事（sourceId=null, externalId=null） */
  @ApiOperation({ summary: '创建赛事' })
  @Post()
  @RequirePermissions('event:create')
  async create(
    @CurrentUser('adminId') adminId: number,
    @Body() dto: CreateEventDto,
  ) {
    return this.eventService.create(dto, adminId);
  }

  /** 3. 更新赛事 */
  @ApiOperation({ summary: '更新赛事' })
  @Put(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateEventDto) {
    return this.eventService.update(Number(id), dto);
  }

  /** 4. 审核（auditStatus 1通过/2驳回） */
  @ApiOperation({ summary: '审核赛事' })
  @Put(':id/audit')
  @RequirePermissions('event:audit')
  async audit(@Param('id') id: number, @Body() dto: AuditEventDto) {
    return this.eventService.audit(Number(id), dto);
  }

  /** 5. 修改赛事状态 */
  @ApiOperation({ summary: '修改赛事状态' })
  @Put(':id/status')
  async updateStatus(
    @Param('id') id: number,
    @Body() dto: UpdateEventStatusDto,
  ) {
    return this.eventService.updateStatus(Number(id), dto);
  }

  /** 6. 发布（publishAt + status=1 报名中） */
  @ApiOperation({ summary: '发布赛事' })
  @Put(':id/publish')
  async publish(@Param('id') id: number) {
    return this.eventService.publish(Number(id));
  }

  /** 7. 设置/取消热门 */
  @ApiOperation({ summary: '设置/取消热门赛事' })
  @Put(':id/hot')
  async updateHot(@Param('id') id: number, @Body() dto: UpdateEventHotDto) {
    return this.eventService.updateHot(Number(id), dto);
  }

  /** 8. 软删除 */
  @ApiOperation({ summary: '删除赛事' })
  @Delete(':id')
  async remove(@Param('id') id: number) {
    await this.eventService.softDelete(Number(id));
    return { success: true };
  }

  /** 9. 创建组别（POST :eventId/group —— 子路径在 :id 之后安全） */
  @ApiOperation({ summary: '创建赛事组别' })
  @Post(':eventId/group')
  async createGroup(
    @Param('eventId') eventId: number,
    @Body() dto: CreateGroupDto,
  ) {
    return this.eventService.createGroup(Number(eventId), dto);
  }

  /** 13. 标记已支付（payStatus=1, payTime, transactionId, status=1 已报名） */
  @ApiOperation({ summary: '标记报名单已支付' })
  @Put('registration/:id/pay-status')
  async updateRegistrationPayStatus(
    @Param('id') id: number,
    @Body() dto: UpdateRegistrationPayStatusDto,
  ) {
    return this.eventService.updateRegistrationPayStatus(Number(id), dto);
  }

  /** 14. 退款（payStatus=2, status=3） */
  @ApiOperation({ summary: '报名单退款' })
  @Put('registration/:id/refund')
  async refundRegistration(@Param('id') id: number) {
    return this.eventService.refundRegistration(Number(id));
  }
}
