import { AppShell } from '@/components/layout/app-shell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppShell className="max-w-[1440px] xl:px-8">{children}</AppShell>;
}
