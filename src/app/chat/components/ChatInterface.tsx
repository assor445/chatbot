'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createChat, saveMessage } from '@/actions/chat'
import MessageContent from './MessageContent'
import { useChatContext } from '../context'
import { AI_MODELS } from '../data'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
}

interface ChatInterfaceProps {
    chatId?: string
    initialMessages?: Message[]
}

function generateId() {
    return Math.random().toString(36).substring(2, 15)
}

export default function ChatInterface({
    chatId,
    initialMessages
}: ChatInterfaceProps) {
    const { selectedModel, setSelectedModel, isSidebarOpen, setIsSidebarOpen } = useChatContext()
    const [inputValue, setInputValue] = useState('')
    const [messages, setMessages] = useState<Message[]>(initialMessages ?? [])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentChatId, setCurrentChatId] = useState<string | undefined>(chatId)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const abortControllerRef = useRef<AbortController | null>(null)
    const router = useRouter()
    const isNewChatRef = useRef(false)

    // Use ref to always have latest messages
    const messagesRef = useRef<Message[]>(initialMessages ?? [])
    useEffect(() => {
        messagesRef.current = messages
    }, [messages])

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isLoading])

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
            setIsLoading(false)
        }
    }

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || isLoading) return

        setError(null)
        setIsLoading(true)

        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        const controller = new AbortController()
        abortControllerRef.current = controller

        const userMessage: Message = {
            id: generateId(),
            role: 'user',
            content: content.trim()
        }

        const currentMessages = [...messagesRef.current, userMessage]
        setMessages(currentMessages)

        let activeChatId = currentChatId

        if (!activeChatId) {
            const { chatId: newChatId, error: createError } = await createChat(content.trim())
            if (createError || !newChatId) {
                setError(createError || 'Failed to create chat')
                setIsLoading(false)
                return
            }
            activeChatId = newChatId
            setCurrentChatId(newChatId)
            isNewChatRef.current = true
        } else {
            await saveMessage(activeChatId, 'user', content.trim())
        }

        const requestMessages = currentMessages
            .filter(m => m.content && m.content.trim() !== '')
            .map(m => ({
                role: m.role,
                content: m.content
            }))

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: requestMessages,
                    model: selectedModel
                }),
                signal: controller.signal
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`HTTP ${response.status}: ${errorText}`)
            }

            const assistantId = generateId()
            setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])

            const reader = response.body?.getReader()
            if (!reader) throw new Error('No response body')

            const decoder = new TextDecoder()
            let fullContent = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) {
                    if (activeChatId && fullContent.trim()) {
                        await saveMessage(activeChatId, 'assistant', fullContent)
                    }
                    if (isNewChatRef.current && activeChatId) {
                        isNewChatRef.current = false
                        router.replace(`/chat/${activeChatId}`)
                    }
                    break
                }
                const chunk = decoder.decode(value, { stream: true })
                fullContent += chunk
                setMessages(prev =>
                    prev.map(m =>
                        m.id === assistantId ? { ...m, content: fullContent } : m
                    )
                )
            }

        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') return
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            if (abortControllerRef.current === controller) {
                abortControllerRef.current = null
                setIsLoading(false)
            }
        }
    }, [isLoading, selectedModel, currentChatId, router])

    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Auto-resize input
    useEffect(() => {
        const textarea = textareaRef.current
        if (textarea) {
            textarea.style.height = 'auto'
            const newHeight = Math.min(textarea.scrollHeight, 200)
            textarea.style.height = `${newHeight}px`
            textarea.style.overflowY = newHeight >= 200 ? 'auto' : 'hidden'
        }
    }, [inputValue])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (inputValue.trim() && !isLoading) {
            sendMessage(inputValue)
            setInputValue('')
            // Reset height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
            }
        }
    }

    // --- Render Helpers ---

    const ModelSelector = () => (
        <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-fit h-8 gap-2 bg-transparent border-none text-[#EFECE3] hover:bg-[#212121]/50 focus:ring-0 focus:ring-offset-0 transition-colors">
                <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#212121] border-[#212121] text-[#EFECE3]">
                {AI_MODELS.map(model => (
                    <SelectItem key={model.id} value={model.id} className="focus:bg-[#212121] focus:text-white cursor-pointer">
                        <span className="font-medium">{model.name}</span>
                        <span className="ml-2 text-xs text-[#EFECE3] hidden sm:inline">{model.description}</span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )

    // Empty State (Welcome Screen)
    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col h-full bg-[#212121] relative overflow-hidden">
                {/* Header Toggle */}
                <div className="h-12 flex items-center px-3">
                    {!isSidebarOpen && (
                        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="text-gray-400 hover:text-white hover:bg-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M9 3v18" /></svg>
                        </Button>
                    )}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 w-full max-w-2xl mx-auto">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium text-white mb-6 sm:mb-8 text-center">
                        What can I help with?
                    </h1>

                    <form onSubmit={handleSubmit} className="w-full">
                        <div className="relative bg-[#2f2f2f] rounded-2xl sm:rounded-3xl p-1 sm:p-1.5 shadow-lg">
                            <input
                                autoFocus
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Message to AiChatBot"
                                className="w-full bg-transparent border-none text-white text-sm sm:text-base px-3 sm:px-4 py-2.5 sm:py-3 placeholder:text-gray-500 focus:outline-none min-h-[44px] sm:min-h-[52px]"
                            />
                            <div className="flex justify-between items-center px-1.5 sm:px-2 pb-0.5 sm:pb-1">
                                <ModelSelector />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={!inputValue.trim() || isLoading}
                                    className={`rounded-full w-7 h-7 sm:w-8 sm:h-8 transition-all ${inputValue.trim() ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#676767] text-[#212121] cursor-not-allowed'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-4 sm:h-4"><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>

                <p className="text-center text-[10px] sm:text-xs text-gray-500 pb-4">
                    AI can make mistakes. Please check important info.
                </p>
            </div>
        )
    }

    // Chat State
    return (
        <div className="flex-1 flex flex-col min-w-0 bg-[#212121] h-full relative overflow-y-auto scrollbar-hide">
            {/* Header - minimal */}
            <div className="h-14 flex items-center px-4 sticky top-0 z-50 bg-[#212121]">
                {!isSidebarOpen && (
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="text-gray-400 hover:text-white hover:bg-white/10 w-10 h-10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M9 3v18" /></svg>
                    </Button>
                )}
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm">
                    {error}
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 px-4 py-4">
                <div className="max-w-3xl mx-auto space-y-6">
                    {messages.map(message => (
                        <div key={message.id} className="w-full">
                            {message.role === 'user' ? (
                                <div className="flex justify-end">
                                    <div className="max-w-[85%] bg-[#2f2f2f] text-white rounded-3xl px-5 py-3">
                                        <MessageContent content={message.content} isUser={true} />
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full text-gray-100">
                                    <MessageContent content={message.content} isUser={false} />
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="w-full py-2">
                            <div className="flex space-x-1.5">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
            </div>

            {/* Input Area (Bottom) */}
            <div className="px-2 sm:px-4 pb-4 pt-2 bg-[#212121] sticky bottom-0 z-40">
                <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto relative">
                    {isLoading && (
                        <div className="absolute -top-12 left-0 right-0 flex justify-center z-10">
                            <Button
                                type="button"
                                onClick={handleStop}
                                variant="secondary"
                                size="sm"
                                className="bg-[#2f2f2f] border border-white/10 text-gray-300 hover:bg-[#3f3f3f] shadow-lg rounded-full h-8 gap-2 text-xs"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                                Stop
                            </Button>
                        </div>
                    )}
                    <div className="relative bg-[#2f2f2f] rounded-2xl sm:rounded-3xl flex items-end p-1 sm:p-1.5">
                        <textarea
                            ref={textareaRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSubmit(e)
                                }
                            }}
                            placeholder="Message Ai ChatBot"
                            className="flex-1 bg-transparent border-none text-white text-sm sm:text-base px-3 sm:px-4 py-2 placeholder:text-gray-500 focus:outline-none resize-none max-h-[200px] scrollbar-hide min-h-[36px]"
                            style={{ height: '36px' }}
                        />

                        <div className="pb-1 pr-1 sm:pb-1 sm:pr-1">
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!inputValue.trim() || isLoading}
                                className={`rounded-full w-10 h-10 sm:w-8 sm:h-8 transition-all ${inputValue.trim() ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#676767] text-[#212121] cursor-not-allowed'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-4 sm:h-4"><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>
                            </Button>
                        </div>
                    </div>
                    <p className="text-center text-[10px] sm:text-xs text-gray-500 mt-2">
                        AI can make mistakes. Please check important info.
                    </p>
                </form>
            </div>
        </div>
    )
}
