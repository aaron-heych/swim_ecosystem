/**
 * 圈子主服务 — 帖子主表 + 评论 + 点赞 + 收藏 + 举报
 * 多表写入使用 DataSource.transaction
 */
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In, Not } from 'typeorm';
import { CirclePost, CircleComment, CircleLike, CircleFavorite, Report } from './circle.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { CreateCommentDto } from './dto/comment.dto';
import { LikeDto } from './dto/like.dto';
import { CreateReportDto } from './dto/report.dto';
import { QueryCommentDto } from './dto/query-comment.dto';
import { QueryReportDto } from './dto/query-report.dto';
import { AuditPostDto } from './dto/audit-post.dto';
import { HandleReportDto } from './dto/handle-report.dto';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { PostExtService } from './post-ext.service';

@Injectable()
export class CircleService {
  constructor(
    @InjectRepository(CirclePost)
    private readonly postRepo: Repository<CirclePost>,
    @InjectRepository(CircleComment)
    private readonly commentRepo: Repository<CircleComment>,
    @InjectRepository(CircleLike)
    private readonly likeRepo: Repository<CircleLike>,
    @InjectRepository(CircleFavorite)
    private readonly favRepo: Repository<CircleFavorite>,
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    private readonly dataSource: DataSource,
    private readonly postExtService: PostExtService,
  ) {}

  /* ============================ C 端 - 帖子 ============================ */

