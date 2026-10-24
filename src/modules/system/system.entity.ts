/**
 * 模块七：系统/运营支撑（5 张表）
 * Banner / Feedback / SmsCode / SysConfig / OperationLog
 */

import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BaseTimestampEntity } from '../../common/entities/base.entity';
import { User } from '../user/user.entity';
import { AdminUser } from '../user/user.entity';

/* ============================= 运营 Banner ============================= */
@Entity('banners')
@Index('idx_banners_pos_status', ['position', 'status'])
export class Banner extends BaseTimestampEntity {
  @Column({ length: 100 })
  title: string;

  @Column({ length: 512, name: 'image_url' })
  imageUrl: string;

  /** 展示位：home/event/venue/circle */
  @Column({ length: 32, default: 'home' })
  position: string;

  /** 跳转类型：0不跳转 1站内页面 2赛事详情 3场馆详情 4H5外链 */
  @Column({ type: 'tinyint', default: 0, name: 'link_type' })
  linkType: number;

  @Column({ length: 500, nullable: true, name: 'link_value' })
  linkValue: string;

  @Column({ type: 'int', default: 0 })
  sort: number;

  @Column({ type: 'datetime', nullable: true, name: 'start_at' })
  startAt: Date;

  @Column({ type: 'datetime', nullable: true, name: 'end_at' })
  endAt: Date;

  /** 状态：0下线 1上线 */
  @Column({ type: 'tinyint', default: 1 })
  status: number;
}

/* ============================= 用户意见反馈 ============================= */
@Entity('feedbacks')
@Index('idx_feedback_status', ['status'])
@Index('idx_feedback_user', ['userId'])
export class Feedback {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'user_id' })
  userId: number;

  /** 类型：1功能建议 2问题反馈 3投诉 4其他 */
  @Column({ type: 'tinyint', default: 1 })
  type: number;

  @Column({ length: 1000 })
  content: string;

  @Column({ type: 'json', nullable: true })
  images: string[];

  @Column({ length: 128, nullable: true })
  contact: string;

  /** 状态：0待处理 1已回复 2已关闭 */
  @Column({ type: 'tinyint', default: 0 })
  status: number;

  @Column({ length: 1000, nullable: true })
  reply: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'reply_by' })
  replyBy: number;

  @Column({ type: 'datetime', nullable: true, name: 'replied_at' })
  repliedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  // ---- 关联 ----
  @ManyToOne(() => User, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @ManyToOne(() => AdminUser, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'reply_by' })
  replier: AdminUser | null;
}

/* ============================= 短信验证码 ============================= */
@Entity('sms_codes')
@Index('idx_sms_phone_scene', ['phone', 'scene'])
@Index('idx_sms_expires', ['expiresAt'])
export class SmsCode {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ length: 20 })
  phone: string;

  /** 场景：login/bind/change_phone */
  @Column({ length: 32, default: 'login' })
  scene: string;

  /** 验证码哈希（不明文存） */
  @Column({ length: 128, name: 'code_hash' })
  codeHash: string;

  @Column({ length: 45, nullable: true })
  ip: string;

  /** 是否已使用 */
  @Column({ type: 'tinyint', default: 0 })
  used: number;

  @Column({ type: 'datetime', name: 'expires_at' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

/* ============================= 系统参数配置 ============================= */
@Entity('sys_configs')
@Index('uk_config_key', ['configKey'], { unique: true })
export class SysConfig {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ length: 64, default: 'system', name: 'config_group' })
  configGroup: string;

  @Column({ length: 128, name: 'config_key' })
  configKey: string;

  @Column({ type: 'text', nullable: true, name: 'config_value' })
  configValue: string;

  /** 值类型：string/number/boolean/json */
  @Column({ length: 16, default: 'string', name: 'value_type' })
  valueType: string;

  @Column({ length: 255, nullable: true })
  remark: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

/* ============================= 管理员操作日志 ============================= */
@Entity('operation_logs')
@Index('idx_oplog_admin_time', ['adminId', 'createdAt'])
@Index('idx_oplog_module', ['module'])
@Index('idx_oplog_created', ['createdAt'])
export class OperationLog {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'admin_id' })
  adminId: number;

  @Column({ length: 64, nullable: true })
  username: string;

  @Column({ length: 64, nullable: true, name: 'operator_real_name' })
  operatorRealName: string;

  @Column({ length: 64 })
  module: string;

  /** 操作：create/update/delete/audit/login */
  @Column({ length: 64 })
  action: string;

  @Column({ length: 32, nullable: true, name: 'target_type' })
  targetType: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'target_id' })
  targetId: number;

  @Column({ length: 128, nullable: true, name: 'target_name' })
  targetName: string;

  @Column({ length: 10, nullable: true, name: 'request_method' })
  requestMethod: string;

  @Column({ length: 500, nullable: true, name: 'request_url' })
  requestUrl: string;

  @Column({ type: 'longtext', nullable: true })
  params: string;

  @Column({ length: 45, nullable: true })
  ip: string;

  @Column({ length: 255, nullable: true, name: 'user_agent' })
  userAgent: string;

  /** 结果：0失败 1成功 */
  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @Column({ length: 500, nullable: true, name: 'error_msg' })
  errorMsg: string;

  @CreateDateColumn()
  createdAt: Date;
}

/* ============================= C 端访问量统计 ============================= */
/**
 * 按模块 + 日期聚合的 C 端访问计数。
 * 由 AccessStatMiddleware 在每个 C 端请求上 upsert 累加。
 * module 取值：association/event/venue/coach/circle/user/system/notification
 */
@Entity('access_stats')
@Index('uk_access_module_date', ['module', 'statDate'], { unique: true })
@Index('idx_access_stat_date', ['statDate'])
export class AccessStat {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  /** 模块：association/event/venue/coach/circle/user/system/notification */
  @Column({ length: 32 })
  module: string;

  /** 统计日期（按 +08:00 当地日期截断） */
  @Column({ type: 'date', name: 'stat_date' })
  statDate: string;

  /** 当日访问次数 */
  @Column({ type: 'int', default: 0 })
  count: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
