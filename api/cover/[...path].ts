export const config = { runtime: 'edge' };

const ALLOWED_METHODS = ['GET', 'OPTIONS'];

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/cover\//, '');
  // Allow optional size query (?s=256|512|original)
  const size = url.searchParams.get('s') || '';
  // Path expected: {mangaId}/{fileName}
  const targetBase = 'https://uploads.mangadex.org/covers/';
  const target = `${targetBase}${path}${size && size !== 'original' ? `.${size}.jpg` : ''}`;

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
      headers: { Referer: 'https://mangadex.org/' }
    });

    const headers = new Headers(upstream.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', headers.get('Cache-Control') || 's-maxage=86400, stale-while-revalidate=31536000');

    const body = await upstream.arrayBuffer();
    return new Response(body, { status: upstream.status, headers });
  } catch (e: any) {
    return new Response('Not Found', { status: 404, headers: corsHeaders() });
  }
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*'
  };
}