/**
 * 模块五：游泳圈子（9 张表）
 * CirclePost（主表） + CardShare / BuddyInvitation / Activity（1:1 扩展）
 * + ActivityParticipant / CircleComment / CircleLike / CircleFavorite / Report
 *
 * 设计：Feed 流只查 circle_posts，详情按 type 关联扩展表
 */

import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { BaseEntity, BaseCreatedEntity, BaseTimestampEntity } from '../../common/entities/base.entity';
import { User } from '../user/user.entity';
import { AdminUser } from '../user/user.entity';
import { Venue } from '../venue/venue.entity';
import { Association } from '../association/association.entity';

/* ============================= 圈子帖子主表 ============================= */
@Entity('circle_posts')
@Index('idx_posts_user', ['userId'])
@Index('idx_posts_type_status', ['type', 'status'])
@Index('idx_posts_city', ['province', 'city'])
@Index('idx_posts_created', ['createdAt'])
export class CirclePost extends BaseEntity {
  @Column({ type: 'bigint', unsigned: true, name: 'user_id' })
  userId: number;

  /** 类型：1代刷卡 2约搭子 3组织活动 4普通动态 */
  @Column({ type: 'tinyint' })
  type: number;

  @Column({ length: 100, nullable: true })
  title: string;

  @Column({ type: 'text' })
  content: string;

  /** 图片 URL 数组 */
  @Column({ type: 'json', nullable: true })
  images: string[];

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'venue_id' })
  venueId: number;

  @Column({ length: 32, nullable: true })
  province: string;

  @Column({ length: 32, nullable: true })
  city: string;

  @Column({ length: 128, nullable: true, name: 'location_name' })
  locationName: string;

  /** 状态：0待审核 1正常 2审核驳回 3已下架 4用户删除 */
  @Column({ type: 'tinyint', default: 0 })
  status: number;

  @Column({ length: 255, nullable: true, name: 'audit_remark' })
  auditRemark: string;

  @Column({ type: 'tinyint', default: 0, name: 'is_top' })
  isTop: number;

  @Column({ type: 'int', default: 0, name: 'view_count' })
  viewCount: number;

  @Column({ type: 'int', default: 0, name: 'like_count' })
  likeCount: number;

  @Column({ type: 'int', default: 0, name: 'comment_count' })
  commentCount: number;

  @Column({ type: 'int', default: 0, name: 'favor_count' })
  favorCount: number;

  // ---- 关联 ----
  @ManyToOne(() => User, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Venue, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'venue_id' })
  venue: Venue | null;

  // 1:1 扩展表
  @OneToOne(() => CardShare, (c) => c.post, { nullable: true })
  cardShare: any;

  @OneToOne(() => BuddyInvitation, (b) => b.post, { nullable: true })
  buddyInvitation: any;

  @OneToOne(() => Activity, (a) => a.post, { nullable: true })
  activity: any;

  @OneToMany(() => CircleComment, (c) => c.post)
  comments: any;
}

/* ============================= 代刷卡（type=1） ============================= */
@Entity('card_shares')
@Index('uk_card_post', ['postId'], { unique: true })
@Index('idx_card_venue', ['venueId'])
@Index('idx_card_status', ['status'])
export class CardShare extends BaseTimestampEntity {
  @Column({ type: 'bigint', unsigned: true, name: 'post_id' })
  postId: number;

  @Column({ type: 'bigint', unsigned: true, name: 'venue_id' })
  venueId: number;

  /** 卡类型：1次卡 2期限卡 */
  @Column({ type: 'tinyint', default: 1, name: 'card_type' })
  cardType: number;

  @Column({ type: 'int', nullable: true, name: 'total_times' })
  totalTimes: number;

  @Column({ type: 'int', nullable: true, name: 'remain_times' })
  remainTimes: number;

  @Column({ type: 'date', nullable: true, name: 'expire_date' })
  expireDate: string;

  /** 报价方式：1按次报价 2一口价 */
  @Column({ type: 'tinyint', default: 1, name: 'price_type' })
  priceType: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  price: number;

  @Column({ length: 255, nullable: true, name: 'trade_method' })
  tradeMethod: string;

  @Column({ length: 64, nullable: true, name: 'contact_wechat' })
  contactWechat: string;

  /** 状态：0进行中 1已成交 2已关闭 */
  @Column({ type: 'tinyint', default: 0 })
  status: number;

