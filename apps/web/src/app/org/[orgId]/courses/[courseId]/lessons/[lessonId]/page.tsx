import Link from 'next/link';
import { getSupabaseAccessTokenFromSession } from '@/lib/supabase-access-token.server';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LessonEditorForm } from '@/components/lessons/lesson-editor-form';
import { LessonAssetUpload } from '@/components/lessons/lesson-asset-upload';
import { LessonAssetsGallery, type LessonAsset } from '@/components/lessons/lesson-assets-gallery';

type Lesson = {
  id: string;
  title: string;
  content_md: string | null;
  course_id: string;
};

export default async function LessonPage({
  params,
}: {
  params: Promise<{ orgId: string; courseId: string; lessonId: string }>;
}) {
  const { orgId, courseId, lessonId } = await params;
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
    return <p className="text-neutral-500">Lesson not found or access denied.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          <Link href={`/org/${orgId}/courses/${courseId}`} className="underline">
            Back to course
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight mt-2">{lesson.title}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lesson content</CardTitle>
          <CardDescription>Markdown body shown to learners.</CardDescription>
        </CardHeader>
        <CardContent>
          <LessonEditorForm lessonId={lessonId} initialTitle={lesson.title} initialMd={lesson.content_md ?? ''} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
          <CardDescription>Upload videos, pictures, and files for this lesson.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <LessonAssetUpload lessonId={lessonId} kind="video" />
            <LessonAssetUpload lessonId={lessonId} kind="image" />
            <LessonAssetUpload lessonId={lessonId} kind="file" />
          </div>
          <LessonAssetsGallery assets={assets} />
        </CardContent>
      </Card>
    </div>
  );
}
