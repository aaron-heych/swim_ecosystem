import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import {
  User,
  AdminUser,
  Role,
  Permission,
  RolePermission,
  AdminUserRole,
} from './user.entity';
import {
  paginate,
  PaginatedResult,
} from '../../common/dto/pagination.dto';
import { maskPhone } from '../../common/utils/aes.util';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { QueryAdminDto } from './dto/query-admin.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { ResetAdminPasswordDto } from './dto/reset-admin-password.dto';
import { UpdateAdminRolesDto } from './dto/update-admin-roles.dto';
import { UpdateAdminUserStatusDto } from './dto/update-admin-status.dto';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AdminUser)
    private readonly adminUserRepo: Repository<AdminUser>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
    @InjectRepository(AdminUserRole)
    private readonly adminUserRoleRepo: Repository<AdminUserRole>,
    private readonly dataSource: DataSource,
  ) {}

  /* ============================= C 端用户管理 ============================= */

  /** C 端用户分页列表（含 keyword 搜 nickname/phone + status 过滤） */
  async findUserList(dto: QueryUserDto): Promise<PaginatedResult<any>> {
    const qb = this.userRepo.createQueryBuilder('u');
    if (dto.keyword) {
      qb.andWhere(
        '(u.nickname LIKE :kw OR u.phone LIKE :kw OR u.real_name LIKE :kw)',
        { kw: `%${dto.keyword}%` },
      );
    }
    if (dto.status !== undefined && dto.status !== null) {
      qb.andWhere('u.status = :status', { status: dto.status });
    }
    qb.orderBy('u.id', 'DESC');
    qb.skip((dto.page - 1) * dto.pageSize).take(dto.pageSize);
    const [list, total] = await qb.getManyAndCount();
    return paginate(
      list.map((u) => this.toAdminUserView(u)),
      total,
      dto.page,
      dto.pageSize,
    );
  }

  /** 修改 C 端用户状态 */
  async updateUserStatus(id: number, dto: UpdateUserStatusDto) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    user.status = dto.status;
    await this.userRepo.save(user);
    return { id, status: user.status };
  }

  /* ============================= 权限 ============================= */

  /** 权限树 */
  async getPermissionTree(): Promise<any[]> {
    const all = await this.permissionRepo.find({
      order: { sort: 'ASC', id: 'ASC' },
    });
    return this.buildPermissionTree(all, 0);
  }

  /** 创建权限 */
  async createPermission(dto: CreatePermissionDto) {
    const exists = await this.permissionRepo.findOne({
      where: { code: dto.code },
      select: ['id'],
    });
    if (exists) throw new ConflictException('权限编码已存在');

    const perm = this.permissionRepo.create({
      parentId: dto.parentId ?? 0,
      type: dto.type,
      code: dto.code,
      name: dto.name,
      path: dto.path ?? null,
      component: dto.component ?? null,
      icon: dto.icon ?? null,
      sort: dto.sort ?? 0,
      status: dto.status ?? 1,
    });
    return this.permissionRepo.save(perm);
  }

  /** 更新权限 */
  async updatePermission(id: number, dto: UpdatePermissionDto) {
    const perm = await this.permissionRepo.findOne({ where: { id } });
    if (!perm) throw new NotFoundException('权限不存在');
    Object.assign(perm, dto);
    await this.permissionRepo.save(perm);
    return perm;
  }

  /** 删除权限 */
  async deletePermission(id: number) {
    const perm = await this.permissionRepo.findOne({ where: { id } });
    if (!perm) throw new NotFoundException('权限不存在');
    // 检查是否有子节点
    const childCount = await this.permissionRepo.count({
      where: { parentId: id },
    });
    if (childCount > 0) {
      throw new BadRequestException('该权限下存在子节点，请先删除子节点');
    }
    // 删除关联表
    await this.rolePermissionRepo.delete({ permissionId: id });
    await this.permissionRepo.delete(id);
    return { success: true };
  }

  private buildPermissionTree(all: Permission[], parentId: number): any[] {
    return all
      .filter((p) => Number(p.parentId) === parentId)
      .map((p) => ({
        id: p.id,
        parentId: Number(p.parentId),
        type: p.type,
        code: p.code,
        name: p.name,
        path: p.path,
        component: p.component,
        icon: p.icon,
        sort: p.sort,
        status: p.status,
        children: this.buildPermissionTree(all, Number(p.id)),
      }));
  }

  /* ============================= 角色 ============================= */

  /** 角色分页列表 */
  async findRoleList(dto: QueryRoleDto): Promise<PaginatedResult<any>> {
    const qb = this.roleRepo.createQueryBuilder('r');
    if (dto.keyword) {
      qb.andWhere('(r.name LIKE :kw OR r.code LIKE :kw)', {
        kw: `%${dto.keyword}%`,
      });
    }
    if (dto.status !== undefined && dto.status !== null) {
      qb.andWhere('r.status = :status', { status: dto.status });
    }
    qb.orderBy('r.sort', 'ASC').addOrderBy('r.id', 'ASC');
    qb.skip((dto.page - 1) * dto.pageSize).take(dto.pageSize);
    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, dto.page, dto.pageSize);
  }

  /** 创建角色 */
  async createRole(dto: CreateRoleDto) {
    const exists = await this.roleRepo.findOne({
      where: { code: dto.code },
      select: ['id'],
    });
    if (exists) throw new ConflictException('角色编码已存在');

    const role = this.roleRepo.create({
      code: dto.code,
      name: dto.name,
      description: dto.description ?? null,
      sort: dto.sort ?? 0,
      status: dto.status ?? 1,
    });
    return this.roleRepo.save(role);
  }

  /** 更新角色基本信息 */
  async updateRole(id: number, dto: UpdateRoleDto) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('角色不存在');
    Object.assign(role, dto);
    await this.roleRepo.save(role);
    return role;
  }

  /** 更新角色权限（全量替换 role_permissions） */
  async updateRolePermissions(id: number, dto: UpdateRolePermissionsDto) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('角色不存在');

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(RolePermission, { roleId: id });
      const rows = dto.permissionIds.map((pid) => {
        const rp = new RolePermission();
        rp.roleId = id;
        rp.permissionId = pid;
        return rp;
      });
      if (rows.length > 0) {
        await manager.insert(RolePermission, rows);
      }
    });
    return { roleId: id, permissionIds: dto.permissionIds };
  }

  /** 删除角色 */
  async deleteRole(id: number) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('角色不存在');
    if (role.code === 'super_admin') {
      throw new BadRequestException('内置超级管理员角色不可删除');
    }
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(RolePermission, { roleId: id });
      await manager.delete(AdminUserRole, { roleId: id });
      await manager.delete(Role, { id });
    });
    return { success: true };
  }

  /* ============================= 管理员 ============================= */

  /** 管理员分页列表 */
  async findAdminList(dto: QueryAdminDto): Promise<PaginatedResult<any>> {
    const qb = this.adminUserRepo.createQueryBuilder('a');
    if (dto.keyword) {
      qb.andWhere('(a.username LIKE :kw OR a.real_name LIKE :kw OR a.phone LIKE :kw)', {
        kw: `%${dto.keyword}%`,
      });
    }
    if (dto.status !== undefined && dto.status !== null) {
      qb.andWhere('a.status = :status', { status: dto.status });
    }
    qb.leftJoinAndSelect('a.roles', 'role');
    qb.orderBy('a.id', 'DESC');
    qb.skip((dto.page - 1) * dto.pageSize).take(dto.pageSize);
    const [list, total] = await qb.getManyAndCount();
    return paginate(
      list.map((a) => this.toAdminAdminView(a)),
      total,
      dto.page,
      dto.pageSize,
    );
  }

  /** 创建管理员 */
  async createAdmin(dto: CreateAdminDto) {
    const exists = await this.adminUserRepo.findOne({
      where: { username: dto.username },
      select: ['id'],
    });
    if (exists) throw new ConflictException('用户名已存在');

    // 校验角色
    if (dto.roleIds?.length) {
      const roleCount = await this.roleRepo.count({
        where: { id: In(dto.roleIds) },
      });
      if (roleCount !== dto.roleIds.length) {
        throw new BadRequestException('部分角色不存在');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const admin = this.adminUserRepo.create({
      username: dto.username,
      passwordHash,
      realName: dto.realName,
      avatarUrl: dto.avatarUrl ?? null,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      status: dto.status ?? 1,
    });
    const saved = await this.adminUserRepo.save(admin);

    if (dto.roleIds?.length) {
      await this.dataSource.transaction(async (manager) => {
        const rows = dto.roleIds.map((rid) => {
          const aur = new AdminUserRole();
          aur.adminUserId = saved.id;
          aur.roleId = rid;
          return aur;
        });
        await manager.insert(AdminUserRole, rows);
      });
    }
    return { id: saved.id, username: saved.username };
  }

  /** 更新管理员基本信息 */
  async updateAdmin(id: number, dto: UpdateAdminDto) {
    const admin = await this.adminUserRepo.findOne({ where: { id } });
    if (!admin) throw new NotFoundException('管理员不存在');
    Object.assign(admin, dto);
    await this.adminUserRepo.save(admin);
    return { id };
  }

  /** 重置管理员密码 */
  async resetAdminPassword(id: number, dto: ResetAdminPasswordDto) {
    const admin = await this.adminUserRepo.findOne({ where: { id } });
    if (!admin) throw new NotFoundException('管理员不存在');
    admin.passwordHash = await bcrypt.hash(dto.password, 10);
    await this.adminUserRepo.save(admin);
    return { success: true };
  }

  /** 更新管理员角色（全量替换 admin_user_roles） */
  async updateAdminRoles(id: number, dto: UpdateAdminRolesDto) {
    const admin = await this.adminUserRepo.findOne({ where: { id } });
    if (!admin) throw new NotFoundException('管理员不存在');

    const roleCount = await this.roleRepo.count({
      where: { id: In(dto.roleIds) },
    });
    if (roleCount !== dto.roleIds.length) {
      throw new BadRequestException('部分角色不存在');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(AdminUserRole, { adminUserId: id });
      const rows = dto.roleIds.map((rid) => {
        const aur = new AdminUserRole();
        aur.adminUserId = id;
        aur.roleId = rid;
        return aur;
      });
      await manager.insert(AdminUserRole, rows);
    });
    return { adminId: id, roleIds: dto.roleIds };
  }

  /** 启用/禁用管理员 */
  async updateAdminStatus(id: number, dto: UpdateAdminUserStatusDto) {
    const admin = await this.adminUserRepo.findOne({ where: { id } });
    if (!admin) throw new NotFoundException('管理员不存在');
    admin.status = dto.status;
    await this.adminUserRepo.save(admin);
    return { id, status: admin.status };
  }

  /* ============================= 视图工具 ============================= */

  private toAdminUserView(u: User) {
    return {
      id: u.id,
      openid: u.openid,
      phone: u.phone ? maskPhone(u.phone) : null,
      nickname: u.nickname,
      avatarUrl: u.avatarUrl,
      gender: u.gender,
      realName: u.realName,
      birthday: u.birthday,
      province: u.province,
      city: u.city,
      district: u.district,
      swimLevel: u.swimLevel,
      status: u.status,
      registerSource: u.registerSource,
      lastLoginAt: u.lastLoginAt,
      lastLoginIp: u.lastLoginIp,
      createdAt: u.createdAt,
    };
  }

  private toAdminAdminView(a: AdminUser) {
    return {
      id: a.id,
      username: a.username,
      realName: a.realName,
      avatarUrl: a.avatarUrl,
      phone: a.phone ? maskPhone(a.phone) : null,
      email: a.email,
      status: a.status,
      roles: (a.roles ?? []).map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
      })),
      lastLoginAt: a.lastLoginAt,
      lastLoginIp: a.lastLoginIp,
      createdAt: a.createdAt,
    };
  }
}