  /** Feed 流：按 type/province/city 过滤，isTop desc + createdAt desc */
  async findFeed(query: QueryPostDto): Promise<PaginatedResult<CirclePost>> {
    const { page, pageSize, keyword, type, province, city } = query;
    const qb = this.postRepo.createQueryBuilder('p');
    qb.where('p.status = :status', { status: 1 });
    if (type) qb.andWhere('p.type = :type', { type });
    if (province) qb.andWhere('p.province = :province', { province });
    if (city) qb.andWhere('p.city = :city', { city });
    if (keyword) {
      qb.andWhere('(p.title LIKE :kw OR p.content LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }
    qb.orderBy('p.isTop', 'DESC').addOrderBy('p.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  /** 帖子详情：按 type 关联加载对应扩展表 */
  async findPostDetail(id: number): Promise<CirclePost> {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['user', 'venue'],
    });
    if (!post || post.status !== 1 || post.deletedAt) {
      throw new NotFoundException('帖子不存在或已下架');
    }
    // 按 type 懒加载扩展表
    await this.postExtService.loadExtension(post);
    // 浏览数 +1（异步更新，不抛错）
    this.postRepo.increment({ id }, 'viewCount', 1).catch(() => undefined);
    return post;
  }

  /** 我的帖子 */
  async findMyPosts(userId: number, query: QueryPostDto): Promise<PaginatedResult<CirclePost>> {
    const { page, pageSize, keyword, type, status } = query;
    const qb = this.postRepo.createQueryBuilder('p');
    qb.where('p.user_id = :userId', { userId });
    // 用户视角：不显示已被自己删除的（status=4）
    qb.andWhere('p.status != :selfDel', { selfDel: 4 });
    if (type) qb.andWhere('p.type = :type', { type });
    if (status !== undefined && status !== 4) qb.andWhere('p.status = :status', { status });
    if (keyword) {
      qb.andWhere('(p.title LIKE :kw OR p.content LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }
    qb.orderBy('p.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  /** 发帖：事务创建主表 + 扩展表 */
  async createPost(userId: number, dto: CreatePostDto): Promise<CirclePost> {
    return this.dataSource.transaction(async (manager) => {
      const post = manager.create(CirclePost, {
        userId,
        type: dto.type,
        title: dto.title ?? null,
        content: dto.content,
        images: dto.images ?? null,
        venueId: dto.venueId ?? null,
        province: dto.province ?? null,
        city: dto.city ?? null,
        locationName: dto.locationName ?? null,
        status: 0, // 默认待审核
        isTop: 0,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        favorCount: 0,
      });
      const saved = await manager.save(post);
      // 按 type 创建扩展表
      await this.postExtService.createExtensionInTransaction(
        manager,
        saved.id,
        dto,
      );
      return saved;
    });
  }

  /** 编辑自己的帖子（仅 status=0 待审或 1 正常时） */
  async updatePost(userId: number, id: number, dto: UpdatePostDto): Promise<CirclePost> {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post || post.deletedAt) throw new NotFoundException('帖子不存在');
    if (post.userId !== userId) throw new ForbiddenException('无权编辑他人帖子');
    if (post.status !== 0 && post.status !== 1) {
      throw new BadRequestException('当前状态不可编辑');
    }
    Object.assign(post, {
      title: dto.title ?? post.title,
      content: dto.content ?? post.content,
      images: dto.images ?? post.images,
      venueId: dto.venueId ?? post.venueId,
      province: dto.province ?? post.province,
      city: dto.city ?? post.city,
      locationName: dto.locationName ?? post.locationName,
    });
    return this.postRepo.save(post);
  }

  /** 删除自己的帖子（status=4 用户删，软删 + 级联扩展表） */
  async deletePost(userId: number, id: number): Promise<void> {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post || post.deletedAt) throw new NotFoundException('帖子不存在');
    if (post.userId !== userId) throw new ForbiddenException('无权删除他人帖子');
    return this.dataSource.transaction(async (manager) => {
      await manager.update(CirclePost, { id }, { status: 4 });
      await manager.softDelete(CirclePost, { id });
      // 扩展表跟随主表 status=4（实际通过软删 + OnDelete CASCADE 由 DB 处理；
      // 这里同时显式更新扩展表状态以兼容查询视图）
      await this.postExtService.markDeletedInTransaction(manager, id, post.type);
    });
  }

  /* ============================ C 端 - 评论 ============================ */

  /** 评论列表（楼中楼：先查一级，再按 parentId 分组） */
  async findComments(postId: number, page = 1, pageSize = 20) {
    const qb = this.commentRepo.createQueryBuilder('c');
    qb.where('c.post_id = :postId', { postId });
    qb.andWhere('c.status = 1');
    qb.andWhere('c.parent_id = 0');
    qb.orderBy('c.createdAt', 'ASC');
    qb.skip((page - 1) * pageSize).take(pageSize);
    const [roots, totalRoot] = await qb.getManyAndCount();
    if (roots.length === 0) {
      return paginate(roots, totalRoot, page, pageSize);
    }
    // 拉取所有楼中楼回复
    const rootIds = roots.map((r) => r.id);
    const replies = await this.commentRepo.find({
      where: { postId, parentId: In(rootIds), status: 1 },
      order: { createdAt: 'ASC' },
    });
    const replyMap = new Map<number, CircleComment[]>();
    for (const r of replies) {
      const arr = replyMap.get(r.parentId) || [];
      arr.push(r);
      replyMap.set(r.parentId, arr);
    }
    const list = roots.map((root) => ({
      ...root,
      replies: replyMap.get(root.id) || [],
    }));
    return paginate(list as any, totalRoot, page, pageSize);
  }

  /** 创建评论：parentId=0 一级，更新 post.commentCount++ */
  async createComment(userId: number, postId: number, dto: CreateCommentDto): Promise<CircleComment> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post || post.status !== 1 || post.deletedAt) {
      throw new NotFoundException('帖子不存在或已下架');
    }
    if (dto.parentId && dto.parentId !== 0) {
      const parent = await this.commentRepo.findOne({
        where: { id: dto.parentId, postId, status: 1 },
      });
      if (!parent) throw new BadRequestException('父评论不存在');
    }
    return this.dataSource.transaction(async (manager) => {
      const comment = manager.create(CircleComment, {
        postId,
        userId,
        parentId: dto.parentId ?? 0,
        replyUserId: dto.replyUserId ?? null,
        content: dto.content,
        status: 1,
      });
      const saved = await manager.save(comment);
      await manager.increment(CirclePost, { id: postId }, 'commentCount', 1);
      return saved;
    });
  }

  /** 删除自己的评论（status=0，post.commentCount--） */
  async deleteComment(userId: number, id: number): Promise<void> {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('评论不存在');
    if (comment.userId !== userId) throw new ForbiddenException('无权删除他人评论');
    if (comment.status === 0) return;
    return this.dataSource.transaction(async (manager) => {
      await manager.update(CircleComment, { id }, { status: 0 });
      await manager.decrement(CirclePost, { id: comment.postId }, 'commentCount', 1);
    });
  }

  /* ============================ C 端 - 点赞 ============================ */

  /** 点赞 / 取消点赞（toggle） */
  async toggleLike(userId: number, dto: LikeDto): Promise<{ liked: boolean }> {
    const { targetType, targetId } = dto;
    // 校验目标存在
    if (targetType === 1) {
      const post = await this.postRepo.findOne({ where: { id: targetId } });
      if (!post || post.status !== 1 || post.deletedAt) {
        throw new NotFoundException('帖子不存在');
      }
    } else if (targetType === 2) {
      const cmt = await this.commentRepo.findOne({ where: { id: targetId, status: 1 } });
      if (!cmt) throw new NotFoundException('评论不存在');
    }

    const exist = await this.likeRepo.findOne({
      where: { userId, targetType, targetId },
    });
    if (exist) {
      return this.dataSource.transaction(async (manager) => {
        await manager.delete(CircleLike, { id: exist.id });
        if (targetType === 1) {
          await manager.decrement(CirclePost, { id: targetId }, 'likeCount', 1);
        }
        // 评论无 likeCount 字段，仅记录点赞关系
        return { liked: false };
      });
    }
    await this.dataSource.transaction(async (manager) => {
      const like = manager.create(CircleLike, {
        userId,
        targetType,
        targetId,
      });
      await manager.save(like);
      if (targetType === 1) {
        await manager.increment(CirclePost, { id: targetId }, 'likeCount', 1);
      }
    });
    return { liked: true };
  }

  /* ============================ C 端 - 收藏 ============================ */

  /** 收藏 / 取消收藏（toggle） */
  async toggleFavorite(userId: number, postId: number): Promise<{ favorited: boolean }> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post || post.status !== 1 || post.deletedAt) {
      throw new NotFoundException('帖子不存在');
    }
    const exist = await this.favRepo.findOne({ where: { userId, postId } });
    if (exist) {
      await this.dataSource.transaction(async (manager) => {
        await manager.delete(CircleFavorite, { id: exist.id });
        await manager.decrement(CirclePost, { id: postId }, 'favorCount', 1);
      });
      return { favorited: false };
    }
    await this.dataSource.transaction(async (manager) => {
      const fav = manager.create(CircleFavorite, { userId, postId });
      await manager.save(fav);
      await manager.increment(CirclePost, { id: postId }, 'favorCount', 1);
    });
    return { favorited: true };
  }

