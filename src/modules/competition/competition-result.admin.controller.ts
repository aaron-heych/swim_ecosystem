import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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
import { memoryStorage } from 'multer';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { CompetitionService } from './competition.service';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  CreateCompetitionGroupDto,
  UpdateCompetitionGroupDto,
} from './dto/group.dto';
import { CreateCompetitionResultDto } from './dto/result.dto';
import { SaveResultAttachmentsDto } from './dto/result.dto';
import { UpdateCompetitionResultDto } from './dto/update-result.dto';
import {
  CreateCompetitionSponsorDto,
  UpdateCompetitionSponsorDto,
} from './dto/sponsor.dto';
import { SaveCompetitionScoreRulesDto } from './dto/score-rule.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

/**
 * 后台 — 冬泳赛事：项目（组别）与成绩
 */
@ApiTags('冬泳赛事-成绩管理')
@ApiBearerAuth('JWT')
@Controller('api/admin/competition')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class CompetitionResultAdminController {
  constructor(private readonly competitionService: CompetitionService) {}

  /** 0. 上传比赛附件（图片或 zip/7z，单个 ≤10MB），返回可访问 url */
  @Post('upload')
  @ApiOperation({ summary: '上传成绩原始记录附件' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'competition-results');
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
        const ok =
          /\.(jpe?g|png|webp|gif|bmp|zip|7z)$/i.test(file.originalname) ||
          /^(image\/|application\/(zip|x-zip-compressed|x-7z-compressed|7z))/.test(
            file.mimetype,
          );
        if (!ok) {
          return cb(
            new BadRequestException('仅支持图片或 zip/7z 压缩包'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  upload(
    @UploadedFile()
    file: { originalname: string; filename: string; size: number },
  ) {
    if (!file) throw new BadRequestException('未接收到文件');
    return {
      name: file.originalname,
      url: `/uploads/competition-results/${file.filename}`,
      size: file.size,
    };
  }

  /** 1. 项目/组别列表 */
  @Get(':id/groups')
  @ApiOperation({ summary: '赛事项目列表' })
  @ApiParam({ name: 'id', description: '赛事ID' })
  groups(@Param('id', ParseIntPipe) id: number) {
    return this.competitionService.findGroups(id);
  }

  /** 2. 新增项目 */
  @Post(':id/groups')
  @ApiOperation({ summary: '新增赛事项目' })
  @ApiParam({ name: 'id', description: '赛事ID' })
  createGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCompetitionGroupDto,
  ) {
    return this.competitionService.createGroup(id, dto);
  }

  /** 3. 更新项目 */
  @Put('group/:gid')
  @ApiOperation({ summary: '更新赛事项目' })
  @ApiParam({ name: 'gid', description: '项目ID' })
  updateGroup(
    @Param('gid', ParseIntPipe) gid: number,
    @Body() dto: UpdateCompetitionGroupDto,
  ) {
    return this.competitionService.updateGroup(gid, dto);
  }

  /** 4. 删除项目（连带成绩） */
  @Delete('group/:gid')
  @ApiOperation({ summary: '删除赛事项目' })
  @ApiParam({ name: 'gid', description: '项目ID' })
  removeGroup(@Param('gid', ParseIntPipe) gid: number) {
    return this.competitionService.removeGroup(gid);
  }

  /** 5. 成绩列表（可按项目过滤） */
  @Get(':id/results')
  @ApiOperation({ summary: '个人成绩列表' })
  @ApiParam({ name: 'id', description: '赛事ID' })
  results(
    @Param('id', ParseIntPipe) id: number,
    @Query('groupId') groupId?: string,
  ) {
    return this.competitionService.findResults(
      id,
      groupId ? Number(groupId) : undefined,
    );
  }

  @Get(':id/results/template')
  @ApiOperation({ summary: '下载个人成绩批量导入模板' })
  async downloadResultsTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    const file = await this.competitionService.createResultsTemplate(id);
    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="competition-results-template.xlsx"',
    );
    response.send(file);
  }

  @Post(':id/results/import')
  @ApiOperation({ summary: '批量导入个人成绩' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!/\.(xlsx|xls)$/i.test(file.originalname)) {
          return cb(
            new BadRequestException('仅支持 .xls 或 .xlsx 格式的 Excel 文件'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  importResults(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile()
    file: { originalname: string; buffer: Buffer },
  ) {
    if (!file) throw new BadRequestException('请选择 .xls 或 .xlsx 格式的导入文件');
    return this.competitionService.importResults(id, file.buffer);
  }

  /** 5.5 比赛结果附件（赛事级：成绩单照片/zip） */
  @Get(':id/result-attachments')
  @ApiOperation({ summary: '比赛结果附件列表' })
  getResultAttachments(@Param('id', ParseIntPipe) id: number) {
    return this.competitionService.getResultAttachments(id);
  }

  @Put(':id/result-attachments')
  @ApiOperation({ summary: '整体保存比赛结果附件' })
  saveResultAttachments(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveResultAttachmentsDto,
  ) {
    return this.competitionService.saveResultAttachments(id, dto.attachments);
  }

  /** 5.6 赛事花絮照片（仅图片，独立存储） */
  @Get(':id/gallery-attachments')
  @ApiOperation({ summary: '赛事花絮照片列表' })
  getGalleryAttachments(@Param('id', ParseIntPipe) id: number) {
    return this.competitionService.getGalleryAttachments(id);
  }

  @Put(':id/gallery-attachments')
  @ApiOperation({ summary: '整体保存赛事花絮照片' })
  saveGalleryAttachments(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveResultAttachmentsDto,
  ) {
    return this.competitionService.saveGalleryAttachments(id, dto.attachments);
  }

  /** 6. 新增成绩 */
  @Post(':id/results')
  @ApiOperation({ summary: '新增个人成绩' })
  @ApiParam({ name: 'id', description: '赛事ID' })
  createResult(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCompetitionResultDto,
  ) {
    return this.competitionService.createResult(id, dto);
  }

  /** 7. 更新成绩 */
  @Put('result/:rid')
  @ApiOperation({ summary: '更新个人成绩' })
  @ApiParam({ name: 'rid', description: '成绩ID' })
  updateResult(
    @Param('rid', ParseIntPipe) rid: number,
    @Body() dto: UpdateCompetitionResultDto,
  ) {
    return this.competitionService.updateResult(rid, dto);
  }

  /** 8. 删除成绩 */
  @Delete('result/:rid')
  @ApiOperation({ summary: '删除个人成绩' })
  @ApiParam({ name: 'rid', description: '成绩ID' })
  removeResult(@Param('rid', ParseIntPipe) rid: number) {
    return this.competitionService.removeResult(rid);
  }

  /** 9. 团体总分榜（按协会汇总积分） */
  @Get(':id/team-ranking')
  @ApiOperation({ summary: '团体总分榜' })
  @ApiParam({ name: 'id', description: '赛事ID' })
  teamRanking(@Param('id', ParseIntPipe) id: number) {
    return this.competitionService.getTeamRanking(id);
  }

  /** 10. 赞助商一览 */
  @Get(':id/sponsors')
  @ApiOperation({ summary: '赞助商一览' })
  @ApiParam({ name: 'id', description: '赛事ID' })
  sponsors(@Param('id', ParseIntPipe) id: number) {
    return this.competitionService.findSponsors(id);
  }

  /** 11. 新增赞助商 */
  @Post(':id/sponsors')
  @ApiOperation({ summary: '新增赞助商' })
  @ApiParam({ name: 'id', description: '赛事ID' })
  createSponsor(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCompetitionSponsorDto,
  ) {
    return this.competitionService.createSponsor(id, dto);
  }

  /** 12. 更新赞助商 */
  @Put('sponsor/:sid')
  @ApiOperation({ summary: '更新赞助商' })
  @ApiParam({ name: 'sid', description: '赞助商ID' })
  updateSponsor(
    @Param('sid', ParseIntPipe) sid: number,
    @Body() dto: UpdateCompetitionSponsorDto,
  ) {
    return this.competitionService.updateSponsor(sid, dto);
  }

  /** 13. 删除赞助商 */
  @Delete('sponsor/:sid')
  @ApiOperation({ summary: '删除赞助商' })
  @ApiParam({ name: 'sid', description: '赞助商ID' })
  removeSponsor(@Param('sid', ParseIntPipe) sid: number) {
    return this.competitionService.removeSponsor(sid);
  }

  /** 14. 查询积分规则（无自定义时返回默认 9/7/6/5/4/3/2/1 并标记 isDefault） */
  @Get(':id/score-rules')
  @ApiOperation({ summary: '查询积分规则' })
  @ApiParam({ name: 'id', description: '赛事ID' })
  scoreRules(@Param('id', ParseIntPipe) id: number) {
    return this.competitionService.getScoreRules(id);
  }

  /** 15. 保存积分规则（整体替换；传空数组恢复默认；不回溯已有成绩） */
  @Put(':id/score-rules')
  @ApiOperation({ summary: '保存积分规则' })
  @ApiParam({ name: 'id', description: '赛事ID' })
  saveScoreRules(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveCompetitionScoreRulesDto,
  ) {
    return this.competitionService.saveScoreRules(id, dto);
  }
}
