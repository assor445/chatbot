'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Chat {
    id: string
    user_id: string
    title: string
    created_at: string
    updated_at: string
}

export interface Message {
    id: string
    chat_id: string
    role: 'user' | 'assistant'
    content: string
    created_at: string
}

// Get all chats for the current user
export async function getChats(): Promise<Chat[]> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return []
    }

    const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

    if (error) {
        console.error('Error fetching chats:', JSON.stringify(error, null, 2))
        if ('message' in error) console.error('Error message:', (error as any).message)
        if ('code' in error) console.error('Error code:', (error as any).code)
        return []
    }

    return data || []
}

// Get a specific chat with its messages
export async function getChat(chatId: string): Promise<{ chat: Chat | null, messages: Message[] }> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { chat: null, messages: [] }
    }

    // Fetch chat - use maybeSingle() to avoid error when no rows found
    const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .eq('user_id', user.id)
        .maybeSingle()

    if (chatError) {
        console.error('Error fetching chat:', chatError.message, chatError.code)
        return { chat: null, messages: [] }
    }

    if (!chat) {
        // Chat not found - not an error, just doesn't exist
        return { chat: null, messages: [] }
    }

    // Fetch messages
    const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

    if (messagesError) {
        console.error('Error fetching messages:', messagesError.message)
        return { chat, messages: [] }
    }

    return { chat, messages: messages || [] }
}

// Create a new chat with the first message
export async function createChat(firstMessage: string): Promise<{ chatId: string | null, error: string | null }> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { chatId: null, error: 'User not authenticated' }
    }

    // Generate title from first message (first 50 chars)
    const title = firstMessage.length > 50
        ? firstMessage.substring(0, 50) + '...'
        : firstMessage

    // Create chat
    const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({
            user_id: user.id,
            title: title
        })
        .select()
        .single()

    if (chatError || !chat) {
        console.error('Error creating chat:', chatError)
        return { chatId: null, error: 'Failed to create chat' }
    }

    // Insert first message
    const { error: messageError } = await supabase
        .from('messages')
        .insert({
            chat_id: chat.id,
            role: 'user',
            content: firstMessage
        })

    if (messageError) {
        console.error('Error creating first message:', messageError)
        // Delete the chat if message creation failed
        await supabase.from('chats').delete().eq('id', chat.id)
        return { chatId: null, error: 'Failed to create message' }
    }

    revalidatePath('/chat')
    return { chatId: chat.id, error: null }
}

// Save a message to an existing chat
export async function saveMessage(
    chatId: string,
    role: 'user' | 'assistant',
    content: string
): Promise<{ success: boolean, error: string | null }> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, error: 'User not authenticated' }
    }

    // Verify chat belongs to user
    const { data: chat } = await supabase
        .from('chats')
        .select('id')
        .eq('id', chatId)
        .eq('user_id', user.id)
        .single()

    if (!chat) {
        return { success: false, error: 'Chat not found' }
    }

    // Insert message
    const { error: messageError } = await supabase
        .from('messages')
        .insert({
            chat_id: chatId,
            role,
            content
        })

    if (messageError) {
        console.error('Error saving message:', messageError)
        return { success: false, error: 'Failed to save message' }
    }

    // Update chat's updated_at
    await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId)

    revalidatePath('/chat')
    revalidatePath(`/chat/${chatId}`)
    return { success: true, error: null }
}

// Delete a chat
export async function deleteChat(chatId: string): Promise<{ success: boolean, error: string | null }> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, error: 'User not authenticated' }
    }

    const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error deleting chat:', error)
        return { success: false, error: 'Failed to delete chat' }
    }

    revalidatePath('/chat')
    return { success: true, error: null }
}

// Update chat title
export async function updateChatTitle(chatId: string, title: string): Promise<{ success: boolean, error: string | null }> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, error: 'User not authenticated' }
    }

    const { error } = await supabase
        .from('chats')
        .update({ title })
        .eq('id', chatId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error updating chat title:', error)
        return { success: false, error: 'Failed to update title' }
    }

    revalidatePath('/chat')
    return { success: true, error: null }
}
