import { BadRequestException, Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { IssueDto } from './dto/issue.dto';

@Controller('certificates')
@UseGuards(SupabaseAuthGuard)
export class CertificatesController {
  @Get()
  async forUser(@Req() req: Request) {
    const { data, error } = await req
      .supabase!.from('certificates')
      .select('*, courses(title)')
      .eq('user_id', req.userId!);
    
    if (error) throw new Error(error.message);
    return data;
  }

  @Get('course')
  async forCourse(@Req() req: Request, @Query('courseId') courseId: string) {
    if (!courseId) throw new BadRequestException('courseId required');
    const { data, error } = await req
      .supabase!.from('certificates')
      .select('*')
      .eq('user_id', req.userId!)
      .eq('course_id', courseId)
      .maybeSingle();
      
    if (error) throw new Error(error.message);
    return data;
  }

  @Post('issue')
  async issue(@Req() req: Request, @Body() body: IssueDto) {
    // Check if the user is enrolled
    const { data: enrollment, error: eErr } = await req
      .supabase!.from('enrollments')
      .select('course_id')
      .eq('user_id', req.userId!)
      .eq('course_id', body.courseId)
      .maybeSingle();

    if (eErr || !enrollment) {
      throw new BadRequestException('User is not enrolled in this course');
    }

    // Check total lessons
    const { data: lessons, error: lErr } = await req
      .supabase!.from('lessons')
      .select('id')
      .eq('course_id', body.courseId);

    if (lErr) throw new Error(lErr.message);
    
    const lessonIds = (lessons ?? []).map((l) => l.id);
    if (lessonIds.length === 0) {
      throw new BadRequestException('Course has no lessons');
    }

    // Check completed lessons
    const { data: completed, error: lpErr } = await req
      .supabase!.from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', req.userId!)
      .in('lesson_id', lessonIds)
      .not('completed_at', 'is', null);

    if (lpErr) throw new Error(lpErr.message);

    const completedIds = (completed ?? []).map((c) => c.lesson_id);
    const hasCompletedAll = lessonIds.every(id => completedIds.includes(id));

    if (!hasCompletedAll) {
      throw new BadRequestException('Not all lessons are completed');
    }

    // Issue certificate
    const { data, error } = await req
      .supabase!.from('certificates')
      .upsert(
        {
          user_id: req.userId!,
          course_id: body.courseId,
          issued_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,course_id' },
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
