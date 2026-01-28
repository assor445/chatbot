import { createClient } from '@/utils/supabase/server'
import { getChats } from '@/actions/chat'
import ChatLayoutClient from './components/ChatLayoutClient'

export default async function ChatLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const chats = await getChats()

    return (
        <ChatLayoutClient
            chats={chats}
            user={user ? { email: user.email } : null}
        >
            {children}
        </ChatLayoutClient>
    )
}
