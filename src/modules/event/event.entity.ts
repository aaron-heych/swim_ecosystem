/**
 * 模块四：赛事通报（6 张表）
 * EventSource / CrawlLog / Event / EventGroup / EventRegistration / EventRegistrationItem
 */

import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { BaseEntity, BaseTimestampEntity, BaseCreatedEntity } from '../../common/entities/base.entity';
import { User } from '../user/user.entity';
import { AdminUser } from '../user/user.entity';
import { Association } from '../association/association.entity';

/* ============================= 赛事抓取数据源 ============================= */
@Entity('event_sources')
@Index('idx_sources_enabled', ['enabled'])
export class EventSource extends BaseTimestampEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ length: 255, nullable: true })
  website: string;

  /** 赛事公告列表页 URL */
  @Column({ length: 500, nullable: true, name: 'list_url' })
  listUrl: string;

  /** 解析方式：manual / cheerio / puppeteer / api */
  @Column({ length: 32, default: 'cheerio', name: 'parser_type' })
  parserType: string;

  /** 解析配置：选择器、分页、字段映射等 */
  @Column({ type: 'json', nullable: true, name: 'parser_config' })
  parserConfig: Record<string, any> | null;

  /** 抓取频率（cron 表达式） */
  @Column({ length: 64, default: '0 6 * * *', name: 'cron_expr' })
  cronExpr: string;

  /** 是否启用：0停用 1启用 */
  @Column({ type: 'tinyint', default: 1 })
  enabled: number;

  @Column({ type: 'datetime', nullable: true, name: 'last_crawled_at' })
  lastCrawledAt: Date;

  /** 最近抓取结果：0失败 1成功 */
  @Column({ type: 'tinyint', nullable: true, name: 'last_status' })
  lastStatus: number;

  @Column({ length: 255, nullable: true })
  remark: string;

  // ---- 关联 ----
  @OneToMany(() => CrawlLog, (l) => l.source)
  crawlLogs: CrawlLog[];

  @OneToMany(() => Event, (e) => e.source)
  events: Event[];
}

/* ============================= 抓取任务日志 ============================= */
@Entity('crawl_logs')
@Index('idx_crawl_source_time', ['sourceId', 'startedAt'])
@Index('idx_crawl_status', ['status'])
export class CrawlLog {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'source_id' })
  sourceId: number;

  /** 触发方式：1定时任务 2手动触发 */
  @Column({ type: 'tinyint', default: 1, name: 'trigger_type' })
  triggerType: number;

  @Column({ type: 'datetime', name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'datetime', nullable: true, name: 'finished_at' })
  finishedAt: Date;

  /** 执行状态：0进行中 1成功 2失败 */
  @Column({ type: 'tinyint', default: 0 })
  status: number;

  @Column({ type: 'int', default: 0, name: 'total_count' })
  totalCount: number;

  @Column({ type: 'int', default: 0, name: 'new_count' })
  newCount: number;

  @Column({ type: 'text', nullable: true, name: 'error_msg' })
  errorMsg: string;

  @CreateDateColumn()
  createdAt: Date;

  // ---- 关联 ----
  @ManyToOne(() => EventSource, (s) => s.crawlLogs, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'source_id' })
  source: EventSource;
}

/* ============================= 赛事 ============================= */
@Entity('events')
@Index('uk_events_source_ext', ['sourceId', 'externalId'], { unique: true })
@Index('idx_events_type_status', ['eventType', 'status'])
@Index('idx_events_city', ['province', 'city'])
@Index('idx_events_date', ['startDate'])
@Index('idx_events_audit', ['auditStatus'])
@Index('idx_events_hot', ['isHot'])
export class Event extends BaseEntity {
  @Column({ length: 200 })
  title: string;

  @Column({ length: 512, nullable: true, name: 'cover_url' })
  coverUrl: string;

  @Column({ length: 200, nullable: true })
  organizer: string;

