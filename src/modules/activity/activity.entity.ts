/**
 * 模块十：冬泳活动（1 张表）
 * WinterActivity — 冬泳管理域的线下活动（区别于圈子模块的 Activity）
 */

import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('winter_activities')
@Index('idx_activities_region_code', ['provinceCode', 'cityCode', 'districtCode'])
@Index('idx_activities_status', ['status'])
export class WinterActivity extends BaseEntity {
  @Column({ length: 150 })
  title: string;

  /** 活动类型：1畅游活动 2冬泳体验 3公益宣传 4交流活动 */
  @Column({ type: 'tinyint', default: 1 })
  type: number;

  /** 活动介绍 */
  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 32, nullable: true })
  province: string;

  @Column({ length: 32, nullable: true })
  city: string;

  @Column({ length: 32, nullable: true })
  district: string;

  /** 行政区划编码（与名称列并存） */
  @Column({ length: 9, nullable: true, name: 'province_code' })
  provinceCode: string;

  @Column({ length: 9, nullable: true, name: 'city_code' })
  cityCode: string;

  @Column({ length: 9, nullable: true, name: 'district_code' })
  districtCode: string;

  /** 活动地点 */
  @Column({ length: 200, nullable: true })
  location: string;

  /** 活动开始时间 */
  @Column({ type: 'datetime', nullable: true, name: 'start_at' })
  startAt: Date;

  /** 活动结束时间 */
  @Column({ type: 'datetime', nullable: true, name: 'end_at' })
  endAt: Date;

  /** 报名截止时间 */
  @Column({ type: 'datetime', nullable: true, name: 'reg_end_at' })
  regEndAt: Date;

  /** 参与费用 */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fee: number;

  /** 名额上限 */
  @Column({ type: 'int', nullable: true })
  capacity: number;

  /** 已报名人数（冗余计数） */
  @Column({ type: 'int', default: 0, name: 'joined_count' })
  joinedCount: number;

  /** 组织方 */
  @Column({ length: 100, nullable: true })
  organizer: string;

  @Column({ length: 32, nullable: true, name: 'contact_name' })
  contactName: string;

  @Column({ length: 20, nullable: true, name: 'contact_phone' })
  contactPhone: string;

  /** 状态：0草稿 1已发布 2进行中 3已结束 4已取消 */
  @Column({ type: 'tinyint', default: 0 })
  status: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'created_by' })
  createdBy: number;
}
