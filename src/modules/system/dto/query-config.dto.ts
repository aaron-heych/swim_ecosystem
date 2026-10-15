/**
 * 配置分页查询 DTO
 */
import { IsString, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryConfigDto extends PaginationDto {
  @IsString()
  @IsOptional()
  configGroup?: string;
}
