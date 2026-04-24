/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { ArrowRight, BookOpen, ChevronLeft, FolderKanban, Plus, Sparkles } from 'lucide-react';
import { getSupabaseAccessTokenFromSession } from '@/lib/supabase-access-token.server';
import { apiFetch } from '@/lib/api';
import type { AdminSettingsResponse } from '@/lib/admin-settings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreateCourseForm } from '@/components/courses/create-course-form';

type Course = {
  id: string;
  title: string;
  description: string | null;
  published: boolean;
  org_id: string;
  thumbnail_url: string | null;
};

export default async function OrgPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const accessToken = await getSupabaseAccessTokenFromSession();
  if (!accessToken) return null;

  let courses: Course[] = [];
  let adminSettings: AdminSettingsResponse | null = null;
  try {
    courses = await apiFetch<Course[]>(`/courses?orgId=${encodeURIComponent(orgId)}`, accessToken);
  } catch {
    courses = [];
  }

  try {
    adminSettings = await apiFetch<AdminSettingsResponse>('/admin/settings', accessToken);
  } catch {
    adminSettings = null;
  }

  const canCreateCourse = Boolean(
    adminSettings?.isAppAdmin || adminSettings?.creationSettings.courseCreationMode === 'org_staff',
  );

  return (
    <div className="mx-auto w-full max-w-4xl space-y-12 pt-10 pb-20 px-4 sm:px-0">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-4">
          <nav className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Link href="/organization" className="flex items-center hover:text-slate-900 transition-colors">
              <ChevronLeft className="size-4" />
              Organizations
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 dark:text-slate-100">Course Workspace</span>
          </nav>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
              Workspace
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400">
              Manage your organization's course catalog.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <StatBadge label="Courses" value={courses.length} />
          <StatBadge label="Published" value={courses.filter((c) => c.published).length} />
        </div>
      </div>

      <main className="space-y-16">
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
            <FolderKanban className="size-5 text-indigo-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Course Catalog
            </h2>
          </div>

          {courses.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm text-slate-500">No courses yet. Create one below to get started.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/org/${orgId}/courses/${course.id}`}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="size-12 shrink-0 rounded-lg object-cover shadow-sm transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 dark:bg-slate-900">
                        <BookOpen className="size-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="truncate text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {course.title}
                        </h3>
                        <Badge variant={course.published ? 'success' : 'secondary'} className="h-4 px-1 text-[9px] uppercase tracking-wider">
                          {course.published ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                        {course.description || 'Manage this course.'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="size-5 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-indigo-500" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {canCreateCourse && (
          <section className="space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
              <Plus className="size-5 text-indigo-500" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Create Course
              </h2>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-950">
              <CreateCourseForm
                orgId={orgId}
                canCreate={canCreateCourse}
                isAppAdmin={isAppAdmin(adminSettings)}
              />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <span className="font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-bold text-slate-950 dark:text-slate-50">{value}</span>
    </div>
  );
}

function isAppAdmin(settings: AdminSettingsResponse | null): boolean {
  return settings?.isAppAdmin ?? false;
}
