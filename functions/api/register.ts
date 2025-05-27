/**
 * Cloudflare Pages API Route: /api/register
 * 
 * Handles user registration with password hashing and role assignment
 * Stores users in Cloudflare KV with hashed passwords
 * 
 * @returns JSON response with success or error message
 */

import { getCorsHeaders } from './verify-jwt';

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
  PORTFOLIO_KV?: KVNamespace; // Project data storage
  USER_KV: KVNamespace; // User account storage
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
}

interface EventContext<Env = any> {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil(promise: Promise<any>): void;
  next(input?: Request | string, init?: RequestInit): Promise<Response>;
}

interface RegisterRequest {
  username: string;
  password: string;
  role?: 'admin' | 'editor'; // Optional, defaults to 'editor'
}

interface RegisterResponse {
  message: string;
  user: {
    username: string;
    role: string;
  };
}

interface RegisterErrorResponse {
  error: string;
  message: string;
}

interface StoredUser {
  username: string;
  hashedPassword: string;
  role: 'admin' | 'editor';
  createdAt: string;
  lastLogin?: string;
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  const { request, env } = context;
  
  // CORS headers
  const corsHeaders = getCorsHeaders();

  try {
    // Parse request body
    const body = await request.json() as RegisterRequest;
    
    // Validate request body
    if (!body.username || !body.password) {
      return new Response(JSON.stringify({
        error: "Validation Error",
        message: "Username and password are required"
      } as RegisterErrorResponse), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Validate username format
    const username = body.username.trim().toLowerCase();
    if (username.length < 3 || username.length > 20) {
      return new Response(JSON.stringify({
        error: "Validation Error",
        message: "Username must be between 3 and 20 characters"
      } as RegisterErrorResponse), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Validate username characters (alphanumeric + underscore)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return new Response(JSON.stringify({
        error: "Validation Error",
        message: "Username can only contain letters, numbers, and underscores"
      } as RegisterErrorResponse), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Validate password strength
    if (body.password.length < 6) {
      return new Response(JSON.stringify({
        error: "Validation Error",
        message: "Password must be at least 6 characters long"
      } as RegisterErrorResponse), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Check if USER_KV is available
    if (!env.USER_KV) {
      return new Response(JSON.stringify({
        error: "Service Unavailable",
        message: "User storage is not configured"
      } as RegisterErrorResponse), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Check if user already exists
    const existingUser = await env.USER_KV.get(`user:${username}`);
    if (existingUser) {
      return new Response(JSON.stringify({
        error: "Conflict",
        message: "Username is already taken"
      } as RegisterErrorResponse), {
        status: 409,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Hash password using Web Crypto API
    const hashedPassword = await hashPassword(body.password);
    
    // Determine user role (default to 'editor', only allow 'admin' for specific usernames)
    let userRole: 'admin' | 'editor' = 'editor';
    if (body.role === 'admin') {
      // Only allow admin role for specific usernames (security measure)
      const adminUsernames = ['admin', 'celalbasaran', 'administrator'];
      if (adminUsernames.includes(username)) {
        userRole = 'admin';
      } else {
        console.warn(`⚠️ Admin role requested for non-admin username: ${username}`);
      }
    }

    // Create user object
    const newUser: StoredUser = {
      username,
      hashedPassword,
      role: userRole,
      createdAt: new Date().toISOString()
    };

    // Store user in KV
    await env.USER_KV.put(`user:${username}`, JSON.stringify(newUser));

    // Prepare response (don't include sensitive data)
    const response: RegisterResponse = {
      message: "User registered successfully",
      user: {
        username: newUser.username,
        role: newUser.role
      }
    };

    console.log(`✅ User registered successfully: ${username} (${userRole})`);

    return new Response(JSON.stringify(response, null, 2), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'X-API-Version': '2.1',
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    return new Response(JSON.stringify({
      error: "Internal Server Error",
      message: "An unexpected error occurred during registration"
    } as RegisterErrorResponse), {
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
 * Hash password using Web Crypto API (SHA-256 with salt)
 */
async function hashPassword(password: string): Promise<string> {
  try {
    // Generate random salt
    const saltArray = new Uint8Array(16);
    crypto.getRandomValues(saltArray);
    const salt = Array.from(saltArray, byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Combine password with salt
    const saltedPassword = password + salt;
    
    // Hash the salted password
    const encoder = new TextEncoder();
    const data = encoder.encode(saltedPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert hash to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Return salt + hash (salt first 32 chars, hash remaining)
    return salt + hashHex;
    
  } catch (error) {
    console.error('❌ Password hashing error:', error);
    throw new Error('Password hashing failed');
  }
}

/**
 * Verify password against stored hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
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
export async function getUserFromKV(username: string, userKV: KVNamespace): Promise<StoredUser | null> {
  try {
    const userData = await userKV.get(`user:${username.toLowerCase()}`);
    if (!userData) {
      return null;
    }
    
    return JSON.parse(userData) as StoredUser;
  } catch (error) {
    console.error('❌ Error fetching user from KV:', error);
    return null;
  }
} 