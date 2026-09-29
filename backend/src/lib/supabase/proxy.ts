import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isAuthCallbackPath } from '@/lib/auth/safe-next';

function copyAuthState(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  for (const header of ['cache-control', 'expires', 'pragma']) {
    const value = source.headers.get(header);
    if (value) target.headers.set(header, value);
  }
  return target;
}

function isProtectedPath(path: string) {
  return ['/chat', '/research', '/create', '/projects', '/control'].some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        },
      },
    },
  );

  const path = request.nextUrl.pathname;
  if (isAuthCallbackPath(path)) return supabaseResponse;

  const { data, error } = await supabase.auth.getClaims();
  const subject = !error && typeof data?.claims?.sub === 'string' ? data.claims.sub : null;
  const authenticated = Boolean(subject);
  const ownerId = process.env.QUOARAAI_OWNER_USER_ID?.trim() || null;
  const ownerAuthenticated = Boolean(authenticated && ownerId && subject === ownerId);

  const authRoute = path.startsWith('/login') || path.startsWith('/signup');
  const protectedPage = isProtectedPath(path);

  if (!ownerAuthenticated && protectedPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = ownerId ? '' : '?setup=owner';
    return copyAuthState(supabaseResponse, NextResponse.redirect(url));
  }

  if (ownerAuthenticated && authRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/chat';
    url.search = '';
    return copyAuthState(supabaseResponse, NextResponse.redirect(url));
  }

  return supabaseResponse;
}
