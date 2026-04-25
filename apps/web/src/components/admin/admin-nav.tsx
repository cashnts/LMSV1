'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  LayoutDashboard, 
  ShieldCheck, 
  Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/policies', label: 'Platform Settings', icon: Settings2 },
  { href: '/admin/access', label: 'Admin Roster', icon: ShieldCheck },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'group relative flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all duration-200 rounded-xl',
              isActive
                ? 'bg-white shadow-sm border border-slate-200 text-brand-primary dark:bg-slate-900 dark:border-slate-800'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900/50 dark:hover:text-slate-200',
            )}
          >
            <div className={cn(
              'p-1.5 rounded-lg transition-colors',
              isActive ? 'bg-brand-primary/10' : 'bg-slate-50 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700'
            )}>
              <Icon className={cn('h-4 w-4', isActive ? 'text-brand-primary' : 'text-slate-400')} />
            </div>
            {item.label}
            {isActive && (
              <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-primary rounded-r-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
