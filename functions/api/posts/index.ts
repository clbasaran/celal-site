import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';

const app = new Hono();

// CORS ayarları
app.use('*', cors({
  origin: ['https://celalbasaran.com', 'http://localhost:8080'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Post şeması
const PostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  featured_image: z.string().optional(),
  tags: z.array(z.string()).default([]),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
});

// Demo posts data
let posts = [
  {
    id: 1,
    title: 'Welcome to the New Admin Panel',
    content: '<p>Bu yeni admin panelimizin ilk blog yazısı!</p>',
    excerpt: 'Admin panelin tanıtım yazısı',
    status: 'published',
    featured_image: '/assets/images/blog/admin-panel.jpg',
    tags: ['admin', 'blog', 'geliştirme'],
    meta_title: 'Yeni Admin Panel | Celal Başaran',
    meta_description: 'Modern admin panel ile içerik yönetimi',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    author_id: 1
  }
];

// GET - Tüm posts
app.get('/', async (c) => {
  try {
    const status = c.req.query('status');
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = parseInt(c.req.query('offset') || '0');

    let filteredPosts = posts;
    if (status) {
      filteredPosts = posts.filter(post => post.status === status);
    }

    const paginatedPosts = filteredPosts.slice(offset, offset + limit);

    return c.json({
      success: true,
      data: paginatedPosts,
      total: filteredPosts.length,
      limit,
      offset
    });
  } catch (error) {
    return c.json({ error: 'Posts alınırken hata oluştu' }, 500);
  }
});

// GET - Tek post
app.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const post = posts.find(p => p.id === id);

    if (!post) {
      return c.json({ error: 'Post bulunamadı' }, 404);
    }

    return c.json({
      success: true,
      data: post
    });
  } catch (error) {
    return c.json({ error: 'Post alınırken hata oluştu' }, 500);
  }
});

// POST - Yeni post
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const postData = PostSchema.parse(body);

    const newPost = {
      id: posts.length + 1,
      ...postData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author_id: 1
    };

    posts.push(newPost);

    return c.json({
      success: true,
      message: 'Post başarıyla oluşturuldu',
      data: newPost
    }, 201);
  } catch (error) {
    return c.json({ error: 'Post oluşturulurken hata oluştu' }, 500);
  }
});

// PUT - Post güncelle
app.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const postData = PostSchema.parse(body);

    const postIndex = posts.findIndex(p => p.id === id);
    if (postIndex === -1) {
      return c.json({ error: 'Post bulunamadı' }, 404);
    }

    posts[postIndex] = {
      ...posts[postIndex],
      ...postData,
      updated_at: new Date().toISOString()
    };

    return c.json({
      success: true,
      message: 'Post başarıyla güncellendi',
      data: posts[postIndex]
    });
  } catch (error) {
    return c.json({ error: 'Post güncellenirken hata oluştu' }, 500);
  }
});

// DELETE - Post sil
app.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const postIndex = posts.findIndex(p => p.id === id);

    if (postIndex === -1) {
      return c.json({ error: 'Post bulunamadı' }, 404);
    }

    posts.splice(postIndex, 1);

    return c.json({
      success: true,
      message: 'Post başarıyla silindi'
    });
  } catch (error) {
    return c.json({ error: 'Post silinirken hata oluştu' }, 500);
  }
});

export default app; 