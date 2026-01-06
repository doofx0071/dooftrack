import { createClient } from '@supabase/supabase-js';

// Use environment variables for security
// Ensure environment variables are set in your local .env file or deployment platform
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface Database {
  public: {
    Tables: {
      manhwa: {
        Row: {
          id: string;
          user_id: string | null;
          source_id: string;
          title: string;
          cover_url: string | null;
          description: string | null;
          mal_id: number | null;
          last_chapter: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          source_id: string;
          title: string;
          cover_url?: string | null;
          description?: string | null;
          mal_id?: number | null;
          last_chapter?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          source_id?: string;
          title?: string;
          cover_url?: string | null;
          description?: string | null;
          mal_id?: number | null;
          last_chapter?: number | null;
          created_at?: string;
        };
      };
      reading_progress: {
        Row: {
          id: string;
          manhwa_id: string;
          status: string;
          last_chapter: number;
          rating: number;
          notes: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          manhwa_id: string;
          status: string;
          last_chapter?: number;
          rating?: number;
          notes?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          manhwa_id?: string;
          status?: string;
          last_chapter?: number;
          rating?: number;
          notes?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}
