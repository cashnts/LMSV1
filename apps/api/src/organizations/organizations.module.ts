import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { OrganizationsController } from './organizations.controller';

@Module({
  imports: [AdminModule],
  controllers: [OrganizationsController],
})
export class OrganizationsModule {}
