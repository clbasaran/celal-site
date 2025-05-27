/**
 * Cloudflare Pages API Route: /api/skills
 * 
 * Serves the latest skills.json data from the repository
 * Supports CORS for cross-origin requests (iOS app integration)
 * 
 * @returns JSON response with skills data
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
  PORTFOLIO_KV: KVNamespace; // KV storage for read/write operations
  API_KEY: string; // API key for authentication
}

interface EventContext<Env = any> {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil(promise: Promise<any>): void;
  next(input?: Request | string, init?: RequestInit): Promise<Response>;
  data: Record<string, any>;
}

type PagesFunction<Env = any> = (context: EventContext<Env>) => Response | Promise<Response>;

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  };

  try {
    const method = request.method;
    
    // Handle different HTTP methods
    switch (method) {
      case 'GET':
        return await handleGetSkills(env, corsHeaders);
      case 'PUT':
        return await handlePutSkills(request, env, corsHeaders);
      default:
        console.warn(`Method ${method} not allowed for /api/skills`);
        return new Response(JSON.stringify({ 
          error: 'Method not allowed',
          message: 'Only GET, PUT, and OPTIONS requests are supported'
        }), { 
          status: 405,
          headers: corsHeaders
        });
    }

  } catch (error) {
    console.error('Unexpected error in /api/skills:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }), { 
      status: 500,
      headers: corsHeaders
    });
  }
};

// GET handler - Read skills data
async function handleGetSkills(env: Env, corsHeaders: Record<string, string>) {
  console.log('Loading skills data...');

  // Try KV first, then fallback to static assets
  let skillsData: any = {};
  
  try {
    const kvData = await env.PORTFOLIO_KV.get('skills');
    if (kvData) {
      skillsData = JSON.parse(kvData);
      console.log('Loaded skills data from KV storage');
    } else {
      // Fallback to static assets
      const skillsFile = await env.ASSETS.get('data/skills.json');
      if (skillsFile) {
        const skillsText = await skillsFile.text();
        skillsData = JSON.parse(skillsText);
        console.log('Loaded skills data from static assets');
        
        // Save to KV for future requests
        await env.PORTFOLIO_KV.put('skills', JSON.stringify(skillsData));
      }
    }
  } catch (error) {
    console.error('Error loading skills:', error);
    return new Response(JSON.stringify({
      error: 'Data not found',
      message: 'Skills data is not available'
    }), { 
      status: 404,
      headers: corsHeaders
    });
  }

  if (!skillsData || typeof skillsData !== 'object') {
    console.error('Skills data is not an object:', typeof skillsData);
    return new Response(JSON.stringify({
      error: 'Invalid data structure',
      message: 'Skills data must be an object'
    }), { 
      status: 500,
      headers: corsHeaders
    });
  }

  // Count total skills for metadata
  const totalSkills = skillsData.skills?.categories?.reduce(
    (total: number, category: any) => total + (category.skills?.length || 0), 
    0
  ) || 0;

  return new Response(JSON.stringify(skillsData, null, 2), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Cache-Control': 'public, max-age=60', // Cache for 1 minute
      'X-Content-Type-Options': 'nosniff',
      'X-API-Version': '2.0',
      'X-Skills-Count': totalSkills.toString(),
      'X-Categories-Count': (skillsData.skills?.categories?.length || 0).toString(),
    },
  });
}

// PUT handler - Replace skills data (no POST for skills, as it's a single object)
async function handlePutSkills(request: Request, env: Env, corsHeaders: Record<string, string>) {
  // Authenticate request
  const authResult = authenticateSkillsRequest(request, env);
  if (!authResult.success) {
    return new Response(JSON.stringify({
      error: 'Unauthorized',
      message: authResult.message
    }), { 
      status: 401,
      headers: corsHeaders
    });
  }

  // Parse request body
  let newSkillsData;
  try {
    newSkillsData = await request.json();
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Invalid JSON',
      message: 'Request body must be valid JSON'
    }), { 
      status: 400,
      headers: corsHeaders
    });
  }

  // Validate skills data structure
  if (!newSkillsData || typeof newSkillsData !== 'object' || Array.isArray(newSkillsData)) {
    return new Response(JSON.stringify({
      error: 'Invalid data',
      message: 'Request body must be a skills data object'
    }), { 
      status: 400,
      headers: corsHeaders
    });
  }

  // Validate required structure
  if (!newSkillsData.skills || !newSkillsData.skills.categories || !Array.isArray(newSkillsData.skills.categories)) {
    return new Response(JSON.stringify({
      error: 'Invalid structure',
      message: 'Skills data must have a "skills.categories" array'
    }), { 
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    // Replace entire skills data
    await env.PORTFOLIO_KV.put('skills', JSON.stringify(newSkillsData));

    const totalSkills = newSkillsData.skills.categories.reduce(
      (total: number, category: any) => total + (category.skills?.length || 0), 
      0
    );

    console.log(`Successfully replaced skills data with ${totalSkills} total skills`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Skills updated successfully',
      totalSkills: totalSkills,
      totalCategories: newSkillsData.skills.categories.length
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error updating skills:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: 'Failed to update skills'
    }), { 
      status: 500,
      headers: corsHeaders
    });
  }
}

// Authentication helper for skills
function authenticateSkillsRequest(request: Request, env: Env): { success: boolean; message: string } {
  const apiKey = request.headers.get('X-API-Key');
  
  if (!apiKey) {
    return { success: false, message: 'API key required in X-API-Key header' };
  }
  
  if (apiKey !== env.API_KEY) {
    return { success: false, message: 'Invalid API key' };
  }
  
  return { success: true, message: 'Authenticated' };
}

// Handle OPTIONS requests for CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}; 