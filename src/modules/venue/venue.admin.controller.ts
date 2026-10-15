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
import { VenueService } from './venue.service';
import { CreateVenueDto, UpdateVenueDto } from './dto/create-venue.dto';
import { QueryVenueDto } from './dto/query-venue.dto';
import { AuditVenueDto, UpdateVenueStatusDto } from './dto/audit-venue.dto';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * 后台场馆管理
 */
@ApiTags('场馆-管理后台')
@ApiBearerAuth('JWT')
@Controller('api/admin/venue')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class VenueAdminController {
  constructor(private readonly venueService: VenueService) {}

  /** 1. 场馆分页（auditStatus 过滤 + keyword） */
  @ApiOperation({ summary: '场馆分页列表' })
  @Get('list')
  async list(@Query() query: QueryVenueDto) {
    return this.venueService.listAdmin(query);
  }

  /** 2. 创建场馆 */
  @ApiOperation({ summary: '创建场馆' })
  @Post()
  @RequirePermissions('venue:create')
  async create(
    @CurrentUser('adminId') adminId: number,
    @Body() dto: CreateVenueDto,
  ) {
    return this.venueService.create(dto, adminId);
  }

  /** 3. 更新场馆基本信息 */
  @ApiOperation({ summary: '更新场馆基本信息' })
  @Put(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateVenueDto) {
    return this.venueService.update(Number(id), dto);
  }

  /** 4. 场馆审核（auditStatus 1通过/2驳回） */
  @ApiOperation({ summary: '审核场馆' })
  @Put(':id/audit')
  @RequirePermissions('venue:audit')
  async audit(@Param('id') id: number, @Body() dto: AuditVenueDto) {
    return this.venueService.audit(Number(id), dto);
  }

  /** 5. 启用/停用 */
  @ApiOperation({ summary: '场馆启用/停用' })
  @Put(':id/status')
  async updateStatus(
    @Param('id') id: number,
    @Body() dto: UpdateVenueStatusDto,
  ) {
    return this.venueService.updateStatus(Number(id), dto);
  }

  /** 6. 软删除 */
  @ApiOperation({ summary: '删除场馆（软删除）' })
  @Delete(':id')
  async remove(@Param('id') id: number) {
    await this.venueService.softDelete(Number(id));
    return { success: true };
  }
}
