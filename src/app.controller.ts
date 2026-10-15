import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('服务信息')
@Controller()
export class AppController {
  /** 服务信息 / 健康检查 */
  @ApiOperation({ summary: '服务信息' })
  @Public()
  @Get()
  root() {
    return {
      name: 'swim-ecosystem-api',
      version: '0.1.0',
      description: '游泳生态圈 API 服务',
      time: new Date().toISOString(),
    };
  }

  /** 健康检查 */
  @ApiOperation({ summary: '健康检查' })
  @Public()
  @Get('health')
  health() {
    return { status: 'ok', time: new Date().toISOString() };
  }
}
