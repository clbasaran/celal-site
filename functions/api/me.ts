/**
 * Cloudflare Pages API Route: /api/me
 * 
 * Returns authenticated user information from JWT token
 * Requires valid JWT token in Authorization header
 * 
 * @returns JSON response with user info or error
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
  JWT_SECRET: string; // JWT signing secret
}

interface EventContext<Env = any> {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil(promise: Promise<any>): void;
  next(input?: Request | string, init?: RequestInit): Promise<Response>;
}

interface UserProfileResponse {
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

interface ErrorResponse {
  error: string;
  message: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const { request, env } = context;
  
  // CORS headers
  const corsHeaders = getCorsHeaders();

  try {
    // Verify JWT token from Authorization header
    const authResult = await verifyJWT(request, env.JWT_SECRET);
    
    if (!authResult.isValid) {
      console.warn('❌ Authentication failed for /api/me:', authResult.error);
      return createUnauthorizedResponse(authResult.error || 'Authentication required');
    }

    // Extract user info from JWT payload
    const { payload } = authResult;
    if (!payload) {
      return createUnauthorizedResponse('Invalid token payload');
    }

    // Prepare user profile response
    const userProfile: UserProfileResponse = {
      username: payload.username,
      role: payload.role,
      iat: payload.iat, // Token issued at
      exp: payload.exp  // Token expires at
    };

    console.log(`✅ User profile requested for: ${payload.username}`);

    return new Response(JSON.stringify(userProfile, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Don't cache user data
        'X-Content-Type-Options': 'nosniff',
        'X-API-Version': '2.0',
        'X-User-Role': payload.role,
      }
    });

  } catch (error) {
    console.error('❌ Error in /api/me:', error);
    
    const errorResponse: ErrorResponse = {
      error: "Internal Server Error",
      message: "An unexpected error occurred while fetching user profile"
    };

    return new Response(JSON.stringify(errorResponse), {
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

/**
 * Alternative implementation: Extended user profile with additional metadata
 * Uncomment this section if you want to add more user profile information
 */

// interface ExtendedUserProfile extends UserProfileResponse {
//   permissions: string[];
//   lastLogin?: string;
//   tokenExpiresIn: number; // Seconds until token expires
// }

// async function getExtendedUserProfile(payload: JWTPayload): Promise<ExtendedUserProfile> {
//   const now = Math.floor(Date.now() / 1000);
//   const expiresIn = payload.exp - now;
//   
//   return {
//     username: payload.username,
//     role: payload.role,
//     iat: payload.iat,
//     exp: payload.exp,
//     permissions: getRolePermissions(payload.role),
//     tokenExpiresIn: Math.max(0, expiresIn)
//   };
// }

// function getRolePermissions(role: string): string[] {
//   switch (role) {
//     case 'admin':
//       return ['read', 'write', 'delete', 'manage_users'];
//     case 'editor':
//       return ['read', 'write'];
//     case 'viewer':
//       return ['read'];
//     default:
//       return [];
//   }
// } 