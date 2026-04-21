/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  CirclePlay,
  FileStack,
  Lock,
  Sparkles,
  Video,
} from 'lucide-react';
import { getSupabaseAccessTokenFromSession } from '@/lib/supabase-access-token.server';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LessonCompleteButton } from '@/components/learn/lesson-complete-button';
import { EnrollCourseButton } from '@/components/learn/enroll-course-button';
import { LessonAssetsGallery, type LessonAsset } from '@/components/lessons/lesson-assets-gallery';

type Course = {
  id: string;
  title: string;
  description: string | null;
  published: boolean;
  thumbnail_url: string | null;
};
type Lesson = { id: string; title: string; sort_order: number; content_md: string | null };
type Progress = { lesson_id: string; completed_at: string | null };
type LessonWithAssets = Lesson & { assets: LessonAsset[] };
type Enrollment = { course_id: string };

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LearnCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const accessToken = await getSupabaseAccessTokenFromSession();
  if (!accessToken) return null;

  let course: Course | null = null;
  let isEnrolled = false;
  let lessons: LessonWithAssets[] = [];
  let progress: Progress[] = [];

  try {
    course = await apiFetch<Course>(`/courses/${courseId}`, accessToken);
    const enrollments = await apiFetch<Enrollment[]>('/enrollments/me', accessToken);
    isEnrolled = enrollments.some((enrollment) => enrollment.course_id === courseId);

    const lessonRows = await apiFetch<Lesson[]>(
      `/lessons?courseId=${encodeURIComponent(courseId)}`,
      accessToken,
    );

    if (isEnrolled) {
      lessons = await Promise.all(
        lessonRows.map(async (lesson) => ({
          ...lesson,
          assets: await apiFetch<LessonAsset[]>(`/lessons/${lesson.id}/assets`, accessToken),
        })),
      );
      progress = await apiFetch<Progress[]>(
        `/progress?courseId=${encodeURIComponent(courseId)}`,
        accessToken,
      );
    } else {
      lessons = lessonRows.map((lesson) => ({ ...lesson, assets: [] }));
    }
  } catch {
    course = null;
  }

  if (!course) {
    return (
      <p className="text-neutral-500">
        Course not found or you do not have access. Enroll first from{' '}
        <Link href="/learn" className="underline">
          My learning
        </Link>
        .
      </p>
    );
  }

  const done = new Set(progress.filter((p) => p.completed_at).map((p) => p.lesson_id));
  const assetCount = lessons.reduce((total, lesson) => total + lesson.assets.length, 0);

  return (
    <div className="w-full space-y-8 pb-10">
      <Button asChild variant="ghost" size="sm" className="w-fit rounded-full px-3 text-slate-600 hover:text-slate-950">
        <Link href="/learn">
          <ArrowLeft />
          Back to catalog
        </Link>
      </Button>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <main className="space-y-8">
          <section className="overflow-hidden rounded-[2rem] bg-[#111827] text-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
            <div className="grid gap-8 p-8 lg:p-10">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-white/14 text-white ring-1 ring-white/10" variant="secondary">
                    {course.published ? 'Published course' : 'Draft course'}
                  </Badge>
                  <span className="inline-flex items-center gap-2 text-sm text-slate-300">
                    <Sparkles className="size-4" />
                    Learn at your own pace
                  </span>
                </div>

                <div className="space-y-4">
                  <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white lg:text-5xl">
                    {course.title}
                  </h1>
                  <p className="max-w-3xl text-base leading-7 text-slate-300 lg:text-lg">
                    {course.description || 'No course description has been added yet.'}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <InfoTile
                    icon={BookOpen}
                    label="Lessons"
                    value={`${lessons.length}`}
                    caption={lessons.length === 1 ? 'Structured chapter' : 'Structured chapters'}
                  />
                  <InfoTile
                    icon={Video}
                    label="Attachments"
                    value={`${assetCount}`}
                    caption={isEnrolled ? 'Media and files included' : 'Unlocked after enrollment'}
                  />
                  <InfoTile
                    icon={CirclePlay}
                    label="Progress"
                    value={isEnrolled ? `${done.size}/${lessons.length || 0}` : 'Preview'}
                    caption={isEnrolled ? 'Lessons completed' : 'Browse the curriculum first'}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Course content
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                  Lesson experience
                </h2>
                <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {isEnrolled
                    ? 'Open any lesson to view its notes, attachments, and completion controls.'
                    : 'Each lesson stays collapsed until you open it. Enroll to unlock the full lesson content and files.'}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                <BookOpen className="size-4" />
                <span>
                  {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
                </span>
              </div>
            </div>

            {lessons.length > 0 ? (
              <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950">
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {lessons.map((lesson, index) => (
                    <details key={lesson.id} className="group bg-white transition-colors open:bg-slate-50/70 dark:bg-slate-950 dark:open:bg-slate-900/40">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 marker:hidden transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/60">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                            {index + 1}
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                              Lesson {index + 1}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-slate-950 dark:text-slate-50">{lesson.title}</h3>
                              {isEnrolled ? (
                                <Badge variant={done.has(lesson.id) ? 'success' : 'secondary'}>
                                  {done.has(lesson.id) ? 'Completed' : 'Not completed'}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Preview</Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {isEnrolled
                                ? lesson.assets.length > 0
                                  ? `${lesson.assets.length} attachment${lesson.assets.length === 1 ? '' : 's'} available`
                                  : 'Open to view lesson details'
                                : 'Open to see what unlocks with enrollment'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {isEnrolled && done.has(lesson.id) ? (
                            <span className="hidden text-xs font-medium text-emerald-600 sm:inline">Done</span>
                          ) : null}
                          <ChevronDown className="mt-1 size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                        </div>
                      </summary>

                      <div className="space-y-4 border-t border-slate-100 bg-white px-5 pt-4 pb-5 dark:border-slate-800 dark:bg-slate-950/80 sm:px-6">
                        {isEnrolled ? (
                          <>
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                Lesson details and attachments
                              </p>
                              <LessonCompleteButton lessonId={lesson.id} initialDone={done.has(lesson.id)} />
                            </div>

                            {lesson.content_md ? (
                              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-700 dark:prose-invert dark:text-slate-300">
                                {lesson.content_md}
                              </div>
                            ) : (
                              <p className="text-sm text-neutral-500">No text content for this lesson.</p>
                            )}

                            <LessonAssetsGallery assets={lesson.assets} emptyLabel="No lesson attachments." />
                          </>
                        ) : (
                          <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                            <div className="rounded-full bg-slate-200 p-1.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              <FileStack className="size-3.5" />
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                Attachments and lesson content unlock after enrollment.
                              </p>
                              <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">
                                Open each lesson after enrolling to read the lesson body, review attachments, and track progress.
                              </p>
                              <p className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                <Lock className="size-3.5" />
                                Enrollment required
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No lessons in this course yet.</p>
            )}
          </section>
        </main>

        <aside className="space-y-6 xl:sticky xl:top-24">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-950">
            {course.thumbnail_url ? (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                No thumbnail available
              </div>
            )}

            <div className="space-y-5 p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                  {isEnrolled ? 'Your access' : 'Ready to start'}
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                  {isEnrolled ? 'You are enrolled' : 'Enroll in this course'}
                </h2>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {isEnrolled
                    ? 'Keep moving through the lessons below. Your completion state is saved per lesson.'
                    : 'Open the curriculum now, then enroll when you are ready to unlock the full lesson experience.'}
                </p>
              </div>

              <EnrollCourseButton courseId={courseId} enrolled={isEnrolled} />

              <div className="space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                <SidebarRow label="Course status" value={course.published ? 'Published' : 'Draft'} />
                <SidebarRow label="Lesson count" value={`${lessons.length}`} />
                <SidebarRow label="Attachments" value={isEnrolled ? `${assetCount}` : 'After enrollment'} />
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              What to expect
            </p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
              <p>Lessons stay collapsed until opened, so the course outline remains easy to scan.</p>
              <p>{isEnrolled ? 'Open a lesson to review notes, media, files, and mark it complete.' : 'Preview the structure now, then enroll to unlock lesson details and attachments.'}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  caption,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4 backdrop-blur">
      <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-white/12 text-white">
        <Icon className="size-5" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-300">{caption}</p>
    </div>
  );
}

function SidebarRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-slate-100">{value}</span>
    </div>
  );
}
