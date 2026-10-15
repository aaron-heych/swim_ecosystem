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
import { CompetitionService } from './competition.service';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { QueryCompetitionDto } from './dto/query-competition.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

/**
 * 后台 — 冬泳赛事管理
 */
@ApiTags('冬泳赛事-管理后台')
@ApiBearerAuth('JWT')
@Controller('api/admin/competition')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class CompetitionAdminController {
  constructor(private readonly competitionService: CompetitionService) {}

  /** 1. 赛事分页列表 */
  @Get('list')
  @ApiOperation({ summary: '冬泳赛事分页列表' })
  list(@Query() query: QueryCompetitionDto) {
    return this.competitionService.findAdminList(query);
  }

  /** 2. 创建赛事（草稿） */
  @Post()
  @ApiOperation({ summary: '创建冬泳赛事' })
  create(
    @Body() dto: CreateCompetitionDto,
    @CurrentUser('adminId') adminId: number,
  ) {
    return this.competitionService.create(dto, adminId);
  }

  /** 3. 更新赛事 */
  @Put(':id')
  @ApiOperation({ summary: '更新冬泳赛事' })
  @ApiParam({ name: 'id', description: '赛事ID' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompetitionDto,
    @CurrentUser() _user: JwtPayload,
  ) {
    return this.competitionService.update(id, dto);
  }

  /** 4. 修改状态（草稿0→报名中1 时自动写发布时间） */
  @Put(':id/status')
  @ApiOperation({ summary: '修改赛事状态' })
  @ApiParam({ name: 'id', description: '赛事ID' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: number,
  ) {
    return this.competitionService.updateStatus(id, status);
  }

  /** 5. 软删除赛事 */
  @Delete(':id')
  @ApiOperation({ summary: '删除冬泳赛事' })
  @ApiParam({ name: 'id', description: '赛事ID' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.competitionService.softRemove(id);
    return { success: true };
  }
}
