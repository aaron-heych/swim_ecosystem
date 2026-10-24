import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { JwtPayload } from '../decorators/current-user.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 开发/联调开关：AUTH_DISABLED=true 时跳过登录校验，注入模拟用户
    if (process.env.AUTH_DISABLED === 'true') {
      request.user = { userId: 1, type: 'user' } as JwtPayload;
      return true;
    }

    const auth = request.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) throw new UnauthorizedException('未登录');
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('登录已过期');
    }
    if (payload.type !== 'user' || !payload.userId) {
      throw new UnauthorizedException('无效的访问令牌');
    }

    const users: { id: number }[] = await this.dataSource.query(
      'SELECT id FROM users WHERE id = ? AND status = 1 AND deleted_at IS NULL',
      [payload.userId],
    );
    if (users.length === 0) {
      throw new UnauthorizedException('用户账号已注销或禁用');
    }
    request.user = payload;
    return true;
  }
}
