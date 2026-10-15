import { Controller, Get, UseGuards } from '@nestjs/common';
import { WinterDashboardService } from './winter-dashboard.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

/**
 * 冬泳管理仪表盘（按角色返回不同数据范围）
 * GET /api/admin/winter-dashboard
 */
@Controller('api/admin/winter-dashboard')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class WinterDashboardController {
  constructor(private readonly dashboardService: WinterDashboardService) {}

  @Get()
  build(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.build(user);
  }
}
