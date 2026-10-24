import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
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
import { diskStorage, memoryStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { Response } from 'express';
import { AssociationService } from './association.service';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateAssociationDto } from './dto/create-association.dto';
import { AuditAssociationDto } from './dto/audit-association.dto';
import { AuditMemberDto } from './dto/audit-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryAssociationDto } from './dto/query-association.dto';
import { QueryMemberDto } from './dto/query-member.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

/**
 * 后台 — 冬泳协会 + 会员管理
 */
@ApiTags('冬泳协会-管理后台')
@ApiBearerAuth('JWT')
@Controller('api/admin/association')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class AssociationAdminController {
  constructor(private readonly associationService: AssociationService) {}

  /** 判断当前用户是否为协会会长（受数据隔离限制） */
  private getScopedAssociationId(user: JwtPayload): number | undefined {
    return user.roleCodes?.includes('swimming_sub_admin')
      ? user.associationId
      : undefined;
  }

  /** 协会会长禁止的操作（创建/审核/启停/删除协会） */
  private assertNotSubAdmin(user: JwtPayload) {
    if (user.roleCodes?.includes('swimming_sub_admin')) {
      throw new ForbiddenException('协会会长无权执行此操作');
    }
  }

  /** 1. 协会分页列表（支持 auditStatus 过滤、keyword 搜 name） */
  @Get('list')
  @ApiOperation({ summary: '协会分页列表' })
  async list(
    @Query() query: QueryAssociationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.associationService.findAdminList(
      query,
      this.getScopedAssociationId(user),
    );
  }

  @Get('import/template')
  @RequirePermissions('association:create')
  @ApiOperation({ summary: '下载协会批量导入模板' })
  async downloadImportTemplate(@Res() response: Response) {
    const file = await this.associationService.createAssociationImportTemplate();
    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="association-import-template.xlsx"',
    );
    response.send(file);
  }

  @Post('import')
  @RequirePermissions('association:create')
  @ApiOperation({ summary: '批量导入协会' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!/\.xlsx$/i.test(file.originalname)) {
          return cb(
            new BadRequestException('仅支持 .xlsx 格式的 Excel 文件'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async importAssociations(
    @UploadedFile()
    file: { originalname: string; buffer: Buffer },
    @CurrentUser() user: JwtPayload,
    @Res() response: Response,
  ) {
    this.assertNotSubAdmin(user);
    if (!file) throw new BadRequestException('请选择 .xlsx 格式的导入文件');
    const result = await this.associationService.importAssociations(file.buffer);
    if (result.errors.length) {
      const report =
        await this.associationService.createAssociationImportErrorReport(
          result.importedCount,
          result.errors,
        );
      response.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      response.setHeader(
        'Content-Disposition',
        'attachment; filename="association-import-errors.xlsx"',
      );
      response.send(report);
      return;
    }
    response.json({
      code: 0,
      message: 'success',
      data: { importedCount: result.importedCount, failedCount: 0 },
    });
  }

  /** 2. 协会详情（含 members 列表） */
  @Get(':id')
  @ApiOperation({ summary: '协会详情（含会员列表）' })
  @ApiParam({ name: 'id', description: '协会ID' })
  async detail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.associationService.findAdminDetail(
      id,
      this.getScopedAssociationId(user),
    );
  }

  /** 3. 管理员创建协会 */
  @Post()
  @RequirePermissions('association:create')
  @ApiOperation({ summary: '管理员创建协会' })
  async create(
    @Body() dto: CreateAssociationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.assertNotSubAdmin(user);
    return this.associationService.createByAdmin(dto);
  }

  /** 4. 更新协会基本信息 */
  @Put(':id')
  @ApiOperation({ summary: '更新协会基本信息' })
  @ApiParam({ name: 'id', description: '协会ID' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateAssociationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // 协会会长只能更新自己协会的信息
    const scopedId = this.getScopedAssociationId(user);
    if (scopedId && id !== scopedId) {
      throw new ForbiddenException('无权修改其他协会信息');
    }
    return this.associationService.update(id, dto);
  }

  /** 5. 审核协会（auditStatus 1通过/2驳回 + auditRemark） */
  @Put(':id/audit')
  @RequirePermissions('association:audit')
  @ApiOperation({ summary: '审核协会' })
  @ApiParam({ name: 'id', description: '协会ID' })
  async audit(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('adminId') adminId: number,
    @Body() dto: AuditAssociationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.assertNotSubAdmin(user);
    return this.associationService.audit(id, adminId, dto);
  }

  /** 6. 启用/停用协会 */
  @Put(':id/status')
  @ApiOperation({ summary: '启用/停用协会' })
  @ApiParam({ name: 'id', description: '协会ID' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: number,
    @CurrentUser() user: JwtPayload,
  ) {
    this.assertNotSubAdmin(user);
    return this.associationService.updateStatus(id, status);
  }

  /** 7. 软删除协会 */
  @Delete(':id')
  @ApiOperation({ summary: '软删除协会' })
  @ApiParam({ name: 'id', description: '协会ID' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    this.assertNotSubAdmin(user);
    await this.associationService.softRemove(id);
    return { success: true };
  }

  /** 8. 协会会员分页（status 过滤） */
  @Get(':id/members')
  @ApiOperation({ summary: '协会会员分页列表' })
  @ApiParam({ name: 'id', description: '协会ID' })
  async members(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.associationService.findMembers(
      id,
      query,
      this.getScopedAssociationId(user),
    );
  }

  /** 9. 审核会员（status 1通过/2拒绝） */
  @Put('member/:memberId/audit')
  @RequirePermissions('association:member:audit')
  @ApiOperation({ summary: '审核会员' })
  @ApiParam({ name: 'memberId', description: '会员记录ID' })
  async auditMember(
    @Param('memberId', ParseIntPipe) memberId: number,
    @CurrentUser('adminId') adminId: number,
    @Body() dto: AuditMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.associationService.auditMember(
      memberId,
      adminId,
      dto,
      this.getScopedAssociationId(user),
    );
  }

  /** 10. 修改会员角色（1会长 2管理员 3普通） */
  @Put('member/:memberId/role')
  @ApiOperation({ summary: '修改会员角色' })
  @ApiParam({ name: 'memberId', description: '会员记录ID' })
  async updateMemberRole(
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body('role') role: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.associationService.updateMemberRole(
      memberId,
      role,
      this.getScopedAssociationId(user),
    );
  }

  /** 11. 移除/恢复会员（status 3退出 4移除） */
  @Put('member/:memberId/status')
  @ApiOperation({ summary: '移除/恢复会员' })
  @ApiParam({ name: 'memberId', description: '会员记录ID' })
  async updateMemberStatus(
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body('status') status: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.associationService.updateMemberStatus(
      memberId,
      status,
      this.getScopedAssociationId(user),
    );
  }

  /** 12. 删除会员记录（逻辑删除） */
  @Delete('member/:memberId')
  @ApiOperation({ summary: '删除会员记录' })
  @ApiParam({ name: 'memberId', description: '会员记录ID' })
  async deleteMember(
    @Param('memberId', ParseIntPipe) memberId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.associationService.deleteMember(
      memberId,
      this.getScopedAssociationId(user),
    );
    return { success: true };
  }

  /** 13. 会员详情（身份证号解密后随 idCard 返回） */
  @Get('member/:memberId')
  @ApiOperation({ summary: '会员详情' })
  @ApiParam({ name: 'memberId', description: '会员记录ID' })
  async memberDetail(
    @Param('memberId', ParseIntPipe) memberId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.associationService.findMemberDetail(
      memberId,
      this.getScopedAssociationId(user),
    );
  }

  /** 14. 编辑会员（全字段可选更新） */
  @Put('member/:memberId')
  @ApiOperation({ summary: '编辑会员' })
  @ApiParam({ name: 'memberId', description: '会员记录ID' })
  async updateMember(
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.associationService.updateMember(
      memberId,
      dto,
      this.getScopedAssociationId(user),
    );
  }

  /** 15. 上传会员头像（图片 ≤2MB），返回可访问 url */
  @Post('member/upload-avatar')
  @ApiOperation({ summary: '上传会员头像' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'avatars');
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const ext = (file.originalname.match(/\.[^.]+$/)?.[0] || '').toLowerCase();
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ok =
          /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.originalname) ||
          /^image\//.test(file.mimetype);
        if (!ok) {
          return cb(new BadRequestException('仅支持图片文件'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadAvatar(
    @UploadedFile()
    file: { originalname: string; filename: string; size: number },
  ) {
    if (!file) throw new BadRequestException('未接收到文件');
    return {
      name: file.originalname,
      url: `/uploads/avatars/${file.filename}`,
      size: file.size,
    };
  }
}
