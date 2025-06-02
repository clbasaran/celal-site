import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import { nanoid } from 'nanoid';

interface Env {
  MEDIA_BUCKET: R2Bucket;
  JWT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS ayarları
app.use('*', cors({
  origin: ['https://celalbasaran.com', 'http://localhost:8080'],
  allowMethods: ['GET', 'POST', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Upload şeması
const UploadSchema = z.object({
  category: z.enum(['images', 'documents', 'media']).default('images'),
  alt_text: z.string().optional(),
  title: z.string().optional(),
});

// File upload endpoint
app.post('/', async (c) => {
  try {
    // Auth kontrolü
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const metadata = JSON.parse(formData.get('metadata') as string || '{}');
    
    if (!file) {
      return c.json({ error: 'Dosya seçilmedi' }, 400);
    }

    const validatedData = UploadSchema.parse(metadata);

    // Dosya validasyonu
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return c.json({ error: 'Dosya boyutu 10MB\'dan büyük olamaz' }, 400);
    }

    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Desteklenmeyen dosya formatı' }, 400);
    }

    // Unique filename oluştur
    const fileExtension = file.name.split('.').pop();
    const uniqueId = nanoid(12);
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${validatedData.category}/${timestamp}/${uniqueId}.${fileExtension}`;

    // R2'ye upload
    const arrayBuffer = await file.arrayBuffer();
    
    const uploadResult = await c.env.MEDIA_BUCKET.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000',
      },
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        category: validatedData.category,
        altText: validatedData.alt_text || '',
        title: validatedData.title || '',
        size: file.size.toString(),
      }
    });

    if (!uploadResult) {
      return c.json({ error: 'Dosya yüklenemedi' }, 500);
    }

    // Public URL oluştur
    const publicUrl = `https://media.celalbasaran.com/${fileName}`;

    return c.json({
      success: true,
      message: 'Dosya başarıyla yüklendi',
      data: {
        id: uniqueId,
        filename: fileName,
        originalName: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type,
        category: validatedData.category,
        altText: validatedData.alt_text,
        title: validatedData.title,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ error: 'Dosya yüklenirken hata oluştu' }, 500);
  }
});

// File list endpoint
app.get('/', async (c) => {
  try {
    const category = c.req.query('category');
    const limit = parseInt(c.req.query('limit') || '20');
    
    const listOptions: R2ListOptions = {
      limit,
      prefix: category ? `${category}/` : undefined,
    };

    const objects = await c.env.MEDIA_BUCKET.list(listOptions);

    const files = objects.objects.map(obj => ({
      filename: obj.key,
      url: `https://media.celalbasaran.com/${obj.key}`,
      size: obj.size,
      lastModified: obj.uploaded.toISOString(),
      metadata: obj.customMetadata
    }));

    return c.json({
      success: true,
      data: files,
      truncated: objects.truncated
    });

  } catch (error) {
    return c.json({ error: 'Dosyalar alınırken hata oluştu' }, 500);
  }
});

// Delete file endpoint
app.delete('/:filename', async (c) => {
  try {
    const filename = c.req.param('filename');
    
    await c.env.MEDIA_BUCKET.delete(filename);

    return c.json({
      success: true,
      message: 'Dosya başarıyla silindi'
    });

  } catch (error) {
    return c.json({ error: 'Dosya silinirken hata oluştu' }, 500);
  }
});

export default app; 