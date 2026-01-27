import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // 1. Create Supabase Client compatible with Middleware
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // 2. Refresh Session
    // This is critical: getUser() refreshes the Auth Token if it's expired.
    // Without this, Server Components might fail even if the user has a cookie.
    const { data: { user } } = await supabase.auth.getUser()

    // 3. Protected Routes Logic
    const path = request.nextUrl.pathname;

    // Global Auth Guard: Dashboard and Admin require Login
    if ((path.startsWith('/admin') || path.startsWith('/dashboard')) && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Admin Role Guard (Optional Optimization: Store role in metadata or cookie for speed check, 
    // but strict check remains in Layout/DB). 
    // For now, we rely on the strict DB check in the Admin Layout to verify the 'ADMIN' role.

    // Redirect logged-in users away from Login/Register
    if ((path === '/login' || path === '/register') && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
