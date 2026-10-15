import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';
import { WxLoginDto } from './dto/wx-login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { BindPhoneDto } from './dto/bind-phone.dto';
import { BindIdCardDto } from './dto/bind-id-card.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiTags('用户-小程序')
@ApiBearerAuth('JWT')
@Controller('api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /** 1. 微信小程序登录（免登录） */
  @Public()
  @Post('wx-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '微信小程序登录' })
  wxLogin(@Body() dto: WxLoginDto, @Req() req: Request) {
    return this.userService.wxLogin(dto, this.clientIp(req));
  }

  /** 2. 获取当前用户资料 */
  @Get('profile')
  @ApiOperation({ summary: '获取当前用户资料' })
  getProfile(@CurrentUser('userId') userId: number) {
    return this.userService.getProfile(userId);
  }

  /** 3. 更新资料 */
  @Put('profile')
  @ApiOperation({ summary: '更新当前用户资料' })
  updateProfile(
    @CurrentUser('userId') userId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(userId, dto);
  }

  /** 4. 绑定手机号 */
  @Post('bind-phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '绑定手机号' })
  bindPhone(
    @CurrentUser('userId') userId: number,
    @Body() dto: BindPhoneDto,
  ) {
    return this.userService.bindPhone(userId, dto);
  }

  /** 5. 实名认证（绑定身份证） */
  @Post('bind-id-card')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '实名认证（绑定身份证）' })
  bindIdCard(
    @CurrentUser('userId') userId: number,
    @Body() dto: BindIdCardDto,
  ) {
    return this.userService.bindIdCard(userId, dto);
  }

  /** 6. 注销账号 */
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '注销账号' })
  deactivate(@CurrentUser('userId') userId: number) {
    return this.userService.deactivate(userId);
  }

  private clientIp(req: Request): string | undefined {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip ?? undefined;
  }
}
