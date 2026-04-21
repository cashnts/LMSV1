import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { EnrollDto } from './dto/enroll.dto';

@Controller('enrollments')
@UseGuards(SupabaseAuthGuard)
export class EnrollmentsController {
  @Get('me')
  async myEnrollments(@Req() req: Request) {
    const { data, error } = await req.supabase!
      .from('enrollments')
      .select('*, courses (id, title, description, published, org_id)')
      .eq('user_id', req.userId!);
    if (error) throw new Error(error.message);
    return data;
  }

  @Post()
  async enroll(@Req() req: Request, @Body() body: EnrollDto) {
    const { data: course, error: ce } = await req
      .supabase!.from('courses')
      .select('id, org_id, published')
      .eq('id', body.courseId)
      .single();
    if (ce || !course) throw new BadRequestException('Course not found');
    if (!course.published) throw new BadRequestException('Course is not published');
    const { data, error } = await req
      .supabase!.from('enrollments')
      .upsert(
        {
          user_id: req.userId!,
          course_id: course.id,
          org_id: course.org_id,
        },
        { onConflict: 'user_id,course_id', ignoreDuplicates: false },
      )
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
