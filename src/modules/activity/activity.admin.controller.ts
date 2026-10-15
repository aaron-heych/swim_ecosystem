import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ActivityService } from './activity.service';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { QueryActivityDto } from './dto/query-activity.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

/**
 * 后台 — 冬泳活动管理
 */
@ApiTags('冬泳活动-管理后台')
@ApiBearerAuth('JWT')
@Controller('api/admin/activity')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class ActivityAdminController {
  constructor(private readonly activityService: ActivityService) {}

  /** 1. 活动分页列表 */
  @Get('list')
  @ApiOperation({ summary: '冬泳活动分页列表' })
  list(@Query() query: QueryActivityDto) {
    return this.activityService.findAdminList(query);
  }

  /** 2. 创建活动（草稿） */
  @Post()
  @ApiOperation({ summary: '创建冬泳活动' })
  create(
    @Body() dto: CreateActivityDto,
    @CurrentUser('adminId') adminId: number,
  ) {
    return this.activityService.create(dto, adminId);
  }

  /** 3. 更新活动 */
  @Put(':id')
  @ApiOperation({ summary: '更新冬泳活动' })
  @ApiParam({ name: 'id', description: '活动ID' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActivityDto,
    @CurrentUser() _user: JwtPayload,
  ) {
    return this.activityService.update(id, dto);
  }

  /** 4. 修改状态 */
  @Put(':id/status')
  @ApiOperation({ summary: '修改活动状态' })
  @ApiParam({ name: 'id', description: '活动ID' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: number,
  ) {
    return this.activityService.updateStatus(id, status);
  }

  /** 5. 软删除活动 */
  @Delete(':id')
  @ApiOperation({ summary: '删除冬泳活动' })
  @ApiParam({ name: 'id', description: '活动ID' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.activityService.softRemove(id);
    return { success: true };
  }
}
