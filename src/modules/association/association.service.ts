import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import ExcelJS from 'exceljs';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { Association, AssociationMember } from './association.entity';
import { Region } from '../region/region.entity';
import { User } from '../user/user.entity';
import { CreateAssociationDto } from './dto/create-association.dto';
import { ApplyMemberDto } from './dto/apply-member.dto';
import { AuditAssociationDto } from './dto/audit-association.dto';
import { AuditMemberDto } from './dto/audit-member.dto';
import { QueryAssociationDto } from './dto/query-association.dto';
import { QueryMemberDto } from './dto/query-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import {
  PaginatedResult,
  paginate,
} from '../../common/dto/pagination.dto';
import { aesEncrypt, aesDecrypt } from '../../common/utils/aes.util';

@Injectable()
export class AssociationService {
  private static readonly ASSOCIATION_IMPORT_COLUMNS = [
    { header: '协会名称', key: 'name', width: 24 },
    { header: '协会简称', key: 'shortName', width: 18 },
    { header: '省份code', key: 'provinceCode', width: 16 },
    { header: '城市code', key: 'cityCode', width: 16 },
    { header: '区县code', key: 'districtCode', width: 16 },
    { header: '详细地址', key: 'address', width: 32 },
    { header: '负责人', key: 'contactName', width: 16 },
    { header: '负责人电话', key: 'contactPhone', width: 20 },
    { header: '微信', key: 'wechat', width: 20 },
    { header: '教练员', key: 'coach', width: 16 },
    { header: '成立日期', key: 'establishDate', width: 16 },
    { header: '协会简介', key: 'intro', width: 36 },
  ];

  constructor(
    @InjectRepository(Association)
    private readonly associationRepo: Repository<Association>,
    @InjectRepository(AssociationMember)
    private readonly memberRepo: Repository<AssociationMember>,
    private readonly dataSource: DataSource,
  ) {}

  /** Region 仓库（AssociationModule 未 forFeature Region，故走 DataSource 间接拿） */
  private get regionRepo(): Repository<Region> {
    return this.dataSource.getRepository(Region);
  }

  /** User 仓库（同样走 DataSource 间接拿，用于更新会员头像/性别） */
  private get userRepo(): Repository<User> {
    return this.dataSource.getRepository(User);
  }

  /** 会员关联用户字段脱敏：避免身份证密文等敏感字段随列表/详情接口下发 */
  private sanitizeMemberUser(member: AssociationMember): AssociationMember {
    if (member.user) {
      const { idCardEnc, ...safeUser } = member.user as any;
      member.user = safeUser as User;
    }
    return member;
  }

  /**
   * 按 DTO 里的 code 反查并填充 name（province/city/district）。
   * - 仅当传了 code 时反查；code 无效则抛 404 提示编码不存在。
   * - 若同时传了 name，以反查结果为准（避免前后端不一致）。
   * - 若清空 code（传 null），同步清空 name，避免脏数据。
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
      } else if (code === null || code === undefined) {
        if (code === null) target[nameKey] = null;
      }
    });
    return target;
  }

  /* ============================= C 端 ============================= */

