/**
 * 模块九：冬泳赛事（4 张表）
 * WinterCompetition        — 冬泳管理域的比赛（区别于平台通用 events）
 * WinterCompetitionGroup   — 赛事项目/组别（成绩的维度）
 * WinterCompetitionResult  — 个人成绩（团体总分由积分自动汇总）
 * WinterCompetitionSponsor — 赛事赞助商（一个赛事多条）
 */

import { Entity, Column, Index } from 'typeorm';
import { BaseEntity, BaseTimestampEntity } from '../../common/entities/base.entity';

@Entity('winter_competitions')
@Index('idx_competitions_region_code', ['provinceCode', 'cityCode', 'districtCode'])
@Index('idx_competitions_status', ['status'])
export class WinterCompetition extends BaseEntity {
  @Column({ length: 150 })
  title: string;

  /** 赛事类型：1竞速赛 2畅游赛 3邀请赛 */
  @Column({ type: 'tinyint', default: 1 })
  type: number;

  /** 赛事级别：1国际 2全国 3省级 4市级 5协会级 */
  @Column({ type: 'tinyint', nullable: true })
  level: number;

  /** 赛事详情 */
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

  /** 比赛地点 */
  @Column({ length: 200, nullable: true })
  location: string;

  /** 比赛开始时间 */
  @Column({ type: 'datetime', nullable: true, name: 'start_at' })
  startAt: Date;

  /** 比赛结束时间 */
  @Column({ type: 'datetime', nullable: true, name: 'end_at' })
  endAt: Date;

  /** 报名开始时间 */
  @Column({ type: 'datetime', nullable: true, name: 'reg_start_at' })
  regStartAt: Date;

  /** 报名截止时间 */
  @Column({ type: 'datetime', nullable: true, name: 'reg_end_at' })
  regEndAt: Date;

  /** 报名费用 */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fee: number;

  /** 名额上限 */
  @Column({ type: 'int', nullable: true })
  capacity: number;

  /** 已报名人数（冗余计数） */
  @Column({ type: 'int', default: 0, name: 'joined_count' })
  joinedCount: number;

  @Column({ length: 32, nullable: true, name: 'contact_name' })
  contactName: string;

  @Column({ length: 20, nullable: true, name: 'contact_phone' })
  contactPhone: string;

  /** 状态：0草稿 1报名中 2比赛中 3已结束 4已取消 */
  @Column({ type: 'tinyint', default: 0 })
  status: number;

  /** 发布时间（草稿发布时写入） */
  @Column({ type: 'datetime', nullable: true, name: 'publish_at' })
  publishAt: Date;

  /** 比赛结果附件（整场赛事的成绩单照片/zip 打包），结构：[{ name, url, size, type, remark }] */
  @Column({ type: 'simple-json', nullable: true, name: 'result_attachments' })
  resultAttachments: {
    name: string;
    url: string;
    size?: number;
    type?: string;
    remark?: string;
  }[];

  /** 赛事花絮照片（仅图片），结构同 result_attachments */
  @Column({ type: 'simple-json', nullable: true, name: 'gallery_attachments' })
  galleryAttachments: {
    name: string;
    url: string;
    size?: number;
    type?: string;
    remark?: string;
  }[];

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'created_by' })
  createdBy: number;
}

/* ============================= 赛事项目 / 组别 ============================= */
@Entity('winter_competition_groups')
@Index('idx_wcgroups_competition', ['competitionId'])
export class WinterCompetitionGroup extends BaseTimestampEntity {
  @Column({ type: 'bigint', unsigned: true, name: 'competition_id' })
  competitionId: number;

  @Column({ length: 100 })
  name: string;

  /** 性别要求：0不限 1男 2女 */
  @Column({ type: 'tinyint', default: 0, name: 'gender_limit' })
  genderLimit: number;

  @Column({ type: 'int', nullable: true, name: 'age_min' })
  ageMin: number;

  @Column({ type: 'int', nullable: true, name: 'age_max' })
  ageMax: number;

  /** 泳姿（自由泳 / 蛙泳 / 蝶泳 / 仰泳 …） */
  @Column({ length: 32, nullable: true })
  stroke: string;

  /** 距离（米） */
  @Column({ type: 'int', nullable: true, name: 'distance_m' })
  distanceM: number;

  @Column({ type: 'int', default: 0 })
  sort: number;
}

/* ============================= 个人成绩 ============================= */
@Entity('winter_competition_results')
@Index('idx_wcresults_competition', ['competitionId'])
@Index('idx_wcresults_group', ['groupId'])
@Index('idx_wcresults_assoc', ['associationId'])
export class WinterCompetitionResult extends BaseTimestampEntity {
  @Column({ type: 'bigint', unsigned: true, name: 'competition_id' })
  competitionId: number;

  @Column({ type: 'bigint', unsigned: true, name: 'group_id' })
  groupId: number;

  /** 参与人员 ID（可为空，支持临时选手） */
  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'participant_id' })
  participantId: number;

  @Column({ length: 32, name: 'participant_name' })
  participantName: string;

  /** 所属冬泳协会（团体总分榜分组依据） */
  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'association_id' })
  associationId: number;

  @Column({ length: 100, nullable: true, name: 'association_name' })
  associationName: string;

  @Column({ length: 100, nullable: true, name: 'team_name' })
  teamName: string;

  /** 名次（rank 为 MySQL 保留字，列名用 rank_no） */
  @Column({ type: 'int', nullable: true, name: 'rank_no' })
  rank: number;

  /** 成绩（如 00:32.15） */
  @Column({ length: 32, nullable: true, name: 'result_value' })
  resultValue: string;

  /** 成绩毫秒值（用于排序，可选） */
  @Column({ type: 'int', nullable: true, name: 'result_ms' })
  resultMs: number;

  /** 积分（默认按名次 9/7/6/5/4/3/2/1 自动给分，可手工修改） */
  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  score: number;

  /** 原始记录附件（图片/zip），结构：[{ name, url }] */
  @Column({ type: 'simple-json', nullable: true })
  attachments: { name: string; url: string }[];

  /** 备注：DNS 未出发 / DNF 未完成 / DSQ 犯规 */
  @Column({ length: 255, nullable: true })
  remark: string;
}

/* ============================= 赞助商 ============================= */
@Entity('winter_competition_sponsors')
@Index('idx_wcsponsors_competition', ['competitionId'])
export class WinterCompetitionSponsor extends BaseTimestampEntity {
  @Column({ type: 'bigint', unsigned: true, name: 'competition_id' })
  competitionId: number;

  /** 公司名称 */
  @Column({ length: 100 })
  name: string;

  /** 公司主页 URL */
  @Column({ length: 200, nullable: true })
  website: string;

  /** 主营业务 */
  @Column({ length: 255, nullable: true })
  business: string;

  @Column({ type: 'int', default: 0 })
  sort: number;
}

/* ============================= 积分规则 ============================= */
@Entity('winter_competition_score_rules')
@Index('idx_wcsr_competition', ['competitionId'])
export class WinterCompetitionScoreRule extends BaseTimestampEntity {
  @Column({ type: 'bigint', unsigned: true, name: 'competition_id' })
  competitionId: number;

  /** 名次 */
  @Column({ type: 'int', name: 'rank_no' })
  rankNo: number;

  /** 该名次对应积分 */
  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  score: number;
}
