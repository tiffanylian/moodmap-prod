export type Mood = "HYPED" | "VIBING" | "MID" | "STRESSED" | "TIRED";

export interface MoodPin {
  id: number;
  lat: number;
  lng: number;
  mood: Mood;
  message?: string;
  createdAt: string;
}

export interface CurrentUser {
  id: number;
  email: string;
  hasSubmittedPin: boolean;
}
