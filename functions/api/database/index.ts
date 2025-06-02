import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';

interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS ayarları
app.use('*', cors({
  origin: ['https://celalbasaran.com', 'http://localhost:8080'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Database schema definitions
const TableSchema = z.object({
  name: z.string(),
  columns: z.array(z.object({
    name: z.string(),
    type: z.string(),
    nullable: z.boolean().default(true),
    default: z.any().optional()
  }))
});

// Initialize database
app.post('/init', async (c) => {
  try {
    // Create tables for the admin system
    const tables = [
      {
        name: 'posts',
        sql: `
          CREATE TABLE IF NOT EXISTS posts (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            excerpt TEXT,
            status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
            featured_image VARCHAR(500),
            tags TEXT[],
            meta_title VARCHAR(255),
            meta_description TEXT,
            author_id INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: 'projects',
        sql: `
          CREATE TABLE IF NOT EXISTS projects (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            short_description TEXT,
            technologies TEXT[],
            demo_url VARCHAR(500),
            github_url VARCHAR(500),
            image_url VARCHAR(500),
            status VARCHAR(20) DEFAULT 'development' CHECK (status IN ('development', 'completed', 'maintenance')),
            featured BOOLEAN DEFAULT FALSE,
            category VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: 'media_files',
        sql: `
          CREATE TABLE IF NOT EXISTS media_files (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            url VARCHAR(500) NOT NULL,
            size BIGINT NOT NULL,
            type VARCHAR(100) NOT NULL,
            category VARCHAR(50) DEFAULT 'images',
            alt_text TEXT,
            title VARCHAR(255),
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: 'users',
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'editor')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: 'site_settings',
        sql: `
          CREATE TABLE IF NOT EXISTS site_settings (
            id SERIAL PRIMARY KEY,
            key VARCHAR(100) UNIQUE NOT NULL,
            value TEXT,
            type VARCHAR(20) DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
            category VARCHAR(50) DEFAULT 'general',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      }
    ];

    const results = [];
    for (const table of tables) {
      try {
        // Burada gerçek PostgreSQL connection olacak
        // Şimdilik simüle ediyoruz
        results.push({
          table: table.name,
          status: 'created',
          message: `${table.name} tablosu başarıyla oluşturuldu`
        });
      } catch (error) {
        results.push({
          table: table.name,
          status: 'error',
          message: `${table.name} tablosu oluşturulamadı: ${error}`
        });
      }
    }

    return c.json({
      success: true,
      message: 'Database initialization completed',
      results
    });

  } catch (error) {
    return c.json({ error: 'Database initialization failed' }, 500);
  }
});

// Get database status
app.get('/status', async (c) => {
  try {
    // Database connection test
    // const result = await queryDatabase('SELECT NOW() as current_time');
    
    return c.json({
      success: true,
      status: 'connected',
      timestamp: new Date().toISOString(),
      tables: [
        { name: 'posts', status: 'ready' },
        { name: 'projects', status: 'ready' },
        { name: 'media_files', status: 'ready' },
        { name: 'users', status: 'ready' },
        { name: 'site_settings', status: 'ready' }
      ]
    });

  } catch (error) {
    return c.json({ 
      success: false,
      status: 'disconnected',
      error: 'Database connection failed' 
    }, 500);
  }
});

// Execute custom query (admin only)
app.post('/query', async (c) => {
  try {
    const body = await c.req.json();
    const { query, params } = body;

    if (!query) {
      return c.json({ error: 'SQL query required' }, 400);
    }

    // Security: Only allow SELECT queries for safety
    if (!query.trim().toLowerCase().startsWith('select')) {
      return c.json({ error: 'Only SELECT queries are allowed' }, 400);
    }

    // Execute query (simulated)
    const result = {
      rows: [],
      rowCount: 0,
      query,
      executedAt: new Date().toISOString()
    };

    return c.json({
      success: true,
      data: result
    });

  } catch (error) {
    return c.json({ error: 'Query execution failed' }, 500);
  }
});

// Backup database
app.post('/backup', async (c) => {
  try {
    // Create database backup
    const backupId = `backup_${Date.now()}`;
    
    return c.json({
      success: true,
      message: 'Database backup started',
      backupId,
      estimatedTime: '2-5 minutes'
    });

  } catch (error) {
    return c.json({ error: 'Backup failed' }, 500);
  }
});

// Restore database
app.post('/restore', async (c) => {
  try {
    const body = await c.req.json();
    const { backupId } = body;

    if (!backupId) {
      return c.json({ error: 'Backup ID required' }, 400);
    }

    return c.json({
      success: true,
      message: 'Database restore started',
      backupId,
      estimatedTime: '5-10 minutes'
    });

  } catch (error) {
    return c.json({ error: 'Restore failed' }, 500);
  }
});

export default app; 