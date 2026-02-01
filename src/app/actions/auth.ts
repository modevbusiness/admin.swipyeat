"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function loginAction(formData: FormData) {
    console.log('[AUTH ACTION] loginAction called')

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = await createClient();

    console.log('[AUTH ACTION] Attempting signInWithPassword for:', email)

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.log('[AUTH ACTION] Login error:', error.message)
        return { success: false, error: error.message };
    }

    console.log('[AUTH ACTION] Login successful! User ID:', data.user?.id)
    console.log('[AUTH ACTION] Session exists:', !!data.session)

    // Revalidate the dashboard to clear any cached state
    revalidatePath('/dashboard', 'layout');

    // Return success and let client do a hard redirect (window.location)
    // This ensures cookies are properly set before navigation
    return { success: true, redirectUrl: '/dashboard' };
}

export async function logoutAction() {
    console.log('[AUTH ACTION] logoutAction called')

    const supabase = await createClient();
    await supabase.auth.signOut();

    console.log('[AUTH ACTION] Signed out successfully')

    // Return success for client to do hard redirect
    return { success: true, redirectUrl: '/login' };
}
