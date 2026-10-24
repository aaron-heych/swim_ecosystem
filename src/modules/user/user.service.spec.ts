import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserService } from './user.service';

describe('UserService 管理员修改密码', () => {
  const admin = {
    id: 8,
    username: 'new_admin',
    realName: '测试管理员',
    avatarUrl: null,
    associationId: null,
    roles: [{ code: 'operator' }],
    needChangePassword: true,
    passwordHash: '',
  };
  const adminUserRepo = {
    findOne: jest.fn(),
    update: jest.fn(),
    save: jest.fn(async (value) => value),
  };
  const jwtService = {
    signAsync: jest.fn(async () => 'updated-token'),
  };
  let service: UserService;

  beforeEach(async () => {
    jest.clearAllMocks();
    admin.passwordHash = await bcrypt.hash('Initial8', 4);
    admin.needChangePassword = true;
    adminUserRepo.findOne.mockResolvedValue(admin);
    service = new UserService(
      {} as any,
      adminUserRepo as any,
      jwtService as any,
      {} as any,
      {} as any,
    );
  });

  it('验证旧密码，只更新密码字段并清除首次改密标记', async () => {
    const result = await service.changeAdminPassword(8, {
      currentPassword: 'Initial8',
      newPassword: 'Updated88',
    });

    expect(result.token).toBe('updated-token');
    expect(result.admin.needChangePassword).toBe(false);
    expect(adminUserRepo.update).toHaveBeenCalledWith(
      8,
      expect.objectContaining({ needChangePassword: false }),
    );
    const [, updateFields] = adminUserRepo.update.mock.calls[0];
    expect(updateFields.passwordHash).not.toBe('Updated88');
    await expect(bcrypt.compare('Updated88', updateFields.passwordHash)).resolves.toBe(true);
    expect(adminUserRepo.save).not.toHaveBeenCalled();
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ needChangePassword: false }),
    );
  });

  it('旧密码错误时不更新密码', async () => {
    await expect(
      service.changeAdminPassword(8, {
        currentPassword: 'WrongPass',
        newPassword: 'Updated88',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(adminUserRepo.update).not.toHaveBeenCalled();
    expect(adminUserRepo.save).not.toHaveBeenCalled();
  });

  it('拒绝新旧密码相同', async () => {
    await expect(
      service.changeAdminPassword(8, {
        currentPassword: 'Initial8',
        newPassword: 'Initial8',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(adminUserRepo.update).not.toHaveBeenCalled();
    expect(adminUserRepo.save).not.toHaveBeenCalled();
  });
});
