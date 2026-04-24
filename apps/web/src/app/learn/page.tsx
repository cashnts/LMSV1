/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { ArrowRight, BookOpen, GraduationCap, LayoutGrid } from 'lucide-react';
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
  try {
    rows = await apiFetch<Row[]>('/enrollments/me', accessToken);
  } catch {
    rows = [];
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-12 pt-10 pb-20 px-4 sm:px-0">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
            Learning Hub
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">
            Manage your enrollments and continue your lessons.
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <EnrollByIdForm />
        </div>
      </div>

      <main className="space-y-16">
        {/* Active Enrollments */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
            <GraduationCap className="size-5 text-indigo-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Active Enrollments
            </h2>
            <Badge variant="secondary" className="ml-auto">{rows.length}</Badge>
          </div>

          {rows.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm text-slate-500">No active enrollments yet. Use a course ID to enroll above.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {rows.map((row) => (
                <Link
                  key={row.course_id}
                  href={`/learn/${row.course_id}`}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="truncate text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {row.courses?.title ?? row.course_id}
                      </h3>
                      <Badge variant="success" className="h-4 px-1 text-[9px] uppercase tracking-wider">Active</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                      {row.courses?.description || 'Continue your learning journey.'}
                    </p>
                  </div>
                  <ArrowRight className="size-5 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-indigo-500" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