  /** C 端：已审核通过、状态正常的协会分页列表 */
  async findPublicList(query: QueryAssociationDto): Promise<PaginatedResult<Association>> {
    const { page, pageSize, keyword, province, city } = query;
    const qb = this.associationRepo
      .createQueryBuilder('a')
      .where('a.audit_status = :audit', { audit: 1 })
      .andWhere('a.status = :status', { status: 1 })
      .andWhere('a.deleted_at IS NULL');

    if (keyword) {
      qb.andWhere('(a.name LIKE :kw OR a.short_name LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }
    if (province) qb.andWhere('a.province = :province', { province });
    if (city) qb.andWhere('a.city = :city', { city });

    qb.orderBy('a.member_count', 'DESC')
      .addOrderBy('a.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  /** C 端：协会详情（仅返回已审核通过的协会） */
  async findPublicDetail(id: number): Promise<Association> {
    const assoc = await this.associationRepo.findOne({
      where: { id, auditStatus: 1, status: 1 },
    });
    if (!assoc) throw new NotFoundException('协会不存在或未通过审核');
    return assoc;
  }

  /** C 端：用户提交入会报名 */
  async apply(userId: number, dto: ApplyMemberDto): Promise<AssociationMember> {
    const assoc = await this.associationRepo.findOne({
      where: { id: dto.associationId, auditStatus: 1, status: 1 },
    });
    if (!assoc) throw new NotFoundException('协会不存在或未通过审核');

    // 唯一索引 (associationId, userId)：同一协会重复报名校验
    const existed = await this.memberRepo.findOne({
      where: { associationId: dto.associationId, userId },
    });
    if (existed && existed.status === 0) {
      throw new BadRequestException('已提交报名，请等待审核');
    }
    if (existed && existed.status === 1) {
      throw new BadRequestException('您已是该协会会员');
    }
    // status=2/3/4 允许重新报名：硬删除历史记录（含软删除残留，避免唯一键冲突）后创建新记录
    if (existed) {
      await this.memberRepo.delete({ id: existed.id });
    }
    await this.memberRepo.delete({ associationId: dto.associationId, userId });

    const member = this.memberRepo.create({
      associationId: dto.associationId,
      userId,
      role: 3,
      realName: dto.realName,
      phone: dto.phone,
      idCardEnc: dto.idCard ? aesEncrypt(dto.idCard) : null,
      emergencyName: dto.emergencyName ?? null,
      emergencyPhone: dto.emergencyPhone ?? null,
      healthDeclaration: dto.healthDeclaration ?? null,
      applyRemark: dto.applyRemark ?? null,
      status: 0,
    });
    return this.memberRepo.save(member);
  }

  /** C 端：我的协会报名记录列表 */
  async findMyMemberships(
    userId: number,
    query: QueryMemberDto,
  ): Promise<PaginatedResult<AssociationMember>> {
    const { page, pageSize, status, role } = query;
    const qb = this.memberRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.association', 'a')
      .where('m.user_id = :userId', { userId })
      .andWhere('m.deleted_at IS NULL');

    if (status !== undefined && status !== null) {
      qb.andWhere('m.status = :status', { status });
    }
    if (role) qb.andWhere('m.role = :role', { role });

    qb.orderBy('m.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  /** C 端：用户创建新协会（审核状态默认 0 待审核） */
  async createByUser(userId: number, dto: CreateAssociationDto): Promise<Association> {
    const existed = await this.associationRepo.findOne({
      where: { name: dto.name },
    });
    if (existed) throw new BadRequestException('协会名称已存在');

    const payload = await this.applyRegionCodes({ ...dto });
    const assoc = this.associationRepo.create({
      ...payload,
      memberCount: 0,
      auditStatus: 0,
      status: 1,
      creatorId: userId,
    });
    return this.associationRepo.save(assoc);
  }

  /** C 端：取消报名（仅 status=0 待审核可取消） */
  async cancelApply(userId: number, memberId: number): Promise<void> {
    const member = await this.memberRepo.findOne({
      where: { id: memberId, userId },
    });
    if (!member) throw new NotFoundException('报名记录不存在');
    if (member.status !== 0) {
      throw new BadRequestException('仅待审核状态的报名可取消');
    }
    await this.memberRepo.delete({ id: memberId });
  }

  /* ============================= 后台 ============================= */

  /** 后台：协会分页列表 */
  async findAdminList(
    query: QueryAssociationDto,
    userAssociationId?: number,
  ): Promise<PaginatedResult<Association>> {
    const {
      page,
      pageSize,
      keyword,
      auditStatus,
      status,
      province,
      city,
      contactName,
      contactPhone,
      establishStart,
      establishEnd,
    } = query;
    const qb = this.associationRepo.createQueryBuilder('a');

    // 协会会长只能看到自己所属协会
    if (userAssociationId) {
      qb.andWhere('a.id = :assocId', { assocId: userAssociationId });
    }
    qb.andWhere('a.deleted_at IS NULL');

    if (keyword) {
      qb.andWhere('(a.name LIKE :kw OR a.short_name LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }
    if (auditStatus !== undefined && auditStatus !== null) {
      qb.andWhere('a.audit_status = :auditStatus', { auditStatus });
    }
    if (status !== undefined && status !== null) {
      qb.andWhere('a.status = :status', { status });
    }
    if (province) qb.andWhere('a.province = :province', { province });
    if (city) qb.andWhere('a.city = :city', { city });
    if (contactName) {
      qb.andWhere('a.contact_name LIKE :contactName', {
        contactName: `%${contactName}%`,
      });
    }
    if (contactPhone) {
      qb.andWhere('a.contact_phone LIKE :contactPhone', {
        contactPhone: `%${contactPhone}%`,
      });
    }
    if (establishStart) {
      qb.andWhere('a.establish_date >= :establishStart', { establishStart });
    }
    if (establishEnd) {
      qb.andWhere('a.establish_date <= :establishEnd', { establishEnd });
    }

    qb.orderBy('a.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  /** 后台：协会详情（含 members 列表） */
  async findAdminDetail(
    id: number,
    userAssociationId?: number,
  ): Promise<Association> {
    // 协会会长只能查看自己所属协会
    if (userAssociationId && id !== userAssociationId) {
      throw new ForbiddenException('无权查看其他协会信息');
    }
    const assoc = await this.associationRepo.findOne({
      where: { id },
      relations: ['members', 'members.user', 'auditor', 'creator'],
    });
    if (!assoc) throw new NotFoundException('协会不存在');
    return assoc;
  }

  async createAssociationImportTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('协会导入');
    sheet.columns = AssociationService.ASSOCIATION_IMPORT_COLUMNS.map(
      (column) => ({
        ...column,
        style: ['provinceCode', 'cityCode', 'districtCode'].includes(column.key)
          ? { numFmt: '@' }
          : undefined,
      }),
    );
    const requiredHeaders = new Set([
      '协会名称',
      '省份code',
      '负责人',
      '负责人电话',
      '成立日期',
    ]);
    sheet.getRow(1).eachCell((cell, columnNumber) => {
      const column = AssociationService.ASSOCIATION_IMPORT_COLUMNS[columnNumber - 1];
      if (column && requiredHeaders.has(column.header)) {
        cell.value = {
          richText: [
            { text: column.header },
            { text: ' *', font: { color: { argb: 'FFFF0000' }, bold: true } },
          ],
        };
      }
      cell.font = { bold: true };
    });
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    const regions = await this.regionRepo.find({
      select: ['id', 'code', 'name', 'level', 'parentId', 'sort'],
      order: { sort: 'ASC', code: 'ASC' },
    });
    const regionById = new Map(regions.map((region) => [String(region.id), region]));
    const districts = regions.filter((region) => region.level === 3);
    const districtSheet = workbook.addWorksheet('区县code参考');
    districtSheet.columns = [
      { header: '省份', key: 'provinceName', width: 20 },
      { header: '省份code', key: 'provinceCode', width: 16, style: { numFmt: '@' } },
      { header: '城市', key: 'cityName', width: 20 },
      { header: '城市code', key: 'cityCode', width: 16, style: { numFmt: '@' } },
      { header: '区县', key: 'districtName', width: 20 },
      { header: '区县code', key: 'districtCode', width: 16, style: { numFmt: '@' } },
    ];
    districtSheet.getRow(1).font = { bold: true };
    districtSheet.addRows(
      districts.map((district) => {
        const city = regionById.get(String(district.parentId));
        const province = city
          ? regionById.get(String(city.parentId))
          : undefined;
        return {
          provinceName: province?.name ?? '',
          provinceCode: province?.code ?? '',
          cityName: city?.name ?? '',
          cityCode: city?.code ?? '',
          districtName: district.name,
          districtCode: district.code,
        };
      }),
    );
    districtSheet.views = [{ state: 'frozen', ySplit: 1 }];

    const instructions = workbook.addWorksheet('填写说明');
    instructions.addRows([
      ['协会批量导入填写说明'],
      ['请在“协会导入”工作表第 2 行开始填写，每行一条协会信息，并保留第一行表头。'],
      ['表头红色 * 表示必填：协会名称、省份code、负责人、负责人电话、成立日期。'],
      ['请在“区县code参考”工作表按省份、城市和区县名称查找对应 code，再填写到“协会导入”工作表。'],
      ['省份/城市/区县名称与 code 必须对应正确的行政区划层级。'],
      ['城市code、区县code 可留空；系统会根据填写的 code 自动生成地区名称。'],
      ['成立日期请使用 YYYY-MM-DD 格式；同名协会或校验失败的行不会导入，并会放入错误报告。'],
      ['单个文件最多导入 5000 条数据，仅支持 .xlsx 文件。'],
    ]);
    instructions.getColumn(1).width = 100;
    instructions.getColumn(1).alignment = { wrapText: true };

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async importAssociations(file: Buffer) {
    const workbook = new ExcelJS.Workbook();
    try {
      const arrayBuffer = new ArrayBuffer(file.byteLength);
      new Uint8Array(arrayBuffer).set(file);
      await workbook.xlsx.load(arrayBuffer);
    } catch {
      throw new BadRequestException('无法读取 Excel 文件，请使用 .xlsx 格式模板');
    }

    const sheet = workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 2) {
      throw new BadRequestException('导入文件中没有协会数据');
    }
    if (sheet.rowCount > 5001) {
      throw new BadRequestException('单次最多导入 5000 条协会数据');
    }

    const headers = new Map<string, number>();
    sheet.getRow(1).eachCell((cell, column) => {
      const header = this.importCellText(cell.value).replace(/\s*\*$/, '').trim();
      if (header && headers.has(header)) {
        throw new BadRequestException(`Excel 表头重复：${header}`);
      }
      if (header) headers.set(header, column);
    });
    const requiredHeaders = AssociationService.ASSOCIATION_IMPORT_COLUMNS.map(
      (column) => column.header,
    );
    const missingHeaders = requiredHeaders.filter((header) => !headers.has(header));
    if (missingHeaders.length) {
      throw new BadRequestException(
        `导入模板缺少以下表头：${missingHeaders.join('、')}`,
      );
    }

    const dataRows: Array<{
      rowNumber: number;
      values: Record<string, string>;
    }> = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const values: Record<string, string> = {};
      for (const column of AssociationService.ASSOCIATION_IMPORT_COLUMNS) {
        values[column.header] = this.importCellText(
          row.getCell(headers.get(column.header)!).value,
        );
      }
      if (Object.values(values).some(Boolean)) {
        dataRows.push({ rowNumber, values });
      }
    });
    if (!dataRows.length) {
      throw new BadRequestException('导入文件中没有协会数据');
    }
    if (dataRows.length > 5000) {
      throw new BadRequestException('单次最多导入 5000 条协会数据');
    }

    const regions = await this.regionRepo.find({
      select: ['id', 'code', 'level', 'parentId'],
    });
    const regionByCode = new Map(regions.map((region) => [region.code, region]));
    const seenNames = new Set<string>();
    const errors: Array<{
      rowNumber: number;
      values: Record<string, string>;
      error: string;
    }> = [];
    let importedCount = 0;

    for (const row of dataRows) {
      const value = (header: string) => row.values[header]?.trim() ?? '';
      const dto = plainToInstance(CreateAssociationDto, {
        name: value('协会名称'),
        shortName: value('协会简称') || undefined,
        provinceCode: value('省份code') || undefined,
        cityCode: value('城市code') || undefined,
        districtCode: value('区县code') || undefined,
        address: value('详细地址') || undefined,
        contactName: value('负责人') || undefined,
        contactPhone: value('负责人电话') || undefined,
        wechat: value('微信') || undefined,
        coach: value('教练员') || undefined,
        establishDate: value('成立日期') || undefined,
        intro: value('协会简介') || undefined,
      });

      let rowError: string | undefined;
      const validationErrors = await validate(dto);
      if (validationErrors.length) {
        rowError = validationErrors
          .flatMap((error) => Object.values(error.constraints ?? {}))
          .join('；');
      }

      const provinceCode = dto.provinceCode;
      const cityCode = dto.cityCode;
      const districtCode = dto.districtCode;
      if (!rowError && !dto.contactName?.trim()) {
        rowError = '负责人为必填项';
      }
      if (!rowError && !dto.contactPhone?.trim()) {
        rowError = '负责人电话为必填项';
      }
      if (!rowError && !dto.establishDate?.trim()) {
        rowError = '成立日期为必填项';
      }
      if (!rowError && !provinceCode) {
        rowError = '省份code为必填项';
      }
      if (!rowError && provinceCode) {
        const province = regionByCode.get(provinceCode);
        if (!province || province.level !== 1) {
          rowError = `省份code无效：${provinceCode}`;
        }
        if (!rowError && cityCode) {
          const city = regionByCode.get(cityCode);
          if (
            !city ||
            city.level !== 2 ||
            String(city.parentId) !== String(province?.id)
          ) {
            rowError = `城市code无效或不属于省份 ${provinceCode}：${cityCode}`;
          }
        }
        if (!rowError && districtCode) {
          const district = regionByCode.get(districtCode);
          const city = cityCode ? regionByCode.get(cityCode) : undefined;
          if (!city) {
            rowError = '填写区县code时必须同时填写城市code';
          } else if (
            !district ||
            district.level !== 3 ||
            String(district.parentId) !== String(city.id)
          ) {
            rowError = `区县code无效或不属于城市 ${cityCode}：${districtCode}`;
          }
        }
      }

      const name = dto.name?.trim();
      const establishDate = dto.establishDate;
      if (
        !rowError &&
        establishDate &&
        !this.isValidImportDate(establishDate)
      ) {
        rowError = '成立日期格式无效，请使用 YYYY-MM-DD';
      }
      if (!rowError && name && seenNames.has(name)) {
        rowError = `本文件中协会名称重复：${name}`;
      }

      if (!rowError) {
        try {
          await this.createByAdmin(dto);
          if (name) seenNames.add(name);
          importedCount += 1;
        } catch (error) {
          if (
            error instanceof BadRequestException ||
            error instanceof NotFoundException
          ) {
            rowError = error.message;
          } else if (
            error instanceof QueryFailedError &&
            (error as QueryFailedError & { driverError?: { code?: string } })
              .driverError?.code === 'ER_DUP_ENTRY'
          ) {
            rowError = `协会名称已存在：${name}`;
          } else {
            throw error;
          }
        }
      }

      if (rowError) {
        errors.push({ rowNumber: row.rowNumber, values: row.values, error: rowError });
      }
    }

    return { importedCount, errors };
  }

  async createAssociationImportErrorReport(
    importedCount: number,
    errors: Array<{
      rowNumber: number;
      values: Record<string, string>;
      error: string;
    }>,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('导入失败行');
    sheet.addRow([`成功导入 ${importedCount} 条；以下 ${errors.length} 条未导入`]);
    sheet.addRow([
      'Excel行号',
      ...AssociationService.ASSOCIATION_IMPORT_COLUMNS.map(
        (column) => column.header,
      ),
      '失败原因',
    ]);
    sheet.getRow(2).font = { bold: true };
    for (const error of errors) {
      sheet.addRow([
        error.rowNumber,
        ...AssociationService.ASSOCIATION_IMPORT_COLUMNS.map(
          (column) => error.values[column.header] ?? '',
        ),
        error.error,
      ]);
    }
    sheet.columns = [
      { width: 12 },
      ...AssociationService.ASSOCIATION_IMPORT_COLUMNS.map((column) => ({
        width: column.width,
      })),
      { width: 52 },
    ];
    sheet.views = [{ state: 'frozen', ySplit: 2 }];
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private importCellText(value: ExcelJS.CellValue): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) {
      const pad = (number: number) => String(number).padStart(2, '0');
      return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
        value.getDate(),
      )}`;
    }
    if (typeof value === 'object') {
      if ('text' in value && typeof value.text === 'string') return value.text.trim();
      if ('richText' in value) {
        return value.richText.map((part) => part.text).join('').trim();
      }
      if ('result' in value) return this.importCellText(value.result);
      return '';
    }
    return String(value).trim();
  }

  private isValidImportDate(value: string): boolean {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }

  /** 后台：管理员创建协会 */
  async createByAdmin(dto: CreateAssociationDto): Promise<Association> {
    const existed = await this.associationRepo.findOne({
      where: { name: dto.name },
    });
    if (existed) throw new BadRequestException('协会名称已存在');

    const payload = await this.applyRegionCodes({ ...dto });
    // 管理员创建默认审核通过、状态正常
    const assoc = this.associationRepo.create({
      ...payload,
      memberCount: 0,
      auditStatus: 1,
      status: 1,
    });
    return this.associationRepo.save(assoc);
  }

  /** 后台：更新协会基本信息 */
  async update(id: number, dto: Partial<CreateAssociationDto>): Promise<Association> {
    const assoc = await this.associationRepo.findOne({ where: { id } });
    if (!assoc) throw new NotFoundException('协会不存在');

    if (dto.name && dto.name !== assoc.name) {
      const dup = await this.associationRepo.findOne({
        where: { name: dto.name },
      });
      if (dup) throw new BadRequestException('协会名称已存在');
    }

    const payload = await this.applyRegionCodes({ ...dto });
    Object.assign(assoc, payload);
    return this.associationRepo.save(assoc);
  }

  /** 后台：审核协会 */
  async audit(
    id: number,
    adminId: number,
    dto: AuditAssociationDto,
  ): Promise<Association> {
    const assoc = await this.associationRepo.findOne({ where: { id } });
    if (!assoc) throw new NotFoundException('协会不存在');
    if (assoc.auditStatus !== 0) {
      throw new BadRequestException('该协会已审核，不可重复审核');
    }

    assoc.auditStatus = dto.auditStatus;
    assoc.auditRemark = dto.auditRemark ?? null;
    assoc.auditorId = adminId;
    assoc.auditedAt = new Date();
    return this.associationRepo.save(assoc);
  }

  /** 后台：启用/停用协会 */
  async updateStatus(id: number, status: number): Promise<Association> {
    const assoc = await this.associationRepo.findOne({ where: { id } });
    if (!assoc) throw new NotFoundException('协会不存在');
    assoc.status = status;
    return this.associationRepo.save(assoc);
  }

  /** 后台：软删除协会 */
  async softRemove(id: number): Promise<void> {
    const assoc = await this.associationRepo.findOne({ where: { id } });
    if (!assoc) throw new NotFoundException('协会不存在');
    await this.associationRepo.softDelete(id);
  }

  /** 后台：协会会员分页 */
  async findMembers(
    associationId: number,
    query: QueryMemberDto,
    userAssociationId?: number,
  ): Promise<PaginatedResult<AssociationMember>> {
    // 协会会长只能查看自己所属协会的会员
    if (userAssociationId && associationId !== userAssociationId) {
      throw new ForbiddenException('无权查看其他协会会员');
    }
    const {
      page,
      pageSize,
      status,
      role,
      keyword,
      phone,
      hasInsurance,
      gender,
      joinedStart,
      joinedEnd,
    } = query;
    const qb = this.memberRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.user', 'u')
      .where('m.association_id = :associationId', { associationId })
      .andWhere('m.deleted_at IS NULL');

    if (status !== undefined && status !== null) {
      qb.andWhere('m.status = :status', { status });
    }
    if (role) qb.andWhere('m.role = :role', { role });
    if (keyword) {
      qb.andWhere('(m.real_name LIKE :kw OR m.member_no LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }
    if (phone) {
      qb.andWhere('m.phone LIKE :phone', { phone: `%${phone}%` });
    }
    if (hasInsurance !== undefined && hasInsurance !== null) {
      if (hasInsurance === 1) {
        qb.andWhere('m.has_insurance = 1');
      } else {
        // 未缴纳：含未填写(NULL)
        qb.andWhere('(m.has_insurance = 0 OR m.has_insurance IS NULL)');
      }
    }
    if (gender !== undefined && gender !== null) {
      qb.andWhere('u.gender = :gender', { gender });
    }
    if (joinedStart) {
      qb.andWhere('m.joined_at >= :joinedStart', {
        joinedStart: `${joinedStart} 00:00:00`,
      });
    }
    if (joinedEnd) {
      qb.andWhere('m.joined_at <= :joinedEnd', {
        joinedEnd: `${joinedEnd} 23:59:59`,
      });
    }

    qb.orderBy('m.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    list.forEach((m) => this.sanitizeMemberUser(m));
    return paginate(list, total, page, pageSize);
  }

  /** 后台：审核会员（status 1通过/2拒绝） */
  async auditMember(
    memberId: number,
    reviewerId: number,
    dto: AuditMemberDto,
    userAssociationId?: number,
  ): Promise<AssociationMember> {
    const member = await this.memberRepo.findOne({
      where: { id: memberId },
      relations: ['association'],
    });
    if (!member) throw new NotFoundException('会员记录不存在');
    if (userAssociationId && member.associationId !== userAssociationId) {
      throw new ForbiddenException('无权操作其他协会的会员');
    }
    if (member.status !== 0) {
      throw new BadRequestException('该报名已审核，不可重复审核');
    }

    member.status = dto.status;
    member.reviewerId = reviewerId;
    member.reviewedAt = new Date();

    if (dto.status === 1) {
      // 通过：生成会员编号 + 入会时间 + 协会冗余计数 +1
      member.memberNo = this.generateMemberNo(member.associationId);
      member.joinedAt = new Date();

      if (member.association) {
        member.association.memberCount = (member.association.memberCount || 0) + 1;
        await this.associationRepo.save(member.association);
      }
    }

    return this.memberRepo.save(member);
  }

  /** 后台：修改会员角色（1会长 2管理员 3普通） */
  async updateMemberRole(
    memberId: number,
    role: number,
    userAssociationId?: number,
  ): Promise<AssociationMember> {
    const member = await this.memberRepo.findOne({ where: { id: memberId } });
    if (!member) throw new NotFoundException('会员记录不存在');
    if (userAssociationId && member.associationId !== userAssociationId) {
      throw new ForbiddenException('无权操作其他协会的会员');
    }
    if (member.status !== 1) {
      throw new BadRequestException('仅已通过审核的会员可修改角色');
    }
    member.role = role;
    return this.memberRepo.save(member);
  }

  /** 后台：移除/恢复会员（status 3退出 4移除） */
  async updateMemberStatus(
    memberId: number,
    status: number,
    userAssociationId?: number,
  ): Promise<AssociationMember> {
    const member = await this.memberRepo.findOne({
      where: { id: memberId },
      relations: ['association'],
    });
    if (!member) throw new NotFoundException('会员记录不存在');
    if (userAssociationId && member.associationId !== userAssociationId) {
      throw new ForbiddenException('无权操作其他协会的会员');
    }

    const prevStatus = member.status;
    member.status = status;
    const result = await this.memberRepo.save(member);

    // 协会冗余计数同步：被移除/退出时 -1，恢复为通过时 +1
    if (member.association) {
      const wasActive = prevStatus === 1;
      const isActive = status === 1;
      if (!wasActive && isActive) {
        member.association.memberCount = (member.association.memberCount || 0) + 1;
        await this.associationRepo.save(member.association);
      } else if (wasActive && !isActive) {
        member.association.memberCount = Math.max(0, (member.association.memberCount || 0) - 1);
        await this.associationRepo.save(member.association);
      }
    }
    return result;
  }

  /** 后台：删除会员记录 */
  async deleteMember(memberId: number, userAssociationId?: number): Promise<void> {
    const member = await this.memberRepo.findOne({
      where: { id: memberId },
      relations: ['association'],
    });
    if (!member) throw new NotFoundException('会员记录不存在');
    if (userAssociationId && member.associationId !== userAssociationId) {
      throw new ForbiddenException('无权操作其他协会的会员');
    }

    // 若为已通过会员，协会冗余计数 -1
    if (member.status === 1 && member.association) {
      member.association.memberCount = Math.max(0, (member.association.memberCount || 0) - 1);
      await this.associationRepo.save(member.association);
    }
    // 逻辑删除
    await this.memberRepo.softDelete({ id: memberId });
  }

  /** 后台：会员详情（身份证号解密后随 idCard 字段返回） */
  async findMemberDetail(
    memberId: number,
    userAssociationId?: number,
  ): Promise<AssociationMember> {
    const member = await this.memberRepo.findOne({
      where: { id: memberId },
      relations: ['user', 'association'],
    });
    if (!member) throw new NotFoundException('会员记录不存在');
    if (userAssociationId && member.associationId !== userAssociationId) {
      throw new ForbiddenException('无权查看其他协会的会员');
    }
    this.sanitizeMemberUser(member);
    let idCard: string | null = null;
    if (member.idCardEnc) {
      try {
        idCard = aesDecrypt(member.idCardEnc);
      } catch {
        idCard = null;
      }
    }
    return { ...member, idCard } as AssociationMember;
  }

  /** 后台：编辑会员（仅更新传入字段；身份证号明文传入时重新加密） */
  async updateMember(
    memberId: number,
    dto: UpdateMemberDto,
    userAssociationId?: number,
  ): Promise<AssociationMember> {
    const member = await this.memberRepo.findOne({
      where: { id: memberId },
      relations: ['association'],
    });
    if (!member) throw new NotFoundException('会员记录不存在');
    if (userAssociationId && member.associationId !== userAssociationId) {
      throw new ForbiddenException('无权操作其他协会的会员');
    }

    if (dto.role !== undefined) member.role = dto.role;
    if (dto.realName !== undefined) member.realName = dto.realName;
    if (dto.phone !== undefined) member.phone = dto.phone;
    if (dto.idCard) member.idCardEnc = aesEncrypt(dto.idCard);
    if (dto.emergencyName !== undefined) member.emergencyName = dto.emergencyName;
    if (dto.emergencyPhone !== undefined) member.emergencyPhone = dto.emergencyPhone;
    if (dto.healthDeclaration !== undefined) member.healthDeclaration = dto.healthDeclaration;
    if (dto.applyRemark !== undefined) member.applyRemark = dto.applyRemark;
    if (dto.joinedAt) member.joinedAt = new Date(`${dto.joinedAt} 00:00:00`);
    if (dto.hasInsurance !== undefined && dto.hasInsurance !== null) {
      member.hasInsurance = dto.hasInsurance;
    }
    if (dto.buyedInsuranceAt) {
      member.buyedInsuranceAt = new Date(`${dto.buyedInsuranceAt} 00:00:00`);
    }
    if (dto.insuranceStartAt) {
      member.insuranceStartAt = new Date(`${dto.insuranceStartAt} 00:00:00`);
    }
    if (dto.insuranceEndAt) {
      member.insuranceEndAt = new Date(`${dto.insuranceEndAt} 00:00:00`);
    }
    // 头像/性别保存在关联的 C 端用户表上
    if (dto.avatar !== undefined || dto.gender !== undefined) {
      const user = await this.userRepo.findOne({ where: { id: member.userId } });
      if (user) {
        if (dto.avatar !== undefined) user.avatarUrl = dto.avatar || null;
        if (dto.gender !== undefined) user.gender = dto.gender;
        await this.userRepo.save(user);
      }
    }
    return this.memberRepo.save(member);
  }

  /* ============================= 私有工具 ============================= */

  /** 生成会员编号：ASC + associationId(0填充6位) + 随机6位 */
  private generateMemberNo(associationId: number): string {
    const padId = String(associationId).padStart(6, '0');
    const rand = Math.floor(100000 + Math.random() * 900000);
    const dateStr = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');
    return `ASC${padId}${dateStr}${rand}`.slice(0, 32);
  }
}
