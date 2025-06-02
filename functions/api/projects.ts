/**
 * Cloudflare Pages API Route: /api/projects
 * 
 * Handles CRUD operations for portfolio projects
 * Supports GET (public), POST (JWT authenticated), PUT (JWT authenticated)
 * 
 * @returns JSON response with projects data or operation result
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
  PORTFOLIO_KV: KVNamespace; // KV storage for read/write operations
  API_KEY: string; // Legacy API key for backward compatibility
  JWT_SECRET: string; // JWT secret for token verification
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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  };

  try {
    const method = request.method;
    
    // Handle different HTTP methods
    switch (method) {
      case 'GET':
        return await handleGet(env, corsHeaders);
      case 'POST':
        return await handlePost(request, env, corsHeaders);
      case 'PUT':
        return await handlePut(request, env, corsHeaders);
      default:
        console.warn(`Method ${method} not allowed for /api/projects`);
        return new Response(JSON.stringify({ 
          error: 'Method not allowed',
          message: 'Only GET, POST, PUT, and OPTIONS requests are supported'
        }), { 
          status: 405,
          headers: corsHeaders
        });
    }

  } catch (error) {
    console.error('Unexpected error in /api/projects:', error);
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

// GET handler - Read projects data
async function handleGet(env: Env, corsHeaders: Record<string, string>) {
  console.log('Loading projects data...');

  // Try KV first, then fallback to static assets
  let projectsData: any[] = [];
  
  try {
    const kvData = await env.PORTFOLIO_KV.get('projects');
    if (kvData) {
      projectsData = JSON.parse(kvData);
      console.log(`Loaded ${projectsData.length} projects from KV storage`);
    } else {
      // Fallback to static assets
      const projectsFile = await env.ASSETS.get('data/projects.json');
      if (projectsFile) {
        const projectsText = await projectsFile.text();
        projectsData = JSON.parse(projectsText);
        console.log(`Loaded ${projectsData.length} projects from static assets`);
        
        // Save to KV for future requests
        await env.PORTFOLIO_KV.put('projects', JSON.stringify(projectsData));
      }
    }
  } catch (error) {
    console.error('Error loading projects:', error);
    return new Response(JSON.stringify({
      error: 'Data not found',
      message: 'Projects data is not available'
    }), { 
      status: 404,
      headers: corsHeaders
    });
  }

  if (!Array.isArray(projectsData)) {
    console.error('Projects data is not an array:', typeof projectsData);
    return new Response(JSON.stringify({
      error: 'Invalid data structure',
      message: 'Projects data must be an array'
    }), { 
      status: 500,
      headers: corsHeaders
    });
  }

  return new Response(JSON.stringify(projectsData, null, 2), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Cache-Control': 'public, max-age=60', // Cache for 1 minute (shorter for dynamic data)
      'X-Content-Type-Options': 'nosniff',
      'X-API-Version': '2.0',
      'X-Projects-Count': projectsData.length.toString(),
    },
  });
}

// POST handler - Add new project
async function handlePost(request: Request, env: Env, corsHeaders: Record<string, string>) {
  // Authenticate request with JWT
  const authResult = await verifyJWT(request, env.JWT_SECRET);
  if (!authResult.isValid) {
    return createUnauthorizedResponse(authResult.error || 'Authentication required for POST operations');
  }

  // Parse request body
  let newProject;
  try {
    newProject = await request.json();
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Invalid JSON',
      message: 'Request body must be valid JSON'
    }), { 
      status: 400,
      headers: corsHeaders
    });
  }

  // Validate project object
  if (!newProject || typeof newProject !== 'object' || Array.isArray(newProject)) {
    return new Response(JSON.stringify({
      error: 'Invalid data',
      message: 'Request body must be a project object'
    }), { 
      status: 400,
      headers: corsHeaders
    });
  }

  // Validate required fields
  const requiredFields = ['id', 'title', 'description', 'status', 'tech', 'featured', 'github', 'live'];
  const missingFields = requiredFields.filter(field => !(field in newProject));
  if (missingFields.length > 0) {
    return new Response(JSON.stringify({
      error: 'Missing fields',
      message: `Required fields missing: ${missingFields.join(', ')}`
    }), { 
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    // Get existing projects
    const existingData = await env.PORTFOLIO_KV.get('projects');
    let projects: any[] = existingData ? JSON.parse(existingData) : [];

    // Check for duplicate ID
    if (projects.some(p => p.id === newProject.id)) {
      return new Response(JSON.stringify({
        error: 'Duplicate ID',
        message: `Project with ID '${newProject.id}' already exists`
      }), { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Add new project
    projects.push(newProject);

    // Save to KV
    await env.PORTFOLIO_KV.put('projects', JSON.stringify(projects));

    console.log(`Successfully added new project: ${newProject.id}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Project added successfully',
      project: newProject,
      totalProjects: projects.length
    }), {
      status: 201,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error adding project:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: 'Failed to add project'
    }), { 
      status: 500,
      headers: corsHeaders
    });
  }
}

// PUT handler - Replace all projects
async function handlePut(request: Request, env: Env, corsHeaders: Record<string, string>) {
  // Authenticate request with JWT
  const authResult = await verifyJWT(request, env.JWT_SECRET);
  if (!authResult.isValid) {
    return createUnauthorizedResponse(authResult.error || 'Authentication required for PUT operations');
  }

  // Parse request body
  let newProjects;
  try {
    newProjects = await request.json();
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Invalid JSON',
      message: 'Request body must be valid JSON'
    }), { 
      status: 400,
      headers: corsHeaders
    });
  }

  // Validate projects array
  if (!Array.isArray(newProjects)) {
    return new Response(JSON.stringify({
      error: 'Invalid data',
      message: 'Request body must be an array of projects'
    }), { 
      status: 400,
      headers: corsHeaders
    });
  }

  // Validate each project
  for (let i = 0; i < newProjects.length; i++) {
    const project = newProjects[i];
    const requiredFields = ['id', 'title', 'description', 'status', 'tech', 'featured', 'github', 'live'];
    const missingFields = requiredFields.filter(field => !(field in project));
    
    if (missingFields.length > 0) {
      return new Response(JSON.stringify({
        error: 'Invalid project data',
        message: `Project at index ${i} missing fields: ${missingFields.join(', ')}`
      }), { 
        status: 400,
        headers: corsHeaders
      });
    }
  }

  try {
    // Replace entire projects array
    await env.PORTFOLIO_KV.put('projects', JSON.stringify(newProjects));

    console.log(`Successfully replaced projects data with ${newProjects.length} projects`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Projects updated successfully',
      totalProjects: newProjects.length
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error updating projects:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: 'Failed to update projects'
    }), { 
      status: 500,
      headers: corsHeaders
    });
  }
}

// MARK: - Legacy Authentication (Deprecated)
// 
// Note: This function is kept for backward compatibility with API key authentication
// New implementations should use JWT authentication via the verifyJWT function
// 
// function authenticateRequest(request: Request, env: Env): { success: boolean; message: string } {
//   const apiKey = request.headers.get('X-API-Key');
//   
//   if (!apiKey) {
//     return { success: false, message: 'API key required in X-API-Key header' };
//   }
//   
//   if (apiKey !== env.API_KEY) {
//     return { success: false, message: 'Invalid API key' };
//   }
//   
//   return { success: true, message: 'Authenticated' };
// }

// Handle OPTIONS requests for CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}; 