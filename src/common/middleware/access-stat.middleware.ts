/**
 * 全局访问量埋点中间件
 *
 * 拦截所有 C 端请求（/api/<module>/...，排除 /api/admin/*），
 * 按模块归类后原子累加当日访问计数（INSERT ... ON DUPLICATE KEY UPDATE）。
 *
 * 写库走 fire-and-forget，任何失败均不影响主请求。
 */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SystemService } from '../../modules/system/system.service';

/** URL 前缀 → 模块 key 白名单（与 ACCESS_MODULES 保持一致） */
const MODULE_KEYS = new Set<string>([
  'association',
  'event',
  'venue',
  'coach',
  'circle',
  'user',
  'system',
  'notification',
]);

@Injectable()
export class AccessStatMiddleware implements NestMiddleware {
  constructor(private readonly systemService: SystemService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    next(); // 先放行，不阻塞请求

    try {
      const url: string = req.originalUrl || req.url || '';
      // 仅统计 /api/<module>/... 的 C 端请求
      if (!url.startsWith('/api/')) return;
      const seg = url.slice(5); // 去掉 '/api/'
      const mod = seg.split('/')[0];
      if (!mod || mod === 'admin') return; // 后台接口不计入 C 端
      if (!MODULE_KEYS.has(mod)) return; // 未知前缀不统计
      // fire-and-forget 累加，失败仅记日志
      this.systemService.recordAccess(mod).catch(() => undefined);
    } catch {
      // 埋点失败一律忽略
    }
  }
}
