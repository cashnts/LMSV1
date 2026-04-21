import Link from 'next/link';
import { ArrowRight, Building2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getSupabaseAccessTokenFromSession } from '@/lib/supabase-access-token.server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type OrgRow = {
  id: string;
  name: string;
  role: string;
};

type CourseRow = {
  id: string;
  title: string;
  description: string | null;
  published: boolean;
  org_id: string;
};

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  const accessToken = await getSupabaseAccessTokenFromSession();
  if (!accessToken) return null;

  let orgs: OrgRow[] = [];
  try {
    orgs = await apiFetch<OrgRow[]>('/organizations', accessToken);
  } catch {
    orgs = [];
  }

  const catalogs = await Promise.all(
    orgs.map(async (org) => {
      try {
        const courses = await apiFetch<CourseRow[]>(`/courses?orgId=${encodeURIComponent(org.id)}`, accessToken);
        return { org, courses };
      } catch {
        return { org, courses: [] as CourseRow[] };
      }
    }),
  );

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 pb-10">
      <div className="space-y-2 pt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          Workspace
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
          Course catalogs
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          Browse courses by organization. Creation and editing stay inside organization workspaces and the admin area.
        </p>
      </div>

      <main className="space-y-10">
        {catalogs.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
            No catalogs yet. You are not a member of any organizations.
          </div>
        ) : (
          <div className="space-y-10">
            {catalogs.map(({ org, courses }) => (
              <section key={org.id} className="space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      Organization
                    </p>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                        {org.name}
                      </h2>
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] uppercase">{org.role}</Badge>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                    <Building2 className="size-4" />
                    <span>
                      {courses.length} {courses.length === 1 ? 'course' : 'courses'}
                    </span>
                  </div>
                </div>

                {courses.length === 0 ? (
                  <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                    No courses in this organization yet.
                    <div className="mt-4">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/org/${org.id}`}>Open organization</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {courses.map((course) => (
                      <Link
                        key={course.id}
                        href={`/org/${org.id}/courses/${course.id}`}
                        className="group flex items-center justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
                      >
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
                          {course.description && (
                            <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                              {course.description}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="size-5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                      </Link>
                    ))}
                    <div className="flex justify-end pt-2">
                      <Button asChild size="sm" variant="outline" className="rounded-full">
                        <Link href={`/org/${org.id}`}>Manage organization</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
