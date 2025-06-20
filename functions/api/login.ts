/**
 * Cloudflare Pages API Route: /api/login
 * 
 * Handles user authentication with JWT tokens
 * Validates username/password and returns signed JWT on success
 * 
 * @returns JSON response with JWT token or error
 */

// Import user management functions
import { getUserFromKV, verifyPassword } from './register';

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
  PORTFOLIO_KV?: KVNamespace; // Optional KV storage for project data
  USER_KV?: KVNamespace; // User account storage
  JWT_SECRET: string; // JWT signing secret
  JWT_REFRESH_SECRET: string; // JWT refresh token secret
}

interface EventContext<Env = any> {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil(promise: Promise<any>): void;
  next(input?: Request | string, init?: RequestInit): Promise<Response>;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    username: string;
    role: string;
  };
  expires_in: number;
  token_type: string;
}

interface LoginErrorResponse {
  error: string;
  message: string;
}

// Legacy hardcoded admin credentials (for backward compatibility)
const LEGACY_ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123", // In production, use hashed passwords
  role: "admin"
};

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  const { request, env } = context;
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };

  try {
    // Parse request body
    const body = await request.json() as LoginRequest;
    
    // Validate request body
    if (!body.username || !body.password) {
      return new Response(JSON.stringify({
        error: "Validation Error",
        message: "Username and password are required"
      } as LoginErrorResponse), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Validate credentials
    const authResult = await validateCredentials(
      body.username.trim(), 
      body.password.trim(), 
      env
    );

    if (!authResult.isValid || !authResult.user) {
      return new Response(JSON.stringify({
        error: "Authentication Failed",
        message: "Invalid username or password"
      } as LoginErrorResponse), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Generate access token (1 hour)
    const accessToken = await generateJWT({
      username: authResult.user.username,
      role: authResult.user.role
    }, env.JWT_SECRET);

    // Generate refresh token (7 days)
    const refreshToken = await generateRefreshToken({
      username: authResult.user.username,
      role: authResult.user.role
    }, env.JWT_REFRESH_SECRET);

    // Return success response
    const response: LoginResponse = {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        username: authResult.user.username,
        role: authResult.user.role
      },
      expires_in: 3600, // 1 hour in seconds
      token_type: "Bearer"
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    
    return new Response(JSON.stringify({
      error: "Internal Server Error",
      message: "An unexpected error occurred during authentication"
    } as LoginErrorResponse), {
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
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  });
}

// MARK: - Helper Functions

/**
 * Validates user credentials against KV storage or legacy admin credentials
 */
async function validateCredentials(username: string, password: string, env: Env): Promise<{ isValid: boolean; user?: { username: string; role: string } }> {
  try {
    const normalizedUsername = username.toLowerCase();

    // First, try to authenticate with USER_KV (new system)
    if (env.USER_KV) {
      const storedUser = await getUserFromKV(normalizedUsername, env.USER_KV);
      if (storedUser) {
        const isPasswordValid = await verifyPassword(password, storedUser.hashedPassword);
        if (isPasswordValid) {
          // Update last login timestamp
          storedUser.lastLogin = new Date().toISOString();
          await env.USER_KV.put(`user:${normalizedUsername}`, JSON.stringify(storedUser));
          
          return {
            isValid: true,
            user: {
              username: storedUser.username,
              role: storedUser.role
            }
          };
        }
      }
    }

    // Fallback to legacy hardcoded admin credentials (for backward compatibility)
    if (normalizedUsername === LEGACY_ADMIN_CREDENTIALS.username && password === LEGACY_ADMIN_CREDENTIALS.password) {
      console.log('⚠️ Using legacy admin credentials - consider migrating to USER_KV');
      return {
        isValid: true,
        user: {
          username: LEGACY_ADMIN_CREDENTIALS.username,
          role: LEGACY_ADMIN_CREDENTIALS.role
        }
      };
    }

    return { isValid: false };
  } catch (error) {
    console.error('❌ Credential validation error:', error);
    return { isValid: false };
  }
}

/**
 * Generates a JWT access token using Web Crypto API (Cloudflare Workers compatible)
 */
async function generateJWT(payload: any, secret: string): Promise<string> {
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
 * Generates a JWT refresh token using Web Crypto API (7 days validity)
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
 * Verify password against stored hash
 */
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    // Extract salt (first 32 characters) and hash (remaining)
    const salt = storedHash.substring(0, 32);
    const hash = storedHash.substring(32);
    
    // Hash the provided password with the same salt
    const saltedPassword = password + salt;
    const encoder = new TextEncoder();
    const data = encoder.encode(saltedPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert hash to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const newHashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Compare hashes
    return newHashHex === hash;
    
  } catch (error) {
    console.error('❌ Password verification error:', error);
    return false;
  }
}

/**
 * Get user from KV storage
 */
async function getUserFromKV(username: string, userKV: KVNamespace): Promise<any> {
  try {
    const userData = await userKV.get(`user:${username.toLowerCase()}`);
    if (!userData) {
      return null;
    }
    
    return JSON.parse(userData);
  } catch (error) {
    console.error('❌ Error fetching user from KV:', error);
    return null;
  }
} 