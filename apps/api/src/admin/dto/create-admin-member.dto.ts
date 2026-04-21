import { IsOptional, IsString } from 'class-validator';

export class CreateAdminMemberDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  email?: string;
}
