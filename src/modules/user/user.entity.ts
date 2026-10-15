/**
 * 模块一：用户体系 + 管理后台 RBAC 权限（6 张表）
 * User / AdminUser / Role / Permission / RolePermission / AdminUserRole
 */

import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
  PrimaryColumn,
  CreateDateColumn,
} from 'typeorm';
import { BaseEntity, BaseTimestampEntity, BaseCreatedEntity } from '../../common/entities/base.entity';

/* ============================= C端用户 ============================= */
@Entity('users')
@Index('uk_users_openid', ['openid'], { unique: true })
@Index('uk_users_unionid', ['unionid'], { unique: true })
@Index('uk_users_phone', ['phone'], { unique: true })
@Index('idx_users_oa_openid', ['oaOpenid'])
@Index('idx_users_city', ['province', 'city'])
@Index('idx_users_status', ['status'])
export class User extends BaseEntity {
  /** 小程序 openid */
  @Column({ length: 64, nullable: true })
  openid: string;

  /** 微信开放平台 unionid（打通小程序 / 公众号） */
  @Column({ length: 64, nullable: true })
  unionid: string;

  /** 公众号 openid */
  @Column({ length: 64, nullable: true, name: 'oa_openid' })
  oaOpenid: string;

  /** 手机号 */
  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 64, nullable: true })
  nickname: string;

  @Column({ length: 512, nullable: true, name: 'avatar_url' })
  avatarUrl: string;

  /** 性别：0未知 1男 2女 */
  @Column({ type: 'tinyint', default: 0 })
  gender: number;

  @Column({ length: 32, nullable: true, name: 'real_name' })
  realName: string;

  /** 身份证号（AES 加密存储） */
  @Column({ length: 255, nullable: true, name: 'id_card_enc' })
  idCardEnc: string;

  @Column({ type: 'date', nullable: true })
  birthday: string;

  @Column({ length: 32, nullable: true })
  province: string;

  @Column({ length: 32, nullable: true })
  city: string;

  @Column({ length: 32, nullable: true })
  district: string;

  /** 游泳水平：0未设置 1初学 2会游 3熟练 4专业 */
  @Column({ type: 'tinyint', default: 0, name: 'swim_level' })
  swimLevel: number;

  @Column({ length: 32, nullable: true, name: 'emergency_name' })
  emergencyName: string;

  @Column({ length: 20, nullable: true, name: 'emergency_phone' })
  emergencyPhone: string;

  @Column({ length: 255, nullable: true })
  bio: string;

  /** 账号状态：0禁用 1正常 */
  @Column({ type: 'tinyint', default: 1 })
  status: number;

  /** 注册来源：1小程序 2公众号H5 3管理后台 */
  @Column({ type: 'tinyint', default: 1, name: 'register_source' })
  registerSource: number;

  @Column({ type: 'datetime', nullable: true, name: 'last_login_at' })
  lastLoginAt: Date;

  @Column({ length: 45, nullable: true, name: 'last_login_ip' })
  lastLoginIp: string;
}

/* ============================= 管理后台账号 ============================= */
@Entity('admin_users')
@Index('uk_admin_username', ['username'], { unique: true })
export class AdminUser extends BaseEntity {
  @Column({ length: 64 })
  username: string;

  /** bcrypt 哈希 */
  @Column({ length: 100, name: 'password_hash' })
  passwordHash: string;

  @Column({ length: 32, name: 'real_name' })
  realName: string;

  @Column({ length: 512, nullable: true, name: 'avatar_url' })
  avatarUrl: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 128, nullable: true })
  email: string;

  /** 状态：0禁用 1正常 */
  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @Column({ type: 'datetime', nullable: true, name: 'last_login_at' })
  lastLoginAt: Date;

  @Column({ length: 45, nullable: true, name: 'last_login_ip' })
  lastLoginIp: string;

  /** 所属协会ID（swimming_sub_admin 协会会长专用，其他角色为 null） */
  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'association_id' })
  associationId: number;

  // ---- 关联 ----
  @ManyToMany(() => Role, (r) => r.adminUsers)
  @JoinTable({
    name: 'admin_user_roles',
    joinColumn: { name: 'admin_user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];
}

/* ============================= 角色 ============================= */
@Entity('roles')
@Index('uk_roles_code', ['code'], { unique: true })
export class Role extends BaseTimestampEntity {
  /** 角色编码：super_admin / operator / association_admin / merchant */
  @Column({ length: 64 })
  code: string;

  @Column({ length: 64 })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ type: 'int', default: 0 })
  sort: number;

  /** 状态：0禁用 1正常 */
  @Column({ type: 'tinyint', default: 1 })
  status: number;

  // ---- 关联 ----
  @ManyToMany(() => AdminUser, (a) => a.roles)
  adminUsers: AdminUser[];

  @ManyToMany(() => Permission, (p) => p.roles)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];
}

/* ============================= 权限（菜单 / 按钮 / 接口） ============================= */
@Entity('permissions')
@Index('uk_permissions_code', ['code'], { unique: true })
@Index('idx_permissions_parent', ['parentId'])
export class Permission extends BaseTimestampEntity {
  /** 父权限 ID，0为顶级 */
  @Column({ type: 'bigint', unsigned: true, default: 0, name: 'parent_id' })
  parentId: number;

  /** 类型：1菜单 2按钮 3接口 */
  @Column({ type: 'tinyint', default: 1 })
  type: number;

  /** 权限标识，如 event:audit */
  @Column({ length: 128 })
  code: string;

  @Column({ length: 64 })
  name: string;

  /** 前端路由 / 接口路径 */
  @Column({ length: 255, nullable: true })
  path: string;

  /** 前端组件路径（菜单用） */
  @Column({ length: 255, nullable: true })
  component: string;

  @Column({ length: 64, nullable: true })
  icon: string;

  @Column({ type: 'int', default: 0 })
  sort: number;

  /** 状态：0禁用 1正常 */
  @Column({ type: 'tinyint', default: 1 })
  status: number;

  // ---- 关联 ----
  @ManyToOne(() => Permission, (p) => p.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Permission | null;

  @OneToMany(() => Permission, (p) => p.parent)
  children: Permission[];

  @ManyToMany(() => Role, (r) => r.permissions)
  roles: Role[];
}

/* ============================= 角色-权限 关联 ============================= */
@Entity('role_permissions')
export class RolePermission {
  @PrimaryColumn({ type: 'bigint', unsigned: true, name: 'role_id' })
  roleId: number;

  @PrimaryColumn({ type: 'bigint', unsigned: true, name: 'permission_id' })
  permissionId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}

/* ============================= 管理员-角色 关联 ============================= */
@Entity('admin_user_roles')
export class AdminUserRole {
  @PrimaryColumn({ type: 'bigint', unsigned: true, name: 'admin_user_id' })
  adminUserId: number;

  @PrimaryColumn({ type: 'bigint', unsigned: true, name: 'role_id' })
  roleId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => AdminUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_user_id' })
  adminUser: AdminUser;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
