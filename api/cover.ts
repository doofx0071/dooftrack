const ALLOWED_METHODS = ['GET', 'OPTIONS'];

// Vercel Node.js runtime using the Fetch Web Standard export
// This function proxies cover images from https://uploads.mangadex.org/covers
// Frontend calls /api/cover/<mangaId>/<fileName>?s=256|512|original
// vercel.json rewrites that to /api/cover?path=<mangaId>/<fileName>&s=...
export default {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    const searchParams = new URLSearchParams(url.search);
    const rawPath = searchParams.get('path') || '';
    searchParams.delete('path');

    const normalizedPath = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath; // no leading slash for covers base
    const targetBase = 'https://uploads.mangadex.org/covers/';
    // Always fetch the original cover path; browser will handle sizing.
    const target = `${targetBase}${normalizedPath}`;

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (!ALLOWED_METHODS.includes(req.method || '')) {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders() });
    }

    try {
      const upstream = await fetch(target, {
        method: 'GET',
        // Set a referer accepted by MD to avoid anti-hotlink image
        headers: { Referer: 'https://mangadex.org/' },
      });

      const headers = new Headers(upstream.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      headers.set('Access-Control-Allow-Headers', '*');
      headers.set(
        'Cache-Control',
        headers.get('Cache-Control') || 's-maxage=86400, stale-while-revalidate=31536000',
      );
      // Avoid content-decoding issues in browsers
      headers.delete('content-encoding');
      headers.delete('Content-Encoding');
      headers.delete('content-length');
      headers.delete('Content-Length');

      const body = await upstream.arrayBuffer();
      return new Response(body, { status: upstream.status, headers });
    } catch (e: any) {
      return new Response('Not Found', { status: 404, headers: corsHeaders() });
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
