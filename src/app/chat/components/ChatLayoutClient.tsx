'use client'

import ChatSidebar from './ChatSidebar'
import { type Chat } from '@/actions/chat'
import { ChatContextProvider } from '../context'
import { useChatContext } from '../context'
import { ErrorBoundary } from '@/components/ErrorBoundary'

interface ChatLayoutClientProps {
    chats: Chat[]
    user: { email?: string } | null
    children: React.ReactNode
}

function ChatLayoutInner({ chats, user, children }: ChatLayoutClientProps) {
    const { isSidebarOpen } = useChatContext()

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#212121]">
            <ChatSidebar
                chats={chats}
                user={user}
                isSidebarOpen={isSidebarOpen}
            />
            <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <ErrorBoundary>
                    {children}
                </ErrorBoundary>
            </main>
        </div>
    )
}

export default function ChatLayoutClient(props: ChatLayoutClientProps) {
    return (
        <ChatContextProvider>
            <ErrorBoundary>
                <ChatLayoutInner {...props} />
            </ErrorBoundary>
        </ChatContextProvider>
    )
}
