import { supabase } from "../lib/supabase";
import type { CurrentUser, MoodPin, Mood, fromDbMood, toDbMood } from "../types";
import { fromDbMood as convertFromDbMood, toDbMood as convertToDbMood } from "../types";

/**
 * Get the current authenticated user and check if they've submitted a pin today
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  // Get the current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.user) {
    return null;
  }

  const userId = session.user.id;
  const email = session.user.email || "";

  // Check if user has submitted a pin today
  const today = new Date().toISOString().split('T')[0];
  const { count, error: countError } = await supabase
    .from('mood_pins')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', `${today}T00:00:00`)
    .lt('created_at', `${today}T23:59:59`);

  const todayPinCount = !countError ? (count ?? 0) : 0;
  const hasSubmittedPin = todayPinCount > 0;

  return {
    id: userId,
    email,
    hasSubmittedPin,
    todayPinCount,
  };
}

/**
 * Calculate the user's consecutive day streak
 */
export async function calculateStreak(): Promise<number> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.user) {
    return 0;
  }

  const userId = session.user.id;

  // Fetch all pins for this user, ordered by date
  const { data: pins, error } = await supabase
    .from('mood_pins')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !pins || pins.length === 0) {
    return 0;
  }

  // Convert dates to day strings (YYYY-MM-DD)
  const daysWithPins = new Set(
    pins.map(pin => new Date(pin.created_at).toISOString().split('T')[0])
  );

  // Check consecutive days starting from today and going backwards
  let streak = 0;
  let currentDate = new Date();

  while (true) {
    const dateString = currentDate.toISOString().split('T')[0];
    
    if (daysWithPins.has(dateString)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Check if a user exists in the database
 */
export async function checkUserExists(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  return !error && data !== null;
}

/**
 * Validate email format (Penn email)
 */
function isValidPennEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sign in with email - validates format and creates anonymous session
 * No email is sent, user is signed in directly
 */
export async function loginWithEmail(email: string): Promise<void> {
  // Validate email format
  if (!isValidPennEmail(email)) {
    throw new Error('Please enter a valid email address');
  }

  // Sign in anonymously first to get a session
  const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
  
  if (anonError || !anonData.user) {
    throw new Error('Failed to create session');
  }

  // Store the email in the users table
  const { error: upsertError } = await supabase
    .from('users')
    .upsert(
      { id: anonData.user.id, email },
      { onConflict: 'id' }
    );

  if (upsertError) {
    throw new Error('Failed to save user data');
  }
}

/**
 * Sign out the current user
 */
export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Fetch all mood pins from the database
 */
export async function fetchPins(): Promise<MoodPin[]> {
  // Calculate timestamp for 24 hours ago
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('mood_pins')
    .select('*')
    .gte('created_at', twentyFourHoursAgo)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  // Convert database format to frontend format
  return data.map(pin => ({
    id: pin.id,
    lat: pin.latitude,
    lng: pin.longitude,
    mood: convertFromDbMood(pin.mood),
    message: pin.note || undefined,
    createdAt: pin.created_at,
  }));
}

/**
 * Create a new mood pin
 * Rate limited to 5 pins per user per day by RLS policy
 */
export async function createPin(input: {
  lat: number;
  lng: number;
  mood: Mood;
  message?: string;
}): Promise<MoodPin> {
  // Get current user
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.user) {
    throw new Error('You must be logged in to create a pin');
  }

  // Ensure user exists in the users table
  await ensureUserExists(session.user.id, session.user.email || '');

  // Insert the pin
  const { data, error } = await supabase
    .from('mood_pins')
    .insert({
      user_id: session.user.id,
      mood: convertToDbMood(input.mood),
      note: input.message || null,
      latitude: input.lat,
      longitude: input.lng,
    })
    .select()
    .single();

  if (error) {
    // Check if it's a rate limit error
    if (error.message.includes('5 pins per user per day')) {
      throw new Error('You have reached the daily limit of 5 pins');
    }
    throw new Error(error.message);
  }

  return {
    id: data.id,
    lat: data.latitude,
    lng: data.longitude,
    mood: convertFromDbMood(data.mood),
    message: data.note || undefined,
    createdAt: data.created_at,
  };
}

/**
 * Helper function to ensure user exists in the users table
 * Called before creating a pin
 */
async function ensureUserExists(userId: string, email: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .upsert({ id: userId, email }, { onConflict: 'id' });

  if (error && !error.message.includes('duplicate')) {
    throw new Error(error.message);
  }
}
