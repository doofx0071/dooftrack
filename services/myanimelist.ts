// MyAnimeList API Service
// Documentation: https://myanimelist.net/apiconfig/references/api/v2

const MAL_BASE_URL = 'https://api.myanimelist.net/v2';
const MAL_CLIENT_ID = import.meta.env.VITE_MAL_CLIENT_ID || '';

// Rate limiting: MAL doesn't specify exact limits, but we'll be conservative
const MIN_REQUEST_INTERVAL = 300; // 300ms between requests (~3 req/sec)
let lastRequestTime = 0;

// Rate-limited fetch wrapper
const rateLimitedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  
  const headers = {
    'X-MAL-CLIENT-ID': MAL_CLIENT_ID,
    ...options.headers,
  };
  
  return fetch(url, { ...options, headers });
};

export interface MALManga {
  id: number;
  title: string;
  main_picture?: {
    medium: string;
    large: string;
  };
  alternative_titles?: {
    synonyms?: string[];
    en?: string;
    ja?: string;
  };
  synopsis?: string;
  mean?: number;
  rank?: number;
  popularity?: number;
  num_list_users?: number;
  num_scoring_users?: number;
  status?: 'finished' | 'currently_publishing' | 'not_yet_published';
  genres?: Array<{ id: number; name: string }>;
  media_type?: 'manga' | 'novel' | 'one_shot' | 'doujinshi' | 'manhwa' | 'manhua' | 'oel';
  num_volumes?: number;
  num_chapters?: number;
  authors?: Array<{
    node: {
      id: number;
      first_name: string;
      last_name: string;
    };
    role: string;
  }>;
}

// Search for manga by title
export const searchMALManga = async (query: string, limit: number = 10): Promise<MALManga[]> => {
  if (!query || !MAL_CLIENT_ID) return [];
  
  try {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('limit', String(limit));
    params.append('fields', 'id,title,main_picture,media_type,num_chapters,num_volumes,synopsis,mean');
    
    const response = await rateLimitedFetch(`${MAL_BASE_URL}/manga?${params.toString()}`);
    
    if (!response.ok) {
      console.error('MAL API Error:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    return data.data.map((item: any) => item.node);
  } catch (error) {
    console.error('Error searching MAL manga:', error);
    return [];
  }
};

// Get manga details by MAL ID
export const getMALMangaById = async (malId: number): Promise<MALManga | null> => {
  if (!MAL_CLIENT_ID) {
    console.warn('MAL Client ID not configured');
    return null;
  }
  
  try {
    const fields = [
      'id',
      'title',
      'main_picture',
      'alternative_titles',
      'synopsis',
      'mean',
      'rank',
      'popularity',
      'num_list_users',
      'num_scoring_users',
      'status',
      'genres',
      'media_type',
      'num_volumes',
      'num_chapters',
      'authors'
    ].join(',');
    
    const response = await rateLimitedFetch(`${MAL_BASE_URL}/manga/${malId}?fields=${fields}`);
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch MAL manga: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching MAL manga by ID:', error);
    return null;
  }
};

// Get total chapter count from MAL by searching for the manga
export const getChapterCountFromMAL = async (title: string): Promise<number | null> => {
  try {
    const results = await searchMALManga(title, 5);
    
    if (results.length === 0) return null;
    
    // Try to find the best match (exact or closest match)
    // Prioritize manhwa media type if searching for manhwa
    const bestMatch = results.find(manga => 
      manga.title.toLowerCase() === title.toLowerCase() ||
      manga.alternative_titles?.en?.toLowerCase() === title.toLowerCase()
    ) || results[0]; // Fallback to first result
    
    return bestMatch.num_chapters || null;
  } catch (error) {
    console.error('Error getting chapter count from MAL:', error);
    return null;
  }
};

// Get manhwa rankings from MAL
export const getTopManhwa = async (limit: number = 20): Promise<MALManga[]> => {
  if (!MAL_CLIENT_ID) return [];
  
  try {
    const params = new URLSearchParams();
    params.append('ranking_type', 'manhwa');
    params.append('limit', String(limit));
    params.append('fields', 'id,title,main_picture,num_chapters,num_volumes,synopsis,mean,rank');
    
    const response = await rateLimitedFetch(`${MAL_BASE_URL}/manga/ranking?${params.toString()}`);
    
    if (!response.ok) {
      console.error('MAL API Error:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    return data.data.map((item: any) => ({
      ...item.node,
      ranking: item.ranking
    }));
  } catch (error) {
    console.error('Error fetching top manhwa from MAL:', error);
    return [];
  }
};

// Search for manga and get detailed info including chapter count
export const searchMALMangaDetailed = async (query: string): Promise<MALManga | null> => {
  try {
    const results = await searchMALManga(query, 1);
    
    if (results.length === 0) return null;
    
    // Get full details for the top result
    const topResult = results[0];
    return await getMALMangaById(topResult.id);
  } catch (error) {
    console.error('Error searching MAL manga detailed:', error);
    return null;
  }
};

// Helper: Check if MAL API is configured
export const isMALConfigured = (): boolean => {
  return !!MAL_CLIENT_ID;
};
