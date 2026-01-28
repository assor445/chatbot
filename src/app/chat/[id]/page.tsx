import { redirect } from 'next/navigation'
import { getChat } from '@/actions/chat'
import ExistingChatClient from './ExistingChatClient'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ExistingChatPage({ params }: PageProps) {
    const { id } = await params

    const { chat, messages } = await getChat(id)

    // If chat not found, redirect to new chat
    if (!chat) {
        redirect('/chat')
    }

    // Transform messages to the format expected by ChatInterface
    const formattedMessages = messages.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content
    }))

    return (
        <ExistingChatClient
            chatId={id}
            initialMessages={formattedMessages}
        />
    )
}
