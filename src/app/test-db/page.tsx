import { createClient } from '@/utils/supabase/server'

export default async function TestDbPage() {
    const supabase = await createClient()

    // 1. Check User
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    // 2. Fetch Chats
    let chatsData = null
    let chatsError = null

    if (user) {
        const result = await supabase
            .from('chats')
            .select('*')
            .eq('user_id', user.id)
            .limit(5)
        chatsData = result.data
        chatsError = result.error
    }

    return (
        <div className="p-8 font-mono text-sm max-w-4xl mx-auto space-y-8 bg-black text-green-400">
            <h1 className="text-xl font-bold border-b border-green-800 pb-2">Supabase Debug Console</h1>

            <section className="space-y-2">
                <h2 className="text-white font-bold">1. Authentication Status</h2>
                <div className="bg-gray-900 p-4 rounded border border-gray-800">
                    {userError ? (
                        <div className="text-red-400">
                            User Error: {JSON.stringify(userError, null, 2)}
                        </div>
                    ) : user ? (
                        <div className="text-green-400">
                            Logged in as: {user.email} <br />
                            User ID: {user.id}
                        </div>
                    ) : (
                        <div className="text-yellow-400">No user session found (Not logged in)</div>
                    )}
                </div>
            </section>

            <section className="space-y-2">
                <h2 className="text-white font-bold">2. Chats Table Query</h2>
                <div className="bg-gray-900 p-4 rounded border border-gray-800 overflow-auto">
                    {chatsError ? (
                        <div className="text-red-400 space-y-2">
                            <div><strong>Error Occurred!</strong></div>
                            <pre>{JSON.stringify(chatsError, null, 2)}</pre>
                            <div><strong>Raw Error Message:</strong> {chatsError.message}</div>
                            <div><strong>Error Code:</strong> {chatsError.code}</div>
                            <div><strong>Error Hint:</strong> {chatsError.hint}</div>
                            <div><strong>Error Details:</strong> {chatsError.details}</div>
                        </div>
                    ) : chatsData ? (
                        <div className="text-green-400">
                            <div>Query Successful!</div>
                            <div>Rows found: {chatsData.length}</div>
                            <pre className="mt-2 text-xs text-gray-400">{JSON.stringify(chatsData, null, 2)}</pre>
                        </div>
                    ) : (
                        <div className="text-gray-500">Query skipped (no user)</div>
                    )}
                </div>
            </section>
        </div>
    )
}
