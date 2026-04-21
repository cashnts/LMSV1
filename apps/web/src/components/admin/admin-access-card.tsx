'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type AdminAccessCardProps = {
  title?: string;
  description?: string;
  details?: string;
  ctaHref?: string;
  ctaLabel?: string;
};

export function AdminAccessCard({
  title = 'Administrator access required',
  description = 'This area is restricted to app administrators. Ask an administrator to open the admin panel or update the admin config for your Clerk account.',
  details,
  ctaHref = '/dashboard',
  ctaLabel = 'Back to dashboard',
}: AdminAccessCardProps) {
  return (
    <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {details ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            {details}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
          <Button type="button" variant="ghost" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
