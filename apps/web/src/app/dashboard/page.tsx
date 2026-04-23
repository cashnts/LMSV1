import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { getSupabaseAccessTokenFromSession } from '@/lib/supabase-access-token.server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type OrgRow = {
  id: string;
  name: string;
  subscription_status: string | null;
  created_at: string;
  role: string;
};

type EnrollmentRow = {
  course_id: string;
  enrolled_at: string;
  courses: { id: string; title: string; description: string | null; published: boolean; org_id: string } | null;
};

type CourseRow = {
  id: string;
  title: string;
  description: string | null;
  published: boolean;
  org_id: string;
};

type CertificateRow = {
  id: string;
  course_id: string;
  issued_at: string;
  courses: { title: string } | null;
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const accessToken = await getSupabaseAccessTokenFromSession();
  if (!accessToken) return null;

  let orgs: OrgRow[] = [];
  let enrollments: EnrollmentRow[] = [];
  let certificates: CertificateRow[] = [];
  
  try {
    orgs = await apiFetch<OrgRow[]>('/organization', accessToken);
  } catch {
    orgs = [];
  }

  try {
    enrollments = await apiFetch<EnrollmentRow[]>('/enrollments/me', accessToken);
  } catch {
    enrollments = [];
  }

  try {
    certificates = await apiFetch<CertificateRow[]>('/certificates', accessToken);
  } catch {
    certificates = [];
  }

  const coursesByOrg = await Promise.all(
    orgs.map(async (org) => {
      try {
        const courses = await apiFetch<CourseRow[]>(`/courses?orgId=${encodeURIComponent(org.id)}`, accessToken);
        return courses.map((course) => ({ ...course, orgName: org.name }));
      } catch {
        return [] as Array<CourseRow & { orgName: string }>;
      }
    }),
  );

  const availableCourses = coursesByOrg
    .flat()
    .filter((course) => course.published)
    .filter((course) => !enrollments.some((enrollment) => enrollment.course_id === course.id));

  return (
    <div className="w-full space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Dashboard</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">Learning overview</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          Track enrollments, open published courses from your organizations, and continue learning without leaving this page.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Organizations" value={orgs.length} hint="Teams you belong to" />
        <StatCard label="Enrolled" value={enrollments.length} hint="Courses already joined" />
        <StatCard label="Certificates" value={certificates.length} hint="Earned certificates" />
        <StatCard label="Active orgs" value={orgs.filter((org) => org.subscription_status === 'active').length} hint="Organizations with active status" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader>
            <CardTitle className="text-xl">Enrolled courses</CardTitle>
            <CardDescription>Resume where you left off.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {enrollments.length === 0 ? (
              <p className="text-sm text-slate-500">No enrollments yet.</p>
            ) : (
              enrollments.map((enrollment) => (
                <div
                  key={enrollment.course_id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                      {enrollment.courses?.title ?? enrollment.course_id}
                    </p>
                    <p className="text-xs text-slate-500">
                      Enrolled {new Date(enrollment.enrolled_at).toLocaleString()}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/learn/${enrollment.course_id}`}>Open</Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader>
            <CardTitle className="text-xl">Certificates</CardTitle>
            <CardDescription>Your completed course achievements.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {certificates.length === 0 ? (
              <p className="text-sm text-slate-500">No certificates earned yet.</p>
            ) : (
              certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-emerald-900 dark:text-emerald-100">
                      {cert.courses?.title ?? 'Course Certificate'}
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      Issued {new Date(cert.issued_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center justify-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                    Verified
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <CardTitle className="text-xl">Available courses</CardTitle>
          <CardDescription>Published courses from your organizations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableCourses.length === 0 ? (
            <p className="text-sm text-slate-500">No published courses are available right now.</p>
          ) : (
            availableCourses.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900 dark:text-slate-100">{course.title}</p>
                  <p className="text-xs text-slate-500">{course.orgName}</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/learn/${course.id}`}>Enroll</Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-500">{hint}</p>
      </CardContent>
    </Card>
  );
}
