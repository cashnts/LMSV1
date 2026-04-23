import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('comments')
@UseGuards(SupabaseAuthGuard)
export class CommentsController {
  @Get()
  async forLesson(@Req() req: Request, @Query('lessonId') lessonId: string) {
    if (!lessonId) return [];

    const { data, error } = await req
      .supabase!.from('lesson_comments')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  }

  @Post()
  async create(@Req() req: Request, @Body() body: CreateCommentDto) {
    const { data, error } = await req
      .supabase!.from('lesson_comments')
      .insert({
        lesson_id: body.lessonId,
        user_id: req.userId!,
        content: body.content,
        author_name: body.authorName || 'User',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const { error } = await req
      .supabase!.from('lesson_comments')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
  }
}
