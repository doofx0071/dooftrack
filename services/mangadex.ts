import { MangaDexResult, Manhwa } from '../types';

const BASE_URL = 'https://api.mangadex.org';
const COVER_URL = 'https://uploads.mangadex.org/covers';

// Rate limiting helper
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 200; // 5 requests per second = 200ms between requests

const rateLimitedFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  return fetch(url, options);
};

// Extract title from localized string object
const extractTitle = (titleObj: Record<string, string>): string => {
  return titleObj.en || titleObj['ja-ro'] || Object.values(titleObj)[0] || 'Unknown Title';
};

// Extract description from localized string object
const extractDescription = (descObj: Record<string, string> | undefined): string => {
  if (!descObj) return 'No description available.';
  return descObj.en || Object.values(descObj)[0] || 'No description available.';
};

// Build cover URL with proper size
const buildCoverUrl = (mangaId: string, fileName: string, size: '256' | '512' | 'original' = '256'): string => {
  if (size === 'original') {
    return `${COVER_URL}/${mangaId}/${fileName}`;
  }
  return `${COVER_URL}/${mangaId}/${fileName}.${size}.jpg`;
};

export interface SearchOptions {
  limit?: number;
  offset?: number;
  contentRating?: ('safe' | 'suggestive' | 'erotica' | 'pornographic')[];
  publicationDemographic?: ('shounen' | 'shoujo' | 'josei' | 'seinen' | 'none')[];
  status?: ('ongoing' | 'completed' | 'hiatus' | 'cancelled')[];
  includedTags?: string[];
  excludedTags?: string[];
  order?: Record<string, 'asc' | 'desc'>;
}

export const searchMangaDex = async (query: string, options: SearchOptions = {}): Promise<Manhwa[]> => {
  if (!query && !options.includedTags?.length) return [];

  try {
    const params = new URLSearchParams();
    
    if (query) {
      params.append('title', query);
    }
    
    // Pagination
    params.append('limit', String(options.limit || 20));
    if (options.offset) {
      params.append('offset', String(options.offset));
    }
    
    // Include relationships
    params.append('includes[]', 'cover_art');
    params.append('includes[]', 'author');
    params.append('includes[]', 'artist');
    
    // Content rating filter (default: safe, suggestive, erotica - no pornographic)
    const contentRating = options.contentRating || ['safe', 'suggestive', 'erotica'];
    contentRating.forEach(rating => params.append('contentRating[]', rating));
    
    // Publication demographic
    if (options.publicationDemographic) {
      options.publicationDemographic.forEach(demo => params.append('publicationDemographic[]', demo));
    }
    
    // Status filter
    if (options.status) {
      options.status.forEach(status => params.append('status[]', status));
    }
    
    // Tag filters
    if (options.includedTags) {
      options.includedTags.forEach(tag => params.append('includedTags[]', tag));
    }
    if (options.excludedTags) {
      options.excludedTags.forEach(tag => params.append('excludedTags[]', tag));
    }
    
    // Ordering
    const order = options.order || { relevance: 'desc' };
    Object.entries(order).forEach(([key, value]) => {
      params.append(`order[${key}]`, value);
    });

    const response = await rateLimitedFetch(`${BASE_URL}/manga?${params.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('MangaDex API Error:', {
        status: response.status,
        statusText: response.statusText,
        requestId: response.headers.get('X-Request-ID'),
        error: errorData
      });
      throw new Error(`Failed to fetch from MangaDex: ${response.status}`);
    }

    const data = await response.json();
    
    return data.data.map((item: MangaDexResult) => {
      const coverRel = item.relationships.find((r) => r.type === 'cover_art');
      const fileName = coverRel?.attributes?.fileName;
      const title = extractTitle(item.attributes.title);
      const description = extractDescription(item.attributes.description);
      
      return {
        id: item.id,
        title: title,
        description: description,
        source_id: item.id,
        created_at: item.attributes.createdAt,
        cover_url: fileName 
          ? buildCoverUrl(item.id, fileName, '256')
          : 'https://via.placeholder.com/300x450?text=No+Cover', // Better fallback
      };
    });

  } catch (error) {
    console.error('MangaDex API Error:', error);
    return [];
  }
};

// Get manga by ID with full details
export const getMangaById = async (mangaId: string): Promise<Manhwa | null> => {
  try {
    const params = new URLSearchParams();
    params.append('includes[]', 'cover_art');
    params.append('includes[]', 'author');
    params.append('includes[]', 'artist');
    
    const response = await rateLimitedFetch(`${BASE_URL}/manga/${mangaId}?${params.toString()}`);
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch manga: ${response.status}`);
    }

    const data = await response.json();
    const item = data.data;
    
    const coverRel = item.relationships.find((r: any) => r.type === 'cover_art');
    const fileName = coverRel?.attributes?.fileName;
    
    return {
      id: item.id,
      title: extractTitle(item.attributes.title),
      description: extractDescription(item.attributes.description),
      source_id: item.id,
      created_at: item.attributes.createdAt,
      cover_url: fileName 
        ? buildCoverUrl(item.id, fileName, '512') // Higher quality for details page
        : 'https://via.placeholder.com/300x450?text=No+Cover',
      lastChapter: item.attributes.lastChapter ? parseFloat(item.attributes.lastChapter) : undefined,
    };
  } catch (error) {
    console.error('Error fetching manga by ID:', error);
    return null;
  }
};

