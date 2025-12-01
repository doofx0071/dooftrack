export const config = { runtime: 'edge' };

const ALLOWED_METHODS = ['GET', 'OPTIONS'];

export default async function handler(req: Request) {
  const url = new URL(req.url);
  // path after /api/mangadex/
  const path = url.pathname.replace(/^\/api\/mangadex\//, '');
  const target = `https://api.mangadex.org/${path}${url.search}`;

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  if (!ALLOWED_METHODS.includes(req.method || '')) {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders() });
  }

  try {
    const upstream = await fetch(target, {
      // preserve method and headers minimally
      method: 'GET',
      headers: {
        'User-Agent': 'doofTrack/1.0 (+https://doof-track.vercel.app)'
      }
    });

    const headers = new Headers(upstream.headers);
    // Ensure CORS and caching
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', '*');
    headers.set('Cache-Control', headers.get('Cache-Control') || 's-maxage=600, stale-while-revalidate=86400');

    const body = await upstream.arrayBuffer();
    return new Response(body, { status: upstream.status, headers });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'proxy_error', message: e?.message || 'fetch failed' }), {
      status: 502,
      headers: { 'content-type': 'application/json', ...corsHeaders() }
    });
  }
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*'
  };
}