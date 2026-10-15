import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsNotEmpty,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AnnouncementAttachmentDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @MaxLength(500)
  url: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  size?: number;
}

export class SaveAnnouncementDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(40)
  category: string;

  @IsString()
  @MaxLength(150)
  @IsOptional()
  publisherUnit?: string;

  @IsString()
  content: string;

  @IsNotEmpty()
  @IsDateString()
  activityAt: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  location?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  participants?: string;

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => AnnouncementAttachmentDto)
  @IsOptional()
  attachments?: AnnouncementAttachmentDto[];

  @IsIn([
    'all_members',
    'association_admins',
    'association_presidents',
    'selected_members',
  ])
  audienceType: string;

  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Type(() => Number)
  @IsOptional()
  userIds?: number[];

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @IsBoolean()
  @IsOptional()
  isImportant?: boolean;

  @IsBoolean()
  @IsOptional()
  requiresAttendance?: boolean;
}

export class QueryAnnouncementsDto extends PaginationDto {
  @IsIn([1, 2, 3])
  @Type(() => Number)
  @IsOptional()
  role?: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  status?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class QueryAnnouncementRecipientsDto extends PaginationDto {
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  isRead?: number;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  attendanceStatus?: number;
}

export class AnnouncementAttendanceDto {
  @IsIn([1, 2])
  @Type(() => Number)
  attendanceStatus: number;
}
