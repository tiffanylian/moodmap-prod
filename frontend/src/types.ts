import type { Database } from './types/database';

// Map database mood labels to frontend format
export type Mood = "HYPED" | "VIBING" | "MID" | "STRESSED" | "TIRED";
export type DbMood = Database['public']['Enums']['mood_label'];

// Helper functions to convert between frontend and database formats
export function toDbMood(mood: Mood): DbMood {
  const moodMap: Record<Mood, DbMood> = {
    HYPED: 'Hyped',
    VIBING: 'Vibing',
    MID: 'Mid',
    STRESSED: 'Stressed',
    TIRED: 'Tired',
  };
  return moodMap[mood];
}

export function fromDbMood(dbMood: DbMood): Mood {
  const moodMap: Record<DbMood, Mood> = {
    Hyped: 'HYPED',
    Vibing: 'VIBING',
    Mid: 'MID',
    Stressed: 'STRESSED',
    Tired: 'TIRED',
  };
  return moodMap[dbMood];
}

export interface MoodPin {
  id: number;
  lat: number;
  lng: number;
  mood: Mood;
  message?: string;
  createdAt: string;
}

export interface CurrentUser {
  id: string; // UUID from Supabase auth
  email: string;
  hasSubmittedPin: boolean;
}
