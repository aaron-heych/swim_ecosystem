import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';

/** 单条积分规则：名次 → 积分 */
export class ScoreRuleItemDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  rankNo: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  score: number;
}

/** 整体保存积分规则（传空数组 = 清除自定义，恢复默认 9/7/6/5/4/3/2/1） */
export class SaveCompetitionScoreRulesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScoreRuleItemDto)
  rules: ScoreRuleItemDto[];
}