// Get manga feed (chapters)
export const getMangaFeed = async (
  mangaId: string, 
  options: {
    limit?: number;
    offset?: number;
    translatedLanguage?: string[];
    order?: Record<string, 'asc' | 'desc'>;
  } = {}
) => {
  try {
    const params = new URLSearchParams();
    params.append('limit', String(options.limit || 100));
    if (options.offset) {
      params.append('offset', String(options.offset));
    }
    
    // Language filter (default to English)
    const languages = options.translatedLanguage || ['en'];
    languages.forEach(lang => params.append('translatedLanguage[]', lang));
    
    // Include relationships
    params.append('includes[]', 'scanlation_group');
    params.append('includes[]', 'user');
    
    // Ordering (default by chapter ascending)
    const order = options.order || { chapter: 'asc' };
    Object.entries(order).forEach(([key, value]) => {
      params.append(`order[${key}]`, value);
    });
    
    const response = await rateLimitedFetch(
      `${BASE_URL}/manga/${mangaId}/feed?${params.toString()}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch manga feed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching manga feed:', error);
    return [];
  }
};

// Get the last chapter number for a manga
export const getLastChapterNumber = async (mangaId: string): Promise<number | null> => {
  try {
    // Use aggregate endpoint to get chapter statistics
    const response = await rateLimitedFetch(
      `${BASE_URL}/manga/${mangaId}/aggregate?translatedLanguage[]=en`
    );
    
    if (!response.ok) {
      console.error('Failed to fetch manga aggregate:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    // The aggregate returns volumes with chapters
    // Find the highest chapter number across all volumes
    let maxChapter = 0;
    
    if (data.volumes) {
      Object.values(data.volumes).forEach((volume: any) => {
        if (volume.chapters) {
          Object.keys(volume.chapters).forEach((chapterNum: string) => {
            const num = parseFloat(chapterNum);
            if (!isNaN(num) && num > maxChapter) {
              maxChapter = num;
            }
          });
        }
      });
    }
    
    return maxChapter > 0 ? Math.floor(maxChapter) : null;
  } catch (error) {
    console.error('Error fetching last chapter number:', error);
    return null;
  }
};

// Get all available tags
export const getTags = async () => {
  try {
    const response = await rateLimitedFetch(`${BASE_URL}/manga/tag`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tags: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data.map((tag: any) => ({
      id: tag.id,
      name: tag.attributes.name.en || Object.values(tag.attributes.name)[0],
      group: tag.attributes.group,
      description: tag.attributes.description?.en || ''
    }));
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
};

// Get random manga
export const getRandomManga = async (): Promise<Manhwa | null> => {
  try {
    const params = new URLSearchParams();
    params.append('includes[]', 'cover_art');
    params.append('includes[]', 'author');
    params.append('contentRating[]', 'safe');
    params.append('contentRating[]', 'suggestive');
    
    const response = await rateLimitedFetch(`${BASE_URL}/manga/random?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch random manga: ${response.status}`);
    }
    
    const data = await response.json();
    const item = data.data;
    
    const coverRel = item.relationships.find((r: any) => r.type === 'cover_art');
    const fileName = coverRel?.attributes?.fileName;
    
    return {
      id: item.id,
      title: extractTitle(item.attributes.title),
      description: extractDescription(item.attributes.description),
      source_id: item.id,
      created_at: item.attributes.createdAt,
      cover_url: fileName 
        ? buildCoverUrl(item.id, fileName, '256')
        : 'https://via.placeholder.com/300x450?text=No+Cover',
    };
  } catch (error) {
    console.error('Error fetching random manga:', error);
    return null;
  }
};

// Get related manga (sequels, prequels, spin-offs, same author)
export const getRelatedManga = async (mangaId: string, limit: number = 10): Promise<Manhwa[]> => {
  try {
    const params = new URLSearchParams();
    params.append('includes[]', 'cover_art');
    params.append('includes[]', 'author');
    params.append('includes[]', 'artist');
    
    // Fetch the manga with relationships to find related works
    const response = await rateLimitedFetch(`${BASE_URL}/manga/${mangaId}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch manga details: ${response.status}`);
    }
    
    const data = await response.json();
    const manga = data.data;
    
    // Try to get tags for similarity matching
    const mangaTags = manga.attributes?.tags?.map((t: any) => t.id) || [];
    
    // Extract related manga from relationships
    const relatedMangaIds = manga.relationships
      .filter((rel: any) => rel.type === 'manga' && rel.related)
      .map((rel: any) => rel.id)
      .slice(0, limit);
    
    if (relatedMangaIds.length > 0) {
      // Fetch details for each related manga
      const relatedManga = await Promise.all(
        relatedMangaIds.map((id: string) => getMangaById(id))
      );
      
      // Filter out null results
      const results = relatedManga.filter((m): m is Manhwa => m !== null);
      if (results.length > 0) {
        return results;
      }
    }
    
    // Fallback 1: Search by same author
    const authorRel = manga.relationships.find((r: any) => r.type === 'author');
    
    if (authorRel) {
      const authorResults = await searchBySameAuthor(authorRel.id, mangaId, limit);
      if (authorResults.length > 0) {
        return authorResults;
      }
    }
    
    // Fallback 2: Search by tags (similar genres)
    if (mangaTags.length > 0) {
      const tagResults = await searchMangaDex('', {
        includedTags: mangaTags.slice(0, 3), // Use top 3 tags
        limit: limit,
        order: { followedCount: 'desc' }
      });
      // Filter out the current manga
      return tagResults.filter(m => m.source_id !== mangaId);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching related manga:', error);
    return [];
  }
};

// Get recently updated manga
export const getRecentlyUpdated = async (limit: number = 10): Promise<Manhwa[]> => {
  try {
    const params = new URLSearchParams();
    params.append('limit', String(limit));
    params.append('includes[]', 'cover_art');
    params.append('contentRating[]', 'safe');
    params.append('contentRating[]', 'suggestive');
    params.append('order[latestUploadedChapter]', 'desc');
    params.append('hasAvailableChapters', 'true');
    
    const response = await rateLimitedFetch(`${BASE_URL}/manga?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch recently updated: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.data.map((item: MangaDexResult) => {
      const coverRel = item.relationships.find((r) => r.type === 'cover_art');
      const fileName = coverRel?.attributes?.fileName;
      
      return {
        id: item.id,
        title: extractTitle(item.attributes.title),
        description: extractDescription(item.attributes.description),
        source_id: item.id,
        created_at: item.attributes.createdAt,
        cover_url: fileName 
          ? buildCoverUrl(item.id, fileName, '256')
          : 'https://via.placeholder.com/300x450?text=No+Cover',
      };
    });
  } catch (error) {
    console.error('Error fetching recently updated:', error);
    return [];
  }
};

// Get popular manga (sorted by follows)
export const getPopularManga = async (limit: number = 10): Promise<Manhwa[]> => {
  try {
    const params = new URLSearchParams();
    params.append('limit', String(limit));
    params.append('includes[]', 'cover_art');
    params.append('contentRating[]', 'safe');
    params.append('contentRating[]', 'suggestive');
    params.append('order[followedCount]', 'desc');
    params.append('hasAvailableChapters', 'true');
    
    const response = await rateLimitedFetch(`${BASE_URL}/manga?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch popular manga: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.data.map((item: MangaDexResult) => {
      const coverRel = item.relationships.find((r) => r.type === 'cover_art');
      const fileName = coverRel?.attributes?.fileName;
      
      return {
        id: item.id,
        title: extractTitle(item.attributes.title),
        description: extractDescription(item.attributes.description),
        source_id: item.id,
        created_at: item.attributes.createdAt,
        cover_url: fileName 
          ? buildCoverUrl(item.id, fileName, '256')
          : 'https://via.placeholder.com/300x450?text=No+Cover',
      };
    });
  } catch (error) {
    console.error('Error fetching popular manga:', error);
    return [];
  }
};

// Get completed manga
export const getCompletedManga = async (limit: number = 10): Promise<Manhwa[]> => {
  try {
    const params = new URLSearchParams();
    params.append('limit', String(limit));
    params.append('includes[]', 'cover_art');
    params.append('contentRating[]', 'safe');
    params.append('contentRating[]', 'suggestive');
    params.append('status[]', 'completed');
    params.append('order[followedCount]', 'desc');
    params.append('hasAvailableChapters', 'true');
    
    const response = await rateLimitedFetch(`${BASE_URL}/manga?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch completed manga: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.data.map((item: MangaDexResult) => {
      const coverRel = item.relationships.find((r) => r.type === 'cover_art');
      const fileName = coverRel?.attributes?.fileName;
      
      return {
        id: item.id,
        title: extractTitle(item.attributes.title),
        description: extractDescription(item.attributes.description),
        source_id: item.id,
        created_at: item.attributes.createdAt,
        cover_url: fileName 
          ? buildCoverUrl(item.id, fileName, '256')
          : 'https://via.placeholder.com/300x450?text=No+Cover',
      };
    });
  } catch (error) {
    console.error('Error fetching completed manga:', error);
    return [];
  }
};

// Get newly added manga
export const getNewlyAdded = async (limit: number = 10): Promise<Manhwa[]> => {
  try {
    const params = new URLSearchParams();
    params.append('limit', String(limit));
    params.append('includes[]', 'cover_art');
    params.append('contentRating[]', 'safe');
    params.append('contentRating[]', 'suggestive');
    params.append('order[createdAt]', 'desc');
    params.append('hasAvailableChapters', 'true');
    
    const response = await rateLimitedFetch(`${BASE_URL}/manga?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch newly added: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.data.map((item: MangaDexResult) => {
      const coverRel = item.relationships.find((r) => r.type === 'cover_art');
      const fileName = coverRel?.attributes?.fileName;
      
      return {
        id: item.id,
        title: extractTitle(item.attributes.title),
        description: extractDescription(item.attributes.description),
        source_id: item.id,
        created_at: item.attributes.createdAt,
        cover_url: fileName 
          ? buildCoverUrl(item.id, fileName, '256')
          : 'https://via.placeholder.com/300x450?text=No+Cover',
      };
    });
  } catch (error) {
    console.error('Error fetching newly added:', error);
    return [];
  }
};

// Helper: Search by same author
const searchBySameAuthor = async (
  authorId: string, 
  excludeMangaId: string, 
  limit: number
): Promise<Manhwa[]> => {
  try {
    const params = new URLSearchParams();
    params.append('authors[]', authorId);
    params.append('limit', String(limit + 1)); // +1 to account for excluding the current manga
    params.append('includes[]', 'cover_art');
    params.append('contentRating[]', 'safe');
    params.append('contentRating[]', 'suggestive');
    params.append('contentRating[]', 'erotica');
    params.append('order[followedCount]', 'desc'); // Sort by popularity
    
    const response = await rateLimitedFetch(`${BASE_URL}/manga?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch author's manga: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.data
      .filter((item: MangaDexResult) => item.id !== excludeMangaId) // Exclude current manga
      .slice(0, limit)
      .map((item: MangaDexResult) => {
        const coverRel = item.relationships.find((r) => r.type === 'cover_art');
        const fileName = coverRel?.attributes?.fileName;
        
        return {
          id: item.id,
          title: extractTitle(item.attributes.title),
          description: extractDescription(item.attributes.description),
          source_id: item.id,
          created_at: item.attributes.createdAt,
          cover_url: fileName 
            ? buildCoverUrl(item.id, fileName, '256')
            : 'https://via.placeholder.com/300x450?text=No+Cover',
        };
      });
  } catch (error) {
    console.error('Error searching by same author:', error);
    return [];
  }
};
