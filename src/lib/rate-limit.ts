/**
 * Simple in-memory rate limiter
 * Limits requests per user based on sliding window
 */

interface RateLimitEntry {
    count: number
    resetTime: number
}

// In-memory store (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Configuration
const WINDOW_MS = 60 * 1000 // 1 minute window
const MAX_REQUESTS = 20 // Max requests per window

export interface RateLimitResult {
    success: boolean
    remaining: number
    resetIn: number // seconds until reset
}

/**
 * Check if a user is rate limited
 * @param userId - Unique user identifier
 * @returns RateLimitResult with success status and remaining requests
 */
export function checkRateLimit(userId: string): RateLimitResult {
    const now = Date.now()
    const entry = rateLimitStore.get(userId)

    // If no entry or window expired, create new entry
    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(userId, {
            count: 1,
            resetTime: now + WINDOW_MS
        })
        return {
            success: true,
            remaining: MAX_REQUESTS - 1,
            resetIn: Math.ceil(WINDOW_MS / 1000)
        }
    }

    // Check if limit exceeded
    if (entry.count >= MAX_REQUESTS) {
        return {
            success: false,
            remaining: 0,
            resetIn: Math.ceil((entry.resetTime - now) / 1000)
        }
    }

    // Increment count
    entry.count++
    rateLimitStore.set(userId, entry)

    return {
        success: true,
        remaining: MAX_REQUESTS - entry.count,
        resetIn: Math.ceil((entry.resetTime - now) / 1000)
    }
}

/**
 * Clean up expired entries (call periodically if needed)
 */
export function cleanupRateLimitStore(): void {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key)
        }
    }
}
