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
  const { pathname } = request.nextUrl;

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
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  // 1. Check for Student Authentication
  const studentToken = request.cookies.get('ana_student_session')?.value;
  let isStudentAuthenticated = false;

  if (studentToken) {
    try {
      const { jwtVerify } = await import('jose');
      const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';
      const secret = new TextEncoder().encode(JWT_SECRET);
      await jwtVerify(studentToken, secret);
      isStudentAuthenticated = true;
    } catch (e) {
      console.error('Invalid student session', e);
    }
  }

  const isAdminAuthenticated = !!adminUser;
  const isPublic = isPublicRoute(pathname);
  const isAuth = isAuthRoute(pathname);
  const isApiRoute = pathname.startsWith('/api');
  const isStudentRoute = pathname.startsWith('/student');

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
