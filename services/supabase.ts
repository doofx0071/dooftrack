import { createClient } from '@supabase/supabase-js';

// Use environment variables for security
// Fallback to hardcoded values for development only
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zduodyvyhuzrtdzikjou.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkdW9keXZ5aHV6cnRkemlram91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyOTg3ODUsImV4cCI6MjA3OTg3NDc4NX0.kulPNkPkbGNQfZ-HYA2Z4n7opGg5MQ2M6IZ_Hi3l6zE';

// Warn if using fallback credentials in production
if (import.meta.env.PROD && !import.meta.env.VITE_SUPABASE_URL) {
  console.warn('⚠️  Using fallback Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
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
