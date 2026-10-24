import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ChangeAdminPasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @Length(8, 64)
  newPassword: string;
}
