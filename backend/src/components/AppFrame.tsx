import type { ReactNode } from 'react';
import AppNav from './AppNav';

export default function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-neutral-950 pb-20 text-neutral-100 md:pb-0">
      {children}
      <AppNav />
    </div>
  );
}
