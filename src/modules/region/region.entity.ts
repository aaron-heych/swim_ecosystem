/**
 * 行政区划（省 / 市 / 区县）— 维度表
 *
 * 数据来源：国家统计局行政区划编码（modood/Administrative-divisions-of-China）。
 * code 编码规则：
 *   省 / 直辖市：2 位   (11 = 北京市)
 *   地级市     ：4 位   (1101 = 市辖区)
 *   区 / 县   ：6 位   (110101 = 东城区)
 *   特别说明：东莞 / 中山 / 儮州等「直筒子市」无区县级建制，
 *   其下辖乡镇/街道使用 9 位统计编码（如 441900003 东城街道），
 *   一并入库为 level=3，code 列长度放宽至 9 位以兼容。
 * 父子关系：
 *   省 parentId = NULL
 *   市 parentId = 省.id
 *   区县 parentId = 市.id
 *
 * 初始化脚本：scripts/seed-regions.js
 */

import {
  Entity,
  Column,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('regions')
@Index('uk_region_code', ['code'], { unique: true })
@Index('idx_region_parent', ['parentId'])
@Index('idx_region_level', ['level'])
export class Region {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  /** 行政区划编码：省 2 位 / 市 4 位 / 区县 6 位（个别直筒子市乡镇 9 位） */
  @Column({ length: 9 })
  code: string;

  @Column({ length: 64 })
  name: string;

  /** 层级：1省/直辖市 2地级市 3区/县 */
  @Column({ type: 'tinyint' })
  level: number;

  /** 上级 region.id；省级为 NULL */
  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'parent_id' })
  parentId: number;

  /** 排序值，按行政区划编码顺序递增 */
  @Column({ type: 'int', default: 0 })
  sort: number;

  /** 状态：0禁用 1启用 */
  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
