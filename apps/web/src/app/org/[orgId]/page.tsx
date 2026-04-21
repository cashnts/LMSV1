/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { ArrowRight, FolderKanban } from 'lucide-react';
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
    <div className="mx-auto w-full max-w-4xl space-y-8 pb-10">
      <div className="space-y-6 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Organization
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">Course workspace</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Manage the catalog inside this organization. Create courses here based on the current admin policy.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/courses">Back to catalogs</Link>
          </Button>
        </div>

        <div className="flex flex-wrap gap-4">
          <StatBadge label="Courses" value={courses.length} />
          <StatBadge label="Published" value={courses.filter((c) => c.published).length} />
          <StatBadge
            label="Creation"
            value={adminSettings?.creationSettings.courseCreationMode === 'org_staff' ? 'Org staff' : 'Admins only'}
          />
        </div>
      </div>

      <main className="space-y-10">
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Workspace
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                Catalog
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                Published courses are visible to enrolled learners.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
              <FolderKanban className="size-4" />
              <span>
                {courses.length} {courses.length === 1 ? 'course' : 'courses'}
              </span>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              No courses yet. Create one below to get started.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/org/${orgId}/courses/${course.id}`}
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
                        {course.published ? (
                          <Badge variant="success" className="h-5 px-1.5 text-[10px]">Published</Badge>
                        ) : (
                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">Draft</Badge>
                        )}
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                        {course.description || 'Edit this course to add a description.'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="size-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-5 rounded-[1.5rem] border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">
              New course
            </h2>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
              {isAppAdmin(adminSettings) ? 'Create courses as an app administrator.' : 'Add a title and optional description.'}
            </p>
          </div>
          <CreateCourseForm
            orgId={orgId}
            canCreate={canCreateCourse}
            isAppAdmin={isAppAdmin(adminSettings)}
          />
        </section>
      </main>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <span className="font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-semibold text-slate-900 dark:text-slate-50">{value}</span>
    </div>
  );
}

function isAppAdmin(settings: AdminSettingsResponse | null): boolean {
  return settings?.isAppAdmin ?? false;
}
