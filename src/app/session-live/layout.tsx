import AppShell from '@/components/AppShell';

export default function SessionLiveLayout({ children }: { children: React.ReactNode }) {
  return <AppShell fullscreen>{children}</AppShell>;
}
