import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { RegionService } from './region.service';

@ApiTags('行政区划-管理后台')
@ApiBearerAuth('JWT')
@Controller('api/admin/region')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class RegionAdminController {
  constructor(private readonly regionService: RegionService) {}

  private assertSuperAdmin(user: JwtPayload): void {
    if (!user.roleCodes?.includes('super_admin')) {
      throw new ForbiddenException('仅超级管理员可以维护行政区');
    }
  }

  @Get('tree')
  @ApiOperation({ summary: '获取全部行政区树（含停用项）' })
  tree(@CurrentUser() user: JwtPayload) {
    this.assertSuperAdmin(user);
    return this.regionService.findAdminTree();
  }

  @Post()
  @ApiOperation({ summary: '新增省、市或区县' })
  create(
    @Body() dto: CreateRegionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.assertSuperAdmin(user);
    return this.regionService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '修改行政区名称、编码、排序或状态' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRegionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.assertSuperAdmin(user);
    return this.regionService.update(id, dto);
  }
}
