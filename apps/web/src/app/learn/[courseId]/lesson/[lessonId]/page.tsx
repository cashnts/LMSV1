/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import {
  FileStack,
  MoreVertical,
  PlayCircle,
  Share2,
  X,
  CheckCircle2,
  ArrowLeft,
  MessageSquare,
  Info,
} from 'lucide-react';
import { getSupabaseAccessTokenFromSession } from '@/lib/supabase-access-token.server';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { LessonCompleteButton } from '@/components/learn/lesson-complete-button';
import { LessonComments } from '@/components/learn/lesson-comments';
import { LessonMarkdown } from '@/components/learn/lesson-markdown';
import { LessonAssetsGallery, type LessonAsset } from '@/components/lessons/lesson-assets-gallery';
import { VideoPlayer } from '@/components/learn/video-player';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

type Course = { id: string; title: string };
type Lesson = { 
  id: string; 
  title: string; 
  content_md: string | null; 
  sort_order: number;
  updated_at: string;
  asset_count?: number;
};
type Progress = { lesson_id: string; completed_at: string | null };
type Enrollment = { course_id: string };

export default async function LessonViewPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect('/login');

  const { courseId, lessonId } = await params;
  const accessToken = await getSupabaseAccessTokenFromSession();
  if (!accessToken) return null;

  // Check enrollment first
  const enrollments = await apiFetch<Enrollment[]>('/enrollments/me', accessToken);
  const isEnrolled = enrollments.some((e) => e.course_id === courseId);

  if (!isEnrolled) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Enrollment Required</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">You must be enrolled in this course to view its lessons.</p>
        <Button asChild className="mt-6 rounded-xl bg-indigo-600 hover:bg-indigo-700">
          <Link href={`/learn/${courseId}`}>Go to Course Overview</Link>
        </Button>
      </div>
    );
  }

  const [course, lessons, lesson, progress] = await Promise.all([
    apiFetch<Course>(`/courses/${courseId}`, accessToken),
    apiFetch<Lesson[]>(`/lessons?courseId=${encodeURIComponent(courseId)}`, accessToken),
    apiFetch<Lesson>(`/lessons/${lessonId}`, accessToken),
    apiFetch<Progress[]>(`/progress?courseId=${encodeURIComponent(courseId)}`, accessToken),
  ]);

  const assets = await apiFetch<LessonAsset[]>(`/lessons/${lessonId}/assets`, accessToken);
  const done = new Set(progress.filter((p) => p.completed_at).map((p) => p.lesson_id));
  const progressPct = lessons.length > 0 ? Math.round((done.size / lessons.length) * 100) : 0;

  const videoAsset = assets.find(a => a.kind === 'video');
  const otherAssets = assets.filter(a => a.id !== videoAsset?.id);

  const lastUpdated = new Date(lesson.updated_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate video properties for Client Component
  const videoUrl = videoAsset ? (videoAsset.cdn_url || videoAsset.signed_url || '') : null;
  const isIframe = !!(videoAsset && (
    videoAsset.storage_provider === 'bunny-stream' || 
    (videoAsset.storage_provider === 'bunny-storage' && videoUrl?.includes('mediadelivery.net')) ||
    (videoAsset.storage_provider === 'external' && videoUrl?.includes('mediadelivery.net'))
  ));

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-[#0d1117]">
      {/* Top Navigation Bar - Truly Full Width, Overlays Site Nav */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-[#0d1117] px-6 text-white">
        <div className="flex items-center gap-4 truncate">
          <Button asChild variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/10">
            <Link href={`/learn/${courseId}`}>
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div className="h-6 w-px bg-slate-700" />
          <div className="truncate">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{course.title}</p>
            <h2 className="truncate text-sm font-bold">{lesson.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-4 lg:flex">
             <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400">Your progress • {progressPct}%</span>
                <div className="h-1.5 w-40 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${progressPct}%` }} />
                </div>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden text-white hover:bg-white/10 sm:flex">
              <Share2 className="mr-2 size-4" />
              Share
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/10">
              <MoreVertical className="size-5" />
            </Button>
            <Button asChild variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/10">
              <Link href={`/learn/${courseId}`}>
                <X className="size-5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Video & Lesson Details */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {/* Video Player Area - Truly Edge-to-Edge */}
          <div className="w-full bg-black">
            <VideoPlayer url={videoUrl} isIframe={isIframe} />
          </div>

          {/* Lesson Details Area */}
          <div className="w-full py-10">
            {/* Header info - Flush with video edges */}
            <div className="mb-10 flex flex-wrap items-center justify-between gap-6 border-b border-slate-200 px-8 pb-8 dark:border-slate-800 lg:px-12">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{lesson.title}</h1>
                <p className="mt-2 text-sm text-slate-500">Last updated {lastUpdated}</p>
              </div>
              <LessonCompleteButton lessonId={lessonId} initialDone={done.has(lessonId)} />
            </div>

            {/* Main content - with balanced internal padding */}
            <div className="space-y-16 px-8 lg:px-12">
              {/* Lesson Overview */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                  <span className="flex size-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Info className="size-3.5 text-slate-600 dark:text-slate-400" />
                  </span>
                  Lesson Overview
                </div>
                {lesson.content_md ? (
                  <div className="prose prose-slate max-w-none dark:prose-invert">
                    <LessonMarkdown content={lesson.content_md} />
                  </div>
                ) : (
                  <p className="text-base italic text-slate-500">No text materials provided for this lesson.</p>
                )}
              </section>

              {/* Resources & Downloads */}
              {otherAssets.length > 0 && (
                <section className="space-y-6 pt-10 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                      <FileStack className="size-3.5 text-slate-600 dark:text-slate-400" />
                    </span>
                    Resources & Downloads
                  </div>
                  <LessonAssetsGallery assets={otherAssets} />
                </section>
              )}

              {/* Discussion Section */}
              <section className="space-y-8 pt-10 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                   <span className="flex size-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                    <MessageSquare className="size-3.5 text-slate-600 dark:text-slate-400" />
                  </span>
                  Q&A / Discussion
                </div>
                <div className="max-w-4xl">
                  <LessonComments lessonId={lessonId} />
                </div>
              </section>
            </div>
          </div>
        </main>

        {/* Right Column: Course Content Sidebar - Fixed Width (340px) */}
        <aside className="hidden w-[340px] shrink-0 flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0d1117] lg:flex">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-slate-400">Course content</h2>
            <Button variant="ghost" size="icon" className="size-8 rounded-full text-slate-400 hover:text-white">
              <X className="size-4" />
            </Button>
          </div>
          
          <nav className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {lessons.map((l, i) => {
              const isActive = l.id === lessonId;
              return (
                <Link
                  key={l.id}
                  href={`/learn/${courseId}/lesson/${l.id}`}
                  className={`group flex items-start gap-4 px-6 py-5 transition-colors ${
                    isActive 
                      ? 'bg-indigo-600/10 dark:bg-indigo-500/10 border-l-4 border-indigo-500' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                     {done.has(l.id) ? (
                       <CheckCircle2 className="size-5 text-emerald-500" />
                     ) : (
                       <PlayCircle className={`size-5 ${isActive ? 'text-indigo-500' : 'text-slate-500 group-hover:text-slate-400'}`} />
                     )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13px] font-bold leading-tight ${isActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {i + 1}. {l.title}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-[11px] font-medium text-slate-500">
                       <span className="flex items-center gap-1">
                         <FileStack className="size-3" />
                         {l.asset_count || 0} resources
                       </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>
      </div>
    </div>
  );
}
