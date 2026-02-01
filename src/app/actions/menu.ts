"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { MenuItem, Category } from "@/types/menu";
import { revalidatePath } from "next/cache";

/**
 * Fetch all categories for a restaurant with item counts
 */
export async function getCategoriesAction(restaurantId: string) {
    const supabase = createAdminClient();

    // Fetch categories
    const { data: categories, error: catError } = await supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: true });

    if (catError) {
        console.error("Error fetching categories:", catError);
        return { success: false, error: catError.message };
    }

    // Fetch item counts per category
    const { data: counts, error: countError } = await supabase
        .from("menu_items")
        .select("category_id")
        .eq("restaurant_id", restaurantId);

    if (countError) {
        console.error("Error fetching item counts:", countError);
        return { success: true, data: categories }; // Return without counts if fails
    }

    const categoriesWithCounts = categories.map(cat => ({
        ...cat,
        item_count: counts.filter(item => item.category_id === cat.id).length
    }));

    return { success: true, data: categoriesWithCounts };
}

/**
 * Fetch all menu items for a restaurant
 */
export async function getMenuItemsAction(restaurantId: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("menu_items")
        .select("*, category:categories(name)")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching items:", error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

/**
 * Fetch paginated menu items for a restaurant with filters
 */
export async function getMenuItemsPaginatedAction(
    restaurantId: string,
    page: number = 1,
    limit: number = 15,
    categoryId?: string,
    searchQuery?: string,
    availabilityFilter?: 'all' | 'active' | 'inactive'
) {
    const supabase = createAdminClient();
    const offset = (page - 1) * limit;

    // Build the query
    let query = supabase
        .from("menu_items")
        .select("*, category:categories(name)", { count: "exact" })
        .eq("restaurant_id", restaurantId);

    // Apply category filter
    if (categoryId) {
        query = query.eq("category_id", categoryId);
    }

    // Apply search filter
    if (searchQuery && searchQuery.trim() !== "") {
        query = query.ilike("name", `%${searchQuery}%`);
    }

    // Apply availability filter
    if (availabilityFilter === 'active') {
        query = query.eq("is_available", true);
    } else if (availabilityFilter === 'inactive') {
        query = query.eq("is_available", false);
    }

    // Apply pagination and ordering
    const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error("Error fetching paginated items:", error);
        return { success: false, error: error.message };
    }

    return { 
        success: true, 
        data, 
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page
    };
}

/**
 * Upsert menu item
 */
export async function upsertMenuItemAction(item: any, restaurantSlug: string) {
    const supabase = createAdminClient();

    // Remove relationship and empty fields before upsert
    const { variants, modifiers, category, ...itemData } = item;

    // Safety check: ensure id is not an empty string
    if (itemData.id === "" || itemData.id === null) {
        delete itemData.id;
    }

    // [Cleanup Logic] Fetch old image before upsert if this is an update and has new image
    let oldImageUrl: string | null = null;
    if (itemData.id && itemData.image_url) {
        const { data: currentItem } = await supabase
            .from("menu_items")
            .select("image_url")
            .eq("id", itemData.id)
            .single();
        oldImageUrl = currentItem?.image_url;
    }

    const { data, error } = await supabase
        .from("menu_items")
        .upsert(itemData)
        .select()
        .single();

    // Execute cleanup after successful upsert
    if (!error && oldImageUrl && oldImageUrl !== itemData.image_url && oldImageUrl.includes('Restaurants-Media')) {
        try {
            const pathParts = oldImageUrl.split('Restaurants-Media/');
            if (pathParts.length > 1) {
                const path = pathParts[1];
                await supabase.storage.from('Restaurants-Media').remove([path]);
                console.log("Cleaned up old menu item image:", path);
            }
        } catch (err) {
            console.error("Error cleaning up menu item image:", err);
        }
    }



    if (error) {
        console.error("Error upserting menu item:", error.message, "Data:", itemData);
        return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/menu`);
    return { success: true, data };
}

/**
 * Delete menu item
 */
export async function deleteMenuItemAction(itemId: string, restaurantSlug: string) {
    const supabase = createAdminClient();
    const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", itemId);

    if (error) {
        console.error("Error deleting menu item:", error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/menu`);
    return { success: true };
}

/**
 * Toggle menu item availability
 */
