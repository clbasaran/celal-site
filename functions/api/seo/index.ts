import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';

interface Env {
  SITE_DATA: KVNamespace;
  JWT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS ayarları
app.use('*', cors({
  origin: ['https://celalbasaran.com', 'http://localhost:8080'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// SEO şeması
const SEOSchema = z.object({
  title: z.string().min(1).max(60),
  description: z.string().min(1).max(160),
  keywords: z.array(z.string()).default([]),
  canonical_url: z.string().url().optional(),
  og_title: z.string().optional(),
  og_description: z.string().optional(),
  og_image: z.string().url().optional(),
  twitter_title: z.string().optional(),
  twitter_description: z.string().optional(),
  twitter_image: z.string().url().optional(),
  robots: z.enum(['index,follow', 'noindex,nofollow', 'index,nofollow', 'noindex,follow']).default('index,follow'),
  schema_markup: z.record(z.any()).optional(),
});

// Page SEO şeması
const PageSEOSchema = z.object({
  page: z.string(),
  seo: SEOSchema
});

// Get SEO settings for a page
app.get('/page/:page', async (c) => {
  try {
    const page = c.req.param('page');
    const seoData = await c.env.SITE_DATA.get(`seo:${page}`);

    if (!seoData) {
      // Default SEO for pages
      const defaultSEO = {
        title: 'Celal Başaran - Software Developer',
        description: 'Profesyonel yazılım geliştirici. Modern web teknolojileri ile projeler.',
        keywords: ['software', 'developer', 'web', 'javascript', 'typescript', 'react'],
        robots: 'index,follow'
      };

      return c.json({
        success: true,
        data: defaultSEO
      });
    }

    return c.json({
      success: true,
      data: JSON.parse(seoData)
    });

  } catch (error) {
    return c.json({ error: 'SEO data alınırken hata oluştu' }, 500);
  }
});

// Update SEO settings for a page
app.put('/page/:page', async (c) => {
  try {
    const page = c.req.param('page');
    const body = await c.req.json();
    const seoData = SEOSchema.parse(body);

    await c.env.SITE_DATA.put(`seo:${page}`, JSON.stringify(seoData));

    return c.json({
      success: true,
      message: 'SEO ayarları güncellendi',
      data: seoData
    });

  } catch (error) {
    return c.json({ error: 'SEO ayarları güncellenirken hata oluştu' }, 500);
  }
});

// Generate sitemap
app.get('/sitemap', async (c) => {
  try {
    const pages = [
      { url: '/', priority: 1.0, changefreq: 'daily' },
      { url: '/about', priority: 0.8, changefreq: 'monthly' },
      { url: '/projects', priority: 0.9, changefreq: 'weekly' },
      { url: '/blog', priority: 0.8, changefreq: 'daily' },
      { url: '/contact', priority: 0.7, changefreq: 'monthly' },
    ];

    // Get dynamic pages (posts, projects)
    const posts = await c.env.SITE_DATA.get('posts:published');
    const projects = await c.env.SITE_DATA.get('projects:all');

    if (posts) {
      const postsData = JSON.parse(posts);
      postsData.forEach((post: any) => {
        pages.push({
          url: `/blog/${post.slug}`,
          priority: 0.6,
          changefreq: 'monthly'
        });
      });
    }

    if (projects) {
      const projectsData = JSON.parse(projects);
      projectsData.forEach((project: any) => {
        pages.push({
          url: `/projects/${project.slug}`,
          priority: 0.7,
          changefreq: 'monthly'
        });
      });
    }

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `
  <url>
    <loc>https://celalbasaran.com${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`).join('')}
</urlset>`;

    return new Response(sitemapXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    return c.json({ error: 'Sitemap oluşturulamadı' }, 500);
  }
});

// Generate robots.txt
app.get('/robots', async (c) => {
  try {
    const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://celalbasaran.com/sitemap.xml

# Disallow admin areas
Disallow: /admin/
Disallow: /api/

# Allow important pages
Allow: /
Allow: /about
Allow: /projects
Allow: /blog
Allow: /contact`;

    return new Response(robotsTxt, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400'
      }
    });

  } catch (error) {
    return c.json({ error: 'Robots.txt oluşturulamadı' }, 500);
  }
});

// SEO Analysis
app.post('/analyze', async (c) => {
  try {
    const body = await c.req.json();
    const { url, content } = body;

    // Basic SEO analysis
    const analysis = {
      title: {
        length: content.title?.length || 0,
        score: (content.title?.length >= 30 && content.title?.length <= 60) ? 100 : 50,
        suggestion: content.title?.length < 30 ? 'Title çok kısa' : content.title?.length > 60 ? 'Title çok uzun' : 'Title uygun'
      },
      description: {
        length: content.description?.length || 0,
        score: (content.description?.length >= 120 && content.description?.length <= 160) ? 100 : 50,
        suggestion: content.description?.length < 120 ? 'Description çok kısa' : content.description?.length > 160 ? 'Description çok uzun' : 'Description uygun'
      },
      keywords: {
        count: content.keywords?.length || 0,
        score: (content.keywords?.length >= 3 && content.keywords?.length <= 10) ? 100 : 50,
        suggestion: content.keywords?.length < 3 ? 'Daha fazla keyword ekleyin' : content.keywords?.length > 10 ? 'Keyword sayısını azaltın' : 'Keyword sayısı uygun'
      },
      headings: {
        h1_count: (content.html?.match(/<h1/g) || []).length,
        score: (content.html?.match(/<h1/g) || []).length === 1 ? 100 : 50,
        suggestion: (content.html?.match(/<h1/g) || []).length !== 1 ? 'Sadece bir H1 kullanın' : 'H1 yapısı uygun'
      },
      images: {
        without_alt: (content.html?.match(/<img(?![^>]*alt=)/g) || []).length,
        score: (content.html?.match(/<img(?![^>]*alt=)/g) || []).length === 0 ? 100 : 0,
        suggestion: (content.html?.match(/<img(?![^>]*alt=)/g) || []).length > 0 ? 'Tüm resimlere alt text ekleyin' : 'Alt text kullanımı uygun'
      }
    };

    const overallScore = Math.round(
      (analysis.title.score + analysis.description.score + analysis.keywords.score + 
       analysis.headings.score + analysis.images.score) / 5
    );

    return c.json({
      success: true,
      data: {
        url,
        score: overallScore,
        analysis,
        recommendations: [
          ...(analysis.title.score < 100 ? [analysis.title.suggestion] : []),
          ...(analysis.description.score < 100 ? [analysis.description.suggestion] : []),
          ...(analysis.keywords.score < 100 ? [analysis.keywords.suggestion] : []),
          ...(analysis.headings.score < 100 ? [analysis.headings.suggestion] : []),
          ...(analysis.images.score < 100 ? [analysis.images.suggestion] : [])
        ]
      }
    });

  } catch (error) {
    return c.json({ error: 'SEO analizi yapılamadı' }, 500);
  }
});

// Schema.org markup generator
app.post('/schema', async (c) => {
  try {
    const body = await c.req.json();
    const { type, data } = body;

    let schema = {};

    switch (type) {
      case 'person':
        schema = {
          "@context": "https://schema.org",
          "@type": "Person",
          "name": data.name || "Celal Başaran",
          "jobTitle": data.jobTitle || "Software Developer",
          "url": data.url || "https://celalbasaran.com",
          "image": data.image,
          "sameAs": data.socialLinks || [],
          "worksFor": {
            "@type": "Organization",
            "name": data.company
          }
        };
        break;

      case 'website':
        schema = {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": data.name || "Celal Başaran",
          "url": data.url || "https://celalbasaran.com",
          "description": data.description,
          "potentialAction": {
            "@type": "SearchAction",
            "target": `${data.url}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string"
          }
        };
        break;

      case 'article':
        schema = {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": data.title,
          "description": data.description,
          "image": data.image,
          "author": {
            "@type": "Person",
            "name": data.author || "Celal Başaran"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Celal Başaran",
            "logo": {
              "@type": "ImageObject",
              "url": "https://celalbasaran.com/logo.png"
            }
          },
          "datePublished": data.datePublished,
          "dateModified": data.dateModified
        };
        break;

      default:
        return c.json({ error: 'Desteklenmeyen schema tipi' }, 400);
    }

    return c.json({
      success: true,
      data: schema
    });

  } catch (error) {
    return c.json({ error: 'Schema markup oluşturulamadı' }, 500);
  }
});

export default app; 