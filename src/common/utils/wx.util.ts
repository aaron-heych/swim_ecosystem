import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface WxSessionInfo {
  openid: string;
  unionid?: string;
  sessionKey: string;
}

/**
 * 微信小程序 code2Session 调用封装。
 * 依赖：axios。可在 main.ts 中全局注册，或通过 HttpService 注入。
 */
@Injectable()
export class WxUtil {
  private readonly logger = new Logger(WxUtil.name);

  async code2Session(code: string): Promise<WxSessionInfo> {
    const appId = process.env.WX_APP_ID;
    const secret = process.env.WX_APP_SECRET;
    if (!appId || !secret) {
      throw new Error('未配置微信小程序 AppId / Secret');
    }
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
    const resp = await axios.get(url);
    const data = resp.data;
    if (data.errcode) {
      this.logger.error(`code2session 失败: ${data.errcode} ${data.errmsg}`);
      throw new Error(`微信登录失败: ${data.errmsg}`);
    }
    return {
      openid: data.openid,
      unionid: data.unionid,
      sessionKey: data.session_key,
    };
  }

  /** 公众号 Access Token 缓存（简易内存版，生产建议用 Redis） */
  private oaAccessToken = '';
  private oaTokenExpiresAt = 0;

  async getOaAccessToken(): Promise<string> {
    if (this.oaAccessToken && Date.now() < this.oaTokenExpiresAt) {
      return this.oaAccessToken;
    }
    const appId = process.env.WX_OA_APP_ID;
    const secret = process.env.WX_OA_APP_SECRET;
    if (!appId || !secret) throw new Error('未配置公众号 AppId / Secret');
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${secret}`;
    const resp = await axios.get(url);
    const data = resp.data;
    if (data.errcode) {
      throw new Error(`获取公众号 access_token 失败: ${data.errmsg}`);
    }
    this.oaAccessToken = data.access_token;
    this.oaTokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
    return this.oaAccessToken;
  }
}
