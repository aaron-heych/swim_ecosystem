/**
 * 短信验证码服务
 * 1. sendCode：生成 6 位验证码 → hashSmsCode 存储 → 60s 内防重复 → 调用第三方短信 API（TODO，目前只 log）
 * 2. verifyCode：校验通过后置 used=1
 *
 * 配置：SmsCode 表（phone/scene/codeHash/ip?/used/expiresAt）
 * 工具：generateSmsCode / hashSmsCode / verifySmsCode
 */
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsCode } from './system.entity';
import { SendSmsDto } from './dto/send-sms.dto';
import { VerifySmsDto } from './dto/verify-sms.dto';
import {
  generateSmsCode,
  hashSmsCode,
  verifySmsCode,
} from '../../common/utils/sms-code.util';

const SMS_CODE_TTL_MIN = 10; // 验证码有效期 10 分钟
const SMS_CODE_RESEND_SEC = 60; // 同手机号 + 场景 60s 内不可重发

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    @InjectRepository(SmsCode)
    private readonly smsRepo: Repository<SmsCode>,
  ) {}

  /** 发送短信验证码 */
  async sendCode(dto: SendSmsDto, ip?: string): Promise<{ success: true }> {
    const scene = dto.scene ?? 'login';
    // 60s 内防重复发送：取最新一条同手机号+场景的记录，判断是否在重发窗口内
    const recent = await this.smsRepo.findOne({
      where: {
        phone: dto.phone,
        scene,
      },
      order: { createdAt: 'DESC' },
    });
    if (recent) {
      const elapsed = (Date.now() - recent.createdAt.getTime()) / 1000;
      if (elapsed < SMS_CODE_RESEND_SEC) {
        throw new BadRequestException('验证码发送过于频繁，请稍后再试');
      }
    }

    // 生成 + 哈希存储
    const code = generateSmsCode();
    const codeHash = hashSmsCode(code);
    const expiresAt = new Date(Date.now() + SMS_CODE_TTL_MIN * 60 * 1000);

    await this.smsRepo.save(
      this.smsRepo.create({
        phone: dto.phone,
        scene,
        codeHash,
        ip: ip ?? null,
        used: 0,
        expiresAt,
      }),
    );

    // TODO: 接入第三方短信 API（如阿里云 / 腾讯云 / 容联云）
    // 现阶段仅 log 用于联调，生产环境必须接入真实短信通道
    this.logger.log(`[SMS-DEV] ${dto.phone} (${scene}) 验证码: ${code}`);

    return { success: true };
  }

  /** 校验短信验证码（通过后置 used=1） */
  async verifyCode(dto: VerifySmsDto): Promise<boolean> {
    const scene = dto.scene ?? 'login';
    // 取最新一条未使用且未过期的记录
    const record = await this.smsRepo.findOne({
      where: {
        phone: dto.phone,
        scene,
        used: 0,
      },
      order: { createdAt: 'DESC' },
    });

    if (!record) {
      throw new BadRequestException('验证码不存在或已使用');
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('验证码已过期');
    }
    if (!verifySmsCode(dto.code, record.codeHash)) {
      throw new BadRequestException('验证码不正确');
    }
    // 标记已使用
    await this.smsRepo.update(record.id, { used: 1 });
    return true;
  }
}
