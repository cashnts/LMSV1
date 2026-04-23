import { IsNotEmpty, IsUUID } from 'class-validator';

export class IssueDto {
  @IsNotEmpty()
  @IsUUID()
  courseId!: string;
}
