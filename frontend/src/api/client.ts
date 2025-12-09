import { supabase } from "../lib/supabase";
import type { CurrentUser, MoodPin, Mood } from "../types";
import { fromDbMood, toDbMood } from "../types";

/**
 * Helper function to ensure user exists in the users table
 * Called before creating a pin or getting user info
 */
async function ensureUserExists(userId: string, email: string): Promise<void> {
  // First check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email')
    .eq('id', userId)
    .maybeSingle();

  // If user exists, no need to do anything
  if (existingUser) {
    return;
  }

  // User doesn't exist, try to insert
  const { error } = await supabase
    .from('users')
    .insert({ id: userId, email: email || 'anonymous@moodmap.app' });

  // Ignore duplicate key errors (race condition where another request inserted first)
  if (error && !error.message.includes('duplicate key')) {
    console.error('Error ensuring user exists:', error);
    throw new Error(`Failed to create user profile: ${error.message}`);
  }

  // Add a small delay to ensure the insert is committed
  await new Promise(resolve => setTimeout(resolve, 50));
}

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
  const email = session.user.email || "anonymous@moodmap.app";

  // Ensure user exists in the users table
  await ensureUserExists(userId, email);

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
 * Sign in with email using magic link - validates Penn email domain
 */
export async function loginWithEmail(email: string): Promise<void> {
  // Validate Penn email domain
  if (!email.toLowerCase().endsWith('@upenn.edu')) {
    throw new Error('Please use your Penn email (@upenn.edu)');
  }

  // Send magic link to user's Penn email
  const { error } = await supabase.auth.signInWithOtp({
    email: email.toLowerCase().trim(),
    options: {
      emailRedirectTo: `${window.location.origin}/submit`,
      shouldCreateUser: true,
    }
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  // Success - user will receive magic link email
}

/**
 * Sign out the current user
 */
export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  // Ignore "Auth session missing" errors - user is already logged out
  if (error && !error.message.includes('Auth session missing')) {
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
    mood: fromDbMood(pin.mood),
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

  const userId = session.user.id;
  
  // Create unique email for this anonymous user
  const uniqueEmail = `${userId}@anonymous.moodmap.app`;

  // Ensure user exists in the users table - retry logic
  let userExists = false;
  let retries = 3;
  
  while (!userExists && retries > 0) {
    // Try to insert user
    const { error: insertError } = await supabase
      .from('users')
      .insert({ id: userId, email: uniqueEmail });

    if (!insertError || insertError.message.includes('duplicate key')) {
      // Success or already exists
      userExists = true;
    } else {
      console.error('Error inserting user:', insertError);
      retries--;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Verify user exists before inserting pin
  const { data: userCheck } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  if (!userCheck) {
    throw new Error('Failed to create user profile. Please try logging in again.');
  }

  // Insert the pin
  const { data, error } = await supabase
    .from('mood_pins')
    .insert({
      user_id: userId,
      mood: toDbMood(input.mood),
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
    mood: fromDbMood(data.mood),
    message: data.note || undefined,
    createdAt: data.created_at,
  };
}

/**
 * Check if current user is suspended
 */
export async function checkUserSuspension(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user?.id) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('moderation_level')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    // User is suspended if moderation_level >= 3
    return data.moderation_level >= 3;
  } catch (error) {
    console.error('Error checking suspension status:', error);
    return false;
  }
}

/**
 * Report a mood pin for inappropriate content
 * Returns whether the pin was deleted and if the user was suspended
 */
export async function reportPin(pinId: number): Promise<{ pinDeleted: boolean; userSuspended: boolean }> {
  // Get current user
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }

  const reporterId = session.user.id;
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  try {
    const response = await fetch(`${backendUrl}/pins/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pin_id: pinId,
        reporter_id: reporterId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to report pin');
    }

    const result = await response.json();
    return {
      pinDeleted: result.pin_deleted || false,
      userSuspended: result.user_suspended || false,
    };
  } catch (error) {
    console.error('Error reporting pin:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to report pin');
  }
}
