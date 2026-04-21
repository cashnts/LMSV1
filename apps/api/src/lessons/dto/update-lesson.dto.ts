import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100000)
  contentMd?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
