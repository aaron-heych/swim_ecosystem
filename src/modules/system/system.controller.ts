/**
 * 系统 C 端 Controller — Banner 列表 / 反馈提交 / 配置查询 / 短信验证码
 * 公开接口 @Public，写操作 @UseGuards(JwtAuthGuard)（反馈允许匿名）
 */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SystemService } from './system.service';
import { SmsService } from './sms.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { SendSmsDto } from './dto/send-sms.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('系统-小程序')
@Controller('api/system')
export class SystemController {
  constructor(
    private readonly systemService: SystemService,
    private readonly smsService: SmsService,
  ) {}

  /* ---------------------------- Banner ---------------------------- */

  @ApiOperation({ summary: 'Banner 列表' })
  @Get('banners')
  @Public()
  async banners(@Query('position') position?: string) {
    return this.systemService.findActiveBanners(position);
  }

  /* ---------------------------- 反馈 ---------------------------- */

  @ApiOperation({ summary: '提交用户反馈' })
  @Post('feedback')
  @Public() // 允许匿名提交；若携带登录态则记录 userId
  async feedback(
    @Body() dto: CreateFeedbackDto,
    @CurrentUser() user?: { userId?: number },
  ) {
    return this.systemService.createFeedback(user?.userId ?? null, dto);
  }

  /* ---------------------------- 配置查询 ---------------------------- */

  @Get('config/:key')
  @Public()
  async config(@Param('key') key: string) {
    return this.systemService.findPublicConfig(key);
  }

  /* ---------------------------- 短信验证码 ---------------------------- */

  @Post('sms/send')
  @Public()
  async sendSms(@Body() dto: SendSmsDto, @Ip() ip?: string) {
    return this.smsService.sendCode(dto, ip);
  }
}
