import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AssociationService } from './association.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateAssociationDto } from './dto/create-association.dto';
import { ApplyMemberDto } from './dto/apply-member.dto';
import { QueryAssociationDto } from './dto/query-association.dto';
import { QueryMemberDto } from './dto/query-member.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

/**
 * C 端 — 冬泳协会
 *
 * 注意：字面量路由（list / my-memberships）必须声明在 `:id` 之前，
 * 否则会被参数路由 `:id` 提前匹配，导致 ParseIntPipe 抛错。
 */
@Controller('api/association')
@UseGuards(JwtAuthGuard)
@ApiTags('冬泳协会-小程序')
@ApiBearerAuth('JWT')
export class AssociationController {
  constructor(private readonly associationService: AssociationService) {}

  /** 已审核通过的协会分页列表（公开浏览） */
  @Public()
  @Get('list')
  @ApiOperation({ summary: '已审核协会分页列表（公开浏览）' })
  async list(@Query() query: QueryAssociationDto) {
    return this.associationService.findPublicList(query);
  }

  /** 我的协会报名记录列表 */
  @Get('my-memberships')
  @ApiOperation({ summary: '我的协会报名记录列表' })
  async myMemberships(
    @CurrentUser('userId') userId: number,
    @Query() query: QueryMemberDto,
  ) {
    return this.associationService.findMyMemberships(userId, query);
  }

  /** 用户提交入会报名 */
  @Post('apply')
  @ApiOperation({ summary: '提交入会报名' })
  async apply(
    @CurrentUser('userId') userId: number,
    @Body() dto: ApplyMemberDto,
  ) {
    return this.associationService.apply(userId, dto);
  }

  /** 用户创建新协会（默认 0 待审核） */
  @Post(':id/create')
  @ApiOperation({ summary: '用户创建新协会（默认待审核）' })
  @ApiParam({ name: 'id', description: '占位参数（接口设计保留，创建时不依赖该值）' })
  async createByUser(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) _id: number,
    @Body() dto: CreateAssociationDto,
  ) {
    // 注：路由路径含 :id 占位以与接口设计保持一致，实际创建时不依赖该 id
    return this.associationService.createByUser(userId, dto);
  }

  /** 取消报名（仅 status=0 待审核可取消） */
  @Put(':id/cancel-apply')
  @ApiOperation({ summary: '取消入会报名（仅待审核可取消）' })
  @ApiParam({ name: 'id', description: '报名记录ID' })
  async cancelApply(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) memberId: number,
  ) {
    await this.associationService.cancelApply(userId, memberId);
    return { success: true };
  }

  /** 协会详情（公开浏览，放在 :id 类路由最后以避免覆盖字面量路由） */
  @Public()
  @Get(':id')
  @ApiOperation({ summary: '协会详情（公开浏览）' })
  @ApiParam({ name: 'id', description: '协会ID' })
  async detail(@Param('id', ParseIntPipe) id: number) {
    return this.associationService.findPublicDetail(id);
  }
}
