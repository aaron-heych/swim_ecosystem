import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
  userId?: number;
  adminId?: number;
  username?: string;
  roleCodes?: string[];
  associationId?: number;
  type?: 'user' | 'admin';
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;
    return data ? user?.[data] : user;
  },
);
