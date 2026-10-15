import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  OaFollower,
  MessageTemplate,
  UserSubscribe,
  NotificationLog,
} from './notification.entity';
import { User } from '../user/user.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { QueryLogsDto } from './dto/query-logs.dto';
import { SubscribeDto } from './dto/subscribe.dto';
import {
  PaginatedResult,
  paginate,
} from '../../common/dto/pagination.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(OaFollower)
    private readonly oaFollowerRepo: Repository<OaFollower>,
    @InjectRepository(MessageTemplate)
    private readonly templateRepo: Repository<MessageTemplate>,
    @InjectRepository(UserSubscribe)
    private readonly subscribeRepo: Repository<UserSubscribe>,
    @InjectRepository(NotificationLog)
    private readonly logRepo: Repository<NotificationLog>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /* ============================= C 端 ============================= */

  /**
   * 用户接受订阅授权
   * 每条 templateId 对应的 UserSubscribe 记录 quota +1，更新 lastAcceptAt
   */
  async subscribe(userId: number, dto: SubscribeDto): Promise<void> {
    // 校验模板存在且启用
    const templates = await this.templateRepo.find({
      where: { id: In(dto.templateIds), status: 1 },
    });
    if (templates.length !== dto.templateIds.length) {
      throw new BadRequestException('部分模板不存在或已停用');
    }

    for (const templateId of dto.templateIds) {
      const tpl = templates.find((t) => t.id === templateId)!;
      let sub = await this.subscribeRepo.findOne({
        where: { userId, templateId },
      });
      if (!sub) {
        sub = this.subscribeRepo.create({
          userId,
          templateId,
          channel: tpl.channel,
          quota: 1,
          lastAcceptAt: new Date(),
        });
      } else {
        sub.quota = (sub.quota || 0) + 1;
        sub.lastAcceptAt = new Date();
        sub.channel = tpl.channel;
      }
      await this.subscribeRepo.save(sub);
    }
  }

  /** 我的订阅列表（含 templateCode、剩余 quota） */
  async findMySubscribes(
    userId: number,
    query: PaginationDto,
  ): Promise<PaginatedResult<UserSubscribe>> {
    const { page, pageSize } = query;
    const qb = this.subscribeRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.template', 't')
      .where('s.user_id = :userId', { userId });

    qb.orderBy('s.last_accept_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  /* ============================= 后台：模板 ============================= */

  /** 模板分页列表（channel 过滤、keyword 搜 code/name） */
  async findTemplates(
    query: PaginationDto & { channel?: number },
  ): Promise<PaginatedResult<MessageTemplate>> {
    const { page, pageSize, keyword, channel } = query;
    const qb = this.templateRepo.createQueryBuilder('t');

    if (keyword) {
      qb.andWhere('(t.code LIKE :kw OR t.name LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }
    if (channel) qb.andWhere('t.channel = :channel', { channel });

    qb.orderBy('t.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  /** 创建模板 */
  async createTemplate(dto: CreateTemplateDto): Promise<MessageTemplate> {
    const existed = await this.templateRepo.findOne({
      where: { code: dto.code, channel: dto.channel },
    });
    if (existed) {
      throw new BadRequestException('该 (code, channel) 模板已存在');
    }
    const tpl = this.templateRepo.create({
      ...dto,
      status: dto.status ?? 1,
    });
    return this.templateRepo.save(tpl);
  }

  /** 更新模板 */
  async updateTemplate(
    id: number,
    dto: Partial<CreateTemplateDto>,
  ): Promise<MessageTemplate> {
    const tpl = await this.templateRepo.findOne({ where: { id } });
    if (!tpl) throw new NotFoundException('模板不存在');

    if (dto.code && dto.channel) {
      const dup = await this.templateRepo.findOne({
        where: { code: dto.code, channel: dto.channel },
      });
      if (dup && dup.id !== id) {
        throw new BadRequestException('该 (code, channel) 模板已存在');
      }
    }
    Object.assign(tpl, dto);
    return this.templateRepo.save(tpl);
  }

  /** 启用/停用模板 */
  async updateTemplateStatus(id: number, status: number): Promise<MessageTemplate> {
    const tpl = await this.templateRepo.findOne({ where: { id } });
    if (!tpl) throw new NotFoundException('模板不存在');
    tpl.status = status;
    return this.templateRepo.save(tpl);
  }

  /** 删除模板 */
  async deleteTemplate(id: number): Promise<void> {
    const tpl = await this.templateRepo.findOne({ where: { id } });
    if (!tpl) throw new NotFoundException('模板不存在');
    await this.templateRepo.delete({ id });
  }

  /* ============================= 后台：流水 ============================= */

  /** 下发流水分页（支持 userId、templateCode、status、bizType 过滤、日期范围） */
  async findLogs(query: QueryLogsDto): Promise<PaginatedResult<NotificationLog>> {
    const { page, pageSize, channel, userId, templateCode, status, bizType, startDate, endDate } = query;
    const qb = this.logRepo.createQueryBuilder('l');

    if (channel) qb.andWhere('l.channel = :channel', { channel });
    if (userId) qb.andWhere('l.user_id = :userId', { userId });
    if (templateCode) qb.andWhere('l.template_code = :templateCode', { templateCode });
    if (status !== undefined && status !== null) {
      qb.andWhere('l.status = :status', { status });
    }
    if (bizType) qb.andWhere('l.biz_type = :bizType', { bizType });
    if (startDate) {
      qb.andWhere('l.created_at >= :startDate', { startDate: new Date(`${startDate}T00:00:00`) });
    }
    if (endDate) {
      qb.andWhere('l.created_at <= :endDate', { endDate: new Date(`${endDate}T23:59:59`) });
    }

    qb.orderBy('l.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  /* ============================= 后台：下发 ============================= */

  /**
   * 手动触发下发
   * 实现：查模板、查 UserSubscribe 扣减 quota（订阅消息），
   * 或查 OaFollower（公众号模板消息），插入 NotificationLog 记录，标记 plannedAt。
   * 实际调用微信 API 发送可省略/留 TODO。
   */
  async send(dto: SendNotificationDto): Promise<{
    successCount: number;
    failCount: number;
    logs: NotificationLog[];
  }> {
    const template = await this.templateRepo.findOne({
      where: { code: dto.templateCode },
    });
    if (!template) throw new NotFoundException('模板不存在');
    if (template.status !== 1) {
      throw new BadRequestException('模板已停用，不可下发');
    }

    const users = await this.userRepo.find({
      where: { id: In(dto.userIds) },
    });
    const foundUserIds = new Set(users.map((u) => u.id));
    const missingUserIds = dto.userIds.filter((id) => !foundUserIds.has(id));
    if (missingUserIds.length > 0) {
      throw new BadRequestException(`用户不存在：${missingUserIds.join(',')}`);
    }

    const logs: NotificationLog[] = [];
    let successCount = 0;
    let failCount = 0;
    const now = new Date();
    const plannedAt = now;

    for (const userId of dto.userIds) {
      const user = users.find((u) => u.id === userId)!;
      let openid: string | null = null;
      let channel: number = template.channel;

      if (template.channel === 1) {
        // 小程序订阅消息：需 UserSubscribe quota > 0
        const sub = await this.subscribeRepo.findOne({
          where: { userId, templateId: template.id },
        });
        if (!sub || sub.quota <= 0) {
          const log = this.logRepo.create({
            userId,
            openid: null,
            channel,
            templateId: template.id,
            templateCode: template.code,
            title: template.title,
            content: template.example,
            data: dto.data,
            bizType: dto.bizType ?? null,
            bizId: dto.bizId ?? null,
            status: 2,
            errorMsg: '用户未订阅或订阅次数已用尽',
            plannedAt,
          });
          logs.push(await this.logRepo.save(log));
          failCount++;
          continue;
        }
        // 扣减 quota
        sub.quota = sub.quota - 1;
        await this.subscribeRepo.save(sub);
        openid = user.openid;
      } else if (template.channel === 2) {
        // 公众号模板消息：查 OaFollower
        const oaFollower = user.oaOpenid
          ? await this.oaFollowerRepo.findOne({
              where: { openid: user.oaOpenid, subscribeStatus: 1 },
            })
          : null;
        if (!oaFollower) {
          const log = this.logRepo.create({
            userId,
            openid: null,
            channel,
            templateId: template.id,
            templateCode: template.code,
            title: template.title,
            content: template.example,
            data: dto.data,
            bizType: dto.bizType ?? null,
            bizId: dto.bizId ?? null,
            status: 2,
            errorMsg: '用户未关注公众号或已取关',
            plannedAt,
          });
          logs.push(await this.logRepo.save(log));
          failCount++;
          continue;
        }
        openid = oaFollower.openid;
      } else {
        // 短信：用户需有手机号
        if (!user.phone) {
          const log = this.logRepo.create({
            userId,
            openid: null,
            channel,
            templateId: template.id,
            templateCode: template.code,
            title: template.title,
            content: template.example,
            data: dto.data,
            bizType: dto.bizType ?? null,
            bizId: dto.bizId ?? null,
            status: 2,
            errorMsg: '用户未绑定手机号',
            plannedAt,
          });
          logs.push(await this.logRepo.save(log));
          failCount++;
          continue;
        }
        openid = null;
      }

      // TODO: 实际调用微信 API 发送 — 此处仅插入流水，标记待发送 + plannedAt
      const log = this.logRepo.create({
        userId,
        openid,
        channel,
        templateId: template.id,
        templateCode: template.code,
        title: template.title,
        content: template.example,
        data: dto.data,
        bizType: dto.bizType ?? null,
        bizId: dto.bizId ?? null,
        status: 0,
        errorMsg: null,
        plannedAt,
      });
      logs.push(await this.logRepo.save(log));
      successCount++;
    }

    return { successCount, failCount, logs };
  }

  /* ============================= 后台：公众号粉丝 ============================= */

  /** 公众号粉丝分页列表 */
  async findOaFollowers(
    query: PaginationDto,
  ): Promise<PaginatedResult<OaFollower>> {
    const { page, pageSize, keyword } = query;
    const qb = this.oaFollowerRepo.createQueryBuilder('f');

    if (keyword) {
      qb.andWhere('(f.nickname LIKE :kw OR f.openid LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }

    qb.orderBy('f.subscribe_time', 'DESC')
      .addOrderBy('f.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }
}
