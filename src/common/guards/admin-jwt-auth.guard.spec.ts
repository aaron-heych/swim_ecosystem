import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import { ALLOW_DURING_PASSWORD_CHANGE } from '../decorators/allow-during-password-change.decorator';

describe('AdminJwtAuthGuard 首次登录改密限制', () => {
  const handler = {};
  const controller = {};
  let request: any;
  let allowPasswordChange: boolean;
  let originalAuthDisabled: string | undefined;
  let guard: AdminJwtAuthGuard;
  const jwtService = {
    verifyAsync: jest.fn(),
  };
  const dataSource = {
    query: jest.fn().mockResolvedValue([{ code: 'super_admin' }]),
  };
  const reflector = {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === ALLOW_DURING_PASSWORD_CHANGE) return allowPasswordChange;
      return false;
    }),
  } as unknown as Reflector;
  const context = {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => request }),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    originalAuthDisabled = process.env.AUTH_DISABLED;
    delete process.env.AUTH_DISABLED;
    allowPasswordChange = false;
    request = { headers: { authorization: 'Bearer valid-token' } };
    jwtService.verifyAsync.mockResolvedValue({
      type: 'admin',
      adminId: 4,
      needChangePassword: true,
    });
    guard = new AdminJwtAuthGuard(jwtService as any, reflector, dataSource as any);
  });

  afterEach(() => {
    if (originalAuthDisabled === undefined) {
      delete process.env.AUTH_DISABLED;
    } else {
      process.env.AUTH_DISABLED = originalAuthDisabled;
    }
  });

  it('阻止首次登录改密前访问其他后台接口', async () => {
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(request.user).toBeUndefined();
  });

  it('允许首次登录管理员访问带白名单标记的改密接口', async () => {
    allowPasswordChange = true;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user.needChangePassword).toBe(true);
  });

  it('禁用或逻辑删除所有角色后拒绝继续使用旧令牌', async () => {
    dataSource.query.mockResolvedValueOnce([]);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
