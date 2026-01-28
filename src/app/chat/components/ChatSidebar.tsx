'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { deleteChat, type Chat } from '@/actions/chat'
import { useChatContext } from '../context'

interface ChatSidebarProps {
    chats: Chat[]
    user: { email?: string } | null
    isSidebarOpen: boolean
}

export default function ChatSidebar({ chats, user, isSidebarOpen }: ChatSidebarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const { setIsSidebarOpen } = useChatContext()
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const handleNewChat = () => {
        router.push('/chat')
        if (isMobile) setIsSidebarOpen(false)
    }

    const handleChatClick = (chatId: string) => {
        router.push(`/chat/${chatId}`)
        if (isMobile) setIsSidebarOpen(false)
    }

    const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation()
        setDeletingId(chatId)
        const { success } = await deleteChat(chatId)
        if (success) {
            if (pathname === `/chat/${chatId}`) {
                router.push('/chat')
            }
            router.refresh()
        }
        setDeletingId(null)
    }

    const currentChatId = pathname.startsWith('/chat/') ? pathname.split('/')[2] : null

    // Don't render if closed on desktop
    if (!isSidebarOpen && !isMobile) {
        return null
    }

    return (
        <>
            {/* Mobile Overlay */}
            {isSidebarOpen && isMobile && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`
                    ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'}
                    w-[260px] bg-[#171717] flex flex-col h-full
                    transition-transform duration-200 ease-out
                    ${isMobile && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
                `}
            >
                {/* Header with New Chat and Close */}
                <div className="h-12 flex items-center justify-between px-2 border-b border-white/5">
                    <Button
                        onClick={handleNewChat}
                        variant="ghost"
                        size="sm"
                        className="gap-2 h-9 px-3 text-white/90 hover:bg-white/10 font-normal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14" /><path d="M5 12h14" />
                        </svg>
                        New chat
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(false)}
                        className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M9 3v18" />
                        </svg>
                    </Button>
                </div>

                {/* Chat List */}
                <ScrollArea className="flex-1 px-2">
                    <div className="pb-2">
                        {chats.length === 0 ? (
                            <p className="text-xs text-gray-500 px-3 py-6 text-center">
                                No chats yet
                            </p>
                        ) : (
                            <div className="space-y-0.5">
                                {chats.map(chat => (
                                    <div
                                        key={chat.id}
                                        onClick={() => handleChatClick(chat.id)}
                                        className={`
                                            group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
                                            transition-colors relative
                                            ${currentChatId === chat.id
                                                ? 'bg-white/10'
                                                : 'hover:bg-white/5'
                                            }
                                        `}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        </svg>
                                        <span className="text-sm text-gray-200 truncate flex-1">
                                            {chat.title}
                                        </span>

                                        {/* Delete Button (on hover) */}
                                        <button
                                            onClick={(e) => handleDeleteChat(e, chat.id)}
                                            disabled={deletingId === chat.id}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-md transition-all"
                                        >
                                            {deletingId === chat.id ? (
                                                <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 hover:text-red-400">
                                                    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* User Section */}
                <div className="p-2 border-t border-white/10">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-medium">
                                {user?.email?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-200 truncate">
                                {user?.email?.split('@')[0] || 'User'}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-10 px-3 mt-1 text-gray-400 hover:text-white hover:bg-white/10 font-normal"
                        onClick={handleLogout}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
                        </svg>
                        Log out
                    </Button>
                </div>
            </aside>
        </>
    )
}
