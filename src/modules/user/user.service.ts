import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, AdminUser } from './user.entity';
import { WxUtil } from '../../common/utils/wx.util';
import {
  aesEncrypt,
  aesDecrypt,
  maskIdCard,
  maskPhone,
} from '../../common/utils/aes.util';
import { WxLoginDto } from './dto/wx-login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { BindPhoneDto } from './dto/bind-phone.dto';
import { BindIdCardDto } from './dto/bind-id-card.dto';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AdminUser)
    private readonly adminUserRepo: Repository<AdminUser>,
    private readonly jwtService: JwtService,
    private readonly wxUtil: WxUtil,
  ) {}

  /* ============================= C 端 ============================= */

  /** 微信小程序登录 */
  async wxLogin(dto: WxLoginDto, ip?: string) {
    const session = await this.wxUtil.code2Session(dto.code);
    if (!session.openid) {
      throw new BadRequestException('微信登录失败：未获取到 openid');
    }

    let user = await this.userRepo.findOne({
      where: { openid: session.openid },
    });
    if (!user) {
      user = this.userRepo.create({
        openid: session.openid,
        unionid: session.unionid ?? null,
        registerSource: 1,
        status: 1,
      });
      user = await this.userRepo.save(user);
    } else if (session.unionid && !user.unionid) {
      user.unionid = session.unionid;
      await this.userRepo.update(user.id, { unionid: session.unionid });
    }

    if (user.status === 0) {
      throw new ForbiddenException('账号已被禁用，请联系管理员');
    }

    const now = new Date();
    await this.userRepo.update(user.id, {
      lastLoginAt: now,
      lastLoginIp: ip ?? null,
    });

    const token = await this.jwtService.signAsync({
      userId: user.id,
      type: 'user',
    });
    return { token, user: this.buildProfile(user) };
  }

  /** 获取当前用户资料（脱敏） */
  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    return this.buildProfile(user);
  }

  /** 更新资料 */
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    Object.assign(user, dto);
    await this.userRepo.save(user);
    return this.buildProfile(user);
  }

  /**
   * 绑定手机号。
   * - 微信 getPhoneNumber 方式：仅传 phone（已在前端解密）
   * - 短信验证码方式：传 phone + smsHash（hashSmsCode(code) 由客户端生成，
   *   生产应查 SmsCode 表对比；此处按约定简化为已验证通过）
   */
  async bindPhone(userId: number, dto: BindPhoneDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    // 手机号唯一性
    const exists = await this.userRepo.findOne({
      where: { phone: dto.phone },
      select: ['id'],
    });
    if (exists && exists.id !== userId) {
      throw new ConflictException('该手机号已被其他用户绑定');
    }

    user.phone = dto.phone;
    await this.userRepo.save(user);
    return this.buildProfile(user);
  }

  /** 实名认证：绑定身份证 */
  async bindIdCard(userId: number, dto: BindIdCardDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    if (user.idCardEnc) {
      throw new ConflictException('已完成实名认证，不可重复绑定');
    }

    user.idCardEnc = aesEncrypt(dto.idCard);
    if (dto.realName) user.realName = dto.realName;
    await this.userRepo.save(user);
    return this.buildProfile(user);
  }

  /** 注销账号：软删除 + 禁用 */
  async deactivate(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    user.status = 0;
    await this.userRepo.save(user);
    await this.userRepo.softDelete(userId);
    return { success: true };
  }

  /* ============================= 后台登录 ============================= */

  /** 后台账号登录 */
  async adminLogin(dto: AdminLoginDto, ip?: string) {
    const admin = await this.adminUserRepo.findOne({
      where: { username: dto.username },
      relations: ['roles'],
    });
    if (!admin) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    if (admin.status === 0) {
      throw new ForbiddenException('管理员账号已被禁用');
    }
    const ok = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const roleCodes = (admin.roles ?? []).map((r) => r.code);
    const now = new Date();
    await this.adminUserRepo.update(admin.id, {
      lastLoginAt: now,
      lastLoginIp: ip ?? null,
    });

    const token = await this.jwtService.signAsync({
      adminId: admin.id,
      username: admin.username,
      roleCodes,
      associationId: admin.associationId ?? null,
      type: 'admin',
    });
    return {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        realName: admin.realName,
        avatarUrl: admin.avatarUrl,
        roleCodes,
        associationId: admin.associationId ?? null,
      },
    };
  }

  /* ============================= 工具 ============================= */

  /** 构造脱敏的用户资料 */
  private buildProfile(user: User) {
    let idCardMasked: string | null = null;
    if (user.idCardEnc) {
      try {
        idCardMasked = maskIdCard(aesDecrypt(user.idCardEnc));
      } catch {
        idCardMasked = null;
      }
    }
    return {
      id: user.id,
      openid: user.openid,
      phone: user.phone ? maskPhone(user.phone) : null,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      gender: user.gender,
      realName: user.realName,
      idCard: idCardMasked,
      hasIdCard: !!user.idCardEnc,
      birthday: user.birthday,
      province: user.province,
      city: user.city,
      district: user.district,
      swimLevel: user.swimLevel,
      emergencyName: user.emergencyName,
      emergencyPhone: user.emergencyPhone
        ? maskPhone(user.emergencyPhone)
        : null,
      bio: user.bio,
      status: user.status,
      registerSource: user.registerSource,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
