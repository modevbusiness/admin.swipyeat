import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
);

export type UserRole = "super_admin" | "restaurant_admin" | "manager" | "waiter" | "kitchen_staff";

export interface UserProfile {
  id: string; // Changed from UUID to string to support Clerk IDs
  clerk_user_id?: string;
  restaurant_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get the current authenticated user from Clerk
 */
export async function getAuthUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  return user;
}

/**
 * Get user profile from database with restaurant info
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return data as UserProfile;
}

/**
 * Get current user with profile and role
 */
export async function getCurrentUserWithProfile() {
  const user = await getAuthUser();
  if (!user) return null;

  const profile = await getUserProfile(user.id);

  return {
    user,
    profile,
    role: (user.unsafeMetadata?.role as UserRole) || profile?.role || null,
  };
}

/**
 * Check if user has a specific role
 */
export async function hasRole(requiredRoles: UserRole[]): Promise<boolean> {
  const { role } = await getCurrentUserWithProfile() || {};
  if (!role) return false;

  return requiredRoles.includes(role);
}

/**
 * Get restaurant ID for the current user
 */
export async function getUserRestaurantId(): Promise<string | null> {
  const { profile } = await getCurrentUserWithProfile() || {};
  return profile?.restaurant_id || null;
}

/**
 * Update user's last login time
 */
export async function updateLastLogin(userId: string) {
  await supabaseAdmin
    .from("users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", userId);
}
