/**
 * Cloudflare Pages API Route: /api/content
 * 
 * Handles content management for admin dashboard
 * Supports GET, POST, PUT, DELETE (JWT authenticated)
 * 
 * @returns JSON response with content data
 */

import { verifyJWT, createUnauthorizedResponse } from './verify-jwt';

interface Env {
  ASSETS: any;
  PORTFOLIO_KV: KVNamespace;
  JWT_SECRET: string;
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

interface Content {
  id: string;
  title: string;
  type: 'blog' | 'portfolio' | 'page' | 'news';
  status: 'published' | 'draft' | 'archived';
  content: string;
  excerpt?: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  tags?: string[];
  slug: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const method = request.method;
    
    if (method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Authenticate all requests
    const authResult = await verifyJWT(request, env.JWT_SECRET);
    if (!authResult.isValid) {
      return createUnauthorizedResponse(authResult.error || 'Authentication required');
    }

    switch (method) {
      case 'GET':
        return await handleGet(request, env, corsHeaders);
      case 'POST':
        return await handlePost(request, env, corsHeaders);
      case 'PUT':
        return await handlePut(request, env, corsHeaders);
      case 'DELETE':
        return await handleDelete(request, env, corsHeaders);
      default:
        return new Response(JSON.stringify({
          error: 'Method not allowed',
          message: 'Only GET, POST, PUT, DELETE requests are supported'
        }), { 
          status: 405,
          headers: corsHeaders
        });
    }

  } catch (error) {
    console.error('Unexpected error in /api/content:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }), { 
      status: 500,
      headers: corsHeaders
    });
  }
};

async function handleGet(request: Request, env: Env, corsHeaders: Record<string, string>) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');

    let contentData = await env.PORTFOLIO_KV.get('content');
    let content: Content[] = contentData ? JSON.parse(contentData) : await getDefaultContent();

    // Filter by parameters
    if (id) {
      const item = content.find(c => c.id === id);
      if (!item) {
        return new Response(JSON.stringify({
          error: 'Not found',
          message: 'Content not found'
        }), { status: 404, headers: corsHeaders });
      }
      content = [item];
    }

    if (type) {
      content = content.filter(c => c.type === type);
    }

    if (status) {
      content = content.filter(c => c.status === status);
    }

    return new Response(JSON.stringify({
      content,
      total: content.length,
      stats: {
        published: content.filter(c => c.status === 'published').length,
        draft: content.filter(c => c.status === 'draft').length,
        archived: content.filter(c => c.status === 'archived').length
      }
    }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error getting content:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch content',
      message: 'Could not retrieve content data'
    }), { 
      status: 500,
      headers: corsHeaders
    });
  }
}

async function handlePost(request: Request, env: Env, corsHeaders: Record<string, string>) {
  try {
    const newContent: Partial<Content> = await request.json();

    // Validate required fields
    if (!newContent.title || !newContent.type || !newContent.content) {
      return new Response(JSON.stringify({
        error: 'Missing required fields',
        message: 'Title, type, and content are required'
      }), { status: 400, headers: corsHeaders });
    }

    // Generate ID and slug
    const id = crypto.randomUUID();
    const slug = generateSlug(newContent.title);
    const now = new Date().toISOString();

    const content: Content = {
      id,
      title: newContent.title,
      type: newContent.type as Content['type'],
      status: newContent.status || 'draft',
      content: newContent.content,
      excerpt: newContent.excerpt || generateExcerpt(newContent.content),
      author: 'Admin',
      createdAt: now,
      updatedAt: now,
      publishedAt: newContent.status === 'published' ? now : undefined,
      tags: newContent.tags || [],
      slug,
      seo: newContent.seo || {}
    };

    // Get existing content
    const existingData = await env.PORTFOLIO_KV.get('content');
    const existingContent: Content[] = existingData ? JSON.parse(existingData) : [];

    // Add new content
    existingContent.push(content);

    // Save to KV
    await env.PORTFOLIO_KV.put('content', JSON.stringify(existingContent));

    return new Response(JSON.stringify({
      success: true,
      content,
      message: 'Content created successfully'
    }), {
      status: 201,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error creating content:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create content',
      message: 'Could not create content'
    }), { 
      status: 500,
      headers: corsHeaders
    });
  }
}

