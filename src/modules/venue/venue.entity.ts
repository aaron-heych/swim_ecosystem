/**
 * 模块三：场馆 + 教练预约（6 张表）
 * Venue / Coach / CoachCourse / CoachSchedule / CoachAppointment / CoachReview
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
import { BaseEntity, BaseTimestampEntity } from '../../common/entities/base.entity';
import { User } from '../user/user.entity';
import { AdminUser } from '../user/user.entity';

/* ============================= 游泳场馆 / 冬泳基地 ============================= */
@Entity('venues')
@Index('idx_venues_city_type', ['province', 'city', 'type'])
@Index('idx_venues_geo', ['longitude', 'latitude'])
@Index('idx_venues_status', ['status'])
@Index('idx_venues_region_code', ['provinceCode', 'cityCode', 'districtCode'])
export class Venue extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  /** 类型：1室内恒温 2室内常温 3室外泳池 4公开水域/冬泳基地 */
  @Column({ type: 'tinyint', default: 1 })
  type: number;

  @Column({ length: 512, nullable: true, name: 'cover_url' })
  coverUrl: string;

  /** 场馆图集 URL 数组 */
  @Column({ type: 'json', nullable: true })
  images: string[];

  /** 省 名称（冗余，与 provinceCode 配对） */
  @Column({ length: 32, nullable: true })
  province: string;

  /** 市 名称 */
  @Column({ length: 32, nullable: true })
  city: string;

  /** 区/县 名称 */
  @Column({ length: 32, nullable: true })
  district: string;

  /** 省 行政区划编码（关联 regions.code） */
  @Column({ length: 9, nullable: true, name: 'province_code' })
  provinceCode: string | null;

  /** 市 行政区划编码 */
  @Column({ length: 9, nullable: true, name: 'city_code' })
  cityCode: string | null;

  /** 区/县 行政区划编码 */
  @Column({ length: 9, nullable: true, name: 'district_code' })
  districtCode: string | null;

  @Column({ length: 255 })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ length: 20, nullable: true })
  phone: string;

  /** 营业时间描述，如 06:30-22:00 */
  @Column({ length: 255, nullable: true, name: 'business_hours' })
  businessHours: string;

  /** 泳道长度（米）：50/25 */
  @Column({ type: 'decimal', precision: 5, scale: 1, nullable: true, name: 'pool_length_m' })
  poolLengthM: number;

  @Column({ type: 'int', nullable: true, name: 'lane_count' })
  laneCount: number;

  /** 最低水温℃（冬泳场地关键信息） */
  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true, name: 'water_temp_min' })
  waterTempMin: number;

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true, name: 'water_temp_max' })
  waterTempMax: number;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true, name: 'depth_min' })
  depthMin: number;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true, name: 'depth_max' })
  depthMax: number;

  /** 配套设施标签数组 */
  @Column({ type: 'json', nullable: true })
  facilities: string[];

  /** 特色标签数组 */
  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'price_min' })
  priceMin: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'price_max' })
  priceMax: number;

  @Column({ type: 'text', nullable: true })
  intro: string;

  /** 综合评分（冗余） */
  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0.0 })
  rating: number;

  @Column({ type: 'int', default: 0, name: 'rating_count' })
  ratingCount: number;

  /** 审核状态：0待审核 1通过 2驳回 */
  @Column({ type: 'tinyint', default: 1, name: 'audit_status' })
  auditStatus: number;

  /** 状态：0停业/下架 1正常 */
  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'creator_id' })
  creatorId: number;

  // ---- 关联 ----
  @ManyToOne(() => AdminUser, { nullable: true })
  @JoinColumn({ name: 'creator_id' })
  creator: AdminUser | null;

  @OneToMany(() => Coach, (c) => c.venue)
  coaches: Coach[];
}