  /** 信息来源（手工发布为空） */
  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'source_id' })
  sourceId: number;

  @Column({ length: 500, nullable: true, name: 'source_url' })
  sourceUrl: string;

  /** 来源站赛事唯一标识（抓取去重用） */
  @Column({ length: 64, nullable: true, name: 'external_id' })
  externalId: string;

  /** 项目类型 */
  @Column({ length: 32, default: 'swimming', name: 'event_type' })
  eventType: string;

  /** 赛事级别：1国际 2全国 3省级 4市级 5民间 */
  @Column({ type: 'tinyint', default: 5 })
  level: number;

  @Column({ length: 32, nullable: true })
  province: string;

  @Column({ length: 32, nullable: true })
  city: string;

  @Column({ length: 32, nullable: true })
  district: string;

  @Column({ length: 200, nullable: true, name: 'venue_name' })
  venueName: string;

  @Column({ length: 255, nullable: true })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: 'date', nullable: true, name: 'start_date' })
  startDate: string;

  @Column({ type: 'date', nullable: true, name: 'end_date' })
  endDate: string;

  @Column({ type: 'datetime', nullable: true, name: 'register_start' })
  registerStart: Date;

  @Column({ type: 'datetime', nullable: true, name: 'register_end' })
  registerEnd: Date;

  @Column({ length: 500, nullable: true, name: 'register_url' })
  registerUrl: string;

  @Column({ length: 20, nullable: true, name: 'contact_phone' })
  contactPhone: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'fee_min' })
  feeMin: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'fee_max' })
  feeMax: number;

  /** 赛事规程/详情（富文本 HTML） */
  @Column({ type: 'longtext', nullable: true })
  content: string;

  /** 标签数组 */
  @Column({ type: 'json', nullable: true })
  tags: string[];

  /** 审核状态：0待审核 1通过 2驳回 */
  @Column({ type: 'tinyint', default: 0, name: 'audit_status' })
  auditStatus: number;

  /** 赛事状态：0草稿 1报名中 2报名截止 3已结束 4已取消 */
  @Column({ type: 'tinyint', default: 0 })
  status: number;

  /** 是否热门 */
  @Column({ type: 'tinyint', default: 0, name: 'is_hot' })
  isHot: number;

  @Column({ type: 'int', default: 0, name: 'register_count' })
  registerCount: number;

  @Column({ type: 'int', default: 0, name: 'view_count' })
  viewCount: number;

  @Column({ type: 'datetime', nullable: true, name: 'publish_at' })
  publishAt: Date;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'creator_id' })
  creatorId: number;

  // ---- 关联 ----
  @ManyToOne(() => EventSource, (s) => s.events, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'source_id' })
  source: EventSource | null;

  @ManyToOne(() => AdminUser, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'creator_id' })
  creator: AdminUser | null;

  @OneToMany(() => EventGroup, (g) => g.event)
  groups: EventGroup[];

  @OneToMany(() => EventRegistration, (r) => r.event)
  registrations: EventRegistration[];
}

/* ============================= 赛事组别 / 比赛小项 ============================= */
@Entity('event_groups')
@Index('idx_groups_event', ['eventId'])
export class EventGroup extends BaseTimestampEntity {
  @Column({ type: 'bigint', unsigned: true, name: 'event_id' })
  eventId: number;

  @Column({ length: 100 })
  name: string;

  /** 性别要求：0不限 1男 2女 */
  @Column({ type: 'tinyint', default: 0, name: 'gender_limit' })
  genderLimit: number;

  @Column({ type: 'int', nullable: true, name: 'age_min' })
  ageMin: number;

  @Column({ type: 'int', nullable: true, name: 'age_max' })
  ageMax: number;

  @Column({ length: 32, nullable: true })
  stroke: string;

  /** 距离（米） */
  @Column({ type: 'int', nullable: true, name: 'distance_m' })
  distanceM: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  fee: number;

