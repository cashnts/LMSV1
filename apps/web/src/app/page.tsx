import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { ArrowRight, BookOpen, Layout, ShieldCheck, Sparkles, Zap, GraduationCap } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getSupabaseAccessTokenFromSession } from '@/lib/supabase-access-token.server';
import type { AdminSettingsResponse } from '@/lib/admin-settings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function Home() {
  const { userId } = await auth();

  // If logged in, check if admin setup is needed
  if (userId) {
    const accessToken = await getSupabaseAccessTokenFromSession();
    if (accessToken) {
      try {
        const adminSettings = await apiFetch<AdminSettingsResponse>('/admin/settings', accessToken);
        if (adminSettings.setup.canBootstrapInitialAdmin) {
          redirect('/admin');
        }
      } catch {
        // Fallback
      }
    }
  }

  return (
    <div className="flex w-full flex-col items-center">
      {/* Hero Section - Clean & Minimal */}
      <section className="w-full bg-white px-6 pb-20 pt-20 dark:bg-[#0d1117] lg:pb-32 lg:pt-32">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <Badge variant="secondary" className="mb-8 rounded-full px-4 py-1.5 text-sm font-medium">
            <Sparkles className="mr-2 size-4 text-indigo-500" />
            Modern Learning Management
          </Badge>
          
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-7xl">
            Education made <span className="text-indigo-600 dark:text-indigo-400">effortless.</span>
          </h1>
          
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-slate-500 dark:text-slate-400 sm:text-xl">
            The simplest way to create courses, manage learners, and scale your education platform. Clean, fast, and remarkably intuitive.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {userId ? (
              <Button asChild size="lg" className="h-14 rounded-2xl bg-indigo-600 px-10 text-base font-bold text-white hover:bg-indigo-700">
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 size-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="h-14 rounded-2xl bg-indigo-600 px-10 text-base font-bold text-white hover:bg-indigo-700">
                  <Link href="/sign-up">
                    Get Started
                    <ArrowRight className="ml-2 size-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 rounded-2xl px-10 text-base font-bold">
                  <Link href="/login">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats / Proof Section */}
      <section className="w-full border-y border-slate-100 bg-slate-50/50 py-12 dark:border-slate-800 dark:bg-slate-900/20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">10k+</p>
              <p className="text-sm font-medium text-slate-500">Active Learners</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">500+</p>
              <p className="text-sm font-medium text-slate-500">Courses Published</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">99.9%</p>
              <p className="text-sm font-medium text-slate-500">Uptime Reliability</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">24/7</p>
              <p className="text-sm font-medium text-slate-500">Expert Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
        <div className="mb-20">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Built for modern educators.
          </h2>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
            A minimalist approach to complex learning needs.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard 
            icon={BookOpen}
            title="Course Builder"
            description="Create structured lessons with video, text, and rich media in minutes."
          />
          <FeatureCard 
            icon={Layout}
            title="Clean Dashboard"
            description="Everything you need at a glance, without the unnecessary clutter."
          />
          <FeatureCard 
            icon={ShieldCheck}
            title="Access Control"
            description="Manage who sees what with granular organization-level permissions."
          />
          <FeatureCard 
            icon={Zap}
            title="Fast Streaming"
            description="Lightning fast video delivery powered by global CDN infrastructure."
          />
          <FeatureCard 
            icon={GraduationCap}
            title="Certificates"
            description="Automated certificate generation for your successful graduates."
          />
          <FeatureCard 
            icon={Sparkles}
            title="Modern UX"
            description="A learning experience that learners will actually enjoy using."
          />
        </div>
      </section>

      {/* Simplified CTA */}
      <section className="w-full bg-slate-50 pb-24 dark:bg-slate-900/50">
        <div className="mx-auto max-w-4xl px-6 pt-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Start your journey today.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500">
            Join the organizations that are already scaling their knowledge.
          </p>
          <div className="mt-10 flex justify-center">
            <Button asChild size="lg" className="h-14 rounded-2xl bg-indigo-600 px-10 text-base font-bold text-white hover:bg-indigo-700">
              <Link href={userId ? "/dashboard" : "/sign-up"}>
                {userId ? "Return to Dashboard" : "Create Free Account"}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="group rounded-[2rem] border border-slate-100 bg-white p-8 transition-all hover:border-indigo-500/30 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-900 dark:text-slate-400 dark:group-hover:bg-indigo-950/30">
        <Icon className="size-6" />
      </div>
      <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{title}</h3>
      <p className="leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}