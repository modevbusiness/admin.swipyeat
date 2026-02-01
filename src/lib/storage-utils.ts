import { createClient } from "@/lib/supabase/client";

export type MediaFolder = 'restaurants' | 'users' | 'categories' | 'products';

/**
 * Uploads a file to the Restaurants-Media bucket in a specific folder.
 * @param file The file object to upload
 * @param folder The folder category (restaurants, users, categories, products)
 * @param identifier Unique identifier for the file (e.g., user ID, slug, or sanitized name)
 * @returns Object containing success status, publicUrl, or error
 */
export async function uploadMedia(
    file: File,
    folder: MediaFolder,
    identifier: string
) {
    try {
        const supabase = createClient();

        // Validation
        if (!file.type.startsWith('image/')) {
            throw new Error('Please upload an image file');
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            throw new Error('Image size must be less than 2MB');
        }

        const fileExt = file.name.split('.').pop();
        // Clean the identifier to be safe for filenames
        const cleanId = identifier.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `${cleanId}-${Date.now()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('Restaurants-Media')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('Restaurants-Media')
            .getPublicUrl(filePath);

        return { success: true, publicUrl };
    } catch (error: any) {
        console.error("Upload error:", error);
        return { success: false, error: error.message };
    }
}
