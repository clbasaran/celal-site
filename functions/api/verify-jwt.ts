/**
 * JWT Verification Utility for Cloudflare Pages
 * 
 * Provides middleware functions for validating JWT tokens
 * Used to protect API endpoints that require authentication
 */

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
  JWT_SECRET: string;
}

interface JWTPayload {
  username: string;
  role: string;
  iat: number;
  exp: number;
  iss: string;
}

interface AuthResult {
  isValid: boolean;
  payload?: JWTPayload;
  error?: string;
}

/**
 * Verifies JWT token from Authorization header
 */
export async function verifyJWT(request: Request, jwtSecret: string): Promise<AuthResult> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        isValid: false,
        error: 'Missing or invalid Authorization header'
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Parse JWT token
    const payload = await parseJWT(token, jwtSecret);
    
    if (!payload) {
      return {
        isValid: false,
        error: 'Invalid token signature'
      };
    }

    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return {
        isValid: false,
        error: 'Token has expired'
      };
    }

    // Validate issuer
    if (payload.iss !== 'celal-site-api') {
      return {
        isValid: false,
        error: 'Invalid token issuer'
      };
    }

    return {
      isValid: true,
      payload
    };

  } catch (error) {
    console.error('❌ JWT verification error:', error);
    return {
      isValid: false,
      error: 'Token verification failed'
    };
  }
}

/**
 * Creates an unauthorized response with CORS headers
 */
export function createUnauthorizedResponse(message: string = 'Unauthorized'): Response {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  return new Response(JSON.stringify({
    error: 'Unauthorized',
    message
  }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

/**
 * Creates CORS headers for successful responses
 */
export function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// MARK: - Helper Functions

/**
 * Parses and validates JWT token using Web Crypto API
 */
async function parseJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    
    // Verify signature
    const data = `${headerB64}.${payloadB64}`;
    const expectedSignature = await signHMAC(data, secret);
    
    if (expectedSignature !== signatureB64) {
      return null;
    }

    // Decode payload
    const payloadJson = base64UrlDecode(payloadB64);
    const payload = JSON.parse(payloadJson) as JWTPayload;
    
    return payload;
    
  } catch (error) {
    console.error('❌ JWT parsing error:', error);
    return null;
  }
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