'use client'

import ChatInterface from '../components/ChatInterface'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
}

interface ExistingChatClientProps {
    chatId: string
    initialMessages: Message[]
}

export default function ExistingChatClient({ chatId, initialMessages }: ExistingChatClientProps) {
    return (
        <ChatInterface
            key={chatId}
            chatId={chatId}
            initialMessages={initialMessages}
        />
    )
}
