/**
 * 游泳生态圈 — TypeORM 实体基类
 *
 * 依赖：typeorm ^0.3.x  +  typeorm-extension（SnakeNamingStrategy）
 * 前置条件：app.module.ts 中 TypeOrmModule.forRoot 配置：
 *   namingStrategy: new SnakeNamingStrategy()
 *   supportBigNumbers: true, bigNumberStrings: false  （bigint → number）
 *
 * 三种基类：
 *   BaseEntity           — id + createdAt + updatedAt + deletedAt（软删除）
 *   BaseTimestampEntity  — id + createdAt + updatedAt
 *   BaseCreatedEntity    — id + createdAt（流水 / 关联表）
 */

import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

/** 主表基类：含软删除 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;
}

/** 带时间戳基类（无软删除） */
export abstract class BaseTimestampEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/** 仅创建时间基类（流水 / 日志 / 关联表） */
export abstract class BaseCreatedEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @CreateDateColumn()
  createdAt: Date;
}
