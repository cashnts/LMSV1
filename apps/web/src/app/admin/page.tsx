import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import { getSupabaseAccessTokenFromSession } from '@/lib/supabase-access-token.server';
import { 
  Users, 
  BookOpen, 
  TrendingUp,
  Clock,
  ArrowUpRight,
  GraduationCap,
  Layers,
  Flame,
  Award
} from 'lucide-react';

type AnalyticsData = {
  overview: {
    totalUsers: number;
    totalCourses: number;
    totalEnrollments: number;
    totalLessons: number;
  };
  trends: {
    registrations: { created_at: string }[];
    enrollments: { enrolled_at: string }[];
  };
  topCourses: {
    id: string;
    title: string;
    enrollmentCount: number;
  }[];
};

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const accessToken = await getSupabaseAccessTokenFromSession();
  if (!accessToken) return null;

  let data: AnalyticsData | null = null;
  try {
    data = await apiFetch<AnalyticsData>('/admin/analytics', accessToken);
  } catch (err) {
    console.error('Failed to fetch analytics:', err);
  }

  if (!data) return <div className="p-8 text-center text-slate-500">Failed to load platform metrics.</div>;

  const { overview, topCourses, trends } = data;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Primary Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          label="Total Students" 
          value={overview.totalUsers.toLocaleString()} 
          icon={Users} 
          description="Registered learners" 
          color="indigo"
        />
        <MetricCard 
          label="Active Enrollments" 
          value={overview.totalEnrollments.toLocaleString()} 
          icon={GraduationCap} 
          description="Joined course instances" 
          color="emerald"
        />
        <MetricCard 
          label="Published Content" 
          value={overview.totalCourses.toLocaleString()} 
          icon={BookOpen} 
          description="Courses in catalog" 
          color="amber"
        />
        <MetricCard 
          label="Learning Assets" 
          value={overview.totalLessons.toLocaleString()} 
          icon={Layers} 
          description="Lessons and materials" 
          color="blue"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Growth Trends - Visualized with SVG */}
        <Card className="lg:col-span-2 border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-6">
            <div>
              <CardTitle className="text-lg font-bold">Growth Velocity</CardTitle>
              <CardDescription>New registrations vs Enrollments (Last 30 days)</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-black uppercase text-slate-400">Users</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black uppercase text-slate-400">Enrolls</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative h-64 w-full pt-10 px-8">
               <GrowthChart 
                  registrations={trends.registrations} 
                  enrollments={trends.enrollments} 
               />
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-50 border-t border-slate-50 dark:divide-slate-800 dark:border-slate-800">
               <div className="p-6 text-center">
                  <p className="text-2xl font-black text-indigo-600">{trends.registrations.length}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">New Users</p>
               </div>
               <div className="p-6 text-center">
                  <p className="text-2xl font-black text-emerald-600">{trends.enrollments.length}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Course Joins</p>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Courses Leaderboard */}
        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-2">
              <Award className="size-4 text-amber-500" />
              <CardTitle className="text-lg font-bold">Top Performing</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {topCourses.length === 0 ? (
                  <p className="p-8 text-center text-xs text-slate-400">No enrollment data available yet.</p>
                ) : (
                  topCourses.map((course, i) => (
                    <div key={course.id} className="group flex items-center justify-between p-4 hover:bg-slate-50 transition-colors dark:hover:bg-slate-900/50">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-xs font-black text-slate-300 tabular-nums">0{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{course.title}</p>
                          <p className="text-[10px] font-medium text-slate-400">{course.enrollmentCount} total students</p>
                        </div>
                      </div>
                      <div className="size-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                         <ArrowUpRight className="size-4" />
                      </div>
                    </div>
                  ))
                )}
             </div>
             <div className="p-4 bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800 text-center">
                <Link href="/courses" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700">View All Courses</Link>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links Footer */}
      <div className="grid gap-6 sm:grid-cols-3">
         <QuickLink label="Audit User Roster" icon={Users} href="/admin/users" />
         <QuickLink label="System Policies" icon={ShieldCheck} href="/admin/policies" />
         <QuickLink label="Stripe Analytics" icon={TrendingUp} href="https://dashboard.stripe.com" external />
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, description, color }: any) {
  const themes = {
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
  };
  
  return (
    <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-xl ${(themes as any)[color]}`}>
            <Icon className="size-5" />
          </div>
          <TrendingUp className="size-4 text-emerald-500 opacity-50" />
        </div>
        <div className="mt-4">
          <p className="text-3xl font-black text-slate-900 dark:text-slate-50">{value}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{label}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
           <p className="text-[10px] font-medium text-slate-400">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickLink({ label, icon: Icon, href, external }: any) {
  const Comp = external ? 'a' : Link;
  return (
    <Comp 
      href={href} 
      target={external ? "_blank" : undefined}
      className="flex items-center gap-3 p-4 rounded-[1.25rem] border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all dark:bg-slate-950 dark:border-slate-800"
    >
      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover:text-indigo-600 transition-colors">
        <Icon className="size-4" />
      </div>
      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{label}</span>
    </Comp>
  );
}

function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}

/**
 * Simple SVG-based line chart for growth visualization
 */
function GrowthChart({ registrations, enrollments }: { registrations: any[], enrollments: any[] }) {
  // Aggregate data by day (simple count for 30 days)
  const now = new Date();
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  const regCounts = days.map(d => registrations.filter(r => r.created_at.startsWith(d)).length);
  const enrollCounts = days.map(d => enrollments.filter(e => e.enrolled_at.startsWith(d)).length);

  const max = Math.max(...regCounts, ...enrollCounts, 5); // Ensure at least 5 for scale

  const getPoints = (counts: number[]) => {
    return counts.map((count, i) => {
      const x = (i / 29) * 100;
      const y = 100 - (count / max) * 100;
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
      {/* Grid Lines */}
      {[0, 25, 50, 75, 100].map(val => (
        <line key={val} x1="0" y1={val} x2="100" y2={val} className="stroke-slate-50 dark:stroke-slate-800" strokeWidth="0.5" />
      ))}
      
      {/* Enrollments Path (Emerald) */}
      <polyline
        fill="none"
        stroke="#10b981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={getPoints(enrollCounts)}
        className="drop-shadow-sm"
      />
      
      {/* Registrations Path (Indigo) */}
      <polyline
        fill="none"
        stroke="#6366f1"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={getPoints(regCounts)}
        className="drop-shadow-sm"
      />
    </svg>
  );
}
