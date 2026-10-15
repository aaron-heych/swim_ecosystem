/**
 * 圈子后台 Controller — 帖子审核 / 评论管理 / 举报处理
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CircleService } from './circle.service';
import { QueryPostDto } from './dto/query-post.dto';
import { QueryCommentDto } from './dto/query-comment.dto';
import { QueryReportDto } from './dto/query-report.dto';
import { AuditPostDto } from './dto/audit-post.dto';
import { HandleReportDto } from './dto/handle-report.dto';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('游泳圈子-管理后台')
@ApiBearerAuth('JWT')
@Controller('api/admin/circle')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class CircleAdminController {
  constructor(private readonly circleService: CircleService) {}

  /* ---------------------------- 帖子 ---------------------------- */

  @ApiOperation({ summary: '帖子分页列表' })
  @Get('posts')
  async posts(@Query() query: QueryPostDto) {
    return this.circleService.adminFindPosts(query);
  }

  @ApiOperation({ summary: '审核帖子' })
  @Put('post/:id/audit')
  @RequirePermissions('circle:audit')
  async audit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AuditPostDto,
  ) {
    await this.circleService.auditPost(id, dto);
    return { success: true };
  }

  @ApiOperation({ summary: '置顶/取消置顶帖子' })
  @Put('post/:id/top')
  @RequirePermissions('circle:top')
  async top(@Param('id', ParseIntPipe) id: number) {
    return this.circleService.toggleTop(id);
  }

  @ApiOperation({ summary: '下架帖子' })
  @Put('post/:id/status')
  @RequirePermissions('circle:offline')
  async offline(@Param('id', ParseIntPipe) id: number) {
    await this.circleService.offlinePost(id);
    return { success: true };
  }

  @ApiOperation({ summary: '删除帖子' })
  @Delete('post/:id')
  @RequirePermissions('circle:delete')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.circleService.adminDeletePost(id);
    return { success: true };
  }

  /* ---------------------------- 评论 ---------------------------- */

  @ApiOperation({ summary: '评论分页列表' })
  @Get('comments')
  async comments(@Query() query: QueryCommentDto) {
    return this.circleService.adminFindComments(query);
  }

  @ApiOperation({ summary: '删除评论' })
  @Delete('comment/:id')
  @RequirePermissions('circle:comment:delete')
  async deleteComment(@Param('id', ParseIntPipe) id: number) {
    await this.circleService.adminDeleteComment(id);
    return { success: true };
  }

  /* ---------------------------- 举报 ---------------------------- */

  @ApiOperation({ summary: '举报分页列表' })
  @Get('reports')
  async reports(@Query() query: QueryReportDto) {
    return this.circleService.findReports(query);
  }

  @ApiOperation({ summary: '处理举报' })
  @Put('report/:id/handle')
  @RequirePermissions('circle:report:handle')
  async handleReport(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('adminId') adminId: number,
    @Body() dto: HandleReportDto,
  ) {
    await this.circleService.handleReport(id, adminId, dto);
    return { success: true };
  }
}
