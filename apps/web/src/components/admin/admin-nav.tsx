'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, LayoutDashboard, Shield, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/access', label: 'Access', icon: Shield },
  { href: '/admin/policies', label: 'Policies', icon: SlidersHorizontal },
  { href: '/admin/organizations', label: 'Organizations', icon: Building2 },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all duration-200',
              isActive
                ? 'bg-slate-950 text-white shadow-lg shadow-slate-200 dark:bg-slate-100 dark:text-slate-950 dark:shadow-none'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900/50 dark:hover:text-slate-50',
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
