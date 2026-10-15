import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import ExcelJS from 'exceljs';
import * as XLSX from '@e965/xlsx';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { WinterCompetition } from './competition.entity';
import {
  WinterCompetitionGroup,
  WinterCompetitionResult,
  WinterCompetitionScoreRule,
  WinterCompetitionSponsor,
} from './competition.entity';
import {
  WinterParticipant,
  WinterParticipation,
} from '../winter-participation/winter-participation.entity';
import { Association } from '../association/association.entity';
import { Region } from '../region/region.entity';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { QueryCompetitionDto } from './dto/query-competition.dto';
import {
  CreateCompetitionGroupDto,
  UpdateCompetitionGroupDto,
} from './dto/group.dto';
import { CreateCompetitionResultDto } from './dto/result.dto';
import { UpdateCompetitionResultDto } from './dto/update-result.dto';
import {
  CreateCompetitionSponsorDto,
  UpdateCompetitionSponsorDto,
} from './dto/sponsor.dto';
import { SaveCompetitionScoreRulesDto } from './dto/score-rule.dto';
import {
  PaginatedResult,
  paginate,
} from '../../common/dto/pagination.dto';

@Injectable()
export class CompetitionService {
  constructor(
    @InjectRepository(WinterCompetition)
    private readonly competitionRepo: Repository<WinterCompetition>,
    @InjectRepository(WinterCompetitionGroup)
    private readonly groupRepo: Repository<WinterCompetitionGroup>,
    @InjectRepository(WinterCompetitionResult)
    private readonly resultRepo: Repository<WinterCompetitionResult>,
    @InjectRepository(WinterCompetitionSponsor)
    private readonly sponsorRepo: Repository<WinterCompetitionSponsor>,
    @InjectRepository(WinterCompetitionScoreRule)
    private readonly scoreRuleRepo: Repository<WinterCompetitionScoreRule>,
    private readonly dataSource: DataSource,
  ) {}

  /** 名次 → 默认积分（前 8 名 9/7/6/5/4/3/2/1） */
  private static readonly SCORE_BY_RANK: Record<number, number> = {
    1: 9,
    2: 7,
    3: 6,
    4: 5,
    5: 4,
    6: 3,
    7: 2,
    8: 1,
  };

