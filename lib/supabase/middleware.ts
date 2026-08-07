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

export async function updateSession(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Block extraneous Socket.IO polling from browser extensions or local apps
  // (e.g. Kaspersky/Zalo) that floods the Next.js dev server with SSR requests.
  if (searchParams.has('EIO') || searchParams.has('transport')) {
    return new NextResponse('Bad Request: Socket.IO polling not supported', { status: 400 });
  }

  const isPublic = isPublicRoute(pathname);
  const isAuth = isAuthRoute(pathname);
  const isApiRoute = pathname.startsWith('/api');
  const isStudentRoute = pathname.startsWith('/student');

  // Every gate below only fires when `!isPublic` (or is the login page, handled
  // via `isAuth`) — so a public route that isn't also the login page never needs
  // auth state at all. Skip the Supabase round trips entirely for those instead
  // of paying for them on every request and only checking pathname afterwards.
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

  // getClaims verifies the signed JWT locally (when JWKS is available), avoiding
  // the extra Auth-server round trip that getUser makes on every request — same
  // pattern already used by getCurrentUser() in lib/services/auth.service.ts.
  const { data: claimsData } = await supabase.auth.getClaims();
  const authUserId = claimsData?.claims?.sub;

  const isAuthenticated = !!authUserId;

  let roleCode: string | undefined;
  if (isAuthenticated) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('users')
      .select('roles(code)')
      .eq('id', authUserId)
      .maybeSingle();
    roleCode = (profile as { roles?: { code?: string } | null } | null)?.roles?.code;
  }
  // Fail closed: if the role lookup errored or the profile row is missing,
  // `roleCode` stays undefined — treat that as neither student nor staff
  // rather than defaulting to staff access (`roleCode !== 'STU'` would
  // otherwise be true for `undefined`).
  const isStudentAuthenticated = isAuthenticated && roleCode === 'STU';
  const isAdminAuthenticated = isAuthenticated && roleCode != null && roleCode !== 'STU';

  // Handle API Routes Security
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

  // Handle Login Routes
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

  // Handle Protected Student Routes
  if (isStudentRoute && !isStudentAuthenticated) {
    if (!isPublic && !isApiRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // Handle Protected Admin Routes
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
