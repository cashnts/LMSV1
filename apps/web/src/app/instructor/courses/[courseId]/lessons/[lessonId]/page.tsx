import Link from 'next/link';
import { ChevronLeft, FileText, Globe, PlayCircle, Sparkles, FolderOpen, UploadCloud } from 'lucide-react';
import { getSupabaseAccessTokenFromSession } from '@/lib/supabase-access-token.server';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LessonEditorForm } from '@/components/lessons/lesson-editor-form';
import { LessonAssetUpload } from '@/components/lessons/lesson-asset-upload';
import { LessonAssetsGallery, type LessonAsset } from '@/components/lessons/lesson-assets-gallery';
import { LessonVideoUrlForm } from '@/components/lessons/lesson-video-url-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Lesson = {
  id: string;
  title: string;
  content_md: string | null;
  course_id: string;
};

export default async function LessonEditorPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const accessToken = await getSupabaseAccessTokenFromSession();
  if (!accessToken) return null;

  let lesson: Lesson | null = null;
  let assets: LessonAsset[] = [];
  try {
    lesson = await apiFetch<Lesson>(`/lessons/${lessonId}`, accessToken);
    assets = await apiFetch<LessonAsset[]>(`/lessons/${lessonId}/assets`, accessToken);
  } catch {
    lesson = null;
  }

  if (!lesson) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <p className="text-slate-500">Lesson not found or access denied.</p>
        <Button asChild variant="outline">
          <Link href={`/instructor/courses/${courseId}`}>Back to course</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pt-6 pb-12 px-4 sm:px-6">
      {/* Compact Header */}
      <div className="space-y-3">
        <nav className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
          <Link href={`/instructor/courses/${courseId}`} className="hover:text-slate-900 transition-colors">
            Back to course
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 dark:text-slate-100 font-bold tracking-tight">Editor</span>
        </nav>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50 truncate max-w-md">
              {lesson.title}
            </h1>
            <Badge variant="outline" className="h-4 px-1 text-[9px] uppercase tracking-wider font-bold text-slate-400 border-slate-200">
              Lesson
            </Badge>
          </div>
          
          <Button asChild variant="outline" size="sm" className="h-8 rounded-lg font-bold text-xs">
             <Link href={`/learn/${courseId}/lesson/${lessonId}`} target="_blank">
               <PlayCircle className="mr-1.5 size-3.5" />
               Preview
             </Link>
          </Button>
        </div>
      </div>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="rounded-[1.5rem] border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800 px-6 py-4">
            <div className="flex items-center gap-2">
              <FileText className="size-3.5 text-indigo-600" />
              <CardTitle className="text-sm font-bold">Content</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <LessonEditorForm lessonId={lessonId} initialTitle={lesson.title} initialMd={lesson.content_md ?? ''} />
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800 px-6 py-4">
            <div className="flex items-center gap-2">
              <UploadCloud className="size-3.5 text-blue-600" />
              <CardTitle className="text-sm font-bold">Add Resources</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="scale-90 origin-top">
               <LessonAssetUpload lessonId={lessonId} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-slate-200 shadow-sm dark:border-slate-800 overflow-hidden">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800 px-6 py-4 bg-slate-50/30">
            <div className="flex items-center gap-2">
              <FolderOpen className="size-3.5 text-emerald-600" />
              <CardTitle className="text-sm font-bold">Library</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 overflow-y-auto max-h-[320px]">
            <LessonAssetsGallery assets={assets} canDelete={true} />
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800 px-6 py-4">
            <div className="flex items-center gap-2">
              <Globe className="size-3.5 text-amber-600" />
              <CardTitle className="text-sm font-bold">Video URL</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <LessonVideoUrlForm lessonId={lessonId} />
            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
              <Sparkles className="size-3 text-amber-400" />
              <span>Bunny.net embed or HLS support.</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
