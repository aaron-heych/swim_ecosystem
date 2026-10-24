import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AdminUser, AdminUserRole, Role, User } from './user.entity';
import { OperationLog } from '../system/system.entity';
import { RbacService } from './rbac.service';

describe('RbacService 删除管理员', () => {
  let service: RbacService;
  let admin: { id: number; roles: Role[] } | null;
  let superAdminCount: number;
  const adminRepo = {
    findOne: jest.fn(async () => admin),
    createQueryBuilder: jest.fn(() => ({
      innerJoin: jest.fn().mockReturnThis(),
      getCount: jest.fn(async () => superAdminCount),
    })),
    delete: jest.fn(),
    softDelete: jest.fn(),
    create: jest.fn((values) => values),
    save: jest.fn(async (values) => ({ id: 7, ...values })),
  };
  const roleRepo = {
    findOne: jest.fn(async () => ({ id: 9, code: 'super_admin' })),
    count: jest.fn(async () => 0),
  };
  const manager = {
    findOne: jest.fn(
      async (): Promise<any> => ({ id: 6, code: 'operator', name: '运营' }),
    ),
    count: jest.fn(async () => 0),
    create: jest.fn((_entity, value) => value),
    getRepository: jest.fn((entity) =>
      entity === AdminUser ? adminRepo : roleRepo,
    ),
    save: jest.fn(async (_entity, value) => ({ id: 7, ...value })),
    update: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    insert: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn(async (callback) => callback(manager)),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    admin = { id: 2, roles: [] };
    superAdminCount = 2;
    service = new RbacService(
      {} as any,
      adminRepo as any,
      roleRepo as any,
      {} as any,
      {} as any,
      {} as any,
      dataSource as any,
    );
  });

  it('拒绝删除当前登录的管理员', async () => {
    await expect(service.deleteAdmin(2, 2)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('逻辑删除管理员并保留角色关联', async () => {
    await expect(service.deleteAdmin(2, 1)).resolves.toEqual({
      success: true,
    });
    expect(manager.delete).not.toHaveBeenCalledWith(AdminUserRole, {
      adminUserId: 2,
    });
    expect(adminRepo.softDelete).toHaveBeenCalledWith({ id: 2 });
  });

  it('拒绝删除最后一个超级管理员', async () => {
    admin = { id: 2, roles: [{ code: 'super_admin' } as Role] };
    superAdminCount = 1;

    await expect(service.deleteAdmin(2, 1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(adminRepo.softDelete).not.toHaveBeenCalled();
  });

  it('禁止删除仍有关联管理员的角色', async () => {
    manager.count.mockResolvedValueOnce(1);

    await expect(service.deleteRole(6, 1)).rejects.toThrow(
      '该角色下仍有绑定用户，请先解除绑定或禁用角色。',
    );
    expect(manager.softDelete).not.toHaveBeenCalled();
  });

  it('无绑定管理员的角色采用逻辑删除', async () => {
    await expect(service.deleteRole(6, 1)).resolves.toEqual({ success: true });
    expect(manager.softDelete).toHaveBeenCalledWith(Role, 6);
    expect(manager.save).toHaveBeenCalledWith(
      OperationLog,
      expect.objectContaining({
        module: 'rbac',
        action: 'delete',
        params: expect.stringContaining('"roleId":6'),
      }),
    );
  });

  it('软删除 C 端用户、禁用账号并记录操作者', async () => {
    manager.findOne.mockResolvedValueOnce({
      id: 12,
      nickname: '用户昵称',
    } as User);

    await expect(service.deleteUser(12, 1, 'admin')).resolves.toEqual({
      success: true,
    });
    expect(manager.update).toHaveBeenCalledWith(User, 12, { status: 0 });
    expect(manager.softDelete).toHaveBeenCalledWith(User, 12);
    expect(manager.save).toHaveBeenCalledWith(
      OperationLog,
      expect.objectContaining({
        adminId: 1,
        username: 'admin',
        module: 'user',
        action: 'delete',
      }),
    );
  });

  it('创建管理员时保存初始密码哈希并记录新增审计日志', async () => {
    adminRepo.findOne.mockResolvedValueOnce(null);
    roleRepo.count.mockResolvedValueOnce(1);

    const result = await service.createAdmin(
      {
        username: 'new_admin',
        realName: '测试管理员',
        roleIds: [4],
      } as any,
      1,
      'operator',
    );

    expect(result.initialPassword).toHaveLength(8);
    expect(result.needChangePassword).toBe(true);
    const savedHash = manager.save.mock.calls[0][1].passwordHash;
    expect(savedHash).not.toBe(result.initialPassword);
    await expect(bcrypt.compare(result.initialPassword, savedHash)).resolves.toBe(
      true,
    );
    expect(manager.save.mock.calls[0][1].needChangePassword).toBe(true);
    expect(manager.insert).toHaveBeenCalledWith(
      AdminUserRole,
      expect.arrayContaining([
        expect.objectContaining({ adminUserId: 7, roleId: 4 }),
      ]),
    );
    expect(manager.save).toHaveBeenCalledWith(
      OperationLog,
      expect.objectContaining({
        module: 'rbac',
        action: 'create',
        targetType: 'admin',
        targetId: 7,
        targetName: 'new_admin',
      }),
    );
    expect(
      manager.save.mock.calls[1][1].params,
    ).not.toContain(result.initialPassword);
  });

  it('编辑管理员时同时全量替换角色关联', async () => {
    adminRepo.findOne.mockResolvedValueOnce({
      id: 7,
      username: 'target_admin',
      roles: [],
    } as any);
    roleRepo.count.mockResolvedValueOnce(1);

    await expect(
      service.updateAdmin(7, {
        realName: '新姓名',
        phone: '13800138000',
        roleIds: [4],
      }, 1, 'operator', '127.0.0.1'),
    ).resolves.toEqual({ id: 7, roleIds: [4] });

    expect(manager.update).toHaveBeenCalledWith(
      AdminUser,
      { id: 7 },
      { realName: '新姓名', phone: '13800138000' },
    );
    expect(manager.delete).toHaveBeenCalledWith(AdminUserRole, {
      adminUserId: 7,
    });
    expect(manager.insert).toHaveBeenCalledWith(
      AdminUserRole,
      expect.arrayContaining([
        expect.objectContaining({ adminUserId: 7, roleId: 4 }),
      ]),
    );
    expect(manager.save).toHaveBeenCalledWith(
      OperationLog,
      expect.objectContaining({
        adminId: 1,
        username: 'operator',
        module: 'rbac',
        action: 'update',
        targetType: 'admin',
        targetId: 7,
        targetName: 'target_admin',
        ip: '127.0.0.1',
        params: JSON.stringify({
          adminId: 7,
          changedFields: ['realName', 'phone', 'roleIds'],
        }),
      }),
    );
  });
});
