"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateRestaurantAction(restaurantId: string, restaurantSlug: string, formData: any) {
    const supabaseAdmin = createAdminClient();

    try {
        // Fetch current data for cleanup check BEFORE update
        let oldLogoUrl: string | null = null;
        let oldCoverUrl: string | null = null;
        if (formData.logo_url || formData.cover_image_url) {
            const { data: currentRest } = await supabaseAdmin
                .from("restaurants")
                .select("logo_url, cover_image_url")
                .eq("id", restaurantId)
                .single();
            oldLogoUrl = currentRest?.logo_url;
            oldCoverUrl = currentRest?.cover_image_url;
        }

        const { error } = await supabaseAdmin
            .from("restaurants")
            .update({
                name: formData.name,
                slug: formData.slug,
                address: formData.address,
                city: formData.city,
                phone: formData.phone,
                email: formData.email,
                number_of_tables: parseInt(formData.number_of_tables) || 10,
                logo_url: formData.logo_url,
                cover_image_url: formData.cover_image_url,
                google_map_url: formData.google_map_url,
                instagram_url: formData.instagram_url,
            })
            .eq("id", restaurantId);

        if (error) throw error;

        // Cleanup Logo
        if (formData.logo_url && oldLogoUrl && oldLogoUrl !== formData.logo_url && oldLogoUrl.includes('Restaurants-Media')) {
            try {
                const pathParts = oldLogoUrl.split('Restaurants-Media/');
                if (pathParts.length > 1) {
                    await supabaseAdmin.storage.from('Restaurants-Media').remove([pathParts[1]]);
                    console.log("Cleaned up old logo:", pathParts[1]);
                }
            } catch (e) { console.error("Logo cleanup error", e); }
        }

        // Cleanup Cover Image
        if (formData.cover_image_url && oldCoverUrl && oldCoverUrl !== formData.cover_image_url && oldCoverUrl.includes('Restaurants-Media')) {
            try {
                const pathParts = oldCoverUrl.split('Restaurants-Media/');
                if (pathParts.length > 1) {
                    await supabaseAdmin.storage.from('Restaurants-Media').remove([pathParts[1]]);
                    console.log("Cleaned up old cover:", pathParts[1]);
                }
            } catch (e) { console.error("Cover cleanup error", e); }
        }

        revalidatePath(`/dashboard/settings`);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating restaurant:", error);
        return { success: false, error: error.message };
    }
}

export async function getRestaurantBySlugAction(slug: string) {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
        .from("restaurants")
        .select("*")
        .eq("slug", slug)
        .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

export async function getActiveSubscriptionAction(restaurantId: string) {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
        .from("subscriptions")
        .select("*, plan:subscription_plans(*)")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}
