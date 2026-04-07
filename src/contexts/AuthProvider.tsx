"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser as useClerkUser, useAuth as useClerkAuth } from "@clerk/nextjs";
import type { User } from "@supabase/supabase-js";

// Types
interface UserProfile {
    id: string;
    restaurant_id: string | null;
    name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    role: "super_admin" | "restaurant_admin" | "manager" | "waiter" | "kitchen_staff";
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
}

interface Restaurant {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    cover_image_url: string | null;
    phone: string | null;
    email: string | null;
    address: string;
    city: string | null;
    number_of_tables: number;
    is_active: boolean;
    pin: string | null;
    is_locked: boolean;
    google_map_url: string | null;
    instagram_url: string | null;
    created_at: string;
    updated_at: string;
    subscription?: {
        plan_type: "free_trial" | "pro";
        status: "active" | "canceled" | "expired" | "suspended";
        is_current: boolean;
        max_tables?: number;
        max_menu_items?: number;
        ends_at?: string | null;
    } | null;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    restaurant: Restaurant | null;
    loading: boolean;
    error: string | null;
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    restaurant: null,
    loading: true,
    error: null,
    refreshAuth: async () => { },
});

// Hooks
export function useUser() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useUser must be used within an AuthProvider");
    }
    return { user: context.user, loading: context.loading };
}

export function useProfile() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useProfile must be used within an AuthProvider");
    }
    return { profile: context.profile, loading: context.loading };
}

export function useRestaurant() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useRestaurant must be used within an AuthProvider");
    }
    return { restaurant: context.restaurant, loading: context.loading };
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

// Helper: Promise with timeout
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(errorMessage)), ms);
    });
    return Promise.race([promise, timeout]);
}

// Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { user: clerkUser, isLoaded: clerkLoaded } = useClerkUser();
    
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // initialized is no longer required with clerk


    // Create supabase client once with useMemo
    const supabase = useMemo(() => createClient(), []);

    // Fetch user profile from DB with timeout
    const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
        console.log('[AUTH PROVIDER] fetchProfile START for userId:', userId);
        try {
            const queryPromise = Promise.resolve(
                supabase
                    .from("users")
                    .select("*")
                    .eq("id", userId)
                    .single()
            );

            const { data, error } = await withTimeout(queryPromise, 10000, 'Profile fetch timeout');

            if (error) {
                // PGRST116: The result contains 0 rows
                if (error.code === 'PGRST116') {
                    console.log("[AUTH PROVIDER] Profile not found (new user?)");
                    return null;
                }
                console.error("[AUTH PROVIDER] Error fetching profile:", JSON.stringify(error, null, 2));
                return null;
            }

            console.log('[AUTH PROVIDER] fetchProfile SUCCESS:', data?.name);
            return data as UserProfile;
        } catch (err) {
            console.error("[AUTH PROVIDER] fetchProfile FAILED with exception:", err);
            return null;
        }
    }, [supabase]);

    // Fetch restaurant from DB with timeout
    const fetchRestaurant = useCallback(async (restaurantId: string): Promise<Restaurant | null> => {
        console.log('[AUTH PROVIDER] fetchRestaurant START for id:', restaurantId);
        try {
            const queryPromise = Promise.resolve(
                supabase
                    .from("restaurants")
                    .select(`
                        *,
                        subscriptions(
                            is_current,
                            status,
                            ends_at,
                        subscription_plans(plan_type, max_tables, max_menu_items)
                        )
                    `)
                    .eq("id", restaurantId)
                    .single()
            );

            const { data, error } = await withTimeout(queryPromise, 5000, 'Restaurant fetch timeout');

            if (error) {
                console.error("[AUTH PROVIDER] Error fetching restaurant:", error);
                return null;
            }

            // Process subscription data
            let subscription = null;
            if (data.subscriptions && Array.isArray(data.subscriptions)) {
                const subs = data.subscriptions as any[];
                const currentSub = subs.find((s: any) => s.is_current === true) || subs[0];

                if (currentSub) {
                    const planInfo = Array.isArray(currentSub.subscription_plans)
                        ? currentSub.subscription_plans[0]
                        : currentSub.subscription_plans;

                    subscription = {
                        plan_type: planInfo?.plan_type || "free_trial",
                        status: currentSub.status,
                        is_current: currentSub.is_current,
                        max_tables: planInfo?.max_tables,
                        max_menu_items: planInfo?.max_menu_items,
                        ends_at: currentSub.ends_at,
                    };
                }
            }

            const { subscriptions, ...restaurantData } = data;

            console.log('[AUTH PROVIDER] fetchRestaurant SUCCESS:', restaurantData.name);
            return {
                ...restaurantData,
                subscription,
            } as Restaurant;
        } catch (err) {
            console.error("[AUTH PROVIDER] fetchRestaurant FAILED:", err);
            return null;
        }
    }, [supabase]);

    // Load user data (profile + restaurant)
    const loadUserData = useCallback(async (authUser: User) => {
        console.log('[AUTH PROVIDER] loadUserData START for:', authUser.id);
        setUser(authUser);

        const userProfile = await fetchProfile(authUser.id);
        setProfile(userProfile);

        if (userProfile?.restaurant_id) {
            const restaurantData = await fetchRestaurant(userProfile.restaurant_id);
            setRestaurant(restaurantData);
        } else {
            console.log('[AUTH PROVIDER] No restaurant_id in profile');
            setRestaurant(null);
        }

        console.log('[AUTH PROVIDER] loadUserData COMPLETE');
    }, [fetchProfile, fetchRestaurant]);

    const refreshAuth = useCallback(async () => {
        console.log('[AUTH PROVIDER] refreshAuth started (no-op as Clerk handles this)');
    }, []);

    // Sync with Clerk auth state
    useEffect(() => {
        if (!clerkLoaded) return;

        console.log('[AUTH PROVIDER] Syncing Clerk state, user:', clerkUser?.id);
        const syncUser = async () => {
            try {
                if (!clerkUser) {
                    setUser(null);
                    setProfile(null);
                    setRestaurant(null);
                    return;
                }

                // Mock Supabase User object from Clerk User
                const authUser = {
                    id: clerkUser.id,
                    email: clerkUser.primaryEmailAddress?.emailAddress,
                    user_metadata: {
                        name: clerkUser.fullName,
                        avatar_url: clerkUser.imageUrl,
                    },
                    app_metadata: {},
                    aud: 'authenticated',
                    created_at: clerkUser.createdAt?.toString() || new Date().toISOString(),
                } as unknown as User;

                await loadUserData(authUser);
            } catch (err) {
                console.error("[AUTH PROVIDER] Error syncing clerk user:", err);
                setError("Failed to load authentication data");
            } finally {
                setLoading(false);
            }
        };

        syncUser();
    }, [clerkUser, clerkLoaded, loadUserData]);

    const value: AuthContextType = {
        user,
        profile,
        restaurant,
        loading,
        error,
        refreshAuth,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;
