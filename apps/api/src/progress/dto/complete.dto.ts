import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CompleteDto {
  @IsUUID()
  lessonId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  lastSeconds?: number;
}
