/**
 * Test API endpoint - API bağlantılarını test etmek için
 */

interface Env {
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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (request.method === 'POST') {
    try {
      const requestData = await request.json() as { action: string; data?: any };
      const { action, data } = requestData;

      switch (action) {
        case 'test-kv':
          // KV test
          await env.PORTFOLIO_KV.put('test-key', JSON.stringify({ 
            message: 'KV çalışıyor!', 
            timestamp: new Date().toISOString() 
          }));
          const testData = await env.PORTFOLIO_KV.get('test-key');
          
          return new Response(JSON.stringify({
            success: true,
            message: 'KV storage test başarılı',
            data: JSON.parse(testData || '{}')
          }), { status: 200, headers: corsHeaders });

        case 'init-sample-data':
          // Örnek veri oluştur
          const sampleContent = [
            {
              id: '1',
              title: 'Hoş Geldiniz',
              type: 'blog',
              status: 'published',
              content: 'Admin panel API entegrasyonu başarıyla tamamlandı!',
              excerpt: 'Yeni admin panelimiz hazır.',
              author: 'Admin',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              publishedAt: new Date().toISOString(),
              tags: ['admin', 'api', 'test'],
              slug: 'hos-geldiniz'
            }
          ];

          const sampleProjects = [
            {
              id: '1',
              title: 'Admin Panel API',
              description: 'Profesyonel admin paneli ile API entegrasyonu',
              status: 'completed',
              technologies: ['TypeScript', 'Cloudflare Pages', 'Chart.js'],
              demoUrl: '/admin/',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];

          await env.PORTFOLIO_KV.put('content', JSON.stringify(sampleContent));
          await env.PORTFOLIO_KV.put('projects', JSON.stringify(sampleProjects));

          return new Response(JSON.stringify({
            success: true,
            message: 'Örnek veriler oluşturuldu',
            data: { content: sampleContent.length, projects: sampleProjects.length }
          }), { status: 200, headers: corsHeaders });

        default:
          return new Response(JSON.stringify({
            error: 'Geçersiz test aksiyonu'
          }), { status: 400, headers: corsHeaders });
      }
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Test hatası',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      }), { status: 500, headers: corsHeaders });
    }
  }

  // GET request - test durumu
  return new Response(JSON.stringify({
    status: 'API çalışıyor',
    timestamp: new Date().toISOString(),
    environment: env.JWT_SECRET ? 'configured' : 'not-configured',
    endpoints: [
      '/api/test',
      '/api/dashboard', 
      '/api/content',
      '/api/projects',
      '/api/analytics',
      '/api/media'
    ]
  }), { status: 200, headers: corsHeaders });
}; 