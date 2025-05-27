/**
 * Cloudflare Pages API Route: /api/refresh
 * 
 * Handles JWT token refresh for session renewal
 * Validates refresh token and issues new access token
 * 
 * @returns JSON response with new tokens or error
 */

import { verifyJWT, createUnauthorizedResponse, getCorsHeaders } from './verify-jwt';

// Cloudflare Pages function types
declare global {
  interface KVNamespace {
    get(key: string): Promise<string | null>;
    put(key: string, value: string): Promise<void>;
    delete(key: string): Promise<void>;
  }
}

interface Env {
  ASSETS: any;
  PORTFOLIO_KV?: KVNamespace;
  JWT_SECRET: string; // Access token secret
  JWT_REFRESH_SECRET: string; // Refresh token secret (different from access token)
}

interface EventContext<Env = any> {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil(promise: Promise<any>): void;
  next(input?: Request | string, init?: RequestInit): Promise<Response>;
}

interface RefreshRequest {
  refresh_token: string;
}

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface RefreshErrorResponse {
  error: string;
  message: string;
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  const { request, env } = context;
  
  // CORS headers
  const corsHeaders = getCorsHeaders();

  try {
    // Parse request body
    const body = await request.json() as RefreshRequest;
    
    // Validate request body
    if (!body.refresh_token) {
      return new Response(JSON.stringify({
        error: "Validation Error",
        message: "refresh_token is required"
      } as RefreshErrorResponse), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Verify refresh token with different secret
    const refreshAuthResult = await verifyRefreshToken(body.refresh_token.trim(), env.JWT_REFRESH_SECRET);
    
    if (!refreshAuthResult.isValid) {
      console.warn('❌ Invalid refresh token for /api/refresh:', refreshAuthResult.error);
      return new Response(JSON.stringify({
        error: "Invalid Refresh Token",
        message: refreshAuthResult.error || "Refresh token is invalid or expired"
      } as RefreshErrorResponse), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    const { payload } = refreshAuthResult;
    if (!payload) {
      return new Response(JSON.stringify({
        error: "Invalid Token Payload",
        message: "Refresh token payload is missing or invalid"
      } as RefreshErrorResponse), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Generate new access token (1 hour validity)
    const newAccessToken = await generateAccessToken({
      username: payload.username,
      role: payload.role
    }, env.JWT_SECRET);

    // Generate new refresh token (7 days validity) 
    const newRefreshToken = await generateRefreshToken({
      username: payload.username,
      role: payload.role
    }, env.JWT_REFRESH_SECRET);

    // Prepare refresh response
    const response: RefreshResponse = {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      expires_in: 3600, // 1 hour in seconds
      token_type: "Bearer"
    };

    console.log(`✅ Tokens refreshed successfully for user: ${payload.username}`);

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'X-API-Version': '2.0',
      }
    });

  } catch (error) {
    console.error('❌ Refresh token error:', error);
    
    return new Response(JSON.stringify({
      error: "Internal Server Error",
      message: "An unexpected error occurred during token refresh"
    } as RefreshErrorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// Handle CORS preflight requests
export async function onRequestOptions(context: EventContext<Env>): Promise<Response> {
  const corsHeaders = getCorsHeaders();
  
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      'Access-Control-Max-Age': '86400', // 24 hours
    }
  });
}

// MARK: - Helper Functions

/**
 * Verifies refresh token using different secret than access token
 */
async function verifyRefreshToken(token: string, secret: string): Promise<{ isValid: boolean; payload?: any; error?: string }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { isValid: false, error: 'Invalid token format' };
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    
    // Verify signature
    const data = `${headerB64}.${payloadB64}`;
    const expectedSignature = await signHMAC(data, secret);
    
    if (expectedSignature !== signatureB64) {
      return { isValid: false, error: 'Invalid token signature' };
    }

    // Decode payload
    const payloadJson = base64UrlDecode(payloadB64);
    const payload = JSON.parse(payloadJson);
    
    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { isValid: false, error: 'Refresh token has expired' };
    }

    // Validate issuer
    if (payload.iss !== 'celal-site-refresh') {
      return { isValid: false, error: 'Invalid token issuer' };
    }

    return { isValid: true, payload };
    
  } catch (error) {
    console.error('❌ Refresh token verification error:', error);
    return { isValid: false, error: 'Token verification failed' };
  }
}

/**
 * Generates a new access token (1 hour validity)
 */
async function generateAccessToken(payload: any, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    ...payload,
    iat: now,
    exp: now + 3600, // 1 hour expiration
    iss: 'celal-site-api'
  };

  // Encode header and payload
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(jwtPayload));
  
  // Create signature using Web Crypto API
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = await signHMAC(data, secret);
  
  return `${data}.${signature}`;
}

/**
 * Generates a new refresh token (7 days validity)
 */
async function generateRefreshToken(payload: any, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    ...payload,
    iat: now,
    exp: now + (7 * 24 * 3600), // 7 days expiration
    iss: 'celal-site-refresh'
  };

  // Encode header and payload
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(jwtPayload));
  
  // Create signature using Web Crypto API
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = await signHMAC(data, secret);
  
  return `${data}.${signature}`;
}

/**
 * Signs data with HMAC-SHA256 using Web Crypto API
 */
async function signHMAC(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return base64UrlEncode(Array.from(new Uint8Array(signature)));
}

/**
 * Base64 URL encoding (JWT standard)
 */
function base64UrlEncode(data: string | number[]): string {
  let base64: string;
  
  if (typeof data === 'string') {
    base64 = btoa(unescape(encodeURIComponent(data)));
  } else {
    // Handle Uint8Array/number array
    const binaryString = String.fromCharCode.apply(null, data);
    base64 = btoa(binaryString);
  }
  
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64 URL decoding
 */
function base64UrlDecode(str: string): string {
  // Add padding if needed
  let padded = str;
  switch (padded.length % 4) {
    case 2: padded += '=='; break;
    case 3: padded += '='; break;
  }
  
  // Convert URL-safe base64 to regular base64
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  
  try {
    return decodeURIComponent(escape(atob(base64)));
  } catch (error) {
    throw new Error('Invalid base64 string');
  }
} 