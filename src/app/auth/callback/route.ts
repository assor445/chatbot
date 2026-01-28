import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // URL untuk redirect setelah login, default ke halaman chat
    const next = searchParams.get('next') ?? '/chat'

    if (code) {
        const supabase = await createClient()
        // Menukar authorization code menjadi session cookie
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Redirect ke halaman yang dituju setelah berhasil login
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Jika gagal, redirect ke halaman login dengan error message
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