  /** 我的收藏列表 */
  async findMyFavorites(userId: number, page = 1, pageSize = 20) {
    const qb = this.favRepo.createQueryBuilder('f');
    qb.where('f.user_id = :userId', { userId });
    qb.leftJoinAndSelect('f.post', 'p');
    qb.andWhere('p.status = 1');
    qb.andWhere('p.deleted_at IS NULL');
    qb.orderBy('f.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  /* ============================ C 端 - 举报 ============================ */

  async createReport(reporterId: number, dto: CreateReportDto): Promise<Report> {
    const report = this.reportRepo.create({
      reporterId,
      targetType: dto.targetType,
      targetId: dto.targetId,
      reasonType: dto.reasonType,
      reasonDetail: dto.reasonDetail ?? null,
      images: dto.images ?? null,
      status: 0,
    });
    return this.reportRepo.save(report);
  }

  /* ============================ 后台 - 帖子审核 ============================ */

  /** 后台帖子分页（status/type/userId 过滤、keyword） */
  async adminFindPosts(query: QueryPostDto): Promise<PaginatedResult<CirclePost>> {
    const { page, pageSize, keyword, type, status, userId } = query;
    const qb = this.postRepo.createQueryBuilder('p');
    if (type) qb.andWhere('p.type = :type', { type });
    if (status !== undefined) qb.andWhere('p.status = :status', { status });
    if (userId) qb.andWhere('p.user_id = :userId', { userId });
    if (keyword) {
      qb.andWhere('(p.title LIKE :kw OR p.content LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }
    qb.orderBy('p.isTop', 'DESC').addOrderBy('p.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  /** 审核：status 1正常/2驳回 + auditRemark */
  async auditPost(id: number, dto: AuditPostDto): Promise<void> {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post || post.deletedAt) throw new NotFoundException('帖子不存在');
    await this.postRepo.update(id, {
      status: dto.status,
      auditRemark: dto.auditRemark ?? null,
    });
  }

  /** 置顶 / 取消（isTop toggle） */
  async toggleTop(id: number): Promise<{ isTop: number }> {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post || post.deletedAt) throw new NotFoundException('帖子不存在');
    const next = post.isTop === 1 ? 0 : 1;
    await this.postRepo.update(id, { isTop: next });
    return { isTop: next };
  }

  /** 下架（status=3） */
  async offlinePost(id: number): Promise<void> {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post || post.deletedAt) throw new NotFoundException('帖子不存在');
    await this.postRepo.update(id, { status: 3 });
  }

  /** 后台删除（硬删或软删） */
  async adminDeletePost(id: number): Promise<void> {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('帖子不存在');
    await this.postRepo.softDelete(id);
  }

  /* ============================ 后台 - 评论 ============================ */

  async adminFindComments(query: QueryCommentDto) {
    const { page, pageSize, keyword, status, postId } = query;
    const qb = this.commentRepo.createQueryBuilder('c');
    if (status !== undefined) qb.andWhere('c.status = :status', { status });
    if (postId) qb.andWhere('c.post_id = :postId', { postId });
    if (keyword) qb.andWhere('c.content LIKE :kw', { kw: `%${keyword}%` });
    qb.orderBy('c.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  async adminDeleteComment(id: number): Promise<void> {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('评论不存在');
    if (comment.status === 0) return;
    return this.dataSource.transaction(async (manager) => {
      await manager.update(CircleComment, { id }, { status: 0 });
      await manager.decrement(CirclePost, { id: comment.postId }, 'commentCount', 1);
    });
  }

  /* ============================ 后台 - 举报 ============================ */

  async findReports(query: QueryReportDto): Promise<PaginatedResult<Report>> {
    const { page, pageSize, status, targetType } = query;
    const qb = this.reportRepo.createQueryBuilder('r');
    if (status !== undefined) qb.andWhere('r.status = :status', { status });
    if (targetType) qb.andWhere('r.target_type = :targetType', { targetType });
    qb.orderBy('r.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  /** 处理举报：status 1处罚 2驳回 + handleRemark，handlerId = currentAdminId */
  async handleReport(id: number, adminId: number, dto: HandleReportDto): Promise<void> {
    const report = await this.reportRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException('举报记录不存在');
    await this.reportRepo.update(id, {
      status: dto.status,
      handlerId: adminId,
      handleRemark: dto.handleRemark ?? null,
      handledAt: new Date(),
    });
  }
}
