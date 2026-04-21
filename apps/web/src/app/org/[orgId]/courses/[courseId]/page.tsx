import Link from 'next/link';
import { getSupabaseAccessTokenFromSession } from '@/lib/supabase-access-token.server';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CourseSettingsForm } from '@/components/courses/course-settings-form';
import { CreateLessonForm } from '@/components/lessons/create-lesson-form';

type Course = {
  id: string;
  title: string;
  description: string | null;
  published: boolean;
  thumbnail_url: string | null;
};

type Lesson = {
  id: string;
  title: string;
  sort_order: number;
};

export default async function CoursePage({
  params,
}: {
  params: Promise<{ orgId: string; courseId: string }>;
}) {
  const { orgId, courseId } = await params;
  const accessToken = await getSupabaseAccessTokenFromSession();
  if (!accessToken) return null;

  let course: Course | null = null;
  let lessons: Lesson[] = [];
  try {
    course = await apiFetch<Course>(`/courses/${courseId}`, accessToken);
    lessons = await apiFetch<Lesson[]>(
      `/lessons?courseId=${encodeURIComponent(courseId)}`,
      accessToken,
    );
  } catch {
    course = null;
  }

  if (!course) {
    return <p className="text-neutral-500">Course not found or access denied.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          <Link href={`/org/${orgId}`} className="underline">
            Back to courses
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight mt-2">{course.title}</h1>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Course settings</CardTitle>
            <CardDescription>Title, description, and publish state.</CardDescription>
          </CardHeader>
          <CardContent>
            <CourseSettingsForm
              courseId={courseId}
              initialTitle={course.title}
              initialDescription={course.description ?? ''}
              initialPublished={course.published}
              initialThumbnailUrl={course.thumbnail_url ?? ''}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lessons</CardTitle>
            <CardDescription>Ordered content for learners.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CreateLessonForm courseId={courseId} orgId={orgId} />
            <ul className="space-y-2">
              {lessons.length === 0 ? (
                <li className="text-sm text-neutral-500">No lessons yet.</li>
              ) : (
                lessons.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/org/${orgId}/courses/${courseId}/lessons/${l.id}`}
                      className="text-sm font-medium underline hover:no-underline"
                    >
                      {l.title}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
