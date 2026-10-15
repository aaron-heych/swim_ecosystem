import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  BadRequestException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CreateTemplateDto } from './dto/create-template.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { QueryLogsDto } from './dto/query-logs.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { AnnouncementService } from './announcement.service';
import {
  QueryAnnouncementRecipientsDto,
  QueryAnnouncementsDto,
  SaveAnnouncementDto,
} from './dto/announcement.dto';

/**
 * 后台 — 微信通知：模板 / 流水 / 下发 / 粉丝
 */
@ApiTags('消息通知-管理后台')
@ApiBearerAuth('JWT')
@Controller('api/admin/notification')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class NotificationAdminController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly announcementService: AnnouncementService,
  ) {}

  private scopedAssociationId(user: JwtPayload): number | undefined {
    if (user.roleCodes?.includes('swimming_sub_admin')) {
      if (!user.associationId) {
        throw new ForbiddenException('当前协会管理员未绑定协会');
      }
      return user.associationId;
    }
    return undefined;
  }

  @Get('announcements')
  @RequirePermissions('notification:manage')
  @ApiOperation({ summary: '通知公告分页列表' })
  announcements(
    @Query() query: QueryAnnouncementsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.announcementService.findAdminList(
      query,
      this.scopedAssociationId(user),
    );
  }

  @Get('announcement/members')
  @RequirePermissions('notification:manage')
  @ApiOperation({ summary: '通知公告接收会员列表' })
  announcementMembers(
    @Query() query: QueryAnnouncementsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.announcementService.findMembers(
      query,
      this.scopedAssociationId(user),
    );
  }

  @Post('announcement/attachment')
  @RequirePermissions('notification:manage')
  @ApiOperation({ summary: '上传通知公告附件' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'announcements');
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const ext = (file.originalname.match(/\.[^.]+$/)?.[0] || '').toLowerCase();
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|webp)$/i.test(file.originalname)) {
          return cb(
            new BadRequestException('附件仅支持 PDF、Office 文档及 JPG/PNG/WebP 图片'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadAnnouncementAttachment(
    @UploadedFile()
    file: { originalname: string; filename: string; size: number },
  ) {
    if (!file) throw new BadRequestException('未接收到附件');
    return {
      name: file.originalname,
      url: `/uploads/announcements/${file.filename}`,
      size: file.size,
    };
  }

  @Post('announcement')
  @RequirePermissions('notification:manage')
  @ApiOperation({ summary: '创建通知公告草稿' })
  createAnnouncement(
    @Body() dto: SaveAnnouncementDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.announcementService.create(
      dto,
      user.adminId,
      this.scopedAssociationId(user),
    );
  }

  @Get('announcement/:id')
  @RequirePermissions('notification:manage')
  @ApiOperation({ summary: '通知公告详情' })
  announcement(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.announcementService.findAnnouncement(
      id,
      this.scopedAssociationId(user),
    );
  }

  @Put('announcement/:id')
  @RequirePermissions('notification:manage')
  @ApiOperation({ summary: '更新通知公告' })
  updateAnnouncement(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveAnnouncementDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.announcementService.update(
      id,
      dto,
      this.scopedAssociationId(user),
    );
  }

  @Post('announcement/:id/publish')
  @RequirePermissions('notification:manage')
  @ApiOperation({ summary: '发布通知公告' })
  publishAnnouncement(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.announcementService.publish(
      id,
      this.scopedAssociationId(user),
    );
  }

  @Post('announcement/:id/withdraw')
  @RequirePermissions('notification:manage')
  @ApiOperation({ summary: '撤回通知公告' })
  withdrawAnnouncement(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.announcementService.withdraw(
      id,
      this.scopedAssociationId(user),
    );
  }

  @Delete('announcement/:id')
  @RequirePermissions('notification:manage')
  @ApiOperation({ summary: '删除草稿或已撤回通知' })
  deleteAnnouncement(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.announcementService.remove(id, this.scopedAssociationId(user));
  }

  @Get('announcement/:id/recipients')
  @RequirePermissions('notification:manage')
  @ApiOperation({ summary: '通知阅读与参加情况' })
  announcementRecipients(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryAnnouncementRecipientsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.announcementService.findAdminRecipients(
      id,
      query,
      this.scopedAssociationId(user),
    );
  }

  @Get('announcement/:id/attendance.csv')
  @RequirePermissions('notification:manage')
  @ApiOperation({ summary: '导出通知阅读与参加名单' })
  async exportAnnouncementAttendance(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
    @CurrentUser() user: JwtPayload,
  ) {
    const csv = await this.announcementService.exportAttendance(
      id,
      this.scopedAssociationId(user),
    );
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="announcement-${id}-attendance.csv"`,
    );
    response.send(csv);
  }

  /** 1. 模板分页列表（channel 过滤、keyword 搜 code/name） */
  @ApiOperation({ summary: '通知模板分页列表' })
  @Get('templates')
  async templates(@Query() query: PaginationDto & { channel?: number }) {
    return this.notificationService.findTemplates(query);
  }

  /** 2. 创建模板 */
  @ApiOperation({ summary: '创建通知模板' })
  @Post('template')
  @RequirePermissions('notification:template:create')
  async createTemplate(@Body() dto: CreateTemplateDto) {
    return this.notificationService.createTemplate(dto);
  }

  /** 3. 更新模板 */
  @ApiOperation({ summary: '更新通知模板' })
  @Put('template/:id')
  async updateTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.notificationService.updateTemplate(id, dto);
  }

  /** 4. 启用/停用模板 */
  @ApiOperation({ summary: '启用/停用通知模板' })
  @Put('template/:id/status')
  async updateTemplateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: number,
  ) {
    return this.notificationService.updateTemplateStatus(id, status);
  }

  /** 5. 删除模板 */
  @ApiOperation({ summary: '删除通知模板' })
  @Delete('template/:id')
  async deleteTemplate(@Param('id', ParseIntPipe) id: number) {
    await this.notificationService.deleteTemplate(id);
    return { success: true };
  }

  /** 6. 下发流水分页 */
  @ApiOperation({ summary: '通知下发流水分页' })
  @Get('logs')
  async logs(@Query() query: QueryLogsDto) {
    return this.notificationService.findLogs(query);
  }

  /** 7. 手动触发下发 */
  @ApiOperation({ summary: '手动下发通知' })
  @Post('send')
  async send(@Body() dto: SendNotificationDto) {
    return this.notificationService.send(dto);
  }

  /** 8. 公众号粉丝分页列表 */
  @ApiOperation({ summary: '公众号粉丝分页列表' })
  @Get('oa-followers')
  async oaFollowers(@Query() query: PaginationDto) {
    return this.notificationService.findOaFollowers(query);
  }
}
