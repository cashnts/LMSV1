import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CreateAssetDto } from './dto/create-asset.dto';

@Injectable()
export class LessonsService {
  private async withSignedUrls<T extends { object_path: string }[]>(
    supabase: SupabaseClient,
    assets: T,
  ) {
    return Promise.all(
      assets.map(async (asset) => {
        const { data } = await supabase.storage
          .from('lesson-assets')
          .createSignedUrl(asset.object_path, 60 * 60);

        return {
          ...asset,
          signed_url: data?.signedUrl ?? null,
        };
      }),
    );
  }

  async list(supabase: SupabaseClient, courseId: string) {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  }

  async get(supabase: SupabaseClient, id: string) {
    const { data, error } = await supabase.from('lessons').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException('Lesson not found');
    return data;
  }

  async create(supabase: SupabaseClient, dto: CreateLessonDto) {
    const { data, error } = await supabase
      .from('lessons')
      .insert({
        course_id: dto.courseId,
        title: dto.title,
        content_md: dto.contentMd ?? '',
        sort_order: dto.sortOrder ?? 0,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async update(supabase: SupabaseClient, id: string, dto: UpdateLessonDto) {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.title !== undefined) payload.title = dto.title;
    if (dto.contentMd !== undefined) payload.content_md = dto.contentMd;
    if (dto.sortOrder !== undefined) payload.sort_order = dto.sortOrder;
    const { data, error } = await supabase
      .from('lessons')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException('Lesson not found');
    return data;
  }

  async remove(supabase: SupabaseClient, id: string) {
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { ok: true };
  }

  async createSignedUpload(
    supabase: SupabaseClient,
    lessonId: string,
    dto: CreateAssetDto,
  ) {
    const lesson = await this.get(supabase, lessonId);
    const { data: course, error: ce } = await supabase
      .from('courses')
      .select('org_id')
      .eq('id', lesson.course_id)
      .single();
    if (ce || !course) throw new NotFoundException('Course not found');
    const orgId = course.org_id as string;
    const safeName = dto.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectPath = `${orgId}/${lessonId}/${Date.now()}-${safeName}`;
    const { data: row, error: ie } = await supabase
      .from('lesson_assets')
      .insert({
        lesson_id: lessonId,
        object_path: objectPath,
        filename: dto.filename,
        mime_type: dto.mimeType ?? null,
        bytes: 0,
        kind: dto.kind,
        status: 'uploaded',
      })
      .select()
      .single();
    if (ie) throw new Error(ie.message);

    const { data: signed, error: se } = await supabase.storage
      .from('lesson-assets')
      .createSignedUploadUrl(objectPath);
    if (se) {
      await supabase.from('lesson_assets').delete().eq('id', row.id);
      throw new BadRequestException(se.message);
    }
    return {
      asset: row,
      signedUrl: signed?.signedUrl,
      path: signed?.path ?? objectPath,
      token: signed?.token,
    };
  }

  async listAssets(supabase: SupabaseClient, lessonId: string) {
    const { data, error } = await supabase
      .from('lesson_assets')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return this.withSignedUrls(supabase, data ?? []);
  }

  async deleteAsset(supabase: SupabaseClient, assetId: string) {
    const { data: asset, error: fe } = await supabase
      .from('lesson_assets')
      .select('*')
      .eq('id', assetId)
      .single();
    if (fe || !asset) throw new NotFoundException('Asset not found');
    const { error: re } = await supabase.storage.from('lesson-assets').remove([asset.object_path]);
    if (re) console.warn('Storage remove:', re.message);
    const { error: de } = await supabase.from('lesson_assets').delete().eq('id', assetId);
    if (de) throw new Error(de.message);
    return { ok: true };
  }
}
