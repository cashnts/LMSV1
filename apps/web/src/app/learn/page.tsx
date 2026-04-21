/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { ArrowRight, Compass, GraduationCap, Sparkles } from 'lucide-react';
import { getSupabaseAccessTokenFromSession } from '@/lib/supabase-access-token.server';
import { apiFetch } from '@/lib/api';
import { EnrollByIdForm } from '@/components/learn/enroll-by-id-form';
import { Badge } from '@/components/ui/badge';

type Row = {
  course_id: string;
  enrolled_at: string;
  courses: { id: string; title: string; description: string | null; org_id: string } | null;
};

type CourseCatalogRow = {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  published: boolean;
  thumbnail_url: string | null;
};

export default async function LearnPage() {
  const accessToken = await getSupabaseAccessTokenFromSession();
  if (!accessToken) return null;

  let rows: Row[] = [];
  let courses: CourseCatalogRow[] = [];
  try {
    rows = await apiFetch<Row[]>('/enrollments/me', accessToken);
  } catch {
    rows = [];
  }
  try {
    courses = await apiFetch<CourseCatalogRow[]>('/courses/discover', accessToken);
  } catch {
    courses = [];
  }

  const enrolledCourseIds = new Set(rows.map((row) => row.course_id));
  const availableCourses = courses.filter((course) => !enrolledCourseIds.has(course.id));

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 pb-10">
      <section className="overflow-hidden rounded-[2rem] bg-[#0f172a] text-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
        <div className="space-y-6 p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-white/14 text-white ring-1 ring-white/10" variant="secondary">
              Learning hub
            </Badge>
            <span className="inline-flex items-center gap-2 text-sm text-slate-300">
              <Sparkles className="size-4" />
              Discover, enroll, and continue in one place
            </span>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Learn</p>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white lg:text-5xl">
              Your courses, progress, and next lesson.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-300 lg:text-lg">
              Browse the published catalog, jump back into active enrollments, or join a course directly with a shared ID.
            </p>
          </div>

          <div className="pt-2">
            <EnrollByIdForm />
          </div>
        </div>
      </section>

      <main className="space-y-10">
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Continue learning
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                  Active enrollments
                </h2>
                <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Resume an enrolled course from where you left off.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                <GraduationCap className="size-4" />
                <span>
                  {rows.length} {rows.length === 1 ? 'enrollment' : 'enrollments'}
                </span>
              </div>
            </div>

            {rows.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                No enrollments yet. Open a course below or use a shared course ID to get started.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {rows.map((row) => (
                  <Link
                    key={row.course_id}
                    href={`/learn/${row.course_id}`}
                    className="group flex items-center justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="truncate text-base font-semibold text-slate-950 dark:text-slate-50">
                          {row.courses?.title ?? row.course_id}
                        </h3>
                        <Badge variant="success" className="h-5 px-1.5 text-[10px]">Active</Badge>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                        {row.courses?.description || 'Open this course to continue learning.'}
                      </p>
                    </div>
                    <ArrowRight className="size-5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Explore
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                  Course catalog
                </h2>
                <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Browse published courses you haven&apos;t joined yet.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                <Compass className="size-4" />
                <span>
                  {availableCourses.length} {availableCourses.length === 1 ? 'course' : 'courses'}
                </span>
              </div>
            </div>

            {availableCourses.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                No new courses are available right now.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {availableCourses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/learn/${course.id}`}
                    className="group flex items-center justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-5">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="size-16 shrink-0 rounded-xl object-cover shadow-sm transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                          No img
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="truncate text-base font-semibold text-slate-950 dark:text-slate-50">
                            {course.title}
                          </h3>
                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">Open</Badge>
                        </div>
                        <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                          {course.description || 'View details and enrollment options.'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="size-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </main>
    </div>
  );
}
