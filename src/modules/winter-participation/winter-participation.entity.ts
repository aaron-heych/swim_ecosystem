/**
 * 模块十一：冬泳参与（赛事 / 活动 共用，2 张表）
 * WinterParticipation — 参与协会（代表队）
 * WinterParticipant   — 参与人员（由协会会员导入）
 *
 * 赛事（target_type=1）与活动（target_type=2）共用同一套参与数据结构；
 * 赛事另有「项目 + 个人成绩」，见 competition.entity.ts。
 */

import { Entity, Column, Index } from 'typeorm';
import { BaseTimestampEntity } from '../../common/entities/base.entity';

/** 参与主体类型：1赛事 2活动 */
export const PARTICIPATION_TARGET = { COMPETITION: 1, ACTIVITY: 2 } as const;

/* ============================= 参与协会（代表队） ============================= */
@Entity('winter_participations')
@Index('idx_wpart_target', ['targetType', 'targetId'])
@Index('idx_wpart_assoc', ['associationId'])
export class WinterParticipation extends BaseTimestampEntity {
  /** 1赛事 2活动 */
  @Column({ type: 'tinyint', name: 'target_type' })
  targetType: number;

  @Column({ type: 'bigint', unsigned: true, name: 'target_id' })
  targetId: number;

  /** 冬泳协会 */
  @Column({ type: 'bigint', unsigned: true, name: 'association_id' })
  associationId: number;

  /** 冗余协会名，便于列表直显 */
  @Column({ length: 100, name: 'association_name' })
  associationName: string;

  /** 代表队名（默认取协会名） */
  @Column({ length: 100, nullable: true, name: 'team_name' })
  teamName: string;

  @Column({ length: 32, nullable: true, name: 'leader_name' })
  leaderName: string;

  @Column({ length: 20, nullable: true, name: 'leader_phone' })
  leaderPhone: string;

  /** 人数（自动维护） */
  @Column({ type: 'int', default: 0, name: 'participant_count' })
  participantCount: number;

  /** 状态：0待确认 1已确认 2已取消 */
  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @Column({ length: 255, nullable: true })
  remark: string;
}

/* ============================= 参与人员 ============================= */
@Entity('winter_participants')
@Index('idx_wpt_participation', ['participationId'])
@Index('idx_wpt_member', ['memberId'])
export class WinterParticipant extends BaseTimestampEntity {
  @Column({ type: 'bigint', unsigned: true, name: 'participation_id' })
  participationId: number;

  /** 来源协会会员 ID（导入时回填，用于防重复） */
  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'member_id' })
  memberId: number;

  @Column({ length: 32, name: 'real_name' })
  realName: string;

  /** 性别：0未知 1男 2女 */
  @Column({ type: 'tinyint', default: 0 })
  gender: number;

  @Column({ type: 'date', nullable: true })
  birthday: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  /** 身份证号（AES 密文，导入时直接复制会员密文） */
  @Column({ length: 255, nullable: true, name: 'id_card_enc' })
  idCardEnc: string;

  /** 参赛号码 */
  @Column({ length: 16, nullable: true, name: 'bib_no' })
  bibNo: string;

  /** 状态：0取消 1有效 */
  @Column({ type: 'tinyint', default: 1 })
  status: number;
}
