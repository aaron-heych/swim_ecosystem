/**
 * 圈子扩展服务 — CardShare / BuddyInvitation / Activity
 * 1. createExtensionInTransaction：发帖时按 type 在同一事务中创建扩展表
 * 2. loadExtension：详情查询时按 type 懒加载扩展表
 * 3. markDeletedInTransaction：用户删帖时级联标记扩展表
 * 4. activity-join / buddy-join / card-deal：C 端交互操作
 */
import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CirclePost, CardShare, BuddyInvitation, Activity, ActivityParticipant } from './circle.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { ActivitySignupDto } from './dto/signup.dto';

@Injectable()
export class PostExtService {
  private readonly logger = new Logger(PostExtService.name);

  constructor(
    @InjectRepository(CardShare)
    private readonly cardRepo: Repository<CardShare>,
    @InjectRepository(BuddyInvitation)
    private readonly buddyRepo: Repository<BuddyInvitation>,
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(ActivityParticipant)
    private readonly participantRepo: Repository<ActivityParticipant>,
    @InjectRepository(CirclePost)
    private readonly postRepo: Repository<CirclePost>,
    private readonly dataSource: DataSource,
  ) {}

  /* ============================ 发帖：事务创建扩展表 ============================ */

  /** 在 manager 事务中按 post.type 创建 1:1 扩展表 */
  async createExtensionInTransaction(
    manager: EntityManager,
    postId: number,
    dto: CreatePostDto,
  ): Promise<void> {
    switch (dto.type) {
      case 1: {
        const ext = dto.cardShare;
        if (!ext) throw new BadRequestException('代刷卡信息必填');
        await manager.save(
          manager.create(CardShare, {
            postId,
            venueId: ext.venueId,
            cardType: ext.cardType,
            totalTimes: ext.totalTimes ?? null,
            remainTimes: ext.remainTimes ?? null,
            expireDate: ext.expireDate ?? null,
            priceType: ext.priceType,
            price: ext.price,
            tradeMethod: ext.tradeMethod ?? null,
            contactWechat: ext.contactWechat ?? null,
            status: 0,
          }),
        );
        break;
      }
      case 2: {
        const ext = dto.buddyInvitation;
        if (!ext) throw new BadRequestException('约搭子信息必填');
        await manager.save(
          manager.create(BuddyInvitation, {
            postId,
            venueId: ext.venueId,
            scheduleTime: new Date(ext.scheduleTime),
            durationMin: ext.durationMin ?? null,
            genderLimit: ext.genderLimit,
            levelRequirement: ext.levelRequirement ?? null,
            peopleNeeded: ext.peopleNeeded,
            peopleJoined: 1, // 作者本人默认占位
            status: 0,
          }),
        );
        break;
      }
      case 3: {
        const ext = dto.activity;
        if (!ext) throw new BadRequestException('活动信息必填');
        await manager.save(
          manager.create(Activity, {
            postId,
            associationId: ext.associationId ?? null,
            title: ext.title,
            coverUrl: ext.coverUrl ?? null,
            venueId: ext.venueId ?? null,
            address: ext.address ?? null,
            startTime: new Date(ext.startTime),
            endTime: ext.endTime ? new Date(ext.endTime) : null,
            signupDeadline: ext.signupDeadline ? new Date(ext.signupDeadline) : null,
            maxParticipants: ext.maxParticipants,
            joinedCount: 0,
            fee: ext.fee,
            needAudit: ext.needAudit,
            intro: ext.intro ?? null,
            status: 0,
          }),
        );
        break;
      }
      case 4:
        // 普通动态无扩展表
        break;
      default:
        throw new BadRequestException(`不支持的帖子类型: ${dto.type}`);
    }
  }

  /** 详情查询时按 type 懒加载扩展表 */
  async loadExtension(post: CirclePost): Promise<void> {
    try {
      if (post.type === 1) {
        post.cardShare = await this.cardRepo.findOne({ where: { postId: post.id } });
      } else if (post.type === 2) {
        post.buddyInvitation = await this.buddyRepo.findOne({ where: { postId: post.id } });
      } else if (post.type === 3) {
        post.activity = await this.activityRepo.findOne({ where: { postId: post.id } });
      }
    } catch (err) {
      this.logger.warn(`加载扩展表失败 postId=${post.id}: ${(err as Error).message}`);
    }
  }

  /** 用户删帖时按 type 标记扩展表已关闭（保留数据，便于历史查询） */
  async markDeletedInTransaction(
    manager: EntityManager,
    postId: number,
    type: number,
  ): Promise<void> {
    if (type === 1) {
      await manager.update(CardShare, { postId }, { status: 2 });
    } else if (type === 2) {
      await manager.update(BuddyInvitation, { postId }, { status: 3 });
    } else if (type === 3) {
      await manager.update(Activity, { postId }, { status: 4 });
    }
  }

