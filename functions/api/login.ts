/**
 * Cloudflare Pages API Route: /api/login
 * 
 * Handles user authentication with JWT tokens
 * Validates username/password and returns signed JWT on success
 * 
 * @returns JSON response with JWT token or error
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
  PORTFOLIO_KV?: KVNamespace; // Optional KV storage for user credentials
  JWT_SECRET: string; // JWT signing secret
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
  token: string;
  user: {
    username: string;
    role: string;
  };
  expiresIn: number;
}

interface LoginErrorResponse {
  error: string;
  message: string;
}

// Hardcoded admin credentials (for demo - move to KV in production)
const ADMIN_CREDENTIALS = {
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
    const isValidCredentials = await validateCredentials(
      body.username.trim(), 
      body.password.trim(), 
      env
    );

    if (!isValidCredentials) {
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

    // Generate JWT token
    const token = await generateJWT({
      username: body.username.trim(),
      role: ADMIN_CREDENTIALS.role
    }, env.JWT_SECRET);

    // Return success response
    const response: LoginResponse = {
      token,
      user: {
        username: body.username.trim(),
        role: ADMIN_CREDENTIALS.role
      },
      expiresIn: 3600 // 1 hour in seconds
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
 * Validates user credentials against hardcoded admin or KV storage
 */
async function validateCredentials(username: string, password: string, env: Env): Promise<boolean> {
  try {
    // For demo: use hardcoded credentials
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      return true;
    }

    // Future: KV-based user validation
    // if (env.PORTFOLIO_KV) {
    //   const storedUser = await env.PORTFOLIO_KV.get(`user:${username}`);
    //   if (storedUser) {
    //     const userData = JSON.parse(storedUser);
    //     return await verifyPassword(password, userData.hashedPassword);
    //   }
    // }

    return false;
  } catch (error) {
    console.error('❌ Credential validation error:', error);
    return false;
  }
}

/**
 * Generates a JWT token using Web Crypto API (Cloudflare Workers compatible)
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
 * Future: Password hashing with bcrypt-like functionality
 * For production use, implement proper password hashing
 */
// async function hashPassword(password: string): Promise<string> {
//   // Implementation would use Web Crypto API for password hashing
//   // Or use a Cloudflare Workers compatible bcrypt alternative
//   return password; // Placeholder
// }

// async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
//   // Implementation would verify hashed password
//   return password === hashedPassword; // Placeholder
// } 