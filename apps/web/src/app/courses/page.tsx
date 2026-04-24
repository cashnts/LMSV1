/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { ArrowRight, BookOpen, Search, Sparkles, Building2, Clock } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getSupabaseAccessTokenFromSession } from '@/lib/supabase-access-token.server';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

type CourseCatalogRow = {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  published: boolean;
  thumbnail_url: string | null;
  created_at: string;
  organizations: { name: string } | null;
};

export const dynamic = 'force-dynamic';

export default async function CourseCatalogPage() {
  const accessToken = await getSupabaseAccessTokenFromSession();
  if (!accessToken) return null;

  let courses: CourseCatalogRow[] = [];
  try {
    courses = await apiFetch<CourseCatalogRow[]>('/courses/discover', accessToken);
  } catch {
    courses = [];
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-12 pt-12 pb-24 px-4 sm:px-8">
      <main className="space-y-12">
        {/* Search and Filters Header */}
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between border-b border-slate-100 pb-8 dark:border-slate-800">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                <BookOpen className="size-5" />
              </div>
              Course Library
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Find your next learning path
            </p>
          </div>
          
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input 
              placeholder="Search by title or topic..." 
              className="h-14 pl-12 pr-6 rounded-2xl border-slate-200 bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all dark:border-slate-800 dark:bg-slate-950"
            />
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-[3rem] border-2 border-dashed border-slate-200 bg-white py-24 text-center dark:border-slate-800 dark:bg-slate-950">
            <div className="mx-auto flex size-20 items-center justify-center rounded-[2rem] bg-slate-50 text-slate-400 dark:bg-slate-900">
              <Sparkles className="size-10" />
            </div>
            <h3 className="mt-6 text-2xl font-black text-slate-900 dark:text-slate-100">Catalog under construction</h3>
            <p className="mt-3 text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto">
              Our educators are currently crafting new learning experiences. Check back soon for the latest updates.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/learn/${course.id}`}
                className="group flex flex-col overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-2 hover:border-indigo-200 hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.15)] dark:border-slate-800 dark:bg-slate-950 dark:hover:border-indigo-900"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                  {course.thumbnail_url ? (
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title} 
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-indigo-50 text-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-900">
                      <BookOpen className="size-16" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute left-4 top-4">
                    <Badge className="bg-white/90 text-slate-900 backdrop-blur-md border-none px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm">
                      New
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-1 flex-col p-8">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:bg-slate-900">
                        <Building2 className="size-3" />
                        {course.organizations?.name || 'Academy'}
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:bg-slate-900">
                        <Clock className="size-3" />
                        {new Date(course.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-black leading-tight text-slate-900 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400 transition-colors">
                      {course.title}
                    </h3>
                    
                    {course.description && (
                      <p className="line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
                        {course.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6 dark:border-slate-800">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Enrollment</span>
                      <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">Free</span>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm shadow-indigo-100 dark:bg-indigo-950/30 dark:shadow-none">
                      <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
