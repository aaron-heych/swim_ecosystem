import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { WxUtil } from './utils/wx.util';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'swim-ecosystem-jwt-secret-dev',
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  providers: [
    JwtAuthGuard,
    AdminJwtAuthGuard,
    PermissionsGuard,
    TransformInterceptor,
    HttpExceptionFilter,
    WxUtil,
  ],
  exports: [
    JwtModule,
    JwtAuthGuard,
    AdminJwtAuthGuard,
    PermissionsGuard,
    TransformInterceptor,
    HttpExceptionFilter,
    WxUtil,
  ],
})
export class CommonModule {}
