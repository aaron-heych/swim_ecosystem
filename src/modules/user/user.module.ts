import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User,
  AdminUser,
  Role,
  Permission,
  RolePermission,
  AdminUserRole,
} from './user.entity';
import { UserService } from './user.service';
import { RbacService } from './rbac.service';
import { UserController } from './user.controller';
import { UserAdminController } from './user.admin.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      AdminUser,
      Role,
      Permission,
      RolePermission,
      AdminUserRole,
    ]),
    CommonModule,
  ],
  controllers: [UserController, UserAdminController],
  providers: [UserService, RbacService],
  exports: [UserService, RbacService],
})
export class UserModule {}
