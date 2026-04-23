import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [CommentsController],
})
export class CommentsModule {}