  /* ============================ C 端：活动报名 ============================ */

  /** 报名活动：type=3 时；needAudit=0 直接通过(1)，needAudit=1 待审(0)；joinedCount++ */
  async joinActivity(userId: number, postId: number, dto: ActivitySignupDto): Promise<ActivityParticipant> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post || post.status !== 1 || post.deletedAt) {
      throw new NotFoundException('帖子不存在');
    }
    if (post.type !== 3) throw new BadRequestException('非活动类型帖子');
    const activity = await this.activityRepo.findOne({ where: { postId } });
    if (!activity) throw new NotFoundException('活动不存在');
    if (activity.status === 2 || activity.status === 3 || activity.status === 4) {
      throw new BadRequestException('活动已结束或取消');
    }
    if (activity.signupDeadline && activity.signupDeadline.getTime() < Date.now()) {
      throw new BadRequestException('报名已截止');
    }
    if (activity.maxParticipants > 0 && activity.joinedCount >= activity.maxParticipants) {
      throw new BadRequestException('名额已满');
    }
    // 已报名则返回原记录（避免重复报名）
    const exist = await this.participantRepo.findOne({
      where: { activityId: activity.id, userId },
    });
    if (exist) return exist;

    const initialStatus = activity.needAudit === 1 ? 0 : 1;
    return this.dataSource.transaction(async (manager) => {
      const p = manager.create(ActivityParticipant, {
        activityId: activity.id,
        userId,
        status: initialStatus,
        signupRemark: dto.signupRemark ?? null,
      });
      const saved = await manager.save(p);
      // 仅直接通过或新报名增加 joinedCount
      await manager.increment(Activity, { id: activity.id }, 'joinedCount', 1);
      // 报名满后置 status=2 已满
      if (activity.maxParticipants > 0) {
        const refreshed = await manager.findOne(Activity, { where: { id: activity.id } });
        if (refreshed && refreshed.joinedCount >= refreshed.maxParticipants) {
          await manager.update(Activity, { id: activity.id }, { status: 2 });
        }
      }
      return saved;
    });
  }

  /* ============================ C 端：约搭子加入 ============================ */

  /** 约搭子加入：peopleJoined++，满时 status=1 */
  async joinBuddy(userId: number, postId: number): Promise<BuddyInvitation> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post || post.status !== 1 || post.deletedAt) {
      throw new NotFoundException('帖子不存在');
    }
    if (post.type !== 2) throw new BadRequestException('非约搭子类型帖子');
    const buddy = await this.buddyRepo.findOne({ where: { postId } });
    if (!buddy) throw new NotFoundException('约搭子信息不存在');
    if (buddy.status !== 0) throw new BadRequestException('该约搭子已结束或关闭');
    if (buddy.peopleJoined >= buddy.peopleNeeded) {
      throw new BadRequestException('名额已满');
    }
    return this.dataSource.transaction(async (manager) => {
      await manager.increment(
        BuddyInvitation,
        { id: buddy.id },
        'peopleJoined',
        1,
      );
      const refreshed = await manager.findOne(BuddyInvitation, { where: { id: buddy.id } });
      if (refreshed && refreshed.peopleJoined >= refreshed.peopleNeeded) {
        await manager.update(BuddyInvitation, { id: buddy.id }, { status: 1 });
        return refreshed;
      }
      return refreshed!;
    });
  }

  /* ============================ C 端：代刷卡成交 ============================ */

  /** 标记代刷卡成交（仅作者；CardShare.status=1，remainTimes-- 如适用） */
  async markCardDeal(userId: number, postId: number): Promise<CardShare> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post || post.deletedAt) throw new NotFoundException('帖子不存在');
    if (post.type !== 1) throw new BadRequestException('非代刷卡类型帖子');
    if (post.userId !== userId) throw new ForbiddenException('仅作者可标记成交');
    const card = await this.cardRepo.findOne({ where: { postId } });
    if (!card) throw new NotFoundException('代刷卡信息不存在');
    if (card.status === 1) throw new BadRequestException('已标记成交');
    return this.dataSource.transaction(async (manager) => {
      const update: Partial<CardShare> = { status: 1 };
      if (card.remainTimes !== null && card.remainTimes > 0) {
        update.remainTimes = card.remainTimes - 1;
      }
      await manager.update(CardShare, { id: card.id }, update);
      return (await manager.findOne(CardShare, { where: { id: card.id } }))!;
    });
  }
}
