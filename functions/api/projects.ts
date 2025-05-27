/**
 * Cloudflare Pages API Route: /api/projects
 * 
 * Serves the latest projects.json data from the repository
 * Supports CORS for cross-origin requests (iOS app integration)
 * 
 * @returns JSON response with projects data
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
      console.warn(`Method ${request.method} not allowed for /api/projects`);
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

    console.log('Loading projects.json from static assets...');

    // Load the projects.json file from static assets
    const projectsFile = await env.ASSETS.get('data/projects.json');
    
    if (!projectsFile) {
      console.error('projects.json file not found at data/projects.json');
      return new Response(JSON.stringify({
        error: 'Data not found',
        message: 'Projects data file is not available'
      }), { 
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // Get the file content as text
    const projectsText = await projectsFile.text();
    
    if (!projectsText || projectsText.trim() === '') {
      console.error('projects.json file is empty');
      return new Response(JSON.stringify({
        error: 'Empty data',
        message: 'Projects data file is empty'
      }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // Parse JSON with error handling
    let projectsData;
    try {
      projectsData = JSON.parse(projectsText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(JSON.stringify({
        error: 'Invalid data format',
        message: 'Projects data contains invalid JSON'
      }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // Validate that we have an array of projects
    if (!Array.isArray(projectsData)) {
      console.error('Projects data is not an array:', typeof projectsData);
      return new Response(JSON.stringify({
        error: 'Invalid data structure',
        message: 'Projects data must be an array'
      }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    console.log(`Successfully loaded ${projectsData.length} projects`);

    // Return successful response with CORS headers
    return new Response(JSON.stringify(projectsData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'X-Content-Type-Options': 'nosniff',
        'X-API-Version': '1.0',
        'X-Projects-Count': projectsData.length.toString(),
      },
    });

  } catch (error) {
    // Log the full error for debugging
    console.error('Unexpected error in /api/projects:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Return generic error response
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: 'An unexpected error occurred while loading projects data'
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