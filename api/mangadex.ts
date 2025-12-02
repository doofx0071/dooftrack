const ALLOWED_METHODS = ['GET', 'OPTIONS'];

// Vercel Node.js runtime using the Fetch Web Standard export
// This function proxies requests to https://api.mangadex.org
// Frontend calls /api/mangadex/<path>?<query>
// vercel.json rewrites that to /api/mangadex?path=<path>&<query>
export default {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // Extract the target MangaDex path from the ?path= query param added by the rewrite
    const searchParams = new URLSearchParams(url.search);
    const rawPath = searchParams.get('path') || '';
    searchParams.delete('path');

    const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    const searchString = searchParams.toString();
    const target = `https://api.mangadex.org${normalizedPath}${searchString ? `?${searchString}` : ''}`;

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
        method: 'GET',
        headers: {
          'User-Agent': 'doofTrack/1.0 (+https://doof-track.vercel.app)',
        },
      });

      const headers = new Headers(upstream.headers);
      // Ensure CORS and caching
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      headers.set('Access-Control-Allow-Headers', '*');
      headers.set('Cache-Control', headers.get('Cache-Control') || 's-maxage=600, stale-while-revalidate=86400');
      // Avoid double-decompression issues in browsers (ERR_CONTENT_DECODING_FAILED)
      headers.delete('content-encoding');
      headers.delete('Content-Encoding');
      headers.delete('content-length');
      headers.delete('Content-Length');

      const body = await upstream.arrayBuffer();
      return new Response(body, { status: upstream.status, headers });
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: 'proxy_error', message: e?.message || 'fetch failed' }),
        {
          status: 502,
          headers: { 'content-type': 'application/json', ...corsHeaders() },
        },
      );
    }
  },
};

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
}