async function handlePut(request: Request, env: Env, corsHeaders: Record<string, string>) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({
        error: 'Missing ID',
        message: 'Content ID is required for updates'
      }), { status: 400, headers: corsHeaders });
    }

    const updates: Partial<Content> = await request.json();

    // Get existing content
    const existingData = await env.PORTFOLIO_KV.get('content');
    const content: Content[] = existingData ? JSON.parse(existingData) : [];

    // Find content to update
    const index = content.findIndex(c => c.id === id);
    if (index === -1) {
      return new Response(JSON.stringify({
        error: 'Not found',
        message: 'Content not found'
      }), { status: 404, headers: corsHeaders });
    }

    // Update content
    const updatedContent = {
      ...content[index],
      ...updates,
      updatedAt: new Date().toISOString(),
      publishedAt: updates.status === 'published' && content[index].status !== 'published' 
        ? new Date().toISOString() 
        : content[index].publishedAt
    };

    content[index] = updatedContent;

    // Save to KV
    await env.PORTFOLIO_KV.put('content', JSON.stringify(content));

    return new Response(JSON.stringify({
      success: true,
      content: updatedContent,
      message: 'Content updated successfully'
    }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error updating content:', error);
    return new Response(JSON.stringify({
      error: 'Failed to update content',
      message: 'Could not update content'
    }), { 
      status: 500,
      headers: corsHeaders
    });
  }
}

async function handleDelete(request: Request, env: Env, corsHeaders: Record<string, string>) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({
        error: 'Missing ID',
        message: 'Content ID is required for deletion'
      }), { status: 400, headers: corsHeaders });
    }

    // Get existing content
    const existingData = await env.PORTFOLIO_KV.get('content');
    const content: Content[] = existingData ? JSON.parse(existingData) : [];

    // Find content to delete
    const index = content.findIndex(c => c.id === id);
    if (index === -1) {
      return new Response(JSON.stringify({
        error: 'Not found',
        message: 'Content not found'
      }), { status: 404, headers: corsHeaders });
    }

    // Remove content
    const deletedContent = content.splice(index, 1)[0];

    // Save to KV
    await env.PORTFOLIO_KV.put('content', JSON.stringify(content));

    return new Response(JSON.stringify({
      success: true,
      deletedContent,
      message: 'Content deleted successfully'
    }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error deleting content:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete content',
      message: 'Could not delete content'
    }), { 
      status: 500,
      headers: corsHeaders
    });
  }
}

async function getDefaultContent(): Promise<Content[]> {
  return [
    {
      id: '1',
      title: 'Modern Web Tasarım Trendleri',
      type: 'blog',
      status: 'published',
      content: '<p>Modern web tasarım trendleri hakkında detaylı bir inceleme...</p>',
      excerpt: 'Modern web tasarım trendleri ve gelecek öngörüleri',
      author: 'Celal Başaran',
      createdAt: '2025-06-01T10:00:00Z',
      updatedAt: '2025-06-01T10:00:00Z',
      publishedAt: '2025-06-01T10:00:00Z',
      tags: ['web-design', 'trends', 'ui-ux'],
      slug: 'modern-web-tasarim-trendleri',
      seo: {
        title: 'Modern Web Tasarım Trendleri 2025',
        description: 'En son web tasarım trendlerini keşfedin ve sitenizi güncelleyin',
        keywords: ['web tasarım', 'trends', 'ui', 'ux']
      }
    },
    {
      id: '2',
      title: 'E-Ticaret Projesi',
      type: 'portfolio',
      status: 'draft',
      content: '<p>Kapsamlı e-ticaret platformu geliştirme projesi...</p>',
      excerpt: 'React ve Node.js ile geliştirilmiş e-ticaret platformu',
      author: 'Celal Başaran',
      createdAt: '2025-06-02T15:30:00Z',
      updatedAt: '2025-06-02T15:30:00Z',
      tags: ['react', 'nodejs', 'ecommerce'],
      slug: 'e-ticaret-projesi',
      seo: {
        title: 'E-Ticaret Platform Projesi',
        description: 'Modern teknolojilerle geliştirilmiş e-ticaret platformu',
        keywords: ['ecommerce', 'react', 'nodejs', 'portfolio']
      }
    }
  ];
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u')
    .replace(/[şŞ]/g, 's')
    .replace(/[ıİ]/g, 'i')
    .replace(/[öÖ]/g, 'o')
    .replace(/[çÇ]/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function generateExcerpt(content: string, maxLength: number = 150): string {
  const textContent = content.replace(/<[^>]*>/g, '');
  return textContent.length > maxLength 
    ? textContent.substring(0, maxLength) + '...'
    : textContent;
} 