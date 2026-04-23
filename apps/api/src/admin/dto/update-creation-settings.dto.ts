import { IsIn, IsString, MinLength } from 'class-validator';
import { COURSE_CREATION_MODES, ORGANIZATION_CREATION_MODES } from '../admin.service';

export class UpdateCreationSettingsDto {
  @IsString()
  @MinLength(1)
  appName!: string;

  @IsIn(ORGANIZATION_CREATION_MODES)
  organizationCreationMode!: (typeof ORGANIZATION_CREATION_MODES)[number];

  @IsIn(COURSE_CREATION_MODES)
  courseCreationMode!: (typeof COURSE_CREATION_MODES)[number];
}