/* ============================= 教练 ============================= */
@Entity('coaches')
@Index('uk_coaches_user', ['userId'], { unique: true })
@Index('idx_coaches_venue', ['venueId'])
@Index('idx_coaches_audit', ['auditStatus'])
@Index('idx_coaches_status', ['status'])
export class Coach extends BaseEntity {
  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'user_id' })
  userId: number;

  @Column({ length: 32 })
  name: string;

  @Column({ length: 512, nullable: true, name: 'avatar_url' })
  avatarUrl: string;

  /** 性别：0未知 1男 2女 */
  @Column({ type: 'tinyint', default: 0 })
  gender: number;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 64, nullable: true })
  wechat: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'venue_id' })
  venueId: number;

  @Column({ length: 100, nullable: true })
  title: string;

  /** 资质证书图片 URL 数组 */
  @Column({ type: 'json', nullable: true, name: 'cert_images' })
  certImages: string[];

  /** 教授泳姿数组 */
  @Column({ type: 'json', nullable: true })
  strokes: string[];

  /** 授课对象数组 */
  @Column({ type: 'json', nullable: true, name: 'teach_targets' })
  teachTargets: string[];

  /** 教龄（年） */
  @Column({ type: 'int', default: 0, name: 'experience_years' })
  experienceYears: number;

  @Column({ type: 'text', nullable: true })
  intro: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0, name: 'lesson_price' })
  lessonPrice: number;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0.0 })
  rating: number;

  @Column({ type: 'int', default: 0, name: 'rating_count' })
  ratingCount: number;

  @Column({ type: 'int', default: 0, name: 'student_count' })
  studentCount: number;

  /** 审核状态：0待审核 1通过 2驳回 */
  @Column({ type: 'tinyint', default: 0, name: 'audit_status' })
  auditStatus: number;

  @Column({ length: 255, nullable: true, name: 'audit_remark' })
  auditRemark: string;

  /** 上架状态：0下架 1上架 */
  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @Column({ type: 'int', default: 0 })
  sort: number;

  // ---- 关联 ----
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @ManyToOne(() => Venue, (v) => v.coaches, { nullable: true })
  @JoinColumn({ name: 'venue_id' })
  venue: Venue | null;

  @OneToMany(() => CoachCourse, (c) => c.coach)
  courses: CoachCourse[];

  @OneToMany(() => CoachSchedule, (s) => s.coach)
  schedules: CoachSchedule[];

  @OneToMany(() => CoachAppointment, (a) => a.coach)
  appointments: CoachAppointment[];
}

/* ============================= 教练课程产品 ============================= */
@Entity('coach_courses')
@Index('idx_courses_coach', ['coachId'])
export class CoachCourse extends BaseTimestampEntity {
  @Column({ type: 'bigint', unsigned: true, name: 'coach_id' })
  coachId: number;

  @Column({ length: 100 })
  name: string;

  /** 类型：1一对一 2一对多 3小班课 4课时包 */
  @Column({ type: 'tinyint', default: 1 })
  type: number;

  /** 课时数（课时包 > 1） */
  @Column({ type: 'int', default: 1 })
  sessions: number;

  /** 单课时长（分钟） */
  @Column({ type: 'int', default: 60, name: 'duration_min' })
  durationMin: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'original_price' })
  originalPrice: number;

  @Column({ length: 500, nullable: true })
  description: string;

  /** 状态：0下架 1在售 */
  @Column({ type: 'tinyint', default: 1 })
  status: number;

  // ---- 关联 ----
  @ManyToOne(() => Coach, (c) => c.courses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coach_id' })
  coach: Coach;

  @OneToMany(() => CoachSchedule, (s) => s.course)
  schedules: CoachSchedule[];

  @OneToMany(() => CoachAppointment, (a) => a.course)
  appointments: CoachAppointment[];
}

/* ============================= 教练可约排班 ============================= */
@Entity('coach_schedules')
@Index('uk_schedules_coach_date_start', ['coachId', 'workDate', 'startTime'], { unique: true })
@Index('idx_schedules_date', ['workDate'])
@Index('idx_schedules_venue', ['venueId'])
export class CoachSchedule extends BaseTimestampEntity {
  @Column({ type: 'bigint', unsigned: true, name: 'coach_id' })
  coachId: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'course_id' })
  courseId: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'venue_id' })
  venueId: number;

  /** 授课日期 */
  @Column({ type: 'date', name: 'work_date' })
  workDate: string;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  /** 状态：0可约 1已约 2锁定 3休息/关闭 */
  @Column({ type: 'tinyint', default: 0 })
  status: number;

  // ---- 关联 ----
  @ManyToOne(() => Coach, (c) => c.schedules)
  @JoinColumn({ name: 'coach_id' })
  coach: Coach;

  @ManyToOne(() => CoachCourse, (c) => c.schedules, { nullable: true })
  @JoinColumn({ name: 'course_id' })
  course: CoachCourse | null;

  @ManyToOne(() => Venue, { nullable: true })
  @JoinColumn({ name: 'venue_id' })
  venue: Venue | null;
}

