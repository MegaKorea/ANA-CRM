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

    // Student trying to access admin API routes (unless it's /api/student or /api/auth)
    if (isStudentAuthenticated && !pathname.startsWith('/api/student') && !pathname.startsWith('/api/auth')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Handle Login Routes
  if (isAuth) {
    if (isAdminAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = DEFAULT_AUTHENTICATED_ROUTE;
      return NextResponse.redirect(url);
    }
    if (isStudentAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = '/student'; // Default student landing page
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
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
