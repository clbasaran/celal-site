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

// Project şeması
const ProjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  short_description: z.string().optional(),
  technologies: z.array(z.string()).default([]),
  demo_url: z.string().url().optional(),
  github_url: z.string().url().optional(),
  image_url: z.string().optional(),
  status: z.enum(['development', 'completed', 'maintenance']).default('development'),
  featured: z.boolean().default(false),
  category: z.string().optional(),
});

// Demo projects data
let projects = [
  {
    id: 1,
    title: 'Profesyonel Portfolio Website',
    description: 'Modern ve responsive portfolio website tasarımı',
    short_description: 'Portfolio site projesi',
    technologies: ['HTML', 'CSS', 'JavaScript', 'Python'],
    demo_url: 'https://celalbasaran.com',
    github_url: 'https://github.com/clbasaran/celal-site',
    image_url: '/assets/images/projects/portfolio.jpg',
    status: 'completed',
    featured: true,
    category: 'Web Development',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    title: 'Admin Panel Sistemi',
    description: 'Gelişmiş içerik yönetim sistemi',
    short_description: 'CMS Admin Panel',
    technologies: ['TypeScript', 'Hono', 'PostgreSQL', 'Cloudflare'],
    demo_url: 'https://celalbasaran.com/admin',
    github_url: '',
    image_url: '/assets/images/projects/admin.jpg',
    status: 'development',
    featured: true,
    category: 'Backend Development',
    created_at: '2024-01-15T11:00:00Z',
    updated_at: '2024-01-15T11:00:00Z'
  }
];

// GET - Tüm projeler
app.get('/', async (c) => {
  try {
    const featured = c.req.query('featured');
    const category = c.req.query('category');
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = parseInt(c.req.query('offset') || '0');

    let filteredProjects = projects;
    
    if (featured === 'true') {
      filteredProjects = filteredProjects.filter(project => project.featured);
    }
    
    if (category) {
      filteredProjects = filteredProjects.filter(project => 
        project.category?.toLowerCase() === category.toLowerCase()
      );
    }

    const paginatedProjects = filteredProjects.slice(offset, offset + limit);

    return c.json({
      success: true,
      data: paginatedProjects,
      total: filteredProjects.length,
      limit,
      offset
    });
  } catch (error) {
    return c.json({ error: 'Projeler alınırken hata oluştu' }, 500);
  }
});

// GET - Tek proje
app.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const project = projects.find(p => p.id === id);

    if (!project) {
      return c.json({ error: 'Proje bulunamadı' }, 404);
    }

    return c.json({
      success: true,
      data: project
    });
  } catch (error) {
    return c.json({ error: 'Proje alınırken hata oluştu' }, 500);
  }
});

// POST - Yeni proje
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const projectData = ProjectSchema.parse(body);

    const newProject = {
      id: projects.length + 1,
      ...projectData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    projects.push(newProject);

    return c.json({
      success: true,
      message: 'Proje başarıyla oluşturuldu',
      data: newProject
    }, 201);
  } catch (error) {
    return c.json({ error: 'Proje oluşturulurken hata oluştu' }, 500);
  }
});

// PUT - Proje güncelle
app.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const projectData = ProjectSchema.parse(body);

    const projectIndex = projects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return c.json({ error: 'Proje bulunamadı' }, 404);
    }

    projects[projectIndex] = {
      ...projects[projectIndex],
      ...projectData,
      updated_at: new Date().toISOString()
    };

    return c.json({
      success: true,
      message: 'Proje başarıyla güncellendi',
      data: projects[projectIndex]
    });
  } catch (error) {
    return c.json({ error: 'Proje güncellenirken hata oluştu' }, 500);
  }
});

// DELETE - Proje sil
app.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const projectIndex = projects.findIndex(p => p.id === id);

    if (projectIndex === -1) {
      return c.json({ error: 'Proje bulunamadı' }, 404);
    }

    projects.splice(projectIndex, 1);

    return c.json({
      success: true,
      message: 'Proje başarıyla silindi'
    });
  } catch (error) {
    return c.json({ error: 'Proje silinirken hata oluştu' }, 500);
  }
});

export default app; 