  /** 名额，0为不限 */
  @Column({ type: 'int', default: 0 })
  quota: number;

  @Column({ type: 'int', default: 0, name: 'registered_count' })
  registeredCount: number;

  @Column({ type: 'int', default: 0 })
  sort: number;

  // ---- 关联 ----
  @ManyToOne(() => Event, (e) => e.groups, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @OneToMany(() => EventRegistrationItem, (i) => i.group)
  items: EventRegistrationItem[];
}

/* ============================= 赛事报名单 ============================= */
@Entity('event_registrations')
@Index('uk_ereg_order_no', ['orderNo'], { unique: true })
@Index('idx_ereg_event', ['eventId'])
@Index('idx_ereg_user', ['userId'])
@Index('idx_ereg_assoc', ['associationId'])
@Index('idx_ereg_status', ['status'])
export class EventRegistration extends BaseTimestampEntity {
  @Column({ length: 32, name: 'order_no' })
  orderNo: string;

  @Column({ type: 'bigint', unsigned: true, name: 'event_id' })
  eventId: number;

  @Column({ type: 'bigint', unsigned: true, name: 'user_id' })
  userId: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'association_id' })
  associationId: number;

  /** 团队/俱乐部名称 */
  @Column({ length: 100, nullable: true, name: 'team_name' })
  teamName: string;

  @Column({ length: 32, name: 'contact_name' })
  contactName: string;

  @Column({ length: 20, name: 'contact_phone' })
  contactPhone: string;

  @Column({ length: 255, nullable: true, name: 'id_card_enc' })
  idCardEnc: string;

  @Column({ length: 32, nullable: true, name: 'emergency_name' })
  emergencyName: string;

  @Column({ length: 20, nullable: true, name: 'emergency_phone' })
  emergencyPhone: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0, name: 'total_fee' })
  totalFee: number;

  /** 支付状态：0待支付 1已支付 2已退款 */
  @Column({ type: 'tinyint', default: 0, name: 'pay_status' })
  payStatus: number;

  @Column({ type: 'datetime', nullable: true, name: 'pay_time' })
  payTime: Date;

  @Column({ length: 64, nullable: true, name: 'transaction_id' })
  transactionId: string;

  /** 状态：0待支付 1已报名 2已取消 3已退费 */
  @Column({ type: 'tinyint', default: 0 })
  status: number;

  @Column({ length: 255, nullable: true })
  remark: string;

  // ---- 关联 ----
  @ManyToOne(() => Event, (e) => e.registrations, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ManyToOne(() => User, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Association, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'association_id' })
  association: Association | null;

  @OneToMany(() => EventRegistrationItem, (i) => i.registration)
  items: EventRegistrationItem[];
}

/* ============================= 报名明细 ============================= */
@Entity('event_registration_items')
@Index('idx_eritem_reg', ['registrationId'])
@Index('idx_eritem_group', ['groupId'])
export class EventRegistrationItem extends BaseTimestampEntity {
  @Column({ type: 'bigint', unsigned: true, name: 'registration_id' })
  registrationId: number;

  @Column({ type: 'bigint', unsigned: true, name: 'group_id' })
  groupId: number;

  /** 参赛人姓名（可代他人报名） */
  @Column({ length: 32, name: 'participant_name' })
  participantName: string;

  @Column({ length: 255, nullable: true, name: 'id_card_enc' })
  idCardEnc: string;

  /** 性别：0未知 1男 2女 */
  @Column({ type: 'tinyint', default: 0 })
  gender: number;

  @Column({ type: 'date', nullable: true })
  birthday: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  fee: number;

  /** 状态：0取消 1有效 */
  @Column({ type: 'tinyint', default: 1 })
  status: number;

  // ---- 关联 ----
  @ManyToOne(() => EventRegistration, (r) => r.items, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'registration_id' })
  registration: EventRegistration;

  @ManyToOne(() => EventGroup, (g) => g.items, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'group_id' })
  group: EventGroup;
}
