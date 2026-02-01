"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(userId: string, data: { name: string; phone?: string; avatar_url?: string }) {
    const supabase = createAdminClient();

    try {
        // Update user metadata in auth (if name/phone is stored there)
        const { error: authError } = await supabase.auth.updateUser({
            data: {
                full_name: data.name,
                phone: data.phone,
                avatar_url: data.avatar_url
            }
        });

        if (authError) {
            console.warn("Auth metadata update failed (likely dev mode/no session):", authError.message);
        }

        // 1. Fetch current profile before update to get old avatar
        let oldAvatarUrl = null;
        if (data.avatar_url) {
            const { data: currentProfile } = await supabase
                .from("users")
                .select("avatar_url")
                .eq("id", userId)
                .single();
            oldAvatarUrl = currentProfile?.avatar_url;
        }

        // 2. Update public.users table using Admin Client (Bypasses RLS)
        const { error: dbError } = await supabase
            .from("users")
            .update({
                name: data.name,
                phone: data.phone,
                avatar_url: data.avatar_url
            })
            .eq("id", userId);

        if (dbError) {
            console.error("Error updating public user profile:", dbError);
            throw dbError;
        }

        // 3. Delete previous avatar if update was successful and new one is different
        if (data.avatar_url && oldAvatarUrl && oldAvatarUrl !== data.avatar_url && oldAvatarUrl.includes("Restaurants-Media")) {
            try {
                // Extract path: .../Restaurants-Media/users/filename.ext -> users/filename.ext
                const pathParts = oldAvatarUrl.split('Restaurants-Media/');
                if (pathParts.length > 1) {
                    const path = pathParts[1]; // Get everything after 'Restaurants-Media/'
                    const { error: deleteError } = await supabase.storage
                        .from('Restaurants-Media')
                        .remove([path]);

                    if (deleteError) {
                        console.error("Failed to delete old avatar:", deleteError);
                    } else {
                        console.log("Deleted old avatar:", path);
                    }
                }
            } catch (err) {
                console.error("Error during avatar cleanup:", err);
            }
        }

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error: any) {
        console.error("Error updating profile:", error);
        return { success: false, error: error.message };
    }
}
