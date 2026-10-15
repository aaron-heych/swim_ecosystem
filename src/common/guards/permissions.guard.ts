import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { JwtPayload } from '../decorators/current-user.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 开发/联调开关：AUTH_DISABLED=true 时跳过权限校验
    if (process.env.AUTH_DISABLED === 'true') return true;

    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;
    if (!user) throw new ForbiddenException('无权限访问');

    if (user.roleCodes?.includes('super_admin')) return true;

    // 冬泳管理者：在冬泳协会领域拥有最大权限，放行所有 association:* 权限码
    if (user.roleCodes?.includes('swimming_admin')) {
      const allAssociation = required.every((p) => p.startsWith('association'));
      const announcementManagement = required.every(
        (p) => p === 'notification:manage',
      );
      if (allAssociation || announcementManagement) return true;
    }

    // 协会会长：仅能管理自己所属协会的会员，放行 association:member:* 权限码（不能创建/审核协会）
    if (user.roleCodes?.includes('swimming_sub_admin')) {
      const allMemberOps = required.every((p) =>
        p.startsWith('association:member'),
      );
      const announcementManagement = required.every(
        (p) => p === 'notification:manage',
      );
      if (allMemberOps || announcementManagement) return true;
    }

    const hasAll = required.every((p) =>
      user.roleCodes?.some((c) => c === p || c.startsWith(`${p}:`)),
    );
    if (!hasAll) {
      throw new ForbiddenException('权限不足');
    }
    return true;
  }
}
