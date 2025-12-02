const ALLOWED_METHODS = ['GET', 'OPTIONS'];

// Image optimization proxy for MangaDex cover images
// Proxies images from https://uploads.mangadex.org/covers with optimizations:
// - Proper caching headers for CDN and browser
// - Size hints via query params (w=width, q=quality)
// - Format negotiation (WebP support via Accept header)
// - Compression hints for better bandwidth usage
//
// Frontend usage:
//   /api/cover/<mangaId>/<fileName>           - Original size
//   /api/cover/<mangaId>/<fileName>?w=512     - Hint for 512px width
//   /api/cover/<mangaId>/<fileName>?w=256&q=80 - Hint for 256px, quality 80
//
// Note: MangaDex serves original images. Size/quality params are hints for 
// client-side optimization and future server-side processing.
export default {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    const searchParams = new URLSearchParams(url.search);
    const rawPath = searchParams.get('path') || '';
    const width = searchParams.get('w') || searchParams.get('width');
    const quality = searchParams.get('q') || searchParams.get('quality');
    
    searchParams.delete('path');
    searchParams.delete('w');
    searchParams.delete('width');
    searchParams.delete('q');
    searchParams.delete('quality');

    const normalizedPath = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;
    const targetBase = 'https://uploads.mangadex.org/covers/';
    const target = `${targetBase}${normalizedPath}`;

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (!ALLOWED_METHODS.includes(req.method || '')) {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders() });
    }

    try {
      // Check if client supports WebP
      const acceptHeader = req.headers.get('Accept') || '';
      const supportsWebP = acceptHeader.includes('image/webp');

      const upstream = await fetch(target, {
        method: 'GET',
        headers: { 
          Referer: 'https://mangadex.org/',
          // Request WebP if client supports it
          ...(supportsWebP && { 'Accept': 'image/webp,image/*,*/*;q=0.8' }),
        },
      });

      if (!upstream.ok) {
        return new Response('Not Found', { 
          status: upstream.status, 
          headers: corsHeaders() 
        });
      }

      const headers = new Headers(upstream.headers);
      
      // CORS headers
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      headers.set('Access-Control-Allow-Headers', '*');
      
      // Aggressive caching for images (covers don't change)
      headers.set('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
      
      // Add optimization hints for CDN/browser
      if (width) {
        headers.set('X-Image-Width-Hint', width);
      }
      if (quality) {
        headers.set('X-Image-Quality-Hint', quality);
      }
      
      // Inform client about image optimization support
      headers.set('Accept-CH', 'DPR, Viewport-Width, Width');
      headers.set('Vary', 'Accept');
      
      // Remove problematic headers
      headers.delete('content-encoding');
      headers.delete('Content-Encoding');
      headers.delete('content-length');
      headers.delete('Content-Length');

      const body = await upstream.arrayBuffer();
      return new Response(body, { status: upstream.status, headers });
    } catch (e: any) {
      console.error('Cover proxy error:', e);
      return new Response('Service Unavailable', { 
        status: 503, 
        headers: corsHeaders() 
      });
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
