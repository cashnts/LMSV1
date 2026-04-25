import Link from 'next/link';
import { ChevronLeft, ListOrdered, Settings, BookOpen, PlayCircle } from 'lucide-react';
import { getSupabaseAccessTokenFromSession } from '@/lib/supabase-access-token.server';
import { apiFetch } from '@/lib/api';
import { CourseSettingsForm } from '@/components/courses/course-settings-form';
import { CreateLessonForm } from '@/components/lessons/create-lesson-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Course = {
  id: string;
  title: string;
  description: string | null;
  published: boolean;
  thumbnail_url: string | null;
  outcomes: string[];
};

type Lesson = {
  id: string;
  title: string;
  sort_order: number;
};

export default async function CourseEditorPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const accessToken = await getSupabaseAccessTokenFromSession();
  if (!accessToken) return null;

  let course: Course | null = null;
  let lessons: Lesson[] = [];
  try {
    course = await apiFetch<Course>(`/courses/${courseId}`, accessToken);
    lessons = await apiFetch<Lesson[]>(
      `/lessons?courseId=${encodeURIComponent(courseId)}`,
      accessToken,
    );
  } catch {
    course = null;
  }

  if (!course) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <p className="text-slate-500">Course not found or access denied.</p>
        <Button asChild variant="outline">
          <Link href="/instructor">Back to workspace</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 pt-10 pb-24 px-4 sm:px-6">
      {/* Header with Breadcrumbs */}
      <div className="space-y-4">
        <nav className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <Link href="/instructor" className="flex items-center hover:text-slate-900 transition-colors">
            <ChevronLeft className="size-4" />
            Back to courses
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 dark:text-slate-100">Editor</span>
        </nav>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
                {course.title}
              </h1>
              <Badge variant={course.published ? 'success' : 'secondary'} className="h-5 px-1.5 text-[10px] uppercase tracking-wider">
                {course.published ? 'Published' : 'Draft'}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-xl font-bold">
               <Link href={`/learn/${courseId}`} target="_blank">
                 <PlayCircle className="mr-2 size-4" />
                 Preview
               </Link>
            </Button>
          </div>
        </div>
      </div>

      <main className="space-y-16">
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
            <ListOrdered className="size-5 text-indigo-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Curriculum
            </h2>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <CreateLessonForm courseId={courseId} />
            </div>
            
            <div className="grid gap-3">
              {lessons.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-800 dark:bg-slate-950/40">
                  <BookOpen className="mx-auto size-10 text-slate-300" />
                  <p className="mt-3 text-sm text-slate-500 font-medium">Your course is empty. Start by adding your first lesson above.</p>
                </div>
              ) : (
                lessons.map((l, index) => (
                  <Link
                    key={l.id}
                    href={`/instructor/courses/${courseId}/lessons/${l.id}`}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-indigo-500/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:hover:border-indigo-500/50"
                  >
                    <div className="flex items-center gap-5">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-sm font-bold text-slate-500 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-900 dark:text-slate-400">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {l.title}
                        </h4>
                      </div>
                    </div>
                    <ChevronLeft className="size-4 rotate-180 text-slate-300 group-hover:text-indigo-500 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6 pt-8">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
            <Settings className="size-5 text-indigo-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Course Settings
            </h2>
          </div>
          
          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-50/40 p-8 dark:border-slate-800 dark:bg-slate-900/10 lg:p-12">
            <div className="max-w-3xl">
              <CourseSettingsForm
                courseId={courseId}
                initialTitle={course.title}
                initialDescription={course.description ?? ''}
                initialPublished={course.published}
                initialThumbnailUrl={course.thumbnail_url ?? ''}
                initialOutcomes={course.outcomes}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
