/**
 * 圈子 C 端 Controller — 发帖/浏览/评论/点赞/收藏/举报/扩展交互
 * 公开浏览接口 @Public，写操作 @UseGuards(JwtAuthGuard)
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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CircleService } from './circle.service';
import { PostExtService } from './post-ext.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { CreateCommentDto } from './dto/comment.dto';
import { LikeDto } from './dto/like.dto';
import { CreateReportDto } from './dto/report.dto';
import { ActivitySignupDto } from './dto/signup.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('游泳圈子-小程序')
@Controller('api/circle')
export class CircleController {
  constructor(
    private readonly circleService: CircleService,
    private readonly postExtService: PostExtService,
  ) {}

  /* ---------------------------- 浏览（公开） ---------------------------- */

  @ApiOperation({ summary: '圈子帖子信息流' })
  @Get('feed')
  @Public()
  async feed(@Query() query: QueryPostDto) {
    return this.circleService.findFeed(query);
  }

  @ApiOperation({ summary: '帖子详情' })
  @Get('post/:id')
  @Public()
  async detail(@Param('id', ParseIntPipe) id: number) {
    return this.circleService.findPostDetail(id);
  }

  /* ---------------------------- 发帖 / 编辑 / 删除 ---------------------------- */

  @ApiOperation({ summary: '发布帖子' })
  @ApiBearerAuth('JWT')
  @Post('post')
  @UseGuards(JwtAuthGuard)
  async createPost(
    @CurrentUser('userId') userId: number,
    @Body() dto: CreatePostDto,
  ) {
    return this.circleService.createPost(userId, dto);
  }

  @ApiOperation({ summary: '编辑帖子' })
  @ApiBearerAuth('JWT')
  @Put('post/:id')
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
  ) {
    return this.circleService.updatePost(userId, id, dto);
  }

  @ApiOperation({ summary: '删除帖子' })
  @ApiBearerAuth('JWT')
  @Delete('post/:id')
  @UseGuards(JwtAuthGuard)
  async deletePost(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.circleService.deletePost(userId, id);
    return { success: true };
  }

  @ApiOperation({ summary: '我的帖子列表' })
  @ApiBearerAuth('JWT')
  @Get('my-posts')
  @UseGuards(JwtAuthGuard)
  async myPosts(
    @CurrentUser('userId') userId: number,
    @Query() query: QueryPostDto,
  ) {
    return this.circleService.findMyPosts(userId, query);
  }

  /* ---------------------------- 评论 ---------------------------- */

  @ApiOperation({ summary: '发表评论' })
  @ApiBearerAuth('JWT')
  @Post('post/:postId/comment')
  @UseGuards(JwtAuthGuard)
  async createComment(
    @CurrentUser('userId') userId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() dto: CreateCommentDto,
  ) {
    return this.circleService.createComment(userId, postId, dto);
  }

  @ApiOperation({ summary: '帖子评论列表' })
  @Get('post/:postId/comments')
  @Public()
  async listComments(
    @Param('postId', ParseIntPipe) postId: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.circleService.findComments(postId, page ? Number(page) : 1, pageSize ? Number(pageSize) : 20);
  }

  @ApiOperation({ summary: '删除评论' })
  @ApiBearerAuth('JWT')
  @Delete('comment/:id')
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.circleService.deleteComment(userId, id);
    return { success: true };
  }

  /* ---------------------------- 点赞 ---------------------------- */

  @ApiOperation({ summary: '点赞/取消点赞' })
  @ApiBearerAuth('JWT')
  @Post('like')
  @UseGuards(JwtAuthGuard)
  async like(
    @CurrentUser('userId') userId: number,
    @Body() dto: LikeDto,
  ) {
    return this.circleService.toggleLike(userId, dto);
  }

  /* ---------------------------- 收藏 ---------------------------- */

  @ApiOperation({ summary: '收藏/取消收藏帖子' })
  @ApiBearerAuth('JWT')
  @Post('favorite/:postId')
  @UseGuards(JwtAuthGuard)
  async favorite(
    @CurrentUser('userId') userId: number,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.circleService.toggleFavorite(userId, postId);
  }

  @ApiOperation({ summary: '我的收藏列表' })
  @ApiBearerAuth('JWT')
  @Get('my-favorites')
  @UseGuards(JwtAuthGuard)
  async myFavorites(
    @CurrentUser('userId') userId: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.circleService.findMyFavorites(userId, page ? Number(page) : 1, pageSize ? Number(pageSize) : 20);
  }

  /* ---------------------------- 扩展交互 ---------------------------- */

  @ApiOperation({ summary: '报名活动帖子' })
  @ApiBearerAuth('JWT')
  @Post('post/:postId/activity-join')
  @UseGuards(JwtAuthGuard)
  async activityJoin(
    @CurrentUser('userId') userId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() dto: ActivitySignupDto,
  ) {
    return this.postExtService.joinActivity(userId, postId, dto);
  }

  @ApiOperation({ summary: '加入约伴帖子' })
  @ApiBearerAuth('JWT')
  @Post('post/:postId/buddy-join')
  @UseGuards(JwtAuthGuard)
  async buddyJoin(
    @CurrentUser('userId') userId: number,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.postExtService.joinBuddy(userId, postId);
  }

  @ApiOperation({ summary: '标记拼卡成交' })
  @ApiBearerAuth('JWT')
  @Post('post/:postId/card-deal')
  @UseGuards(JwtAuthGuard)
  async cardDeal(
    @CurrentUser('userId') userId: number,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.postExtService.markCardDeal(userId, postId);
  }

  /* ---------------------------- 举报 ---------------------------- */

  @ApiOperation({ summary: '举报帖子/评论' })
  @ApiBearerAuth('JWT')
  @Post('report')
  @UseGuards(JwtAuthGuard)
  async report(
    @CurrentUser('userId') userId: number,
    @Body() dto: CreateReportDto,
  ) {
    return this.circleService.createReport(userId, dto);
  }
}
