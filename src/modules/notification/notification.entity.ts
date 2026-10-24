/**
 * 模块六：微信通知（4 张表）
 * OaFollower / MessageTemplate / UserSubscribe / NotificationLog
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
  UpdateDateColumn,
} from 'typeorm';
import { BaseTimestampEntity } from '../../common/entities/base.entity';
import { User } from '../user/user.entity';

/* ============================= 公众号粉丝 ============================= */
@Entity('oa_followers')
@Index('uk_oa_openid', ['openid'], { unique: true })
@Index('idx_oa_unionid', ['unionid'])
@Index('idx_oa_subscribe', ['subscribeStatus'])
export class OaFollower {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ length: 64 })
  openid: string;

  @Column({ length: 64, nullable: true })
  unionid: string;

  @Column({ length: 64, nullable: true })
  nickname: string;

  @Column({ length: 512, nullable: true, name: 'avatar_url' })
  avatarUrl: string;

  /** 性别：0未知 1男 2女 */
  @Column({ type: 'tinyint', default: 0 })
  gender: number;

  @Column({ length: 32, nullable: true })
  country: string;

  @Column({ length: 32, nullable: true })
  province: string;

  @Column({ length: 32, nullable: true })
  city: string;

  /** 关注状态：0已取关 1关注中 */
  @Column({ type: 'tinyint', default: 1, name: 'subscribe_status' })
  subscribeStatus: number;

  @Column({ type: 'datetime', nullable: true, name: 'subscribe_time' })
  subscribeTime: Date;

  @Column({ type: 'datetime', nullable: true, name: 'unsubscribe_time' })
  unsubscribeTime: Date;

  /** 关注渠道：ADD_SCENE_QR_CODE 等 */
  @Column({ length: 64, nullable: true, name: 'subscribe_scene' })
  subscribeScene: string;

  @Column({ length: 64, nullable: true, name: 'qr_scene' })
  qrScene: string;

  @Column({ type: 'datetime', nullable: true, name: 'last_message_at' })
  lastMessageAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/* ============================= 消息模板配置 ============================= */
@Entity('message_templates')
@Index('uk_tpl_code_channel', ['code', 'channel'], { unique: true })
export class MessageTemplate extends BaseTimestampEntity {
  /** 业务编码：event_reminder / appointment_status 等 */
  @Column({ length: 64 })
  code: string;

  /** 渠道：1小程序订阅消息 2公众号模板消息 3短信 */
  @Column({ type: 'tinyint', default: 1 })
  channel: number;

  /** 微信平台模板 ID */
  @Column({ length: 128, nullable: true, name: 'platform_template_id' })
  platformTemplateId: string;

  @Column({ length: 128 })
  name: string;

  @Column({ length: 128, nullable: true })
  title: string;

  @Column({ length: 500, nullable: true })
  example: string;

  /** 状态：0停用 1启用 */
  @Column({ type: 'tinyint', default: 1 })
  status: number;

  // ---- 关联 ----
  @OneToMany(() => UserSubscribe, (s) => s.template)
  userSubscribes: UserSubscribe[];

  @OneToMany(() => NotificationLog, (l) => l.template)
  logs: NotificationLog[];
}

/* ============================= 用户订阅授权 ============================= */
@Entity('user_subscribes')
@Index('uk_subscribe_user_tpl', ['userId', 'templateId'], { unique: true })
@Index('idx_subscribe_tpl', ['templateId'])
export class UserSubscribe extends BaseTimestampEntity {
  @Column({ type: 'bigint', unsigned: true, name: 'user_id' })
  userId: number;

  @Column({ type: 'bigint', unsigned: true, name: 'template_id' })
  templateId: number;

  /** 渠道：1小程序订阅消息 2公众号模板消息 */
  @Column({ type: 'tinyint', default: 1 })
  channel: number;

  /** 剩余可下发次数 */
  @Column({ type: 'int', default: 1 })
  quota: number;

  @Column({ type: 'datetime', nullable: true, name: 'last_accept_at' })
  lastAcceptAt: Date;

  // ---- 关联 ----
  @ManyToOne(() => User, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => MessageTemplate, (t) => t.userSubscribes, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'template_id' })
  template: MessageTemplate;
}

