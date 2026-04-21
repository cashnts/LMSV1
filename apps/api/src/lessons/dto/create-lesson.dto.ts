import { IsInt, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateLessonDto {
  @IsUUID()
  courseId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100000)
  contentMd?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
