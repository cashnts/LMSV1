import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BunnyService } from '../bunny/bunny.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { AddAssetUrlDto } from './dto/add-asset-url.dto';

type AssetRow = {
  id: string;
  lesson_id: string;
  object_path: string;
  filename: string;
  mime_type: string | null;
  bytes: number | null;
  kind: string;
  status: string;
  storage_provider: string;
  bunny_video_id: string | null;
  cdn_url: string | null;
  created_at: string;
};

@Injectable()
export class LessonsService {
  constructor(private readonly bunny: BunnyService) {}

  private async withResolvedUrls(supabase: SupabaseClient, assets: AssetRow[]) {
    return Promise.all(
      assets.map(async (asset) => {
        let signed_url: string | null = null;

        if (asset.storage_provider === 'bunny-stream' || asset.storage_provider === 'bunny-storage') {
          signed_url = asset.cdn_url;
        } else {
          const { data } = await supabase.storage
            .from('lesson-assets')
            .createSignedUrl(asset.object_path, 60 * 60);
          signed_url = data?.signedUrl ?? null;
        }

        return { ...asset, signed_url };
      }),
    );
  }

  async list(supabase: SupabaseClient, courseId: string) {
    const { data, error } = await supabase
      .from('lessons')
      .select('*, lesson_assets(count)')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true });
    if (error) throw new Error(error.message);
    
    return (data ?? []).map(lesson => ({
      ...lesson,
      asset_count: (lesson as any).lesson_assets?.[0]?.count ?? 0
    }));
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

  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async createUploadIntent(supabase: SupabaseClient, lessonId: string, dto: CreateAssetDto) {
    if (dto.kind === 'video') {
      throw new BadRequestException('Video uploads are not supported. Use video links instead.');
    }

    const { data: lesson, error: le } = await supabase
      .from('lessons')
      .select('title, course_id, courses(title, org_id, organizations(name))')
      .eq('id', lessonId)
      .single();

    if (le || !lesson) throw new NotFoundException('Lesson not found');

    const course = (lesson as any).courses;
    const org = course?.organizations;

    const safeOrgName = this.sanitizeName(org?.name || 'unknown-org');
    const safeCourseName = this.sanitizeName(course?.title || 'unknown-course');
    const safeFileName = dto.filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    const objectPath = `${safeOrgName}/${safeCourseName}/${lessonId}/${Date.now()}-${safeFileName}`;

    if (this.bunny.isStorageConfigured()) {
      const { data: row, error } = await supabase
        .from('lesson_assets')
        .insert({
          lesson_id: lessonId,
          object_path: objectPath,
          filename: dto.filename,
          mime_type: dto.mimeType ?? null,
          bytes: 0,
          kind: dto.kind,
          status: 'uploaded',
          storage_provider: 'bunny-storage',
          bunny_video_id: null,
          cdn_url: null,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);

      return {
        asset: row,
        uploadType: 'bunny-storage',
        uploadPath: `/lessons/assets/${row.id}/upload-file`,
      };
    }

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
        storage_provider: 'supabase',
        bunny_video_id: null,
        cdn_url: null,
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
      uploadType: 'supabase',
      signedUrl: signed?.signedUrl,
      path: signed?.path ?? objectPath,
      token: signed?.token,
    };
  }

  async uploadFileToBunny(
    supabase: SupabaseClient,
    assetId: string,
    file: Express.Multer.File,
  ) {
    const { data: asset, error: fe } = await supabase
      .from('lesson_assets')
      .select('*')
      .eq('id', assetId)
      .single();
    if (fe || !asset) throw new NotFoundException('Asset not found');
    if (asset.storage_provider !== 'bunny-storage') {
      throw new BadRequestException('Asset is not a Bunny Storage asset');
    }

    const { cdnUrl } = await this.bunny.uploadToStorage(
      asset.object_path as string,
      file.buffer,
      file.mimetype,
    );

    const { data, error } = await supabase
      .from('lesson_assets')
      .update({ bytes: file.size, status: 'ready', cdn_url: cdnUrl } as never)
      .eq('id', assetId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async confirmAssetUpload(supabase: SupabaseClient, assetId: string, bytes: number) {
    const { data, error } = await supabase
      .from('lesson_assets')
      .update({ bytes, status: 'ready' } as never)
      .eq('id', assetId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException('Asset not found');
    return data;
  }

  async listAssets(supabase: SupabaseClient, lessonId: string) {
    const { data, error } = await supabase
      .from('lesson_assets')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return this.withResolvedUrls(supabase, (data ?? []) as AssetRow[]);
  }

  async addAssetUrl(supabase: SupabaseClient, lessonId: string, dto: AddAssetUrlDto) {
    let url = dto.url;
    let storageProvider = 'external';

    const isBunnyUrl = url.includes('.b-cdn.net') || url.includes('iframe.mediadelivery.net');
    
    if (isBunnyUrl) {
      storageProvider = 'bunny-storage';
    }

    const { data, error } = await supabase
      .from('lesson_assets')
      .insert({
        lesson_id: lessonId,
        object_path: `url/${lessonId}/${Date.now()}`,
        filename: dto.title ?? 'video',
        mime_type: 'video/mp4',
        bytes: 0,
        kind: 'video',
        status: 'ready',
        storage_provider: storageProvider,
        bunny_video_id: null,
        cdn_url: url,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteAsset(supabase: SupabaseClient, assetId: string) {
    const { data: asset, error: fe } = await supabase
      .from('lesson_assets')
      .select('*')
      .eq('id', assetId)
      .single();
    if (fe || !asset) throw new NotFoundException('Asset not found');

    const provider = asset.storage_provider as string;

    if (provider === 'bunny-storage') {
      await this.bunny
        .deleteFromStorage(asset.object_path as string)
        .catch((e) => console.warn('Bunny Storage delete:', e));
    } else if (provider !== 'bunny-stream' && provider !== 'external') {
      const { error: re } = await supabase.storage
        .from('lesson-assets')
        .remove([asset.object_path as string]);
      if (re) console.warn('Storage remove:', re.message);
    }

    const { error: de } = await supabase.from('lesson_assets').delete().eq('id', assetId);
    if (de) throw new Error(de.message);
    return { ok: true };
  }
}
