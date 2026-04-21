import { BadRequestException, Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CompleteDto } from './dto/complete.dto';

@Controller('progress')
@UseGuards(SupabaseAuthGuard)
export class ProgressController {
  @Get()
  async forCourse(@Req() req: Request, @Query('courseId') courseId: string) {
    if (!courseId) throw new BadRequestException('courseId required');
    const { data: lessons, error: le } = await req
      .supabase!.from('lessons')
      .select('id')
      .eq('course_id', courseId);
    if (le) throw new Error(le.message);
    const ids = (lessons ?? []).map((l) => l.id);
    if (ids.length === 0) return [];
    const { data, error } = await req
      .supabase!.from('lesson_progress')
      .select('*')
      .eq('user_id', req.userId!)
      .in('lesson_id', ids);
    if (error) throw new Error(error.message);
    return data;
  }

  @Post('complete')
  async complete(@Req() req: Request, @Body() body: CompleteDto) {
    const { data, error } = await req
      .supabase!.from('lesson_progress')
      .upsert(
        {
          user_id: req.userId!,
          lesson_id: body.lessonId,
          completed_at: new Date().toISOString(),
          last_seconds: body.lastSeconds ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id' },
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
}
