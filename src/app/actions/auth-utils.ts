"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function updateUserPasswordAction(userId: string, newPassword: string) {
    const supabaseAdmin = createAdminClient();

    try {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: newPassword,
        });

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error("Error updating password:", error);
        return { success: false, error: error.message };
    }
}
