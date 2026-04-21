import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { cn } from '@/lib/utils';

/** Auth gate for dashboard/learn/org routes. Global nav lives in `app/layout.tsx`. */
export async function AppShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const user = await currentUser();
  if (!user) redirect('/login');

  return (
    <main className={cn('mx-auto flex w-full max-w-6xl flex-1 px-4 py-8 sm:px-6', className)}>
      {children}
    </main>
  );
}
