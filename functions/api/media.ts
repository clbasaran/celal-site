/**
 * Cloudflare Pages API Route: /api/media
 * 
 * Handles media file management for admin dashboard
 * Supports GET, POST, DELETE (JWT authenticated)
 * 
 * @returns JSON response with media data
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

interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  alt?: string;
  category: 'image' | 'document' | 'video' | 'other';
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
      case 'DELETE':
        return await handleDelete(request, env, corsHeaders);
      default:
        return new Response(JSON.stringify({
          error: 'Method not allowed',
          message: 'Only GET, POST, DELETE requests are supported'
        }), { 
          status: 405,
          headers: corsHeaders
        });
    }

  } catch (error) {
    console.error('Unexpected error in /api/media:', error);
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
    const category = url.searchParams.get('category');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let mediaData = await env.PORTFOLIO_KV.get('media');
    let media: MediaFile[] = mediaData ? JSON.parse(mediaData) : await getDefaultMedia();

    // Filter by category
    if (category) {
      media = media.filter(m => m.category === category);
    }

    // Apply pagination
    const total = media.length;
    media = media.slice(offset, offset + limit);

    // Calculate storage stats
    const stats = {
      totalFiles: total,
      totalSize: media.reduce((sum, file) => sum + file.size, 0),
      categories: {
        image: media.filter(m => m.category === 'image').length,
        document: media.filter(m => m.category === 'document').length,
        video: media.filter(m => m.category === 'video').length,
        other: media.filter(m => m.category === 'other').length
      }
    };

    return new Response(JSON.stringify({
      media,
      stats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error getting media:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch media',
      message: 'Could not retrieve media files'
    }), { 
      status: 500,
      headers: corsHeaders
    });
  }
}

async function handlePost(request: Request, env: Env, corsHeaders: Record<string, string>) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const alt = formData.get('alt') as string;
    const category = formData.get('category') as string;

    if (!file) {
      return new Response(JSON.stringify({
        error: 'No file provided',
        message: 'A file is required for upload'
      }), { status: 400, headers: corsHeaders });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({
        error: 'File too large',
        message: 'File size must be less than 10MB'
      }), { status: 400, headers: corsHeaders });
    }

    // Generate unique filename
    const id = crypto.randomUUID();
    const extension = file.name.split('.').pop();
    const filename = `${id}.${extension}`;
    
    // For demo purposes, we'll simulate upload and store metadata
    // In production, you would upload to Cloudflare R2 or similar
    const mediaFile: MediaFile = {
      id,
      name: file.name,
      type: file.type,
      size: file.size,
      url: `/uploads/${filename}`, // This would be the actual uploaded URL
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Admin',
      alt: alt || '',
      category: (category as any) || determineCategory(file.type)
    };

    // Get existing media
    const existingData = await env.PORTFOLIO_KV.get('media');
    const existingMedia: MediaFile[] = existingData ? JSON.parse(existingData) : [];

    // Add new media
    existingMedia.push(mediaFile);

    // Save to KV
    await env.PORTFOLIO_KV.put('media', JSON.stringify(existingMedia));

    return new Response(JSON.stringify({
      success: true,
      message: 'File uploaded successfully',
      media: mediaFile
    }), {
      status: 201,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error uploading media:', error);
    return new Response(JSON.stringify({
      error: 'Upload failed',
      message: 'Could not upload file'
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
        error: 'Missing file ID',
        message: 'File ID is required for deletion'
      }), { status: 400, headers: corsHeaders });
    }

    // Get existing media
    const existingData = await env.PORTFOLIO_KV.get('media');
    const existingMedia: MediaFile[] = existingData ? JSON.parse(existingData) : [];

    // Find and remove file
    const fileIndex = existingMedia.findIndex(m => m.id === id);
    if (fileIndex === -1) {
      return new Response(JSON.stringify({
        error: 'File not found',
        message: 'The specified file does not exist'
      }), { status: 404, headers: corsHeaders });
    }

    const deletedFile = existingMedia.splice(fileIndex, 1)[0];

    // Save updated list
    await env.PORTFOLIO_KV.put('media', JSON.stringify(existingMedia));

    return new Response(JSON.stringify({
      success: true,
      message: 'File deleted successfully',
      deletedFile
    }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error deleting media:', error);
    return new Response(JSON.stringify({
      error: 'Deletion failed',
      message: 'Could not delete file'
    }), { 
      status: 500,
      headers: corsHeaders
    });
  }
}

async function getDefaultMedia(): Promise<MediaFile[]> {
  return [
    {
      id: '1',
      name: 'profile-photo.jpg',
      type: 'image/jpeg',
      size: 245760,
      url: '/assets/images/profile.jpg',
      uploadedAt: new Date(Date.now() - 86400000).toISOString(),
      uploadedBy: 'Admin',
      alt: 'Profil fotoğrafı',
      category: 'image'
    },
    {
      id: '2',
      name: 'project-showcase.png',
      type: 'image/png',
      size: 512000,
      url: '/assets/images/project-1.png',
      uploadedAt: new Date(Date.now() - 172800000).toISOString(),
      uploadedBy: 'Admin',
      alt: 'Proje görseli',
      category: 'image'
    }
  ];
}

function determineCategory(mimeType: string): MediaFile['category'] {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
  return 'other';
} 