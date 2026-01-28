import { createClient } from '@/utils/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { truncateMessages } from '@/lib/truncate-messages'

// Allow streaming responses up to 60 seconds
export const maxDuration = 60

// Consistent error response helper
function errorResponse(
    message: string,
    code: string,
    status: number,
    details?: Record<string, unknown>
) {
    return new Response(
        JSON.stringify({
            error: message,
            code,
            ...(details && { details })
        }),
        {
            status,
            headers: { 'Content-Type': 'application/json' }
        }
    )
}

export async function POST(req: Request) {
    // 1. Validasi session user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return errorResponse('Unauthorized', 'AUTH_ERROR', 401)
    }

    // 2. Check rate limit
    const rateLimitResult = checkRateLimit(user.id)
    if (!rateLimitResult.success) {
        return errorResponse(
            'Too many requests. Please wait before sending more messages.',
            'RATE_LIMIT_EXCEEDED',
            429,
            {
                remaining: rateLimitResult.remaining,
                resetIn: rateLimitResult.resetIn
            }
        )
    }

    // 3. Parse request body
    let messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
    let model: string | undefined

    try {
        const body = await req.json()
        messages = body.messages
        model = body.model
    } catch {
        return errorResponse('Invalid request body', 'INVALID_BODY', 400)
    }

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return errorResponse('Messages array is required', 'INVALID_MESSAGES', 400)
    }

    // 4. Truncate messages to fit context window
    const selectedModel = model || 'tngtech/deepseek-r1t2-chimera:free'
    const truncationResult = truncateMessages(messages, selectedModel)

    if (truncationResult.wasTruncated) {
        console.log(`Truncated messages: ${truncationResult.originalCount} -> ${truncationResult.truncatedCount}`)
    }

    console.log('Using model:', selectedModel)
    console.log('Messages count:', truncationResult.truncatedCount)
    console.log('Estimated tokens:', truncationResult.estimatedTokens)



    try {
        // 5. Raw fetch ke OpenRouter
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://aichatbot.com",
                "X-Title": "AI Chatbot",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": selectedModel,
                "messages": truncationResult.messages,
                "stream": true
            })
        });

        if (!response.ok) {
            const errorText = await response.text()
            console.error('OpenRouter API Error:', errorText)

            // Parse OpenRouter error if possible
            let errorMessage = 'AI service error'
            try {
                const errorData = JSON.parse(errorText)
                errorMessage = errorData.error?.message || errorMessage
            } catch {
                errorMessage = errorText || errorMessage
            }

            return errorResponse(
                errorMessage,
                'OPENROUTER_ERROR',
                response.status
            )
        }

        // 6. Transform stream untuk client
        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body?.getReader();
                if (!reader) {
                    controller.close();
                    return;
                }

                const decoder = new TextDecoder();
                let buffer = '';

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');

                        // Keep the last partial line in the buffer
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            const trimmedLine = line.trim();
                            if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

                            if (trimmedLine.startsWith('data: ')) {
                                try {
                                    const jsonStr = trimmedLine.slice(6);
                                    const data = JSON.parse(jsonStr);
                                    const content = data.choices?.[0]?.delta?.content || '';

                                    if (content) {
                                        controller.enqueue(new TextEncoder().encode(content));
                                    }
                                } catch (e) {
                                    console.error('Error parsing JSON line:', trimmedLine, e);
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.error('Stream reading error:', err);
                    controller.error(err);
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-RateLimit-Remaining': String(rateLimitResult.remaining),
                'X-RateLimit-Reset': String(rateLimitResult.resetIn)
            }
        })

    } catch (error) {
        console.error('Server execution error:', error)
        return errorResponse(
            'Internal server error',
            'INTERNAL_ERROR',
            500
        )
    }
}

