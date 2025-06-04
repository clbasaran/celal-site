/**
 * Cloudflare Pages API Route: /api/analytics
 * 
 * Handles analytics data for admin dashboard
 * Supports GET (JWT authenticated)
 * 
 * @returns JSON response with analytics data
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

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const method = request.method;
    
    if (method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }
    
    if (method !== 'GET') {
      return new Response(JSON.stringify({
        error: 'Method not allowed',
        message: 'Only GET requests are supported'
      }), { 
        status: 405,
        headers: corsHeaders
      });
    }

    // Authenticate request
    const authResult = await verifyJWT(request, env.JWT_SECRET);
    if (!authResult.isValid) {
      return createUnauthorizedResponse(authResult.error || 'Authentication required');
    }

    return await handleGet(env, corsHeaders);

  } catch (error) {
    console.error('Unexpected error in /api/analytics:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }), { 
      status: 500,
      headers: corsHeaders
    });
  }
};

async function handleGet(env: Env, corsHeaders: Record<string, string>) {
  try {
    // Get analytics data from KV or generate mock data
    let analyticsData = await env.PORTFOLIO_KV.get('analytics');
    
    if (!analyticsData) {
      // Generate mock analytics data
      const mockData = generateMockAnalytics();
      await env.PORTFOLIO_KV.put('analytics', JSON.stringify(mockData));
      analyticsData = JSON.stringify(mockData);
    }

    const data = JSON.parse(analyticsData);
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error) {
    console.error('Error getting analytics:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch analytics',
      message: 'Could not retrieve analytics data'
    }), { 
      status: 500,
      headers: corsHeaders
    });
  }
}

function generateMockAnalytics() {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  
  return {
    overview: {
      totalVisitors: Math.floor(Math.random() * 5000) + 10000,
      pageViews: Math.floor(Math.random() * 20000) + 40000,
      avgDuration: `${Math.floor(Math.random() * 2) + 2}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      conversionRate: (Math.random() * 3 + 2).toFixed(1) + '%',
      bounceRate: (Math.random() * 20 + 30).toFixed(1) + '%'
    },
    traffic: {
      sources: [
        { name: 'Organik Arama', value: Math.floor(Math.random() * 20) + 40, color: '#667eea' },
        { name: 'Sosyal Medya', value: Math.floor(Math.random() * 15) + 20, color: '#10b981' },
        { name: 'Direkt', value: Math.floor(Math.random() * 10) + 15, color: '#f59e0b' },
        { name: 'Referans', value: Math.floor(Math.random() * 10) + 5, color: '#ef4444' }
      ]
    },
    devices: {
      desktop: Math.floor(Math.random() * 20) + 50,
      mobile: Math.floor(Math.random() * 20) + 30,
      tablet: Math.floor(Math.random() * 10) + 5
    },
    visitors: {
      labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
      data: Array.from({ length: 6 }, () => Math.floor(Math.random() * 3000) + 1000)
    },
    pages: [
      { path: '/', views: Math.floor(Math.random() * 1000) + 2000, title: 'Ana Sayfa' },
      { path: '/hakkimda', views: Math.floor(Math.random() * 500) + 1500, title: 'Hakkımda' },
      { path: '/portfolio', views: Math.floor(Math.random() * 500) + 1000, title: 'Portfolio' },
      { path: '/blog', views: Math.floor(Math.random() * 300) + 800, title: 'Blog' },
      { path: '/iletisim', views: Math.floor(Math.random() * 200) + 500, title: 'İletişim' }
    ],
    realtime: {
      activeUsers: Math.floor(Math.random() * 50) + 10,
      lastUpdated: now.toISOString()
    }
  };
} 