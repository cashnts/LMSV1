import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseService } from '../supabase/supabase.service';
import { EnrollDto } from './dto/enroll.dto';

@Controller('enrollments')
@UseGuards(SupabaseAuthGuard)
export class EnrollmentsController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get('me')
  async myEnrollments(@Req() req: Request) {
    // Use service role to bypass RLS issues but filter by user_id
    const serviceClient = this.supabaseService.createServiceClient();
    const { data, error } = await serviceClient
      .from('enrollments')
      .select('*, courses (id, title, description, published, instructor_id)')
      .eq('user_id', req.userId!);
    if (error) throw new Error(error.message);
    return data;
  }

  @Post()
  async enroll(@Req() req: Request, @Body() body: EnrollDto) {
    const { data: course, error: ce } = await req
      .supabase!.from('courses')
      .select('id, published')
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
        },
        { onConflict: 'user_id,course_id', ignoreDuplicates: false },
      )
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
