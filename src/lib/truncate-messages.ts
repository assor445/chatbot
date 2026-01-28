/**
 * Context window management utility
 * Truncates messages to fit within model context limits
 */

interface Message {
    role: 'user' | 'assistant' | 'system'
    content: string
}

// Rough token estimation (4 chars ≈ 1 token)
const CHARS_PER_TOKEN = 4

// Model context limits (conservative estimates)
const MODEL_CONTEXT_LIMITS: Record<string, number> = {
    'tngtech/deepseek-r1t2-chimera:free': 32000,
    'z-ai/glm-4.5-air:free': 16000,
    'qwen/qwen3-coder:free': 32000,
    'google/gemma-3-27b-it:free': 8000,
    'openai/gpt-oss-120b:free': 16000,
    'google/gemini-2.0-flash-exp:free': 32000,
    'default': 8000 // Fallback for unknown models
}

/**
 * Estimate token count for a message
 */
function estimateTokens(content: string): number {
    return Math.ceil(content.length / CHARS_PER_TOKEN)
}

/**
 * Get context limit for a model
 */
function getContextLimit(model: string): number {
    return MODEL_CONTEXT_LIMITS[model] || MODEL_CONTEXT_LIMITS['default']
}

export interface TruncationResult {
    messages: Message[]
    originalCount: number
    truncatedCount: number
    estimatedTokens: number
    wasTruncated: boolean
}

/**
 * Truncate messages to fit within context window
 * Strategy: Keep system message + as many recent messages as possible
 * 
 * @param messages - Array of messages
 * @param model - Model ID to determine context limit
 * @param reserveTokens - Tokens to reserve for response (default: 2000)
 */
export function truncateMessages(
    messages: Message[],
    model: string,
    reserveTokens: number = 2000
): TruncationResult {
    const contextLimit = getContextLimit(model)
    const availableTokens = contextLimit - reserveTokens

    const originalCount = messages.length

    // Separate system message if exists
    const systemMessages = messages.filter(m => m.role === 'system')
    const conversationMessages = messages.filter(m => m.role !== 'system')

    // Calculate system message tokens
    let usedTokens = systemMessages.reduce(
        (sum, m) => sum + estimateTokens(m.content),
        0
    )

    // Add messages from the end (most recent first)
    const includedMessages: Message[] = []

    for (let i = conversationMessages.length - 1; i >= 0; i--) {
        const msg = conversationMessages[i]
        const msgTokens = estimateTokens(msg.content)

        if (usedTokens + msgTokens <= availableTokens) {
            includedMessages.unshift(msg)
            usedTokens += msgTokens
        } else {
            // Can't fit more messages
            break
        }
    }

    // Combine system messages with included conversation
    const finalMessages = [...systemMessages, ...includedMessages]

    return {
        messages: finalMessages,
        originalCount,
        truncatedCount: finalMessages.length,
        estimatedTokens: usedTokens,
        wasTruncated: finalMessages.length < originalCount
    }
}