export async function toggleItemAvailabilityAction(itemId: string, isAvailable: boolean, restaurantSlug: string) {
    const supabase = createAdminClient();
    const { error } = await supabase
        .from("menu_items")
        .update({ is_available: isAvailable })
        .eq("id", itemId);

    if (error) {
        console.error("Error toggling availability:", error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/menu`);
    return { success: true };
}

/**
 * Upsert a category
 */
/**
 * Upsert a category
 */
export async function upsertCategoryAction(category: any, restaurantSlug: string) {
    const supabase = createAdminClient();

    // Remove calculated and empty fields before upsert
    const { item_count, ...categoryData } = category;

    if (categoryData.id === "" || categoryData.id === null) {
        delete categoryData.id;
    }

    // [Cleanup Logic] Fetch old image before upsert
    let oldCatImageUrl: string | null = null;
    if (categoryData.id && categoryData.image_url) {
        const { data: currentCat } = await supabase
            .from("categories")
            .select("image_url")
            .eq("id", categoryData.id)
            .single();
        oldCatImageUrl = currentCat?.image_url;
    }

    const { data, error } = await supabase
        .from("categories")
        .upsert(categoryData)
        .select()
        .single();

    // Execute cleanup
    if (!error && oldCatImageUrl && oldCatImageUrl !== categoryData.image_url && oldCatImageUrl.includes('Restaurants-Media')) {
        try {
            const pathParts = oldCatImageUrl.split('Restaurants-Media/');
            if (pathParts.length > 1) {
                const path = pathParts[1];
                await supabase.storage.from('Restaurants-Media').remove([path]);
                console.log("Cleaned up old category image:", path);
            }
        } catch (err) {
            console.error("Error cleaning up category image:", err);
        }
    }

    if (error) {
        console.error("Error upserting category:", error.message, "Data:", categoryData);
        return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/menu`);
    return { success: true, data };
}

/**
 * Delete a category
 */
export async function deleteCategoryAction(categoryId: string, restaurantSlug: string) {
    const supabase = createAdminClient();
    const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

    if (error) {
        console.error("Error deleting category:", error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/menu`);
    return { success: true };
}

/**
 * Variants Actions
 */
export async function upsertItemVariantsAction(variants: any[], restaurantSlug: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("item_variants")
        .upsert(variants)
        .select();

    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/menu`);
    return { success: true, data };
}

export async function getItemVariantsAction(itemId: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("item_variants")
        .select("*")
        .eq("menu_item_id", itemId)
        .order("created_at", { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

export async function upsertItemVariantAction(variant: any, restaurantSlug: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("item_variants")
        .upsert(variant)
        .select()
        .single();

    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/menu`);
    return { success: true, data };
}

export async function deleteItemVariantAction(variantId: string, restaurantSlug: string) {
    const supabase = createAdminClient();
    const { error } = await supabase
        .from("item_variants")
        .delete()
        .eq("id", variantId);

    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/menu`);
    return { success: true };
}

/**
 * Modifiers Actions
 */
export async function getRestaurantModifiersAction(restaurantId: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("modifiers")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

export async function upsertModifierAction(modifier: any, restaurantSlug: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("modifiers")
        .upsert(modifier)
        .select()
        .single();

    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/menu`);
    return { success: true, data };
}

export async function deleteModifierAction(modifierId: string, restaurantSlug: string) {
    const supabase = createAdminClient();
    const { error } = await supabase
        .from("modifiers")
        .delete()
        .eq("id", modifierId);

    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/menu`);
    return { success: true };
}

/**
 * Linking Modifiers to Items
 */
export async function getMenuItemModifiersAction(itemId: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("menu_item_modifiers")
        .select("*, modifier:modifiers(*)")
        .eq("menu_item_id", itemId);

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

export async function linkModifierToItemAction(link: any, restaurantSlug: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("menu_item_modifiers")
        .upsert(link)
        .select()
        .single();

    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/menu`);
    return { success: true, data };
}

export async function unlinkModifierFromItemAction(itemId: string, modifierId: string, restaurantSlug: string) {
    const supabase = createAdminClient();
    const { error } = await supabase
        .from("menu_item_modifiers")
        .delete()
        .match({ menu_item_id: itemId, modifier_id: modifierId });

    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/menu`);
    return { success: true };
}