/* ============================= 教练预约单 ============================= */
@Entity('coach_appointments')
@Index('uk_appt_order_no', ['orderNo'], { unique: true })
@Index('uk_appt_schedule', ['scheduleId'], { unique: true })
@Index('idx_appt_user', ['userId'])
@Index('idx_appt_coach_date', ['coachId', 'appointmentDate'])
@Index('idx_appt_status', ['status'])
export class CoachAppointment extends BaseTimestampEntity {
  /** 预约单号（业务唯一） */
  @Column({ length: 32, name: 'order_no' })
  orderNo: string;

  @Column({ type: 'bigint', unsigned: true, name: 'user_id' })
  userId: number;

  @Column({ type: 'bigint', unsigned: true, name: 'coach_id' })
  coachId: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'course_id' })
  courseId: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'schedule_id' })
  scheduleId: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'venue_id' })
  venueId: number;

  @Column({ type: 'date', name: 'appointment_date' })
  appointmentDate: string;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  price: number;

  @Column({ length: 32, name: 'contact_name' })
  contactName: string;

  @Column({ length: 20, name: 'contact_phone' })
  contactPhone: string;

  /** 状态：0待确认 1已确认 2已完成 3用户取消 4教练取消 5爽约 */
  @Column({ type: 'tinyint', default: 0 })
  status: number;

  /** 支付状态：0待支付 1已支付 2已退款 */
  @Column({ type: 'tinyint', default: 0, name: 'pay_status' })
  payStatus: number;

  @Column({ type: 'datetime', nullable: true, name: 'pay_time' })
  payTime: Date;

  @Column({ length: 64, nullable: true, name: 'transaction_id' })
  transactionId: string;

  @Column({ length: 255, nullable: true, name: 'cancel_reason' })
  cancelReason: string;

  /** 取消方：1用户 2教练 3系统 */
  @Column({ type: 'tinyint', nullable: true, name: 'cancel_by' })
  cancelBy: number;

  @Column({ length: 255, nullable: true })
  remark: string;

  // ---- 关联 ----
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Coach, (c) => c.appointments)
  @JoinColumn({ name: 'coach_id' })
  coach: Coach;

  @ManyToOne(() => CoachCourse, (c) => c.appointments, { nullable: true })
  @JoinColumn({ name: 'course_id' })
  course: CoachCourse | null;

  @ManyToOne(() => CoachSchedule, { nullable: true })
  @JoinColumn({ name: 'schedule_id' })
  schedule: CoachSchedule | null;

  @ManyToOne(() => Venue, { nullable: true })
  @JoinColumn({ name: 'venue_id' })
  venue: Venue | null;

  @OneToMany(() => CoachReview, (r) => r.appointment)
  reviews: CoachReview[];
}

/* ============================= 教练课程评价 ============================= */
@Entity('coach_reviews')
@Index('uk_review_appt', ['appointmentId'], { unique: true })
@Index('idx_review_coach', ['coachId'])
@Index('idx_review_user', ['userId'])
export class CoachReview {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'appointment_id' })
  appointmentId: number;

  @Column({ type: 'bigint', unsigned: true, name: 'coach_id' })
  coachId: number;

  @Column({ type: 'bigint', unsigned: true, name: 'user_id' })
  userId: number;

  /** 专业能力评分 1-5 */
  @Column({ type: 'tinyint', default: 5, name: 'score_professional' })
  scoreProfessional: number;

  /** 教学态度评分 1-5 */
  @Column({ type: 'tinyint', default: 5, name: 'score_attitude' })
  scoreAttitude: number;

  /** 守时评分 1-5 */
  @Column({ type: 'tinyint', default: 5, name: 'score_punctual' })
  scorePunctual: number;

  @Column({ length: 1000, nullable: true })
  content: string;

  /** 评价图片 URL 数组 */
  @Column({ type: 'json', nullable: true })
  images: string[];

  @Column({ length: 500, nullable: true })
  reply: string;

  @Column({ type: 'datetime', nullable: true, name: 'replied_at' })
  repliedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  // ---- 关联 ----
  @ManyToOne(() => CoachAppointment, (a) => a.reviews)
  @JoinColumn({ name: 'appointment_id' })
  appointment: CoachAppointment;

  @ManyToOne(() => Coach)
  @JoinColumn({ name: 'coach_id' })
  coach: Coach;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