  // ---- 关联 ----
  @OneToOne(() => CirclePost, (p) => p.cardShare, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'post_id' })
  post: CirclePost;

  @ManyToOne(() => Venue, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'venue_id' })
  venue: Venue;
}

/* ============================= 约搭子（type=2） ============================= */
@Entity('buddy_invitations')
@Index('uk_buddy_post', ['postId'], { unique: true })
@Index('idx_buddy_venue_time', ['venueId', 'scheduleTime'])
@Index('idx_buddy_status', ['status'])
export class BuddyInvitation extends BaseTimestampEntity {
  @Column({ type: 'bigint', unsigned: true, name: 'post_id' })
  postId: number;

  @Column({ type: 'bigint', unsigned: true, name: 'venue_id' })
  venueId: number;

  /** 约定开游时间 */
  @Column({ type: 'datetime', name: 'schedule_time' })
  scheduleTime: Date;

  @Column({ type: 'int', nullable: true, name: 'duration_min' })
  durationMin: number;

  /** 性别要求：0不限 1男 2女 */
  @Column({ type: 'tinyint', default: 0, name: 'gender_limit' })
  genderLimit: number;

  @Column({ length: 128, nullable: true, name: 'level_requirement' })
  levelRequirement: string;

  @Column({ type: 'int', default: 1, name: 'people_needed' })
  peopleNeeded: number;

  @Column({ type: 'int', default: 1, name: 'people_joined' })
  peopleJoined: number;

  /** 状态：0招募中 1已满 2已结束 3已关闭 */
  @Column({ type: 'tinyint', default: 0 })
  status: number;

  // ---- 关联 ----
  @OneToOne(() => CirclePost, (p) => p.buddyInvitation, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'post_id' })
  post: CirclePost;

  @ManyToOne(() => Venue, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'venue_id' })
  venue: Venue;
}

/* ============================= 活动（type=3） ============================= */
@Entity('activities')
@Index('uk_act_post', ['postId'], { unique: true })
@Index('idx_act_assoc', ['associationId'])
@Index('idx_act_venue_time', ['venueId', 'startTime'])
@Index('idx_act_status', ['status'])
export class Activity extends BaseTimestampEntity {
  @Column({ type: 'bigint', unsigned: true, name: 'post_id' })
  postId: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'association_id' })
  associationId: number;

  @Column({ length: 100 })
  title: string;

  @Column({ length: 512, nullable: true, name: 'cover_url' })
  coverUrl: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'venue_id' })
  venueId: number;

  @Column({ length: 255, nullable: true })
  address: string;

  @Column({ type: 'datetime', name: 'start_time' })
  startTime: Date;

  @Column({ type: 'datetime', nullable: true, name: 'end_time' })
  endTime: Date;

  @Column({ type: 'datetime', nullable: true, name: 'signup_deadline' })
  signupDeadline: Date;

  @Column({ type: 'int', default: 0, name: 'max_participants' })
  maxParticipants: number;

  @Column({ type: 'int', default: 0, name: 'joined_count' })
  joinedCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  fee: number;

  /** 报名是否需要审核 */
  @Column({ type: 'tinyint', default: 0, name: 'need_audit' })
  needAudit: number;

  @Column({ type: 'text', nullable: true })
  intro: string;

  /** 状态：0筹备 1报名中 2已满 3已结束 4已取消 */
  @Column({ type: 'tinyint', default: 0 })
  status: number;

  // ---- 关联 ----
  @OneToOne(() => CirclePost, (p) => p.activity, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'post_id' })
  post: CirclePost;

  @ManyToOne(() => Association, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'association_id' })
  association: Association | null;

  @ManyToOne(() => Venue, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'venue_id' })
  venue: Venue | null;

  @OneToMany(() => ActivityParticipant, (p) => p.activity)
  participants: any;
}

/* ============================= 活动报名人员 ============================= */
@Entity('activity_participants')
@Index('uk_ap_act_user', ['activityId', 'userId'], { unique: true })
@Index('idx_ap_user', ['userId'])
@Index('idx_ap_status', ['status'])
export class ActivityParticipant extends BaseTimestampEntity {
  @Column({ type: 'bigint', unsigned: true, name: 'activity_id' })
  activityId: number;

