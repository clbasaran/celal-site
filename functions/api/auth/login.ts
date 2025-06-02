import { Hono } from 'hono';
import { cors } from 'hono/cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const app = new Hono();

// CORS ayarları
app.use('*', cors({
  origin: ['https://celalbasaran.com', 'http://localhost:8080'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Login şeması
const LoginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

// Login endpoint
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { username, password } = LoginSchema.parse(body);

    // Demo credentials (sonra database'den alacağız)
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD_HASH = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // password

    if (username !== ADMIN_USERNAME) {
      return c.json({ error: 'Geçersiz kullanıcı adı veya şifre' }, 401);
    }

    const isValidPassword = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!isValidPassword) {
      return c.json({ error: 'Geçersiz kullanıcı adı veya şifre' }, 401);
    }

    // JWT token oluştur
    const JWT_SECRET = c.env?.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { 
        id: 1, 
        username: ADMIN_USERNAME,
        role: 'admin' 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return c.json({
      success: true,
      message: 'Giriş başarılı',
      token,
      user: {
        id: 1,
        username: ADMIN_USERNAME,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Sunucu hatası' }, 500);
  }
});

export default app; 