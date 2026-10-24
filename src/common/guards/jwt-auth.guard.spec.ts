import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard 账号状态校验', () => {
  const request: any = { headers: { authorization: 'Bearer token' } };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as any;
  const jwtService = {
    verifyAsync: jest.fn(),
  };
  const dataSource = {
    query: jest.fn(),
  };
  let guard: JwtAuthGuard;
  let originalAuthDisabled: string | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    originalAuthDisabled = process.env.AUTH_DISABLED;
    delete process.env.AUTH_DISABLED;
    jwtService.verifyAsync.mockResolvedValue({
      type: 'user',
      userId: 12,
    });
    dataSource.query.mockResolvedValue([{ id: 12 }]);
    guard = new JwtAuthGuard(jwtService as any, dataSource as any);
  });

  afterEach(() => {
    if (originalAuthDisabled === undefined) {
      delete process.env.AUTH_DISABLED;
    } else {
      process.env.AUTH_DISABLED = originalAuthDisabled;
    }
  });

  it('允许有效账号通过并校验其未删除、已启用状态', async () => {
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('deleted_at IS NULL'),
      [12],
    );
    expect(request.user).toEqual({ type: 'user', userId: 12 });
  });

  it('注销或禁用后拒绝已有令牌', async () => {
    dataSource.query.mockResolvedValueOnce([]);

    await expect(guard.canActivate(context)).rejects.toThrow(
      '用户账号已注销或禁用',
    );
  });
});
