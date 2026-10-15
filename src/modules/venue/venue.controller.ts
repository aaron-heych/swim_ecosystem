import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VenueService } from './venue.service';
import { QueryVenueDto } from './dto/query-venue.dto';
import { Public } from '../../common/decorators/public.decorator';

/**
 * C 端场馆浏览
 */
@ApiTags('场馆-小程序')
@Controller('api/venue')
export class VenueController {
  constructor(private readonly venueService: VenueService) {}

  /** 1. 场馆列表（type / province / city / keyword + rating 排序） */
  @ApiOperation({ summary: '场馆分页列表' })
  @Public()
  @Get('list')
  async list(@Query() query: QueryVenueDto) {
    return this.venueService.listPublic(query);
  }

  /** 2. 场馆详情（含 coaches 简要列表） */
  @ApiOperation({ summary: '场馆详情' })
  @Public()
  @Get(':id')
  async detail(@Param('id') id: number) {
    return this.venueService.findPublicDetail(Number(id));
  }

  /** 3. 场馆下教练列表 */
  @ApiOperation({ summary: '场馆下教练列表' })
  @Public()
  @Get(':id/coaches')
  async coaches(@Param('id') id: number) {
    return this.venueService.listCoachesByVenue(Number(id));
  }
}
