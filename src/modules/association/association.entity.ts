/**
 * 模块二：冬泳协会 + 会员报名/人员管理（2 张表）
 * Association / AssociationMember
 */

import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../user/user.entity';
import { AdminUser } from '../user/user.entity';

/* ============================= 冬泳协会 ============================= */
@Entity('associations')
@Index('uk_associations_name', ['name'], { unique: true })
@Index('idx_assoc_city', ['province', 'city'])
@Index('idx_assoc_audit', ['auditStatus'])
@Index('idx_assoc_creator', ['creatorId'])
@Index('idx_associations_region_code', ['provinceCode', 'cityCode', 'districtCode'])
export class Association extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, nullable: true, name: 'short_name' })
  shortName: string;

  @Column({ length: 512, nullable: true, name: 'logo_url' })
  logoUrl: string;

  @Column({ length: 512, nullable: true, name: 'cover_url' })
  coverUrl: string;

  @Column({ length: 32, nullable: true })
  province: string;

  @Column({ length: 32, nullable: true })
  city: string;

  @Column({ length: 32, nullable: true })
  district: string;

  /** 行政区划编码（与 province/city/district 名称列并存，旧行可为 NULL） */
  @Column({ length: 9, nullable: true, name: 'province_code' })
  provinceCode: string;

  @Column({ length: 9, nullable: true, name: 'city_code' })
  cityCode: string;

  @Column({ length: 9, nullable: true, name: 'district_code' })
  districtCode: string;

  @Column({ length: 255, nullable: true })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ length: 32, nullable: true, name: 'contact_name' })
  contactName: string;

  @Column({ length: 20, nullable: true, name: 'contact_phone' })
  contactPhone: string;

  @Column({ length: 64, nullable: true })
  wechat: string;

  /** 教练员 */
  @Column({ length: 32, nullable: true })
  coach: string;

  @Column({ type: 'date', nullable: true, name: 'establish_date' })
  establishDate: string;

  @Column({ type: 'text', nullable: true })
  intro: string;

  /** 会员总数（冗余计数） */
  @Column({ type: 'int', default: 0, name: 'member_count' })
  memberCount: number;

  /** 审核状态：0待审核 1审核通过 2审核驳回 */
  @Column({ type: 'tinyint', default: 0, name: 'audit_status' })
  auditStatus: number;

  @Column({ length: 255, nullable: true, name: 'audit_remark' })
  auditRemark: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'auditor_id' })
  auditorId: number;

  @Column({ type: 'datetime', nullable: true, name: 'audited_at' })
  auditedAt: Date;

  /** 业务状态：0停用 1正常 */
  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'creator_id' })
  creatorId: number;

  // ---- 关联 ----
  @ManyToOne(() => AdminUser, { nullable: true })
  @JoinColumn({ name: 'auditor_id' })
  auditor: AdminUser | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creator_id' })
  creator: User | null;

  @OneToMany(() => AssociationMember, (m) => m.association)
  members: AssociationMember[];
}

/* ============================= 协会会员（报名 + 在册人员管理） ============================= */
@Entity('association_members')
@Index('uk_am_assoc_user', ['associationId', 'userId'], { unique: true })
@Index('idx_am_user', ['userId'])
@Index('idx_am_status', ['status'])
export class AssociationMember extends BaseEntity {
  @Column({ type: 'bigint', unsigned: true, name: 'association_id' })
  associationId: number;

  @Column({ type: 'bigint', unsigned: true, name: 'user_id' })
  userId: number;

  /** 会员编号（通过后生成） */
  @Column({ length: 32, nullable: true, name: 'member_no' })
  memberNo: string;

  /** 协会内角色：1会长 2管理员 3普通会员 */
  @Column({ type: 'tinyint', default: 3 })
  role: number;

  @Column({ length: 32, name: 'real_name' })
  realName: string;

  @Column({ length: 20 })
  phone: string;

  /** 身份证号（AES 加密） */
  @Column({ length: 255, nullable: true, name: 'id_card_enc' })
  idCardEnc: string;

  @Column({ length: 32, nullable: true, name: 'emergency_name' })
  emergencyName: string;

  @Column({ length: 20, nullable: true, name: 'emergency_phone' })
  emergencyPhone: string;

  /** 冬泳健康声明 JSON */
  @Column({ type: 'json', nullable: true, name: 'health_declaration' })
  healthDeclaration: Record<string, any> | null;

  @Column({ length: 255, nullable: true, name: 'apply_remark' })
  applyRemark: string;

  /** 状态：0待审核 1已通过 2已拒绝 3已退出 4被移除 */
  @Column({ type: 'tinyint', default: 0 })
  status: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'reviewer_id' })
  reviewerId: number;

  @Column({ type: 'datetime', nullable: true, name: 'reviewed_at' })
  reviewedAt: Date;

  @Column({ type: 'datetime', nullable: true, name: 'joined_at' })
  joinedAt: Date;

  /** 是否购买保险：null未知 0未购买 1已购买 */
  @Column({ type: 'tinyint', nullable: true, name: 'has_insurance' })
  hasInsurance: number;

  /** 购买保险时间 */
  @Column({ type: 'datetime', nullable: true, name: 'buyed_insurance_at' })
  buyedInsuranceAt: Date;

  /** 保险开始时间 */
  @Column({ type: 'datetime', nullable: true, name: 'insurance_start_at' })
  insuranceStartAt: Date;

  /** 保险结束时间 */
  @Column({ type: 'datetime', nullable: true, name: 'insurance_end_at' })
  insuranceEndAt: Date;

  // ---- 关联 ----
  @ManyToOne(() => Association, (a) => a.members)
  @JoinColumn({ name: 'association_id' })
  association: Association;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User | null;
}
