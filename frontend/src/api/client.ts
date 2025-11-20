import axios from "axios";
import type { CurrentUser, MoodPin, Mood } from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  withCredentials: true,
});

// later your backend will implement these endpoints

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const res = await api.get<CurrentUser>("/api/me");
  return res.data;
}

export async function loginWithEmail(email: string): Promise<void> {
  await api.post("/api/login", { email });
}

export async function fetchPins(): Promise<MoodPin[]> {
  const res = await api.get<MoodPin[]>("/api/pins");
  return res.data;
}

export async function createPin(input: {
  lat: number;
  lng: number;
  mood: Mood;
  message?: string;
}): Promise<MoodPin> {
  const res = await api.post<MoodPin>("/api/pins", input);
  return res.data;
}
