//
//  send-welcome-email.ts
//  Cloudflare Function for sending welcome emails to new users
//  Created by Celal Başaran on 27.05.2025.
//

type PagesFunction<Env = Record<string, any>> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil: (promise: Promise<any>) => void;
  next: () => Promise<Response>;
}) => Promise<Response> | Response;

interface Env {
  RESEND_API_KEY: string;
}

interface WelcomeEmailRequest {
  username: string;
  email: string;
  role: string;
}

interface ResendResponse {
  id: string;
  message?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight requests
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Parse request body
    const body = await context.request.json() as WelcomeEmailRequest;
    const { username, email, role } = body;

    // Validate required fields
    if (!username || !email || !role) {
      return new Response(
        JSON.stringify({ 
          error: 'Username, email, and role are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid email format' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get Resend API key from environment
    const resendApiKey = context.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Email service not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Prepare welcome email content
    const welcomeEmailData = {
      from: 'Celal Başaran Portfolio <noreply@celalbasaran.com>',
      to: [email],
      subject: `Hoş Geldin ${username}! 🎉`,
      html: generateWelcomeEmailHTML(username, role),
      text: generateWelcomeEmailText(username, role)
    };

    // Send email via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(welcomeEmailData)
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error('Resend API error:', errorData);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send welcome email',
          details: 'Email service temporarily unavailable'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const resendResult = await resendResponse.json() as ResendResponse;

    // Return success response
    return new Response(
      JSON.stringify({
        message: 'Welcome email sent successfully',
        emailId: resendResult.id,
        recipient: email,
        username: username
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Welcome email error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'Failed to process welcome email request'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

// Generate HTML email content
function generateWelcomeEmailHTML(username: string, role: string): string {
  const roleDisplayName = role === 'admin' ? 'Admin' : 'Editor';
  const roleIcon = role === 'admin' ? '👑' : '✏️';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hoş Geldin ${username}!</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #0066cc;
          margin-bottom: 10px;
        }
        .welcome-title {
          font-size: 28px;
          font-weight: bold;
          color: #1a202c;
          margin: 20px 0;
        }
        .role-badge {
          display: inline-block;
          background: ${role === 'admin' ? '#9f7aea' : '#10b981'};
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin: 10px 0;
        }
        .content {
          margin: 30px 0;
          font-size: 16px;
          line-height: 1.7;
        }
        .features {
          background: #f7fafc;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .feature-item {
          margin: 10px 0;
          display: flex;
          align-items: center;
        }
        .feature-icon {
          margin-right: 10px;
          font-size: 18px;
        }
        .cta-button {
          display: inline-block;
          background: #0066cc;
          color: white;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          text-align: center;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">📱 Celal Başaran Portfolio</div>
          <h1 class="welcome-title">Hoş Geldin ${username}! 🎉</h1>
          <div class="role-badge">${roleIcon} ${roleDisplayName}</div>
        </div>

        <div class="content">
          <p>Merhaba <strong>${username}</strong>,</p>
          
          <p>Celal Başaran Portfolio sistemine <strong>${roleDisplayName}</strong> yetkisiyle başarıyla kaydoldun! Artık sistemin tüm özelliklerinden faydalanabilirsin.</p>

          <div class="features">
            <h3>🚀 Senin için hazır özellikler:</h3>
            ${role === 'admin' ? `
              <div class="feature-item">
                <span class="feature-icon">👥</span>
                <span>Kullanıcı yönetimi ve yetkilendirme</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">📊</span>
                <span>Detaylı analitik ve istatistikler</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">⚙️</span>
                <span>Sistem ayarları ve konfigürasyon</span>
              </div>
            ` : `
              <div class="feature-item">
                <span class="feature-icon">✏️</span>
                <span>İçerik oluşturma ve düzenleme</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">📝</span>
                <span>Proje yönetimi</span>
              </div>
            `}
            <div class="feature-item">
              <span class="feature-icon">🔐</span>
              <span>Güvenli JWT kimlik doğrulama</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📱</span>
              <span>Modern iOS uygulaması</span>
            </div>
          </div>

          <p>Sisteme giriş yapmak için iOS uygulamasını kullanabilir veya web arayüzümüze erişebilirsin.</p>

          <a href="https://celalbasaran.com" class="cta-button">🌐 Web Arayüzüne Git</a>
        </div>

        <div class="footer">
          <p>Bu e-posta, Celal Başaran Portfolio sistemi tarafından otomatik olarak gönderilmiştir.</p>
          <p>Sorularınız için: <a href="mailto:hello@celalbasaran.com">hello@celalbasaran.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate plain text email content
function generateWelcomeEmailText(username: string, role: string): string {
  const roleDisplayName = role === 'admin' ? 'Admin' : 'Editor';
  
  return `
Hoş Geldin ${username}!

Merhaba ${username},

Celal Başaran Portfolio sistemine ${roleDisplayName} yetkisiyle başarıyla kaydoldun! Artık sistemin tüm özelliklerinden faydalanabilirsin.

Senin için hazır özellikler:
${role === 'admin' ? `
- Kullanıcı yönetimi ve yetkilendirme
- Detaylı analitik ve istatistikler  
- Sistem ayarları ve konfigürasyon
` : `
- İçerik oluşturma ve düzenleme
- Proje yönetimi
`}
- Güvenli JWT kimlik doğrulama
- Modern iOS uygulaması

Sisteme giriş yapmak için iOS uygulamasını kullanabilir veya web arayüzümüze erişebilirsin.

Web Arayüzü: https://celalbasaran.com

Bu e-posta, Celal Başaran Portfolio sistemi tarafından otomatik olarak gönderilmiştir.
Sorularınız için: hello@celalbasaran.com
  `;
} 