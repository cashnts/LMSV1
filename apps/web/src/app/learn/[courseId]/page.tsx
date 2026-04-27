/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import {
  FileStack,
  PlayCircle,
  Sparkles,
  Video,
  CheckCircle2,
  Clock,
  Users,
  Calendar,
} from 'lucide-react';
import { getSupabaseAccessTokenFromSession } from '@/lib/supabase-access-token.server';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClaimCertificateButton } from '@/components/learn/claim-certificate-button';
import { EnrollCourseButton } from '@/components/learn/enroll-course-button';
import { AppShell } from '@/components/layout/app-shell';
import { LessonContent } from '@/components/learn/lesson-content';

type Course = {
  id: string;
  title: string;
  description: string | null;
  published: boolean;
  thumbnail_url: string | null;
  updated_at: string;
  enrollment_count?: number;
  outcomes: string[];
};
type Lesson = { 
  id: string; 
  title: string; 
  sort_order: number; 
  content_md: string | null;
  asset_count?: number;
};
type Progress = { lesson_id: string; completed_at: string | null };
type Enrollment = { course_id: string };
type Certificate = { id: string; issued_at: string };

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LearnCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const accessToken = await getSupabaseAccessTokenFromSession();
  if (!accessToken) return null;

  let course: Course | null = null;
  let isEnrolled = false;
  let lessons: Lesson[] = [];
  let progress: Progress[] = [];
  let certificate: Certificate | null = null;

  try {
    course = await apiFetch<Course>(`/courses/${courseId}`, accessToken);
    const enrollments = await apiFetch<Enrollment[]>('/enrollments/me', accessToken);
    isEnrolled = enrollments.some((enrollment) => enrollment.course_id === courseId);

    lessons = await apiFetch<Lesson[]>(
      `/lessons?courseId=${encodeURIComponent(courseId)}`,
      accessToken,
    );

    if (isEnrolled) {
      progress = await apiFetch<Progress[]>(
        `/progress?courseId=${encodeURIComponent(courseId)}`,
        accessToken,
      );
      try {
        certificate = await apiFetch<Certificate>(`/certificates/course?courseId=${encodeURIComponent(courseId)}`, accessToken);
      } catch {
        certificate = null;
      }
    }
  } catch {
    course = null;
  }

  if (!course) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <p className="text-slate-500">Course not found or access denied.</p>
        <Button asChild variant="outline">
          <Link href="/learn">Browse all courses</Link>
        </Button>
      </div>
    );
  }

  const done = new Set(progress.filter((p) => p.completed_at).map((p) => p.lesson_id));
  const progressPct = lessons.length > 0 ? Math.round((done.size / lessons.length) * 100) : 0;
  const totalAssets = lessons.reduce((acc, l) => acc + (l.asset_count || 0), 0);
  const lastUpdated = new Date(course.updated_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <AppShell className="max-w-[1440px] xl:px-8">
      <div className="mx-auto w-full pb-20">
        {/* Header / Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-12 text-white shadow-2xl sm:px-12 lg:py-16">
          <div className="relative z-10 grid gap-12 lg:grid-cols-[1fr_380px] lg:items-center">
            <div className="space-y-8">
              <nav className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <Link href="/learn" className="hover:text-white transition">Catalog</Link>
                <span>/</span>
                <span className="text-slate-200">Course details</span>
              </nav>

              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border-indigo-500/30">
                    {course.published ? 'Published' : 'Draft'}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Sparkles className="size-4 text-amber-400" />
                    <span>Self-paced learning</span>
                  </div>
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                  {course.title}
                </h1>
                
                {course.description ? (
                  <LessonContent content={course.description} />
                ) : (
                  <p className="max-w-2xl text-lg leading-relaxed text-slate-300">
                    Master this subject with our comprehensive guide designed for learners of all skill levels.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-8 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Users className="size-5 text-indigo-400" />
                  <span>{course.enrollment_count || 0} enrolled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-5 text-indigo-400" />
                  <span>{lessons.length} Lessons</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="size-5" />
                  <span>Updated {lastUpdated}</span>
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-slate-800 shadow-2xl ring-1 ring-white/10">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-indigo-500/10">
                    <Video className="size-16 text-indigo-500/30" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Decorative background elements */}
          <div className="absolute -right-20 -top-20 size-96 rounded-full bg-indigo-600/20 blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 size-96 rounded-full bg-blue-600/10 blur-[100px]" />
        </section>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_360px]">
          <main className="space-y-12">
            {/* Outcome Section */}
            <section className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/40">
              <h2 className="text-2xl font-bold tracking-tight">What you&apos;ll achieve</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {(course.outcomes && course.outcomes.length > 0 ? course.outcomes : [
                  'Foundational principles and advanced concepts',
                  'Practical skills for real-world application',
                  'Industry standard workflows and best practices',
                  'Comprehensive project-based portfolio work',
                ]).map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                    <span className="text-sm leading-6">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Curriculum */}
            <section className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight">Curriculum</h2>
                <p className="text-sm font-medium text-slate-500">
                  {lessons.length} lessons
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40">
                {lessons.map((lesson, i) => {
                  const LessonWrapper = (isEnrolled ? Link : 'div') as any;
                  return (
                    <LessonWrapper
                      key={lesson.id}
                      href={isEnrolled ? `/learn/${courseId}/lesson/${lesson.id}` : undefined}
                      className={`flex items-center justify-between gap-4 border-b border-slate-100 p-6 last:border-0 dark:border-slate-800/60 ${
                        isEnrolled ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40 transition' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-500 dark:bg-slate-800">
                          {i + 1}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">{lesson.title}</h3>
                          <p className="mt-1 text-xs text-slate-500">{lesson.asset_count || 0} resources</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {isEnrolled && done.has(lesson.id) && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-none">Completed</Badge>
                        )}
                        {isEnrolled ? (
                          <PlayCircle className="size-6 text-indigo-500" />
                        ) : (
                          <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4">
                            Preview
                          </button>
                        )}
                      </div>
                    </LessonWrapper>
                  );
                })}
              </div>
            </section>
          </main>

          <aside className="space-y-6">
            <div className="sticky top-8 space-y-6">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
                <div className="lg:hidden">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="aspect-video w-full object-cover" />
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center bg-slate-100 dark:bg-slate-900">
                      <Video className="size-12 text-slate-300" />
                    </div>
                  )}
                </div>
                
                <div className="p-8 space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-slate-950 dark:text-white">Free</span>
                    </div>
                    <EnrollCourseButton courseId={courseId} enrolled={isEnrolled} />
                    <p className="text-center text-xs font-medium text-slate-500">Full lifetime access guaranteed</p>
                  </div>

                  {isEnrolled && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                        <span>Your Progress</span>
                        <span className="text-indigo-600">{progressPct}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full bg-indigo-500 transition-all duration-1000"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 border-t border-slate-100 pt-8 dark:border-slate-800">
                    <p className="text-sm font-bold">This course includes:</p>
                    <ul className="space-y-3">
                      <SidebarBenefit icon={Video} text={`${lessons.length} lessons`} />
                      <SidebarBenefit icon={FileStack} text={`${totalAssets} resources`} />
                      <SidebarBenefit icon={Sparkles} text="Certificate of completion" />
                    </ul>
                  </div>

                  {isEnrolled && hasCompletedAll(done, lessons) && !certificate && (
                    <div className="pt-2">
                      <ClaimCertificateButton courseId={courseId} />
                    </div>
                  )}

                  {certificate && (
                    <div className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-4 text-sm font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                      <Sparkles className="size-4" />
                      Certificate Earned!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function hasCompletedAll(done: Set<string>, lessons: Lesson[]) {
  return lessons.length > 0 && done.size === lessons.length;
}

function SidebarBenefit({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
      <Icon className="mt-0.5 size-4 shrink-0 text-indigo-500" />
      <span>{text}</span>
    </li>
  );
}
