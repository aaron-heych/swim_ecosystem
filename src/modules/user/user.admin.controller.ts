import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';
import { RbacService } from './rbac.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { QueryAdminDto } from './dto/query-admin.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { ResetAdminPasswordDto } from './dto/reset-admin-password.dto';
import { UpdateAdminRolesDto } from './dto/update-admin-roles.dto';
import { UpdateAdminUserStatusDto } from './dto/update-admin-status.dto';
import { ChangeAdminPasswordDto } from './dto/change-admin-password.dto';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Public } from '../../common/decorators/public.decorator';
import { AllowDuringPasswordChange } from '../../common/decorators/allow-during-password-change.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

@ApiTags('用户-管理后台')
@ApiBearerAuth('JWT')
@Controller('api/admin')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class UserAdminController {
  constructor(
    private readonly userService: UserService,
    private readonly rbacService: RbacService,
  ) {}

  /* ============== 后台账号登录 ============== */

  /** 1. 后台登录（免登录） */
  @Public()
  @Post('user/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '管理员登录' })
  adminLogin(@Body() dto: AdminLoginDto, @Req() req: Request) {
    return this.userService.adminLogin(dto, this.clientIp(req));
  }

  /** 管理员修改自己的密码（首次登录强制修改） */
  @Put('user/change-password')
  @AllowDuringPasswordChange()
  @ApiOperation({ summary: '管理员修改自己的密码' })
  changeAdminPassword(
    @Body() dto: ChangeAdminPasswordDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.userService.changeAdminPassword(Number(user.adminId), dto);
  }

  /* ============== C 端用户管理 ============== */

  /** 2. C 端用户分页列表 */
  @Get('user/list')
  @ApiOperation({ summary: 'C端用户分页列表' })
  findUserList(@Query() dto: QueryUserDto) {
    return this.rbacService.findUserList(dto);
  }

  /** 3. 修改用户状态 */
  @Put('user/:id/status')
  @RequirePermissions('user:status')
  @ApiOperation({ summary: '修改用户状态' })
  @ApiParam({ name: 'id', description: '用户ID' })
  updateUserStatus(
    @Param('id') id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.rbacService.updateUserStatus(Number(id), dto);
  }

  /** 管理员逻辑删除 C 端用户 */
  @Delete('user/:id')
  @RequirePermissions('user:status')
  @ApiOperation({ summary: '逻辑删除 C 端用户' })
  deleteUser(
    @Param('id') id: number,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    return this.rbacService.deleteUser(
      Number(id),
      Number(user.adminId),
      user.username ?? '',
      this.clientIp(req),
    );
  }

  /* ===================== RBAC：权限 ===================== */

  /** 1. 权限树 */
  @Get('rbac/permissions')
  @ApiTags('角色权限-管理后台')
  @ApiOperation({ summary: '获取权限树' })
  getPermissionTree() {
    return this.rbacService.getPermissionTree();
  }

  /** 2. 创建权限 */
  @Post('rbac/permission')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('rbac:permission:create')
  @ApiTags('角色权限-管理后台')
  @ApiOperation({ summary: '创建权限' })
  createPermission(@Body() dto: CreatePermissionDto) {
    return this.rbacService.createPermission(dto);
  }

  /** 3. 更新权限 */
  @Put('rbac/permission/:id')
  @RequirePermissions('rbac:permission:update')
  @ApiTags('角色权限-管理后台')
  @ApiOperation({ summary: '更新权限' })
  @ApiParam({ name: 'id', description: '权限ID' })
  updatePermission(
    @Param('id') id: number,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.rbacService.updatePermission(Number(id), dto);
  }

  /** 4. 删除权限 */
  @Delete('rbac/permission/:id')
  @RequirePermissions('rbac:permission:delete')
  @ApiTags('角色权限-管理后台')
  @ApiOperation({ summary: '删除权限' })
  @ApiParam({ name: 'id', description: '权限ID' })
  deletePermission(@Param('id') id: number) {
    return this.rbacService.deletePermission(Number(id));
  }

  /* ===================== RBAC：角色 ===================== */

  /** 5. 角色分页列表 */
  @Get('rbac/roles')
  @ApiTags('角色权限-管理后台')
  @ApiOperation({ summary: '角色分页列表' })
  findRoleList(@Query() dto: QueryRoleDto) {
    return this.rbacService.findRoleList(dto);
  }

  /** 6. 创建角色 */
  @Post('rbac/role')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('rbac:role:create')
  @ApiTags('角色权限-管理后台')
  @ApiOperation({ summary: '创建角色' })
  createRole(@Body() dto: CreateRoleDto) {
    return this.rbacService.createRole(dto);
  }

  /** 7. 更新角色基本信息 */
  @Put('rbac/role/:id')
  @RequirePermissions('rbac:role:update')
  @ApiTags('角色权限-管理后台')
  @ApiOperation({ summary: '更新角色基本信息' })
  @ApiParam({ name: 'id', description: '角色ID' })
  updateRole(@Param('id') id: number, @Body() dto: UpdateRoleDto) {
    return this.rbacService.updateRole(Number(id), dto);
  }

  /** 8. 更新角色权限 */
  @Put('rbac/role/:id/permissions')
  @RequirePermissions('rbac:role:permission')
  @ApiTags('角色权限-管理后台')
  @ApiOperation({ summary: '更新角色权限' })
  @ApiParam({ name: 'id', description: '角色ID' })
  updateRolePermissions(
    @Param('id') id: number,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.rbacService.updateRolePermissions(Number(id), dto);
  }

  /** 9. 删除角色 */
  @Delete('rbac/role/:id')
  @RequirePermissions('rbac:role:delete')
  @ApiTags('角色权限-管理后台')
  @ApiOperation({ summary: '删除角色' })
  @ApiParam({ name: 'id', description: '角色ID' })
  deleteRole(
    @Param('id') id: number,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    return this.rbacService.deleteRole(
      Number(id),
      Number(user.adminId),
      user.username ?? '',
      this.clientIp(req),
    );
  }

  /* ===================== RBAC：管理员 ===================== */

  /** 10. 管理员分页列表 */
  @Get('rbac/admins')
  @ApiTags('角色权限-管理后台')
  @ApiOperation({ summary: '管理员分页列表' })
  findAdminList(@Query() dto: QueryAdminDto) {
    return this.rbacService.findAdminList(dto);
  }

  /** 11. 创建管理员 */
  @Post('rbac/admin')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('rbac:admin:create')
  @ApiTags('角色权限-管理后台')
  @ApiOperation({ summary: '创建管理员' })
  createAdmin(
    @Body() dto: CreateAdminDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    return this.rbacService.createAdmin(
      dto,
      Number(user.adminId),
      user.username ?? '',
      this.clientIp(req),
    );
  }

  /** 12. 更新管理员基本信息 */
  @Put('rbac/admin/:id')
  @RequirePermissions('rbac:admin:update')
  @ApiTags('角色权限-管理后台')
  @ApiOperation({ summary: '更新管理员基本信息' })
  @ApiParam({ name: 'id', description: '管理员ID' })
  updateAdmin(
    @Param('id') id: number,
    @Body() dto: UpdateAdminDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    return this.rbacService.updateAdmin(
      Number(id),
      dto,
      Number(user.adminId),
      user.username ?? '',
      this.clientIp(req),
    );
  }

  /** 13. 重置管理员密码 */
  @Put('rbac/admin/:id/password')
  @RequirePermissions('rbac:admin:password')
  @ApiTags('角色权限-管理后台')
  @ApiOperation({ summary: '重置管理员密码' })
  @ApiParam({ name: 'id', description: '管理员ID' })
  resetAdminPassword(
    @Param('id') id: number,
    @Body() dto: ResetAdminPasswordDto,
  ) {
    return this.rbacService.resetAdminPassword(Number(id), dto);
  }

  /** 14. 更新管理员角色 */
  @Put('rbac/admin/:id/roles')
  @RequirePermissions('rbac:admin:role')
  @ApiTags('角色权限-管理后台')
  @ApiOperation({ summary: '更新管理员角色' })
  @ApiParam({ name: 'id', description: '管理员ID' })
  updateAdminRoles(
    @Param('id') id: number,
    @Body() dto: UpdateAdminRolesDto,
  ) {
    return this.rbacService.updateAdminRoles(Number(id), dto);
  }

  /** 15. 启用/禁用管理员 */
  @Put('rbac/admin/:id/status')
  @RequirePermissions('rbac:admin:status')
  @ApiTags('角色权限-管理后台')
  @ApiOperation({ summary: '启用/禁用管理员' })
  @ApiParam({ name: 'id', description: '管理员ID' })
  updateAdminStatus(
    @Param('id') id: number,
    @Body() dto: UpdateAdminUserStatusDto,
  ) {
    return this.rbacService.updateAdminStatus(Number(id), dto);
  }

  /** 16. 删除管理员 */
  @Delete('rbac/admin/:id')
  @RequirePermissions('rbac:admin:delete')
  @ApiTags('角色权限-管理后台')
  @ApiOperation({ summary: '删除管理员' })
  @ApiParam({ name: 'id', description: '管理员ID' })
  deleteAdmin(
    @Param('id') id: number,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    return this.rbacService.deleteAdmin(
      Number(id),
      Number(user.adminId),
      user.username ?? '',
      this.clientIp(req),
    );
  }

  private clientIp(req: Request): string | undefined {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip ?? undefined;
  }
}
