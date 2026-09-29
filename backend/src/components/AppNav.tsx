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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.07] bg-[#09090b]/92 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-12 flex-col items-center justify-center rounded-xl text-[11px] transition ${
                active
                  ? 'bg-violet-400/[0.09] text-violet-200'
                  : 'text-zinc-600 hover:bg-white/5 hover:text-zinc-300'
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
