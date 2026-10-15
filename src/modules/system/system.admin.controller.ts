/**
 * 系统/运营支撑 — 后台 Controller
 * Banner / Feedback / SysConfig / OperationLog 的后台管理接口
 */
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
import { SystemService } from './system.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { QueryBannerDto } from './dto/query-banner.dto';
import { ReplyFeedbackDto } from './dto/reply-feedback.dto';
import { QueryFeedbackDto } from './dto/query-feedback.dto';
import { CreateConfigDto } from './dto/create-config.dto';
import { QueryConfigDto } from './dto/query-config.dto';
import { QueryOperationLogDto } from './dto/query-operation-log.dto';
import { QueryAccessStatDto } from './dto/query-access-stat.dto';
import { QueryAccessStatDetailDto } from './dto/query-access-stat-detail.dto';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/admin/system')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class SystemAdminController {
  constructor(private readonly systemService: SystemService) {}

  /* ============================= Banner ============================= */

  /** 1. Banner 分页列表（position/status 过滤、keyword 搜标题） */
  @Get('banners')
  async banners(@Query() query: QueryBannerDto) {
    return this.systemService.findBanners(query);
  }

  /** 2. 创建 Banner */
  @Post('banner')
  @RequirePermissions('system:banner:create')
  async createBanner(@Body() dto: CreateBannerDto) {
    return this.systemService.createBanner(dto);
  }

  /** 3. 更新 Banner */
  @Put('banner/:id')
  async updateBanner(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateBannerDto,
  ) {
    return this.systemService.updateBanner(id, dto);
  }

  /** 4. 上线/下线 Banner */
  @Put('banner/:id/status')
  async updateBannerStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: number,
  ) {
    await this.systemService.updateBannerStatus(id, status);
    return { success: true };
  }

  /** 5. 删除 Banner */
  @Delete('banner/:id')
  async deleteBanner(@Param('id', ParseIntPipe) id: number) {
    await this.systemService.deleteBanner(id);
    return { success: true };
  }

  /* ============================= Feedback ============================= */

  /** 6. 反馈分页列表（status/type 过滤、keyword 搜内容） */
  @Get('feedbacks')
  async feedbacks(@Query() query: QueryFeedbackDto) {
    return this.systemService.findFeedbacks(query);
  }

  /** 7. 回复反馈（status=1, replyBy=currentAdminId, repliedAt=now） */
  @Put('feedback/:id/reply')
  @RequirePermissions('system:feedback:reply')
  async replyFeedback(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplyFeedbackDto,
    @CurrentUser('adminId') adminId?: number,
  ) {
    await this.systemService.replyFeedback(id, adminId ?? 0, dto);
    return { success: true };
  }

  /** 8. 关闭反馈（status=2） */
  @Put('feedback/:id/close')
  async closeFeedback(@Param('id', ParseIntPipe) id: number) {
    await this.systemService.closeFeedback(id);
    return { success: true };
  }

  /* ============================= SysConfig ============================= */

  /** 9. 配置分页列表（configGroup 过滤、keyword 搜 key/remark） */
  @Get('configs')
  async configs(@Query() query: QueryConfigDto) {
    return this.systemService.findConfigs(query);
  }

  /** 10. 创建配置 */
  @Post('config')
  @RequirePermissions('system:config:create')
  async createConfig(@Body() dto: CreateConfigDto) {
    return this.systemService.createConfig(dto);
  }

  /** 11. 更新配置 */
  @Put('config/:id')
  async updateConfig(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateConfigDto,
  ) {
    return this.systemService.updateConfig(id, dto);
  }

  /** 12. 删除配置 */
  @Delete('config/:id')
  async deleteConfig(@Param('id', ParseIntPipe) id: number) {
    await this.systemService.deleteConfig(id);
    return { success: true };
  }

  /* ============================= OperationLog ============================= */

  /** 13. 操作日志分页（adminId/module/action/status/日期范围过滤） */
  @Get('operation-logs')
  async operationLogs(@Query() query: QueryOperationLogDto) {
    return this.systemService.findOperationLogs(query);
  }

  /* ============================= C 端访问量统计 ============================= */

  /**
   * 14. C 端访问量汇总（各功能模块 今日/7日/累计 + 最近 N 天趋势）
   *    支持 module / startDate / endDate / days 过滤
   */
  @Get('access-stats')
  async accessStats(@Query() query: QueryAccessStatDto) {
    return this.systemService.findAccessStats(query);
  }

  /**
   * 15. C 端访问量明细（模块/日期范围多维度筛选 + 分页 + 区间聚合）
   *    支持 module / startDate / endDate / page / pageSize / sortField / sortOrder
   */
  @Get('access-stats/detail')
  async accessStatDetail(@Query() query: QueryAccessStatDetailDto) {
    return this.systemService.findAccessStatDetail(query);
  }
}
