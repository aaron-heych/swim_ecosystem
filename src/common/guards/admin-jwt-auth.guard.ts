import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { JwtPayload } from '../decorators/current-user.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ALLOW_DURING_PASSWORD_CHANGE } from '../decorators/allow-during-password-change.decorator';

@Injectable()
export class AdminJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
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

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('登录已过期');
    }
    if (payload.type !== 'admin') {
      throw new UnauthorizedException('无后台访问权限');
    }
    if (!payload.adminId) {
      throw new UnauthorizedException('无效的管理员身份');
    }

    const roles: { code: string }[] = await this.dataSource.query(
      `SELECT r.code
       FROM admin_user_roles aur
       INNER JOIN roles r ON r.id = aur.role_id
       INNER JOIN admin_users a ON a.id = aur.admin_user_id
       WHERE a.id = ? AND a.status = 1 AND a.deleted_at IS NULL
         AND r.status = 1 AND r.deleted_at IS NULL`,
      [payload.adminId],
    );
    if (roles.length === 0) {
      throw new ForbiddenException('管理员账号已禁用、已删除或未分配有效角色');
    }
    payload.roleCodes = roles.map((role) => role.code);

    const canChangePassword = this.reflector.getAllAndOverride<boolean>(
      ALLOW_DURING_PASSWORD_CHANGE,
      [context.getHandler(), context.getClass()],
    );
    if (payload.needChangePassword && !canChangePassword) {
      throw new ForbiddenException('首次登录请先修改密码');
    }
    request.user = payload;
    return true;
  }
}