  async createResultsTemplate(competitionId: number): Promise<Buffer> {
    await this.assertCompetitionExists(competitionId);
    const groups = await this.groupRepo.find({
      where: { competitionId },
      order: { sort: 'ASC', id: 'ASC' },
    });
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('成绩导入');
    sheet.columns = [
      { header: '项目名称', key: 'groupName', width: 24 },
      { header: '选手姓名', key: 'participantName', width: 18 },
      { header: '所属协会', key: 'associationName', width: 24 },
      { header: '代表队', key: 'teamName', width: 20 },
      { header: '名次', key: 'rank', width: 12 },
      { header: '成绩', key: 'resultValue', width: 18, style: { numFmt: '@' } },
      { header: '备注', key: 'remark', width: 30 },
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    const projects = workbook.addWorksheet('项目参考');
    projects.columns = [
      { header: '项目名称', key: 'name', width: 28 },
      { header: '性别限制', key: 'genderLimit', width: 14 },
      { header: '最低年龄', key: 'ageMin', width: 12 },
      { header: '最高年龄', key: 'ageMax', width: 12 },
      { header: '泳姿', key: 'stroke', width: 16 },
      { header: '距离（米）', key: 'distanceM', width: 14 },
    ];
    projects.getRow(1).font = { bold: true };
    projects.views = [{ state: 'frozen', ySplit: 1 }];
    projects.addRows(
      groups.map((group) => ({
        name: group.name,
        genderLimit:
          group.genderLimit === 1
            ? '男子'
            : group.genderLimit === 2
              ? '女子'
              : '不限',
        ageMin: group.ageMin ?? '',
        ageMax: group.ageMax ?? '',
        stroke: group.stroke ?? '',
        distanceM: group.distanceM ?? '',
      })),
    );
    if (groups.length) {
      workbook.definedNames.add(
        `'项目参考'!$A$2:$A$${groups.length + 1}`,
        'CompetitionProjectNames',
      );
      for (let rowNumber = 2; rowNumber <= 5001; rowNumber += 1) {
        sheet.getCell(`A${rowNumber}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['=CompetitionProjectNames'],
          showErrorMessage: true,
          errorTitle: '项目名称无效',
          error: '请从项目参考工作表中选择项目名称',
        };
      }
    }
    const instructions = workbook.addWorksheet('填写说明');
    instructions.addRows([
      ['个人成绩批量导入说明'],
      ['请在“成绩导入”工作表从第 2 行开始填写，每行一条成绩，不要修改第一行列名。'],
      ['“项目参考”工作表列出了本赛事已有项目，请将项目名称原样填写到“成绩导入”工作表。'],
      ['项目名称和选手姓名为必填项。'],
      ['已报名参赛人员按选手姓名及所属协会匹配；未匹配到的选手按非会员成绩导入。'],
      ['名次、成绩、备注至少填写一项；积分将按赛事积分规则自动计算。'],
      ['一次最多导入 5000 条。导入过程中如有任何错误，将整份文件拒绝，不会写入部分数据。'],
    ]);
    instructions.getColumn(1).width = 100;
    instructions.getRow(1).font = { bold: true, size: 14 };
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async importResults(competitionId: number, file: Buffer) {
    await this.assertCompetitionExists(competitionId);

    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(new Uint8Array(file), {
        type: 'array',
        cellDates: true,
        cellFormula: true,
      });
    } catch {
      throw new BadRequestException('Excel 文件无法解析，请检查文件格式和内容');
    }

    const sheetName = workbook.SheetNames.includes('成绩导入')
      ? '成绩导入'
      : workbook.SheetNames[0];
    const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
    if (!sheet || !sheet['!ref']) {
      throw new BadRequestException('Excel 中没有可导入的成绩数据');
    }
    const range = XLSX.utils.decode_range(sheet['!ref']);
    if (range.e.r - range.s.r > 5000) {
      throw new BadRequestException('一次最多导入 5000 条成绩');
    }
    if (range.e.c - range.s.c > 50) {
      throw new BadRequestException('Excel 列数异常，请使用成绩导入模板');
    }
    const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: true,
    });
    if (sheetRows.length < 2) {
      throw new BadRequestException('Excel 中没有可导入的成绩数据');
    }

    const headerColumns = new Map<string, number>();
    sheetRows[0].forEach((value, column) => {
      const header = this.excelCellText(value).trim();
      if (header && headerColumns.has(header)) {
        throw new BadRequestException(`Excel 表头重复：${header}`);
      }
      if (header) headerColumns.set(header, column);
    });
    const requiredHeaders = ['项目名称', '选手姓名', '名次', '成绩'];
    const missingHeaders = requiredHeaders.filter(
      (header) => !headerColumns.has(header),
    );
    if (missingHeaders.length) {
      throw new BadRequestException(`缺少必需列：${missingHeaders.join('、')}`);
    }

    const groups = await this.groupRepo.find({ where: { competitionId } });
    const groupsByName = new Map<string, WinterCompetitionGroup[]>();
    for (const group of groups) {
      const list = groupsByName.get(group.name) ?? [];
      list.push(group);
      groupsByName.set(group.name, list);
    }

    const participants = await this.dataSource
      .getRepository(WinterParticipant)
      .createQueryBuilder('p')
      .innerJoin(
        WinterParticipation,
        'pa',
        'pa.id = p.participation_id',
      )
      .select('p.id', 'id')
      .addSelect('p.real_name', 'realName')
      .addSelect('pa.association_id', 'associationId')
      .addSelect('pa.association_name', 'associationName')
      .addSelect('pa.team_name', 'teamName')
      .where('pa.target_type = :targetType', { targetType: 1 })
      .andWhere('pa.target_id = :competitionId', { competitionId })
      .andWhere('pa.status <> 2')
      .andWhere('p.status = 1')
      .getRawMany();
    const participantsByName = new Map<string, typeof participants>();
    for (const participant of participants) {
      const list = participantsByName.get(participant.realName) ?? [];
      list.push(participant);
      participantsByName.set(participant.realName, list);
    }
    const associationRows = await this.dataSource
      .getRepository(Association)
      .createQueryBuilder('a')
      .select('a.id', 'id')
      .addSelect('a.name', 'name')
      .getRawMany();
    const associationIds = new Map<string, number>(
      associationRows.map((association) => [
        association.name,
        Number(association.id),
      ]),
    );

    const existingResults = await this.resultRepo.find({
      where: { competitionId },
    });
    const occupiedResults = new Set(
      existingResults.map((result) =>
        this.resultIdentity(
          result.groupId,
          result.participantId,
          result.participantName,
          result.associationName,
        ),
      ),
    );
    const importedIdentities = new Set<string>();
    const errors: string[] = [];
    const rows: WinterCompetitionResult[] = [];
    const column = (name: string) => headerColumns.get(name);
    const getValue = (row: unknown[], rowNumber: number, name: string) => {
      const index = column(name);
      if (index === undefined) return '';
      const address = XLSX.utils.encode_cell({
        r: range.s.r + rowNumber,
        c: range.s.c + index,
      });
      if (sheet[address]?.f) {
        throw new BadRequestException(
          `第 ${rowNumber + range.s.r + 1} 行包含公式，请粘贴为数值后重新导入`,
        );
      }
      return this.excelCellText(row[index]).trim();
    };

    for (let rowIndex = 1; rowIndex < sheetRows.length; rowIndex += 1) {
      const excelRow = sheetRows[rowIndex];
      const rowNumber = range.s.r + rowIndex + 1;
      const values = [
        '项目名称',
        '选手姓名',
        '所属协会',
        '代表队',
        '名次',
        '成绩',
        '备注',
      ].map((name) => getValue(excelRow, rowIndex, name));
      if (values.every((value) => !value)) continue;

      const [groupName, participantName, associationName, teamName, rankText, resultValue, remark] =
        values;
      const rowErrors: string[] = [];
      if (!groupName) rowErrors.push('项目名称不能为空');
      if (!participantName) rowErrors.push('选手姓名不能为空');
      if (participantName.length > 32) rowErrors.push('选手姓名不能超过 32 个字符');
      if (associationName.length > 100) rowErrors.push('所属协会不能超过 100 个字符');
      if (teamName.length > 100) rowErrors.push('代表队不能超过 100 个字符');
      if (resultValue.length > 32) rowErrors.push('成绩不能超过 32 个字符');
      if (remark.length > 255) rowErrors.push('备注不能超过 255 个字符');
      if (!rankText && !resultValue && !remark) {
        rowErrors.push('名次、成绩、备注至少填写一项');
      }

      let rank: number | null = null;
      if (rankText) {
        const parsedRank = Number(rankText);
        if (!Number.isInteger(parsedRank) || parsedRank < 1) {
          rowErrors.push('名次必须是大于 0 的整数');
        } else {
          rank = parsedRank;
        }
      }

      const matchingGroups = groupsByName.get(groupName) ?? [];
      if (matchingGroups.length !== 1) {
        rowErrors.push(
          matchingGroups.length ? '项目名称重复，无法确定所属项目' : '项目名称不存在',
        );
      }

      const matchingParticipants = participantsByName.get(participantName) ?? [];
      const candidates = associationName
        ? matchingParticipants.filter(
            (participant) => participant.associationName === associationName,
          )
        : matchingParticipants;
      if (candidates.length > 1) {
        rowErrors.push('同名参赛人员不唯一，请填写正确的所属协会');
      } else if (matchingParticipants.length && associationName && !candidates.length) {
        rowErrors.push('所属协会与该参赛人员的报名信息不一致');
      }
      if (
        !candidates.length &&
        associationName &&
        !associationIds.has(associationName)
      ) {
        rowErrors.push('所属协会不存在，请填写有效的协会名称');
      }

      if (rowErrors.length) {
        errors.push(`第 ${rowNumber} 行：${rowErrors.join('；')}`);
        continue;
      }

      const group = matchingGroups[0];
      const participant = candidates[0];
      const participantId = participant ? Number(participant.id) : null;
      const finalAssociationId = participant
        ? Number(participant.associationId)
        : associationName
          ? associationIds.get(associationName) ?? null
          : null;
      const finalAssociationName = participant
        ? participant.associationName
        : associationName || null;
      const finalTeamName = teamName || participant?.teamName || null;
      const identity = this.resultIdentity(
        group.id,
        participantId,
        participantName,
        finalAssociationName,
      );
      if (occupiedResults.has(identity) || importedIdentities.has(identity)) {
        errors.push(`第 ${rowNumber} 行：该选手在此项目中已有成绩或重复出现`);
        continue;
      }
      importedIdentities.add(identity);

      rows.push(
        this.resultRepo.create({
          competitionId,
          groupId: group.id,
          participantId,
          participantName,
          associationId: finalAssociationId,
          associationName: finalAssociationName,
          teamName: finalTeamName,
          rank,
          resultValue: resultValue || null,
          resultMs: null,
          score: rank
            ? CompetitionService.SCORE_BY_RANK[rank] ?? 0
            : 0,
          attachments: null,
          remark: remark || null,
        }),
      );
    }

    if (errors.length) {
      throw new BadRequestException(
        `导入失败，共发现 ${errors.length} 个问题：${errors.slice(0, 20).join('；')}${
          errors.length > 20 ? '；其余错误请修正后重新导入' : ''
        }`,
      );
    }
    if (!rows.length) {
      throw new BadRequestException('Excel 中没有可导入的成绩数据');
    }

    const scoreRules = await this.scoreRuleRepo.find({ where: { competitionId } });
    if (scoreRules.length) {
      const scoreByRank = new Map(
        scoreRules.map((rule) => [rule.rankNo, Number(rule.score)]),
      );
      rows.forEach((row) => {
        row.score = row.rank ? scoreByRank.get(row.rank) ?? 0 : 0;
      });
    }
    await this.dataSource.transaction(async (manager) => {
      await manager.save(WinterCompetitionResult, rows);
    });
    return { importedCount: rows.length };
  }

  private excelCellText(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      if (value instanceof Date) return value.toISOString();
      return String(value);
    }
    return String(value);
  }

  private resultIdentity(
    groupId: number,
    participantId: number | null,
    participantName: string,
    associationName: string | null,
  ): string {
    return participantId
      ? `${groupId}:participant:${participantId}`
      : `${groupId}:guest:${participantName.trim()}:${associationName ?? ''}`;
  }

  /**
   * 按名次取默认积分：赛事有自定义积分规则时以自定义为准（未覆盖的名次记 0 分），
   * 无自定义规则时回落全局默认 9/7/6/5/4/3/2/1。
   */
  private async defaultScore(
    rank: number | null | undefined,
    competitionId?: number,
  ): Promise<number> {
    if (!rank) return 0;
    if (competitionId) {
      const total = await this.scoreRuleRepo.count({ where: { competitionId } });
      if (total > 0) {
        const rule = await this.scoreRuleRepo.findOne({
          where: { competitionId, rankNo: rank },
        });
        return rule ? Number(rule.score) : 0;
      }
    }
    return CompetitionService.SCORE_BY_RANK[rank] ?? 0;
  }

  /** Region 仓库（CompetitionModule 未 forFeature Region，走 DataSource 间接拿） */
  private get regionRepo(): Repository<Region> {
    return this.dataSource.getRepository(Region);
  }

  /**
   * 按 DTO 里的 code 反查并填充 province/city/district 名称。
   * 与 association.service.applyRegionCodes 同模式。
   */
  private async applyRegionCodes<
    T extends {
      provinceCode?: string | null;
      cityCode?: string | null;
      districtCode?: string | null;
      province?: string | null;
      city?: string | null;
      district?: string | null;
    },
  >(target: T): Promise<T> {
    const codeKeys: Array<
      'provinceCode' | 'cityCode' | 'districtCode'
    > = ['provinceCode', 'cityCode', 'districtCode'];
    const nameKeys: Array<'province' | 'city' | 'district'> = [
      'province',
      'city',
      'district',
    ];
    const codes = codeKeys
      .map((k) => target[k])
      .filter((c): c is string => !!c && typeof c === 'string');
    const codeToName = new Map<string, string>();
    if (codes.length) {
      const rows = await this.regionRepo
        .createQueryBuilder('r')
        .select(['r.code', 'r.name'])
        .where('r.code IN (:...codes)', { codes })
        .getMany();
      rows.forEach((r) => codeToName.set(r.code, r.name));
      for (const c of codes) {
        if (!codeToName.has(c)) {
          throw new NotFoundException(`行政区划编码不存在: ${c}`);
        }
      }
    }
    codeKeys.forEach((codeKey, i) => {
      const code = target[codeKey];
      const nameKey = nameKeys[i];
      if (code) {
        target[nameKey] = codeToName.get(code) ?? null;
      } else if (code === null) {
        target[nameKey] = null;
      }
    });
    // 直辖市的地级在国标区划数据中叫「市辖区」，展示时用省级名代替
    if (target.city === '市辖区' && target.province) {
      target.city = target.province;
    }
    return target;
  }

  /** datetime 字段转换：undefined 跳过 / '' 清空 / 其他转 Date */
  private toDate(v: string | undefined | null): Date | null | undefined {
    if (v === undefined) return undefined;
    if (v === null || v === '') return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  /** 逐字段把 DTO 应用到实体（仅赋值 DTO 中显式出现的字段） */
  private applyDto(comp: WinterCompetition, dto: UpdateCompetitionDto) {
    if (dto.title !== undefined) comp.title = dto.title;
    if (dto.type !== undefined) comp.type = dto.type;
    if (dto.level !== undefined) comp.level = dto.level ?? null;
    if (dto.description !== undefined) comp.description = dto.description ?? null;
    if (dto.provinceCode !== undefined) comp.provinceCode = dto.provinceCode ?? null;
    if (dto.cityCode !== undefined) comp.cityCode = dto.cityCode ?? null;
    if (dto.districtCode !== undefined) comp.districtCode = dto.districtCode ?? null;
    if (dto.province !== undefined) comp.province = dto.province ?? null;
    if (dto.city !== undefined) comp.city = dto.city ?? null;
    if (dto.district !== undefined) comp.district = dto.district ?? null;
    if (dto.location !== undefined) comp.location = dto.location ?? null;
    if (dto.fee !== undefined) comp.fee = dto.fee ?? null;
    if (dto.capacity !== undefined) comp.capacity = dto.capacity ?? null;
    if (dto.contactName !== undefined) comp.contactName = dto.contactName ?? null;
    if (dto.contactPhone !== undefined) comp.contactPhone = dto.contactPhone ?? null;
    const startAt = this.toDate(dto.startAt);
    if (startAt !== undefined) comp.startAt = startAt;
    const endAt = this.toDate(dto.endAt);
    if (endAt !== undefined) comp.endAt = endAt;
    const regStartAt = this.toDate(dto.regStartAt);
    if (regStartAt !== undefined) comp.regStartAt = regStartAt;
    const regEndAt = this.toDate(dto.regEndAt);
    if (regEndAt !== undefined) comp.regEndAt = regEndAt;
    if (dto.status !== undefined) comp.status = dto.status;
  }

  /** 后台：赛事分页列表 */
  async findAdminList(
    query: QueryCompetitionDto,
  ): Promise<PaginatedResult<WinterCompetition>> {
    const { page, pageSize, keyword, type, status } = query;
    const qb = this.competitionRepo
      .createQueryBuilder('c')
      .where('c.deleted_at IS NULL');

    if (keyword) {
      qb.andWhere('c.title LIKE :kw', { kw: `%${keyword}%` });
    }
    if (type !== undefined && type !== null) {
      qb.andWhere('c.type = :type', { type });
    }
    if (status !== undefined && status !== null) {
      qb.andWhere('c.status = :status', { status });
    }

    qb.orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  /** 后台：创建赛事（默认草稿） */
  async create(dto: CreateCompetitionDto, adminId?: number) {
    await this.applyRegionCodes(dto);
    const comp = this.competitionRepo.create({
      title: dto.title,
      type: dto.type ?? 1,
      status: 0,
      createdBy: adminId ?? null,
    });
    this.applyDto(comp, dto);
    // 创建一律为草稿，忽略 DTO 中的 status
    comp.status = 0;
    return this.competitionRepo.save(comp);
  }

  /** 后台：更新赛事 */
  async update(id: number, dto: UpdateCompetitionDto) {
    const comp = await this.competitionRepo.findOne({ where: { id } });
    if (!comp) throw new NotFoundException('赛事不存在');
    await this.applyRegionCodes(dto);
    this.applyDto(comp, dto);
    // 编辑时改为报名中且从未发布过：补写发布时间
    if (comp.status === 1 && !comp.publishAt) {
      comp.publishAt = new Date();
    }
    return this.competitionRepo.save(comp);
  }

  /** 后台：修改状态（草稿 0→1 报名中 时写入发布时间） */
  async updateStatus(id: number, status: number) {
    const comp = await this.competitionRepo.findOne({ where: { id } });
    if (!comp) throw new NotFoundException('赛事不存在');
    comp.status = status;
    if (comp.status === 1 && !comp.publishAt) {
      comp.publishAt = new Date();
    }
    return this.competitionRepo.save(comp);
  }

  /** 后台：软删除 */
  async softRemove(id: number) {
    await this.competitionRepo.softDelete({ id });
  }

  /* ============================ 项目 / 组别 ============================ */

  private async assertCompetitionExists(id: number) {
    const comp = await this.competitionRepo.findOne({ where: { id } });
    if (!comp) throw new NotFoundException('赛事不存在');
    return comp;
  }

  /** 赛事项目列表（附各项目成绩条数） */
  async findGroups(competitionId: number) {
    const groups = await this.groupRepo.find({
      where: { competitionId },
      order: { sort: 'ASC', id: 'ASC' },
    });
    const rows = await this.resultRepo
      .createQueryBuilder('r')
      .select('r.group_id', 'groupId')
      .addSelect('COUNT(*)', 'cnt')
      .where('r.competition_id = :competitionId', { competitionId })
      .groupBy('r.group_id')
      .getRawMany();
    const countMap = new Map<number, number>(
      rows.map((r) => [Number(r.groupId), Number(r.cnt)]),
    );
    return groups.map((g) => ({ ...g, resultCount: countMap.get(g.id) ?? 0 }));
  }

  async createGroup(competitionId: number, dto: CreateCompetitionGroupDto) {
    await this.assertCompetitionExists(competitionId);
    return this.groupRepo.save(
      this.groupRepo.create({
        competitionId,
        name: dto.name,
        genderLimit: dto.genderLimit ?? 0,
        ageMin: dto.ageMin ?? null,
        ageMax: dto.ageMax ?? null,
        stroke: dto.stroke ?? null,
        distanceM: dto.distanceM ?? null,
        sort: dto.sort ?? 0,
      }),
    );
  }

  async updateGroup(id: number, dto: UpdateCompetitionGroupDto) {
    const group = await this.groupRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException('项目不存在');
    if (dto.name !== undefined) group.name = dto.name;
    if (dto.genderLimit !== undefined) group.genderLimit = dto.genderLimit;
    if (dto.ageMin !== undefined) group.ageMin = dto.ageMin ?? null;
    if (dto.ageMax !== undefined) group.ageMax = dto.ageMax ?? null;
    if (dto.stroke !== undefined) group.stroke = dto.stroke ?? null;
    if (dto.distanceM !== undefined) group.distanceM = dto.distanceM ?? null;
    if (dto.sort !== undefined) group.sort = dto.sort;
    return this.groupRepo.save(group);
  }

  /** 删除项目（连带其成绩） */
  async removeGroup(id: number) {
    const group = await this.groupRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException('项目不存在');
    await this.resultRepo.delete({ groupId: id });
    await this.groupRepo.delete({ id });
    return { success: true };
  }

  /* ============================ 个人成绩 ============================ */

  /** 由参与人员反查 姓名/所属协会/队伍 */
  private async resolveParticipant(participantId: number) {
    const participant = await this.dataSource
      .getRepository(WinterParticipant)
      .findOne({ where: { id: participantId } });
    if (!participant) throw new NotFoundException('参与人员不存在');
    const participation = await this.dataSource
      .getRepository(WinterParticipation)
      .findOne({ where: { id: participant.participationId } });
    return {
      name: participant.realName,
      associationId: participation?.associationId ?? null,
      associationName: participation?.associationName ?? null,
      teamName: participation?.teamName ?? null,
    };
  }

  /** 成绩列表（按项目分组、名次升序） */
  async findResults(competitionId: number, groupId?: number) {
    const groups = await this.groupRepo.find({ where: { competitionId } });
    const nameMap = new Map(groups.map((g) => [g.id, g.name]));
    const qb = this.resultRepo
      .createQueryBuilder('r')
      .where('r.competition_id = :competitionId', { competitionId });
    if (groupId) qb.andWhere('r.group_id = :groupId', { groupId });
    qb.orderBy('r.groupId', 'ASC')
      .addOrderBy('r.rank', 'ASC')
      .addOrderBy('r.id', 'ASC');
    const rows = await qb.getMany();
    return rows.map((r) => ({
      ...r,
      groupName: nameMap.get(r.groupId) ?? '',
      score: Number(r.score),
    }));
  }

  async createResult(competitionId: number, dto: CreateCompetitionResultDto) {
    await this.assertCompetitionExists(competitionId);
    const group = await this.groupRepo.findOne({ where: { id: dto.groupId } });
    if (!group || group.competitionId !== competitionId) {
      throw new NotFoundException('项目不存在');
    }
    const row = this.resultRepo.create({
      competitionId,
      groupId: dto.groupId,
      participantId: dto.participantId ?? null,
      participantName: dto.participantName ?? '',
      rank: dto.rank ?? null,
      resultValue: dto.resultValue ?? null,
      resultMs: dto.resultMs ?? null,
      score: dto.score ?? (await this.defaultScore(dto.rank, competitionId)),
      attachments: dto.attachments ?? null,
      remark: dto.remark ?? null,
    });
    if (dto.participantId) {
      const p = await this.resolveParticipant(dto.participantId);
      row.participantName = p.name;
      row.associationId = dto.associationId ?? p.associationId;
      row.associationName = p.associationName;
      row.teamName = dto.teamName ?? p.teamName;
    } else {
      if (!dto.participantName) {
        throw new NotFoundException('请选择参赛人员或填写姓名');
      }
      row.associationId = dto.associationId ?? null;
      row.teamName = dto.teamName ?? null;
    }
    return this.resultRepo.save(row);
  }

  async updateResult(id: number, dto: UpdateCompetitionResultDto) {
    const row = await this.resultRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('成绩不存在');

    if (dto.groupId !== undefined) {
      const group = await this.groupRepo.findOne({ where: { id: dto.groupId } });
      if (!group || group.competitionId !== row.competitionId) {
        throw new NotFoundException('项目不存在');
      }
      row.groupId = dto.groupId;
    }
    if (dto.participantId !== undefined) {
      if (dto.participantId) {
        const p = await this.resolveParticipant(dto.participantId);
        row.participantId = dto.participantId;
        row.participantName = p.name;
        row.associationId = p.associationId;
        row.associationName = p.associationName;
        row.teamName = p.teamName;
      } else {
        row.participantId = null;
      }
    }
    if (dto.participantName !== undefined) row.participantName = dto.participantName;
    if (dto.teamName !== undefined) row.teamName = dto.teamName ?? null;
    if (dto.resultValue !== undefined) row.resultValue = dto.resultValue ?? null;
    if (dto.resultMs !== undefined) row.resultMs = dto.resultMs ?? null;
    if (dto.rank !== undefined) {
      row.rank = dto.rank ?? null;
      // 名次改动且未显式传积分：按新名次重算默认积分
      if (dto.score === undefined) {
        row.score = await this.defaultScore(row.rank, row.competitionId);
      }
    }
    if (dto.score !== undefined) row.score = dto.score;
    if (dto.remark !== undefined) row.remark = dto.remark ?? null;
    if (dto.attachments !== undefined) row.attachments = dto.attachments;
    await this.resultRepo.save(row);
    return row;
  }

  async removeResult(id: number) {
    const row = await this.resultRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('成绩不存在');
    await this.resultRepo.delete({ id });
    return { success: true };
  }

  /** 团体总分榜（按协会汇总个人积分，自动排名次） */
  async getTeamRanking(competitionId: number) {
    const rows = await this.resultRepo
      .createQueryBuilder('r')
      .select('r.association_id', 'associationId')
      .addSelect('MAX(r.association_name)', 'associationName')
      .addSelect('MAX(r.team_name)', 'teamName')
      .addSelect('SUM(r.score)', 'totalScore')
      .addSelect('COUNT(*)', 'resultCount')
      .addSelect('SUM(CASE WHEN r.rank_no = 1 THEN 1 ELSE 0 END)', 'goldCount')
      .where('r.competition_id = :competitionId', { competitionId })
      .andWhere('r.association_id IS NOT NULL')
      .groupBy('r.association_id')
      .orderBy('totalScore', 'DESC')
      .getRawMany();
    return rows.map((r, i) => ({
      rank: i + 1,
      associationId: Number(r.associationId),
      associationName: r.associationName,
      teamName: r.teamName,
      totalScore: Number(r.totalScore),
      goldCount: Number(r.goldCount),
      resultCount: Number(r.resultCount),
    }));
  }

  /* ============================ 赞助商 ============================ */

  /** 赞助商一览（按 sort/ID 升序） */
  async findSponsors(competitionId: number) {
    await this.assertCompetitionExists(competitionId);
    return this.sponsorRepo.find({
      where: { competitionId },
      order: { sort: 'ASC', id: 'ASC' },
    });
  }

  async createSponsor(competitionId: number, dto: CreateCompetitionSponsorDto) {
    await this.assertCompetitionExists(competitionId);
    return this.sponsorRepo.save(
      this.sponsorRepo.create({
        competitionId,
        name: dto.name,
        website: dto.website ?? null,
        business: dto.business ?? null,
        sort: dto.sort ?? 0,
      }),
    );
  }

  async updateSponsor(id: number, dto: UpdateCompetitionSponsorDto) {
    const row = await this.sponsorRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('赞助商不存在');
    if (dto.name !== undefined) row.name = dto.name;
    if (dto.website !== undefined) row.website = dto.website ?? null;
    if (dto.business !== undefined) row.business = dto.business ?? null;
    if (dto.sort !== undefined) row.sort = dto.sort;
    return this.sponsorRepo.save(row);
  }

  async removeSponsor(id: number) {
    const row = await this.sponsorRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('赞助商不存在');
    await this.sponsorRepo.delete({ id });
    return { success: true };
  }

  /* ============================ 积分规则 ============================ */

  /**
   * 查询赛事积分规则：无自定义时返回全局默认并标记 isDefault。
   */
  async getScoreRules(competitionId: number) {
    await this.assertCompetitionExists(competitionId);
    const rows = await this.scoreRuleRepo.find({
      where: { competitionId },
      order: { rankNo: 'ASC' },
    });
    if (!rows.length) {
      return {
        isDefault: true,
        rules: Object.entries(CompetitionService.SCORE_BY_RANK).map(
          ([r, s]) => ({ rankNo: Number(r), score: s }),
        ),
      };
    }
    return {
      isDefault: false,
      rules: rows.map((r) => ({ rankNo: r.rankNo, score: Number(r.score) })),
    };
  }

  /** 比赛结果附件（整场赛事的成绩单照片/zip）：读取 */
  async getResultAttachments(competitionId: number) {
    const comp = await this.assertCompetitionExists(competitionId);
    return comp.resultAttachments ?? [];
  }

  /** 比赛结果附件：整体替换保存（前端负责拼列表） */
  async saveResultAttachments(
    competitionId: number,
    attachments: {
      name: string;
      url: string;
      size?: number;
      type?: string;
      remark?: string;
    }[],
  ) {
    await this.assertCompetitionExists(competitionId);
    await this.competitionRepo.update(competitionId, {
      resultAttachments: attachments,
    });
    return attachments;
  }

  /** 赛事花絮照片（仅图片）：读取 */
  async getGalleryAttachments(competitionId: number) {
    const comp = await this.assertCompetitionExists(competitionId);
    return comp.galleryAttachments ?? [];
  }

  /** 赛事花絮照片：整体替换保存 */
  async saveGalleryAttachments(
    competitionId: number,
    attachments: {
      name: string;
      url: string;
      size?: number;
      type?: string;
      remark?: string;
    }[],
  ) {
    await this.assertCompetitionExists(competitionId);
    await this.competitionRepo.update(competitionId, {
      galleryAttachments: attachments,
    });
    return attachments;
  }

  /**
   * 整体替换积分规则（事务内先删后插）；传空数组 = 清除自定义，恢复默认。
   * 仅影响之后新增/编辑的成绩，已有成绩积分不回溯。
   */
  async saveScoreRules(competitionId: number, dto: SaveCompetitionScoreRulesDto) {
    await this.assertCompetitionExists(competitionId);
    const ranks = dto.rules.map((r) => r.rankNo);
    if (new Set(ranks).size !== ranks.length) {
      throw new BadRequestException('名次不能重复');
    }
    await this.dataSource.transaction(async (em) => {
      await em.delete(WinterCompetitionScoreRule, { competitionId });
      if (dto.rules.length) {
        await em.save(
          WinterCompetitionScoreRule,
          dto.rules.map((r) =>
            em.create(WinterCompetitionScoreRule, {
              competitionId,
              rankNo: r.rankNo,
              score: r.score,
            }),
          ),
        );
      }
    });
    return this.getScoreRules(competitionId);
  }
}
