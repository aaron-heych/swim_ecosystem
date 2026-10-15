import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../decorators/current-user.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AdminJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();

    // 开发/联调开关：AUTH_DISABLED=true 时跳过登录校验，注入模拟超管
    if (process.env.AUTH_DISABLED === 'true') {
      request.user = {
        adminId: 1,
        username: 'admin',
        type: 'admin',
        roleCodes: ['super_admin'],
      } as JwtPayload;
      return true;
    }

    const auth = request.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) throw new UnauthorizedException('未登录');

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      if (payload.type !== 'admin') {
        throw new UnauthorizedException('无后台访问权限');
      }
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('登录已过期');
    }
  }
}
