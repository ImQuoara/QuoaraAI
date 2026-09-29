'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/chat', label: 'Chat', icon: '✦' },
  { href: '/research', label: 'Research', icon: '⌕' },
  { href: '/create', label: 'Create', icon: '◇' },
  { href: '/control', label: 'Control', icon: '⚙' },
] as const;

export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="QuoaraAi primary navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-800 bg-neutral-950/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-12 flex-col items-center justify-center rounded-xl text-[11px] transition ${
                active ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200'
              }`}
            >
              <span aria-hidden className="text-base leading-none">{item.icon}</span>
              <span className="mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
