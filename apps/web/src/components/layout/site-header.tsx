'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Show, UserButton } from '@clerk/nextjs';
import {
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  appName: string;
  isAppAdmin: boolean;
  needsAdminSetup: boolean;
};

export function SiteHeader({ appName, isAppAdmin, needsAdminSetup }: Props) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Home' },
    { href: '/courses', label: 'Courses' },
    { href: '/organization', label: 'Organizations' },
    { href: '/learn', label: 'Learn' },
    ...((isAppAdmin || needsAdminSetup) ? [{ href: '/admin', label: needsAdminSetup ? 'Setup' : 'Admin' }] : []),
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[rgba(248,250,252,0.9)] backdrop-blur-xl dark:border-slate-800 dark:bg-[rgba(9,11,17,0.88)]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-slate-950 dark:text-slate-50"
          >
            {appName}
          </Link>

          <Show when="signed-in">
            <nav className="hidden md:flex">
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'rounded-lg px-3 py-2 text-sm transition',
                        isActive
                          ? 'bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950'
                          : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-50',
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </Show>
        </div>

        <div className="flex items-center gap-2">
          <Show when="signed-out">
            <Link
              href="/login"
              className="hidden sm:inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="hidden sm:inline-flex h-9 items-center justify-center rounded-lg bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
            >
              Sign up
            </Link>
          </Show>

          <Show when="signed-in">
            <div className="hidden md:block">
              <UserButton />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen((value) => !value)}
              className="h-9 w-9 rounded-lg p-0 md:hidden"
            >
              {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </Show>
        </div>
      </div>

      <Show when="signed-in">
        {isOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 md:hidden">
            <div className="grid gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn('rounded-lg px-3 py-2 text-sm', isActive ? 'bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950' : 'text-slate-600 dark:text-slate-300')}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="mt-3">
              <UserButton />
            </div>
          </div>
        )}
      </Show>
    </header>
  );
}
