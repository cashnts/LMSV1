import { Module } from '@nestjs/common';
import { CertificatesController } from './certificates.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [CertificatesController],
})
export class CertificatesModule {}
