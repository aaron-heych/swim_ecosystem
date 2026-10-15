import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
  PARTICIPATION_TARGET,
  WinterParticipant,
  WinterParticipation,
} from './winter-participation.entity';
import { CreateParticipationDto } from './dto/create-participation.dto';
import { UpdateParticipationDto } from './dto/update-participation.dto';
import { QueryParticipationDto } from './dto/query-participation.dto';
import { ImportMembersDto, UpdateParticipantDto } from './dto/participant.dto';
import { Association, AssociationMember } from '../association/association.entity';
import { WinterCompetition } from '../competition/competition.entity';
import { WinterActivity } from '../activity/activity.entity';
import { aesDecrypt, aesEncrypt, maskIdCard } from '../../common/utils/aes.util';
import {
  PaginatedResult,
  paginate,
} from '../../common/dto/pagination.dto';

@Injectable()
export class WinterParticipationService {
  constructor(
    @InjectRepository(WinterParticipation)
    private readonly participationRepo: Repository<WinterParticipation>,
    @InjectRepository(WinterParticipant)
    private readonly participantRepo: Repository<WinterParticipant>,
    private readonly dataSource: DataSource,
  ) {}

  /* ============================ 内部工具 ============================ */

  /** 参与协会列表（按主体） */
  async findList(
    query: QueryParticipationDto,
  ): Promise<PaginatedResult<WinterParticipation>> {
    const { page, pageSize, targetType, targetId, keyword } = query;
    const qb = this.participationRepo
      .createQueryBuilder('p')
      .where('p.target_type = :targetType', { targetType })
      .andWhere('p.target_id = :targetId', { targetId });

    if (keyword) {
      qb.andWhere('(p.association_name LIKE :kw OR p.team_name LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }
    qb.orderBy('p.createdAt', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  /** 新增参与协会（同一主体下同一协会只能有一条） */
  async create(dto: CreateParticipationDto) {
    await this.assertTargetExists(dto.targetType, dto.targetId);
    const exists = await this.participationRepo.findOne({
      where: {
        targetType: dto.targetType,
        targetId: dto.targetId,
        associationId: dto.associationId,
      },
    });
    if (exists) throw new ConflictException('该协会已在此赛事/活动中');

    const assoc = await this.dataSource
      .getRepository(Association)
      .findOne({ where: { id: dto.associationId } });
    if (!assoc) throw new NotFoundException('冬泳协会不存在');

    const row = this.participationRepo.create({
      targetType: dto.targetType,
      targetId: dto.targetId,
      associationId: dto.associationId,
      associationName: assoc.name,
      teamName: dto.teamName || assoc.name,
      leaderName: dto.leaderName || assoc.contactName || null,
      leaderPhone: dto.leaderPhone || assoc.contactPhone || null,
      status: dto.status ?? 1,
      remark: dto.remark ?? null,
    });
    return this.participationRepo.save(row);
  }

  /** 更新参与协会 */
  async update(id: number, dto: UpdateParticipationDto) {
    const row = await this.participationRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('参赛记录不存在');

    if (dto.associationId !== undefined && dto.associationId !== row.associationId) {
      const assoc = await this.dataSource
        .getRepository(Association)
        .findOne({ where: { id: dto.associationId } });
      if (!assoc) throw new NotFoundException('冬泳协会不存在');
      const dup = await this.participationRepo.findOne({
        where: {
          targetType: row.targetType,
          targetId: row.targetId,
          associationId: dto.associationId,
        },
      });
      if (dup) throw new ConflictException('该协会已在此赛事/活动中');
      row.associationId = dto.associationId;
      row.associationName = assoc.name;
    }
    if (dto.teamName !== undefined) row.teamName = dto.teamName ?? null;
    if (dto.leaderName !== undefined) row.leaderName = dto.leaderName ?? null;
    if (dto.leaderPhone !== undefined) row.leaderPhone = dto.leaderPhone ?? null;
    if (dto.status !== undefined) row.status = dto.status;
    if (dto.remark !== undefined) row.remark = dto.remark ?? null;
    return this.participationRepo.save(row);
  }

  /** 删除参与协会（连带删除其人员） */
  async remove(id: number) {
    const row = await this.participationRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('参赛记录不存在');
    await this.participantRepo.delete({ participationId: id });
    await this.participationRepo.delete({ id });
    await this.recomputeTargetCount(row.targetType, row.targetId);
    return { success: true };
  }

  /* ============================ 人员 ============================ */

  /** 某参赛协会下的人员列表 */
  async findParticipants(participationId: number) {
    await this.assertParticipationExists(participationId);
    const rows = await this.participantRepo.find({
      where: { participationId },
      order: { id: 'ASC' },
    });
    return rows.map((r) => ({
      ...r,
      idCardEnc: undefined,
      idCardMasked: this.maskIdCard(r.idCardEnc),
    }));
  }

  /** 可导入的协会会员（标记是否已导入） */
  async findMemberOptions(participationId: number) {
    const pa = await this.assertParticipationExists(participationId);
    const members = await this.dataSource
      .getRepository(AssociationMember)
      .find({
        where: { associationId: pa.associationId, status: 1 },
        relations: ['user'],
        order: { id: 'ASC' },
      });
    const imported = await this.participantRepo.find({
      where: { participationId },
    });
    const importedIds = new Set(
      imported.map((p) => p.memberId).filter((v): v is number => !!v),
    );
    return members.map((m) => ({
      id: m.id,
      memberNo: m.memberNo,
      realName: m.realName,
      phone: m.phone,
      gender: m.user?.gender ?? 0,
      birthday: m.user?.birthday ?? null,
      imported: importedIds.has(m.id),
    }));
  }

  /** 某赛事/活动下全部参与人员（成绩录入下拉用） */
  async findParticipantOptions(targetType: number, targetId: number) {
    const rows = await this.participantRepo
      .createQueryBuilder('p')
      .innerJoin(WinterParticipation, 'pa', 'pa.id = p.participation_id')
      .select('p.id', 'id')
      .addSelect('p.real_name', 'realName')
      .addSelect('p.gender', 'gender')
      .addSelect('p.phone', 'phone')
      .addSelect('pa.association_id', 'associationId')
      .addSelect('pa.association_name', 'associationName')
      .addSelect('pa.team_name', 'teamName')
      .where('pa.target_type = :targetType', { targetType })
      .andWhere('pa.target_id = :targetId', { targetId })
      .andWhere('pa.status <> 2')
      .andWhere('p.status = 1')
      .orderBy('pa.association_name', 'ASC')
      .addOrderBy('p.real_name', 'ASC')
      .getRawMany();
    return rows.map((r) => ({
      id: Number(r.id),
      realName: r.realName,
      gender: Number(r.gender),
      phone: r.phone,
      associationId: Number(r.associationId),
      associationName: r.associationName,
      teamName: r.teamName,
    }));
  }

  /** 从协会会员批量导入人员 */
  async importMembers(participationId: number, dto: ImportMembersDto) {
    const pa = await this.assertParticipationExists(participationId);
    const members = await this.dataSource
      .getRepository(AssociationMember)
      .find({
        where: { id: In(dto.memberIds), associationId: pa.associationId },
        relations: ['user'],
      });
    if (!members.length) throw new BadRequestException('未找到可导入的会员');

    const imported = await this.participantRepo.find({
      where: { participationId },
    });
    const importedIds = new Set(
      imported.map((p) => p.memberId).filter((v): v is number => !!v),
    );
    const rows = members
      .filter((m) => !importedIds.has(m.id))
      .map((m) =>
        this.participantRepo.create({
          participationId,
          memberId: m.id,
          realName: m.realName,
          gender: m.user?.gender ?? 0,
          birthday: m.user?.birthday ?? null,
          phone: m.phone,
          idCardEnc: m.idCardEnc ?? null,
          status: 1,
        }),
      );
    if (rows.length) await this.participantRepo.save(rows);
    await this.recomputeParticipationCount(participationId);
    return { imported: rows.length, skipped: members.length - rows.length };
  }

  /** 编辑人员 */
  async updateParticipant(id: number, dto: UpdateParticipantDto) {
    const row = await this.participantRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('参与人员不存在');
    if (dto.realName !== undefined) row.realName = dto.realName;
    if (dto.gender !== undefined) row.gender = dto.gender;
    if (dto.birthday !== undefined) row.birthday = dto.birthday || null;
    if (dto.phone !== undefined) row.phone = dto.phone ?? null;
    if (dto.idCard !== undefined) {
      row.idCardEnc = dto.idCard ? aesEncrypt(dto.idCard) : null;
    }
    if (dto.bibNo !== undefined) row.bibNo = dto.bibNo ?? null;
    if (dto.status !== undefined) row.status = dto.status;
    const saved = await this.participantRepo.save(row);
    await this.recomputeParticipationCount(row.participationId);
    return saved;
  }

  /** 删除人员 */
  async removeParticipant(id: number) {
    const row = await this.participantRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('参与人员不存在');
    await this.participantRepo.delete({ id });
    await this.recomputeParticipationCount(row.participationId);
    return { success: true };
  }

  /* ============================ 私有辅助 ============================ */

  private maskIdCard(enc?: string | null): string | null {
    if (!enc) return null;
    try {
      return maskIdCard(aesDecrypt(enc));
    } catch {
      return null;
    }
  }

  private async assertParticipationExists(id: number) {
    const pa = await this.participationRepo.findOne({ where: { id } });
    if (!pa) throw new NotFoundException('参赛记录不存在');
    return pa;
  }

  /** 校验赛事/活动是否存在 */
  private async assertTargetExists(targetType: number, targetId: number) {
    const repo =
      targetType === PARTICIPATION_TARGET.COMPETITION
        ? this.dataSource.getRepository(WinterCompetition)
        : this.dataSource.getRepository(WinterActivity);
    const exists = await repo.findOne({ where: { id: targetId } });
    if (!exists) throw new NotFoundException('赛事/活动不存在');
  }

  /** 重算单个参赛协会的人数 */
  private async recomputeParticipationCount(participationId: number) {
    const pa = await this.participationRepo.findOne({
      where: { id: participationId },
    });
    if (!pa) return;
    const count = await this.participantRepo.count({
      where: { participationId, status: 1 },
    });
    await this.participationRepo.update(participationId, {
      participantCount: count,
    });
    await this.recomputeTargetCount(pa.targetType, pa.targetId);
  }

  /** 重算主体的已报名人数（赛事/活动 joined_count） */
  private async recomputeTargetCount(targetType: number, targetId: number) {
    const total = await this.participantRepo
      .createQueryBuilder('p')
      .innerJoin(WinterParticipation, 'pa', 'pa.id = p.participation_id')
      .where('pa.target_type = :targetType', { targetType })
      .andWhere('pa.target_id = :targetId', { targetId })
      .andWhere('pa.status <> 2')
      .andWhere('p.status = 1')
      .getCount();
    const repo =
      targetType === PARTICIPATION_TARGET.COMPETITION
        ? this.dataSource.getRepository(WinterCompetition)
        : this.dataSource.getRepository(WinterActivity);
    await repo.update(targetId, { joinedCount: total });
  }
}
