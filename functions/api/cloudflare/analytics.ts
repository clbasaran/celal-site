export async function onRequest(context: any): Promise<Response> {
    const { request, env } = context;
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const url = new URL(request.url);
        const endpoint = url.pathname.split('/').pop();

        switch (endpoint) {
            case 'analytics':
                return await handleAnalytics(request, env, corsHeaders);
            case 'security':
                return await handleSecurity(request, env, corsHeaders);
            case 'performance':
                return await handlePerformance(request, env, corsHeaders);
            default:
                return new Response(
                    JSON.stringify({ success: false, error: 'Invalid endpoint' }),
                    { status: 400, headers: corsHeaders }
                );
        }
    } catch (error: any) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: corsHeaders }
        );
    }
}

async function handleAnalytics(request: Request, env: any, corsHeaders: any): Promise<Response> {
    if (request.method !== 'GET') {
        return new Response(
            JSON.stringify({ success: false, error: 'Method not allowed' }),
            { status: 405, headers: corsHeaders }
        );
    }

    try {
        // Simulated Cloudflare Analytics data
        // In production, you would use actual Cloudflare Analytics API
        const analyticsData = {
            requests: {
                total: Math.floor(Math.random() * 10000) + 5000,
                cached: Math.floor(Math.random() * 6000) + 3000,
                uncached: Math.floor(Math.random() * 4000) + 2000,
            },
            bandwidth: {
                total: Math.floor(Math.random() * 1000) + 500, // MB
                cached: Math.floor(Math.random() * 600) + 300,
                uncached: Math.floor(Math.random() * 400) + 200,
            },
            threats: {
                blocked: Math.floor(Math.random() * 100) + 50,
                challenged: Math.floor(Math.random() * 50) + 25,
                passed: Math.floor(Math.random() * 1000) + 500,
            },
            visitors: {
                unique: Math.floor(Math.random() * 2000) + 1000,
                countries: ['TR', 'US', 'DE', 'FR', 'GB'],
                topCountries: [
                    { code: 'TR', name: 'Turkey', visitors: Math.floor(Math.random() * 500) + 300 },
                    { code: 'US', name: 'United States', visitors: Math.floor(Math.random() * 400) + 200 },
                    { code: 'DE', name: 'Germany', visitors: Math.floor(Math.random() * 300) + 150 }
                ]
            },
            performance: {
                cacheHitRatio: Math.floor(Math.random() * 20) + 75, // 75-95%
                responseTime: Math.floor(Math.random() * 50) + 150, // 150-200ms
                uptime: 99.9
            },
            timeSeries: {
                requests: Array.from({ length: 24 }, (_, i) => ({
                    hour: i,
                    requests: Math.floor(Math.random() * 500) + 100
                })),
                bandwidth: Array.from({ length: 24 }, (_, i) => ({
                    hour: i,
                    bandwidth: Math.floor(Math.random() * 50) + 20
                }))
            }
        };

        return new Response(
            JSON.stringify({ 
                success: true, 
                data: analyticsData,
                timestamp: new Date().toISOString()
            }),
            { 
                status: 200, 
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
                }
            }
        );
    } catch (error: any) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: corsHeaders }
        );
    }
}

async function handleSecurity(request: Request, env: any, corsHeaders: any): Promise<Response> {
    try {
        const securityData = {
            threats: {
                total: Math.floor(Math.random() * 1000) + 500,
                blocked: Math.floor(Math.random() * 800) + 400,
                challenged: Math.floor(Math.random() * 200) + 100,
                rate: Math.floor(Math.random() * 10) + 5 // threats per hour
            },
            rateLimit: {
                requests: Math.floor(Math.random() * 50000) + 10000,
                limit: 100000,
                remaining: Math.floor(Math.random() * 50000) + 25000
            },
            waf: {
                triggered: Math.floor(Math.random() * 50) + 10,
                rules: [
                    { name: 'SQL Injection', count: Math.floor(Math.random() * 10) + 5 },
                    { name: 'XSS Protection', count: Math.floor(Math.random() * 8) + 3 },
                    { name: 'DDoS Protection', count: Math.floor(Math.random() * 15) + 8 }
                ]
            },
            ssl: {
                grade: 'A+',
                encryption: 'TLS 1.3',
                certificate: 'Valid',
                hsts: true
            }
        };

        return new Response(
            JSON.stringify({ 
                success: true, 
                data: securityData,
                timestamp: new Date().toISOString()
            }),
            { 
                status: 200, 
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error: any) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: corsHeaders }
        );
    }
}

async function handlePerformance(request: Request, env: any, corsHeaders: any): Promise<Response> {
    try {
        const performanceData = {
            speed: {
                firstByte: Math.floor(Math.random() * 100) + 50, // ms
                firstContentfulPaint: Math.floor(Math.random() * 500) + 800, // ms
                largestContentfulPaint: Math.floor(Math.random() * 1000) + 1500, // ms
                cumulativeLayoutShift: (Math.random() * 0.1).toFixed(3),
                firstInputDelay: Math.floor(Math.random() * 50) + 10 // ms
            },
            cache: {
                hitRatio: Math.floor(Math.random() * 20) + 75, // 75-95%
                bandwidth_saved: Math.floor(Math.random() * 500) + 200, // MB
                requests_saved: Math.floor(Math.random() * 5000) + 2000
            },
            optimization: {
                minification: true,
                compression: true,
                imageOptimization: true,
                cdnCoverage: '99.9%',
                edgeLocations: 275
            },
            monitoring: {
                uptime: 99.99,
                errorRate: (Math.random() * 0.1).toFixed(3) + '%',
                responseTime: Math.floor(Math.random() * 50) + 120, // ms
                availability: '99.99%'
            }
        };

        return new Response(
            JSON.stringify({ 
                success: true, 
                data: performanceData,
                timestamp: new Date().toISOString()
            }),
            { 
                status: 200, 
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error: any) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: corsHeaders }
        );
    }
} 