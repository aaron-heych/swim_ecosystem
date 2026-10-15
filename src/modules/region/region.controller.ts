import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RegionService } from './region.service';
import { Public } from '../../common/decorators/public.decorator';

/**
 * 行政区划只读接口（C 端 / 后台通用，无需鉴权）
 */
@ApiTags('行政区划')
@Controller('api/region')
export class RegionController {
  constructor(private readonly regionService: RegionService) {}

  /** 1. 省级列表 */
  @ApiOperation({ summary: '省级列表' })
  @Public()
  @Get('provinces')
  async provinces() {
    return this.regionService.findProvinces();
  }

  /** 2. 子列表（按 parentId 取下级） */
  @ApiOperation({ summary: '子级行政区列表' })
  @Public()
  @Get('children/:parentId')
  async children(@Param('parentId') parentId: number) {
    return this.regionService.findChildren(Number(parentId));
  }

  /** 3. 按 code 查单个节点 */
  @ApiOperation({ summary: '按 code 查行政区' })
  @Public()
  @Get('code/:code')
  async byCode(@Param('code') code: string) {
    return this.regionService.findByCode(code);
  }
}