/* ============================= 通知下发流水 ============================= */
@Entity('notification_logs')
@Index('idx_notify_user', ['userId'])
@Index('idx_notify_biz', ['bizType', 'bizId'])
@Index('idx_notify_status_plan', ['status', 'plannedAt'])
export class NotificationLog {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'user_id' })
  userId: number;

  @Column({ length: 64, nullable: true })
  openid: string;

  /** 渠道：1小程序订阅消息 2公众号模板消息 3短信 */
  @Column({ type: 'tinyint' })
  channel: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'template_id' })
  templateId: number;

  /** 模板业务编码（冗余便于排查） */
  @Column({ length: 64, name: 'template_code' })
  templateCode: string;

  @Column({ length: 128, nullable: true })
  title: string;

  @Column({ length: 500, nullable: true })
  content: string;

  /** 模板参数 */
  @Column({ type: 'json', nullable: true })
  data: Record<string, any> | null;

  /** 业务类型：association/event/activity/appointment/card */
  @Column({ length: 32, nullable: true, name: 'biz_type' })
  bizType: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'biz_id' })
  bizId: number;

  /** 发送状态：0待发送 1成功 2失败 */
  @Column({ type: 'tinyint', default: 0 })
  status: number;

  @Column({ length: 500, nullable: true, name: 'error_msg' })
  errorMsg: string;

  @Column({ length: 64, nullable: true, name: 'wx_msgid' })
  wxMsgid: string;

  @Column({ type: 'datetime', nullable: true, name: 'planned_at' })
  plannedAt: Date;

  @Column({ type: 'datetime', nullable: true, name: 'sent_at' })
  sentAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  // ---- 关联 ----
  @ManyToOne(() => User, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @ManyToOne(() => MessageTemplate, (t) => t.logs, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'template_id' })
  template: MessageTemplate | null;
}

/* ============================= 通知公告 ============================= */
@Entity('announcements')
@Index('idx_announcement_status_date', ['status', 'publishedAt'])
@Index('idx_announcement_category', ['category'])
export class Announcement extends BaseTimestampEntity {
  @Column({ length: 200 })
  title: string;

  @Column({ length: 40 })
  category: string;

  @Column({ length: 150, nullable: true, name: 'publisher_unit' })
  publisherUnit: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'datetime', nullable: true, name: 'activity_at' })
  activityAt: Date | null;

  @Column({ length: 200, nullable: true })
  location: string | null;

  @Column({ length: 500, nullable: true })
  participants: string | null;

  @Column({ type: 'json', nullable: true })
  attachments: Array<{ name: string; url: string; size?: number }> | null;

  /** all_members / association_admins (legacy) / association_presidents / selected_members */
  @Column({ length: 32, name: 'audience_type' })
  audienceType: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'audience_association_id' })
  audienceAssociationId: number | null;

  @Column({ type: 'json', nullable: true, name: 'audience_user_ids' })
  audienceUserIds: number[] | null;

  @Column({ type: 'tinyint', default: 0, name: 'is_pinned' })
  isPinned: number;

  @Column({ type: 'tinyint', default: 0, name: 'is_important' })
  isImportant: number;

  @Column({ type: 'tinyint', default: 0, name: 'requires_attendance' })
  requiresAttendance: number;

  /** 0 draft / 1 published / 2 withdrawn */
  @Column({ type: 'tinyint', default: 0 })
  status: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'publisher_admin_id' })
  publisherAdminId: number | null;

  @Column({ type: 'datetime', nullable: true, name: 'published_at' })
  publishedAt: Date | null;

  @Column({ type: 'datetime', nullable: true, name: 'withdrawn_at' })
  withdrawnAt: Date | null;

  @Column({ type: 'datetime', nullable: true, name: 'deleted_at' })
  deletedAt: Date | null;
}

@Entity('announcement_recipients')
@Index('uk_announcement_recipient', ['announcementId', 'userId'], { unique: true })
@Index('idx_announcement_recipient_user', ['userId', 'announcementId'])
export class AnnouncementRecipient {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'announcement_id' })
  announcementId: number;

  @Column({ type: 'bigint', unsigned: true, name: 'user_id' })
  userId: number;

  @Column({ type: 'tinyint', default: 0, name: 'is_read' })
  isRead: number;

  @Column({ type: 'datetime', nullable: true, name: 'read_at' })
  readAt: Date | null;

  /** null not answered / 1 attending / 2 not attending */
  @Column({ type: 'tinyint', nullable: true, name: 'attendance_status' })
  attendanceStatus: number | null;

  @Column({ type: 'datetime', nullable: true, name: 'responded_at' })
  respondedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
