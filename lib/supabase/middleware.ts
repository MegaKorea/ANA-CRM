import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, type NextRequest } from 'next/server';
import { PUBLIC_ROUTES, AUTH_ROUTES, DEFAULT_AUTHENTICATED_ROUTE } from '@/constants/routes';

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

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!authUser;
  const isStudentAuthenticated = isAuthenticated && authUser?.user_metadata?.role === 'STU';
  const isAdminAuthenticated = isAuthenticated && authUser?.user_metadata?.role !== 'STU';

  const isPublic = isPublicRoute(pathname);
  const isAuth = isAuthRoute(pathname);
  const isApiRoute = pathname.startsWith('/api');
  const isStudentRoute = pathname.startsWith('/student');

  // Handle API Routes Security
  if (isApiRoute && !isPublic) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Student API allowlist: student portal, auth, QR attendance + đọc lịch lớp
    const studentApiAllowed =
      pathname.startsWith('/api/student') ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/attendance/qr') ||
      (request.method === 'GET' &&
        (/^\/api\/classes\/[^/]+$/.test(pathname) ||
          /^\/api\/classes\/[^/]+\/sessions$/.test(pathname) ||
          /^\/api\/classes\/[^/]+\/students$/.test(pathname) ||
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
    // STU: khóa học, lớp (lịch), điểm danh QR
    if (
      isStudentAuthenticated &&
      (pathname.startsWith('/attendance/qr') ||
        pathname.startsWith('/course') ||
        pathname.startsWith('/class'))
    ) {
      return supabaseResponse;
    }
    // STU hitting dashboard `/` or other staff pages → home course, not login
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
