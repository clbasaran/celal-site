/**
 * Cloudflare Pages API Route: /api/skills
 * 
 * Serves the latest skills.json data from the repository
 * Supports CORS for cross-origin requests (iOS app integration)
 * 
 * @returns JSON response with skills data
 */

// Cloudflare Pages function types
interface Env {
  ASSETS: any;
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
  try {
    // Only allow GET requests
    if (request.method !== 'GET') {
      console.warn(`Method ${request.method} not allowed for /api/skills`);
      return new Response(JSON.stringify({ 
        error: 'Method not allowed',
        message: 'Only GET requests are supported'
      }), { 
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    console.log('Loading skills.json from static assets...');

    // Load the skills.json file from static assets
    const skillsFile = await env.ASSETS.get('data/skills.json');
    
    if (!skillsFile) {
      console.error('skills.json file not found at data/skills.json');
      return new Response(JSON.stringify({
        error: 'Data not found',
        message: 'Skills data file is not available'
      }), { 
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // Get the file content as text
    const skillsText = await skillsFile.text();
    
    if (!skillsText || skillsText.trim() === '') {
      console.error('skills.json file is empty');
      return new Response(JSON.stringify({
        error: 'Empty data',
        message: 'Skills data file is empty'
      }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // Parse JSON with error handling
    let skillsData;
    try {
      skillsData = JSON.parse(skillsText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(JSON.stringify({
        error: 'Invalid data format',
        message: 'Skills data contains invalid JSON'
      }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // Validate that we have skills data object
    if (!skillsData || typeof skillsData !== 'object') {
      console.error('Skills data is not an object:', typeof skillsData);
      return new Response(JSON.stringify({
        error: 'Invalid data structure',
        message: 'Skills data must be an object'
      }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // Count total skills for metadata
    const totalSkills = skillsData.skills?.categories?.reduce(
      (total: number, category: any) => total + (category.skills?.length || 0), 
      0
    ) || 0;

    console.log(`Successfully loaded skills data with ${totalSkills} total skills`);

    // Return successful response with CORS headers
    return new Response(JSON.stringify(skillsData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'X-Content-Type-Options': 'nosniff',
        'X-API-Version': '1.0',
        'X-Skills-Count': totalSkills.toString(),
        'X-Categories-Count': (skillsData.skills?.categories?.length || 0).toString(),
      },
    });

  } catch (error) {
    // Log the full error for debugging
    console.error('Unexpected error in /api/skills:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Return generic error response
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: 'An unexpected error occurred while loading skills data'
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
};

// Handle OPTIONS requests for CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}; 