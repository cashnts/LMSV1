import { Injectable, NotFoundException } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async listPublished(supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from('courses')
      .select('id, instructor_id, title, description, published, thumbnail_url, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async list(supabase: SupabaseClient, instructorId?: string) {
    let query = supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (instructorId) {
      query = query.eq('instructor_id', instructorId);
    }
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  async get(supabase: SupabaseClient, id: string) {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException('Course not found');
    
    // Use service role to get accurate total count across all users
    const serviceClient = this.supabaseService.createServiceClient();
    const { count, error: countError } = await serviceClient
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', id);
    
    if (countError) console.error('Error fetching enrollment count:', countError);

    return { ...data, enrollment_count: count ?? 0 };
  }

  async create(supabase: SupabaseClient, dto: CreateCourseDto, instructorId: string) {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        instructor_id: instructorId,
        title: dto.title,
        description: dto.description ?? '',
        published: dto.published ?? false,
        thumbnail_url: dto.thumbnailUrl ?? null,
        outcomes: dto.outcomes ?? [],
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async update(supabase: SupabaseClient, id: string, dto: UpdateCourseDto) {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.title !== undefined) payload.title = dto.title;
    if (dto.description !== undefined) payload.description = dto.description;
    if (dto.published !== undefined) payload.published = dto.published;
    if (dto.thumbnailUrl !== undefined) payload.thumbnail_url = dto.thumbnailUrl || null;
    if (dto.outcomes !== undefined) payload.outcomes = dto.outcomes;
    const { data, error } = await supabase
      .from('courses')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException('Course not found');
    return data;
  }

  async remove(supabase: SupabaseClient, id: string) {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { ok: true };
  }
}
