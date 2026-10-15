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
import { EventSourceService } from './event-source.service';
import {
  CreateSourceDto,
  UpdateSourceDto,
  ToggleSourceDto,
} from './dto/create-source.dto';
import { QuerySourceDto } from './dto/query-source.dto';
import { QueryCrawlLogDto } from './dto/query-crawl-log.dto';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

/**
 * 后台抓取源管理 + 抓取日志列表（按 sourceId）
 * 注意：具体路径（list / crawl-logs）必须在 :id 之前注册，
 * 否则会被 :id 路径参数捕获。
 */
@ApiTags('赛事抓取源-管理后台')
@ApiBearerAuth('JWT')
@Controller('api/admin/event-source')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class EventSourceAdminController {
  constructor(private readonly sourceService: EventSourceService) {}

  /** 1. 数据源分页 */
  @ApiOperation({ summary: '抓取源分页列表' })
  @Get('list')
  async list(@Query() query: QuerySourceDto) {
    return this.sourceService.listSources(query);
  }

  /** 通用日志分页（不带 sourceId 过滤） */
  @ApiOperation({ summary: '抓取日志分页列表' })
  @Get('crawl-logs')
  async listLogs(@Query() query: QueryCrawlLogDto) {
    return this.sourceService.listLogs(query);
  }

  /** 2. 创建数据源 */
  @ApiOperation({ summary: '创建抓取源' })
  @Post()
  async create(@Body() dto: CreateSourceDto) {
    return this.sourceService.createSource(dto);
  }

  /** 3. 更新 */
  @ApiOperation({ summary: '更新抓取源' })
  @Put(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateSourceDto) {
    return this.sourceService.updateSource(Number(id), dto);
  }

  /** 4. 启用/停用 */
  @ApiOperation({ summary: '启用/停用抓取源' })
  @Put(':id/toggle')
  async toggle(@Param('id') id: number, @Body() dto: ToggleSourceDto) {
    return this.sourceService.toggleSource(Number(id), dto);
  }

  /** 5. 删除 */
  @ApiOperation({ summary: '删除抓取源' })
  @Delete(':id')
  async remove(@Param('id') id: number) {
    await this.sourceService.deleteSource(Number(id));
    return { success: true };
  }

  /** 6. 手动触发抓取（返回 logId） */
  @ApiOperation({ summary: '手动触发抓取' })
  @Post(':id/crawl')
  @RequirePermissions('event:crawl:trigger')
  async crawl(@Param('id') id: number) {
    return this.sourceService.triggerCrawl(Number(id));
  }

  /** 7. 抓取日志分页（按 sourceId） */
  @ApiOperation({ summary: '指定源抓取日志分页' })
  @Get(':id/crawl-logs')
  async listLogsBySource(
    @Param('id') id: number,
    @Query() query: QueryCrawlLogDto,
  ) {
    return this.sourceService.listLogsBySource(Number(id), query);
  }
}

/**
 * 抓取日志详情（独立 controller，路由 /api/admin/crawl-log/:logId，
 * 与 event-source 的 :id 路径完全独立，避免冲突）。
 */
@ApiTags('抓取日志-管理后台')
@ApiBearerAuth('JWT')
@Controller('api/admin/crawl-log')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class CrawlLogAdminController {
  constructor(private readonly sourceService: EventSourceService) {}

  /** 8. 抓取日志详情 */
  @ApiOperation({ summary: '抓取日志详情' })
  @Get(':logId')
  async detail(@Param('logId') logId: number) {
    return this.sourceService.findLogById(Number(logId));
  }
}
