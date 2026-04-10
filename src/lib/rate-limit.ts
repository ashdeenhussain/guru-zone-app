
import { NextResponse } from "next/server";

// Simple In-Memory Rate Limiter
// Note: This is per-instance. In a multi-instance production environment, use Redis.
const rateLimitMap = new Map<string, number[]>();

export interface RateLimitConfig {
  limit: number;      // Maximum requests
  windowMs: number;   // Time window in milliseconds
}

/**
 * Basic Rate Limiter
 * @param identifier Unique ID (IP address or User ID)
 * @param config Configuration for limits
 * @returns { success: boolean, remaining: number, reset: number }
 */
export function rateLimit(identifier: string, config: RateLimitConfig) {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Get existing timestamps for this identifier
  let timestamps = rateLimitMap.get(identifier) || [];

  // Filter out timestamps outside the current window
  timestamps = timestamps.filter((ts) => ts > windowStart);

  if (timestamps.length >= config.limit) {
    const oldestTimestamp = timestamps[0];
    const resetTime = oldestTimestamp + config.windowMs;
    
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: resetTime,
    };
  }

  // Add current timestamp
  timestamps.push(now);
  rateLimitMap.set(identifier, timestamps);

  // Periodic cleanup of the map to prevent memory leak
  if (rateLimitMap.size > 1000) {
    const threshold = now - (config.windowMs * 2);
    for (const [key, val] of rateLimitMap.entries()) {
      const filtered = val.filter(t => t > threshold);
      if (filtered.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, filtered);
      }
    }
  }

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - timestamps.length,
    reset: now + config.windowMs,
  };
}

/**
 * Helper to get client IP from request
 */
export function getIP(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  
  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIp) return realIp.trim();
  
  return "127.0.0.1"; // Fallback for local
}