  @Column({ type: 'bigint', unsigned: true, name: 'user_id' })
  userId: number;

  /** 状态：0待审核 1已通过 2已拒绝 3已取消 */
  @Column({ type: 'tinyint', default: 0 })
  status: number;

  @Column({ length: 255, nullable: true, name: 'signup_remark' })
  signupRemark: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'reviewer_id' })
  reviewerId: number;

  @Column({ type: 'datetime', nullable: true, name: 'reviewed_at' })
  reviewedAt: Date;

  // ---- 关联 ----
  @ManyToOne(() => Activity, (a) => a.participants, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @ManyToOne(() => User, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User | null;
}

/* ============================= 帖子评论（楼中楼） ============================= */
@Entity('circle_comments')
@Index('idx_cmt_post', ['postId'])
@Index('idx_cmt_user', ['userId'])
@Index('idx_cmt_parent', ['parentId'])
export class CircleComment {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'post_id' })
  postId: number;

  @Column({ type: 'bigint', unsigned: true, name: 'user_id' })
  userId: number;

  /** 父评论 ID，0为一级评论 */
  @Column({ type: 'bigint', unsigned: true, default: 0, name: 'parent_id' })
  parentId: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'reply_user_id' })
  replyUserId: number;

  @Column({ length: 1000 })
  content: string;

  /** 状态：0删除 1正常 */
  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @CreateDateColumn()
  createdAt: Date;

  // ---- 关联 ----
  @ManyToOne(() => CirclePost, (p) => p.comments, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'post_id' })
  post: CirclePost;

  @ManyToOne(() => User, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'reply_user_id' })
  replyUser: User | null;
}

/* ============================= 点赞（帖子/评论 多态） ============================= */
@Entity('circle_likes')
@Index('uk_likes_target_user', ['targetType', 'targetId', 'userId'], { unique: true })
@Index('idx_likes_user', ['userId'])
export class CircleLike {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'user_id' })
  userId: number;

  /** 目标类型：1帖子 2评论 */
  @Column({ type: 'tinyint', name: 'target_type' })
  targetType: number;

  @Column({ type: 'bigint', unsigned: true, name: 'target_id' })
  targetId: number;

  @CreateDateColumn()
  createdAt: Date;

  // ---- 关联 ----
  @ManyToOne(() => User, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

/* ============================= 帖子收藏 ============================= */
@Entity('circle_favorites')
@Index('uk_fav_user_post', ['userId', 'postId'], { unique: true })
@Index('idx_fav_post', ['postId'])
export class CircleFavorite {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'user_id' })
  userId: number;

  @Column({ type: 'bigint', unsigned: true, name: 'post_id' })
  postId: number;

  @CreateDateColumn()
  createdAt: Date;

  // ---- 关联 ----
  @ManyToOne(() => User, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => CirclePost, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'post_id' })
  post: CirclePost;
}

/* ============================= 举报（多态目标） ============================= */
@Entity('reports')
@Index('idx_reports_target', ['targetType', 'targetId'])
@Index('idx_reports_status', ['status'])
@Index('idx_reports_reporter', ['reporterId'])
export class Report {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'reporter_id' })
  reporterId: number;

  /** 目标类型：1帖子 2评论 3活动 4教练 5场馆 6评价 */
  @Column({ type: 'tinyint', name: 'target_type' })
  targetType: number;

  @Column({ type: 'bigint', unsigned: true, name: 'target_id' })
  targetId: number;

  /** 举报原因类型：1欺诈 2违规广告 3色情低俗 4人身攻击 5虚假信息 9其他 */
  @Column({ type: 'tinyint', name: 'reason_type' })
  reasonType: number;

  @Column({ length: 500, nullable: true, name: 'reason_detail' })
  reasonDetail: string;

  @Column({ type: 'json', nullable: true })
  images: string[];

  /** 处理状态：0待处理 1已处理-处罚 2已处理-驳回 */
  @Column({ type: 'tinyint', default: 0 })
  status: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'handler_id' })
  handlerId: number;

  @Column({ length: 255, nullable: true, name: 'handle_remark' })
  handleRemark: string;

  @Column({ type: 'datetime', nullable: true, name: 'handled_at' })
  handledAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  // ---- 关联 ----
  @ManyToOne(() => User, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @ManyToOne(() => AdminUser, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'handler_id' })
  handler: AdminUser | null;
}
