import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, type NextRequest } from 'next/server';
import { PUBLIC_ROUTES, AUTH_ROUTES, DEFAULT_AUTHENTICATED_ROUTE } from '@/constants/routes';
import { createAdminClient } from '@/lib/supabase/admin';

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route);
}

const ROLE_CACHE_TTL_MS = 30_000;
const roleCache = new Map<string, { roleCode: string | undefined; expiresAt: number }>();

function getCachedRoleCode(userId: string): { hit: true; roleCode: string | undefined } | { hit: false } {
  const entry = roleCache.get(userId);
  if (!entry) return { hit: false };
  if (entry.expiresAt < Date.now()) {
    roleCache.delete(userId);
    return { hit: false };
  }
  return { hit: true, roleCode: entry.roleCode };
}

export async function updateSession(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (searchParams.has('EIO') || searchParams.has('transport')) {
    return new NextResponse('Bad Request: Socket.IO polling not supported', { status: 400 });
  }

  const isPublic = isPublicRoute(pathname);
  const isAuth = isAuthRoute(pathname);
  const isApiRoute = pathname.startsWith('/api');
  const isStudentRoute = pathname.startsWith('/student');

  if (isPublic && !isAuth) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: claimsData } = await supabase.auth.getClaims();
  const authUserId = claimsData?.claims?.sub;

  const isAuthenticated = !!authUserId;

  let roleCode: string | undefined;
  if (isAuthenticated) {
    const cached = getCachedRoleCode(authUserId);
    if (cached.hit) {
      roleCode = cached.roleCode;
    } else {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from('users')
        .select('roles(code)')
        .eq('id', authUserId)
        .maybeSingle();
      roleCode = (profile as { roles?: { code?: string } | null } | null)?.roles?.code;
      roleCache.set(authUserId, { roleCode, expiresAt: Date.now() + ROLE_CACHE_TTL_MS });
    }
  }

  const isStudentAuthenticated = isAuthenticated && roleCode === 'STU';
  const isAdminAuthenticated = isAuthenticated && roleCode != null && roleCode !== 'STU';

  if (isApiRoute && !isPublic) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    const studentApiAllowed =
      pathname.startsWith('/api/student') ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/attendance/qr') ||
      pathname.startsWith('/api/notifications') ||
      pathname === '/api/push/subscribe' ||
      pathname === '/api/push/unsubscribe' ||
      /^\/api\/classes\/sessions\/[^/]+\/quizzes(\/.*)?$/.test(pathname) ||
      /^\/api\/classes\/sessions\/[^/]+\/lectures(\/.*)?$/.test(pathname) ||
      /^\/api\/classes\/sessions\/[^/]+\/seen$/.test(pathname) ||
      (request.method === 'GET' &&
        (pathname === '/api/classes' ||
          /^\/api\/classes\/[^/]+$/.test(pathname) ||
          /^\/api\/classes\/[^/]+\/sessions$/.test(pathname) ||
          /^\/api\/classes\/[^/]+\/students$/.test(pathname) ||
          /^\/api\/classes\/[^/]+\/subject-teachers$/.test(pathname) ||
          pathname === '/api/courses'));

    if (isStudentAuthenticated && !studentApiAllowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  if (isAuth) {
    const nextParam = searchParams.get('next');
    const safeNext =
      nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
        ? nextParam
        : null;

    if (isAdminAuthenticated || isStudentAuthenticated) {
      const url = request.nextUrl.clone();
      if (safeNext) {
        try {
          const dest = new URL(safeNext, request.nextUrl.origin);
          url.pathname = dest.pathname;
          url.search = dest.search;
        } catch {
          url.pathname = isStudentAuthenticated ? '/course' : DEFAULT_AUTHENTICATED_ROUTE;
          url.search = '';
        }
      } else {
        url.pathname = isStudentAuthenticated ? '/course' : DEFAULT_AUTHENTICATED_ROUTE;
        url.search = '';
      }
      return NextResponse.redirect(url);
    }
  }

  if (isStudentRoute && !isStudentAuthenticated) {
    if (!isPublic && !isApiRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  if (!isStudentRoute && !isAdminAuthenticated && !isPublic && !isApiRoute) {
    if (
      isStudentAuthenticated &&
      (pathname.startsWith('/attendance/qr') ||
        pathname.startsWith('/course') ||
        pathname.startsWith('/class'))
    ) {
      return supabaseResponse;
    }
    if (isStudentAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = '/course';
      url.search = '';
      return NextResponse.redirect(url);
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
