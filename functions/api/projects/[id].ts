/**
 * Cloudflare Pages API Route: /api/projects/[id]
 * 
 * Handles individual project operations by ID
 * Supports GET, PUT, DELETE with JWT authentication
 * 
 * @returns JSON response with operation result
 */

import { verifyJWT, createUnauthorizedResponse, getCorsHeaders } from '../verify-jwt';

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

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  };

  try {
    const method = request.method;
    const projectId = params.id;

    if (!projectId) {
      return new Response(JSON.stringify({
        error: 'Missing parameter',
        message: 'Project ID is required'
      }), { 
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Handle different HTTP methods
    switch (method) {
      case 'GET':
        return await handleGetProject(projectId, env, corsHeaders);
      case 'PUT':
        return await handlePutProject(projectId, request, env, corsHeaders);
      case 'DELETE':
        return await handleDeleteProject(projectId, request, env, corsHeaders);
      default:
        console.warn(`Method ${method} not allowed for /api/projects/:id`);
        return new Response(JSON.stringify({ 
          error: 'Method not allowed',
          message: 'Only GET, PUT, DELETE, and OPTIONS requests are supported'
        }), { 
          status: 405,
          headers: corsHeaders
        });
    }

  } catch (error) {
    console.error('Unexpected error in /api/projects/:id:', error);
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

// GET handler - Read specific project
async function handleGetProject(projectId: string, env: Env, corsHeaders: Record<string, string>) {
  console.log(`Loading project with ID: ${projectId}`);

  try {
    // Get all projects from KV
    const kvData = await env.PORTFOLIO_KV.get('projects');
    let projects: any[] = [];
    
    if (kvData) {
      projects = JSON.parse(kvData);
    } else {
      // Fallback to static assets
      const projectsFile = await env.ASSETS.get('data/projects.json');
      if (projectsFile) {
        const projectsText = await projectsFile.text();
        projects = JSON.parse(projectsText);
      }
    }

    // Find the specific project
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return new Response(JSON.stringify({
        error: 'Not found',
        message: `Project with ID '${projectId}' not found`
      }), { 
        status: 404,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify(project, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=60',
        'X-Content-Type-Options': 'nosniff',
        'X-API-Version': '2.0',
        'X-Project-ID': projectId,
      },
    });

  } catch (error) {
    console.error('Error loading project:', error);
    return new Response(JSON.stringify({
      error: 'Data error',
      message: 'Failed to load project data'
    }), { 
      status: 500,
      headers: corsHeaders
    });
  }
}

// PUT handler - Update specific project
async function handlePutProject(projectId: string, request: Request, env: Env, corsHeaders: Record<string, string>) {
  // Authenticate request with JWT
  const authResult = await verifyJWT(request, env.JWT_SECRET);
  if (!authResult.isValid) {
    return createUnauthorizedResponse(authResult.error || 'Authentication required for PUT operations');
  }

  // Parse request body
  let updatedProject;
  try {
    updatedProject = await request.json();
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
  if (!updatedProject || typeof updatedProject !== 'object' || Array.isArray(updatedProject)) {
    return new Response(JSON.stringify({
      error: 'Invalid data',
      message: 'Request body must be a project object'
    }), { 
      status: 400,
      headers: corsHeaders
    });
  }

  // Ensure ID matches URL parameter
  if (updatedProject.id !== projectId) {
    return new Response(JSON.stringify({
      error: 'ID mismatch',
      message: 'Project ID in body must match URL parameter'
    }), { 
      status: 400,
      headers: corsHeaders
    });
  }

  // Validate required fields
  const requiredFields = ['id', 'title', 'description', 'status', 'tech', 'featured', 'github', 'live'];
  const missingFields = requiredFields.filter(field => !(field in updatedProject));
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

    // Find project index
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) {
      return new Response(JSON.stringify({
        error: 'Not found',
        message: `Project with ID '${projectId}' not found`
      }), { 
        status: 404,
        headers: corsHeaders
      });
    }

    // Update the project
    projects[projectIndex] = {
      ...projects[projectIndex],
      ...updatedProject,
      id: projectId // Ensure ID doesn't change
    };

    // Save to KV
    await env.PORTFOLIO_KV.put('projects', JSON.stringify(projects));

    console.log(`Successfully updated project: ${projectId}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Project updated successfully',
      project: projects[projectIndex]
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error updating project:', error);
    return new Response(JSON.stringify({
      error: 'Update failed',
      message: 'Failed to update project'
    }), { 
      status: 500,
      headers: corsHeaders
    });
  }
}

// DELETE handler - Delete specific project
async function handleDeleteProject(projectId: string, request: Request, env: Env, corsHeaders: Record<string, string>) {
  // Authenticate request with JWT
  const authResult = await verifyJWT(request, env.JWT_SECRET);
  if (!authResult.isValid) {
    return createUnauthorizedResponse(authResult.error || 'Authentication required for DELETE operations');
  }

  try {
    // Get existing projects
    const existingData = await env.PORTFOLIO_KV.get('projects');
    let projects: any[] = existingData ? JSON.parse(existingData) : [];

    // Find project index
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) {
      return new Response(JSON.stringify({
        error: 'Not found',
        message: `Project with ID '${projectId}' not found`
      }), { 
        status: 404,
        headers: corsHeaders
      });
    }

    // Remove the project
    const deletedProject = projects.splice(projectIndex, 1)[0];

    // Save to KV
    await env.PORTFOLIO_KV.put('projects', JSON.stringify(projects));

    console.log(`Successfully deleted project: ${projectId}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Project deleted successfully',
      deletedProject: deletedProject,
      totalProjects: projects.length
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error deleting project:', error);
    return new Response(JSON.stringify({
      error: 'Delete failed',
      message: 'Failed to delete project'
    }), { 
      status: 500,
      headers: corsHeaders
    });
  }
}

// Authentication helper for project operations
function authenticateProjectRequest(request: Request, env: Env): { success: boolean; message: string } {
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
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}; 