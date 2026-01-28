import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // MENGAMBIL USER
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // ATURAN PROTEKSI RUTE (Disini Satpam Bekerja)

    // 1. Jika user BELUM login dan mencoba masuk ke halaman /chat...
    // 1. Jika user BELUM login dan mencoba masuk ke halaman /chat...
    if (!user && request.nextUrl.pathname.startsWith('/chat') && request.method === 'GET') {
        // ...tendang ke halaman login
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // 2. Jika user SUDAH login tapi masih nongkrong di halaman /login...
    if (user && request.nextUrl.pathname.startsWith('/login')) {
        // ...arahkan langsung ke halaman chat
        const url = request.nextUrl.clone()
        url.pathname = '/chat'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}