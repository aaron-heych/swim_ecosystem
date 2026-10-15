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
import { WinterParticipationService } from './winter-participation.service';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CreateParticipationDto } from './dto/create-participation.dto';
import { UpdateParticipationDto } from './dto/update-participation.dto';
import { QueryParticipationDto } from './dto/query-participation.dto';
import { ImportMembersDto, UpdateParticipantDto } from './dto/participant.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

/**
 * 后台 — 冬泳参与管理（赛事 / 活动共用的参与协会与人员）
 */
@ApiTags('冬泳参与-管理后台')
@ApiBearerAuth('JWT')
@Controller('api/admin')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class WinterParticipationAdminController {
  constructor(private readonly service: WinterParticipationService) {}

  /** 1. 参与协会列表（按赛事/活动过滤） */
  @Get('winter-participation/list')
  @ApiOperation({ summary: '参与协会列表' })
  list(@Query() query: QueryParticipationDto) {
    return this.service.findList(query);
  }

  /** 查询某赛事/活动下全部参与人员（成绩录入下拉用） */
  @Get('winter-participation/participant-options')
  @ApiOperation({ summary: '赛事/活动全部参与人员' })
  participantOptions(
    @Query('targetType', ParseIntPipe) targetType: number,
    @Query('targetId', ParseIntPipe) targetId: number,
  ) {
    return this.service.findParticipantOptions(targetType, targetId);
  }

  /** 2. 新增参与协会 */
  @Post('winter-participation')
  @ApiOperation({ summary: '新增参与协会' })
  create(@Body() dto: CreateParticipationDto) {
    return this.service.create(dto);
  }

  /** 3. 更新参与协会 */
  @Put('winter-participation/:id')
  @ApiOperation({ summary: '更新参与协会' })
  @ApiParam({ name: 'id', description: '参与记录ID' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateParticipationDto,
  ) {
    return this.service.update(id, dto);
  }

  /** 4. 删除参与协会（连带人员） */
  @Delete('winter-participation/:id')
  @ApiOperation({ summary: '删除参与协会' })
  @ApiParam({ name: 'id', description: '参与记录ID' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  /** 5. 某参赛协会下的人员列表 */
  @Get('winter-participation/:id/participants')
  @ApiOperation({ summary: '参与人员列表' })
  @ApiParam({ name: 'id', description: '参与记录ID' })
  participants(@Param('id', ParseIntPipe) id: number) {
    return this.service.findParticipants(id);
  }

  /** 6. 可导入的协会会员（标记是否已导入） */
  @Get('winter-participation/:id/member-options')
  @ApiOperation({ summary: '可导入的协会会员' })
  @ApiParam({ name: 'id', description: '参与记录ID' })
  memberOptions(@Param('id', ParseIntPipe) id: number) {
    return this.service.findMemberOptions(id);
  }

  /** 7. 从协会会员批量导入人员 */
  @Post('winter-participation/:id/import-members')
  @ApiOperation({ summary: '从协会会员导入参与人员' })
  @ApiParam({ name: 'id', description: '参与记录ID' })
  importMembers(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ImportMembersDto,
  ) {
    return this.service.importMembers(id, dto);
  }

  /** 8. 编辑参与人员 */
  @Put('winter-participant/:id')
  @ApiOperation({ summary: '编辑参与人员' })
  @ApiParam({ name: 'id', description: '参与人员ID' })
  updateParticipant(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateParticipantDto,
  ) {
    return this.service.updateParticipant(id, dto);
  }

  /** 9. 删除参与人员 */
  @Delete('winter-participant/:id')
  @ApiOperation({ summary: '删除参与人员' })
  @ApiParam({ name: 'id', description: '参与人员ID' })
  removeParticipant(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeParticipant(id);
  }
}
