import { IsIn } from 'class-validator';
import { COURSE_CREATION_MODES, ORGANIZATION_CREATION_MODES } from '../admin.service';

export class UpdateCreationSettingsDto {
  @IsIn(ORGANIZATION_CREATION_MODES)
  organizationCreationMode!: (typeof ORGANIZATION_CREATION_MODES)[number];

  @IsIn(COURSE_CREATION_MODES)
  courseCreationMode!: (typeof COURSE_CREATION_MODES)[number];
}
