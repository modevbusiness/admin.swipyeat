"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { SignJWT } from "jose";

export async function generateStaffInviteAction(email: string, role: string, validityHours: number, restaurantId: string) {
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("JWT_SECRET is not configured");
        }

        const secretKey = new TextEncoder().encode(secret);

        const token = await new SignJWT({ email, role, restaurantId })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime(`${validityHours}h`)
            .sign(secretKey);

        // Uses the domain specified by the user
        const link = `https://swipyeat.com/invite/${token}`;
        
        return { success: true, link };
    } catch (error: any) {
        console.error("Invite generation error:", error);
        return { success: false, error: error.message };
    }
}


export async function createStaffAction(formData: any, restaurantId: string) {
    try {
        const supabaseAdmin = createAdminClient();
        const supabase = await createClient(); // For regular DB checks if needed
        // 1. Create the user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: formData.email,
            password: formData.password,
            email_confirm: true,
            user_metadata: {
                full_name: formData.full_name,
                role: formData.role
            }
        });

        if (authError) throw authError;

        // 2. Insert into our 'users' table
        // Note: Usually a trigger in Supabase handles this, but we'll do it explicitly 
        // to ensure restaurant_id and other fields are set.
        const { error: dbError } = await supabaseAdmin.from("users").insert([
            {
                id: authData.user.id,
                restaurant_id: restaurantId,
                name: formData.full_name,
                email: formData.email,
                role: formData.role,
                is_active: true,
            },
        ]);

        if (dbError) {
            // Rollback auth user if DB insert fails
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            throw dbError;
        }

        revalidatePath(`/dashboard/staff`);
        return { success: true, data: { id: authData.user.id } };
    } catch (error: any) {
        console.error("Staff creation error:", error);
        return { success: false, error: error.message };
    }
}

export async function resetStaffPasswordAction(userId: string) {
    try {
        const supabaseAdmin = createAdminClient();

        // 1. Generate a random temporary code
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let tempPassword = "G-";
        for (let i = 0; i < 3; i++) tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        tempPassword += "-";
        for (let i = 0; i < 3; i++) tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        tempPassword += "-";
        for (let i = 0; i < 3; i++) tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));

        // 2. Update the user in Supabase Auth
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: tempPassword,
            user_metadata: { force_password_change: true }
        });

        if (error) throw error;

        revalidatePath(`/dashboard/staff`);
        return { success: true, tempPassword };
    } catch (error: any) {
        console.error("Password reset error:", error);
        return { success: false, error: error.message };
    }
}

export async function completePasswordSetupAction(newPassword: string) {
    try {
        const supabase = await createClient();

        // 1. Update own password (this works if logged in)
        const { error: authError } = await supabase.auth.updateUser({
            password: newPassword,
            data: { force_password_change: false }
        });

        if (authError) throw authError;

        return { success: true };
    } catch (error: any) {
        console.error("Password completion error:", error);
        return { success: false, error: error.message };
    }
}

export async function updateStaffAction(userId: string, formData: any) {
    try {
        const supabaseAdmin = createAdminClient();

        // 1. Update our 'users' table
        const { error: dbError } = await supabaseAdmin
            .from("users")
            .update({
                name: formData.full_name,
                role: formData.role,
                updated_at: new Date().toISOString()
            })
            .eq("id", userId);

        if (dbError) throw dbError;

        // 2. Update Supabase Auth metadata
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: {
                full_name: formData.full_name,
                role: formData.role
            }
        });

        if (authError) throw authError;

        revalidatePath(`/dashboard/staff`);
        return { success: true };
    } catch (error: any) {
        console.error("Staff update error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteStaffAction(userId: string) {
    try {
        const supabaseAdmin = createAdminClient();

        // 1. Delete from Supabase Auth (Service Role)
        // This effectively removes access immediately.
        // If 'public.users' has 'ON DELETE CASCADE' referencing auth.users, it will be gone too.
        // Otherwise, we might want to manually delete it, but usually standard setup cascades or we handle it here.
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) throw authError;

        // 2. Explicitly delete from public.users if needed (double safety or if no cascade)
        // Note: If you have a foreign key set to cascade, this might be redundant or fail if already deleted.
        // For safety, we can attempt it, effectively ensuring cleanup.
        const { error: dbError } = await supabaseAdmin.from("users").delete().eq("id", userId);

        // Ignore "row not found" if cascade already took care of it, but report other errors
        if (dbError) {
            console.warn("DB delete warning (might be cascaded):", dbError);
        }

        revalidatePath(`/dashboard/staff`);
        return { success: true };
    } catch (error: any) {
        console.error("Staff deletion error:", error);
        return { success: false, error: error.message };
    }
}
