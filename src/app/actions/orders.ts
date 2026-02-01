"use server";

import { createAdminClient } from "@/lib/supabase/admin";

// Fetch all orders for a restaurant with filters
export async function getOrdersAction(restaurantId: string, filters?: {
    status?: string;
    tableType?: string;
    page?: number;
    limit?: number;
}) {
    const supabaseAdmin = createAdminClient();

    try {
        let query = supabaseAdmin
            .from("orders")
            .select(`
                *,
                created_by_user:users!created_by(name, email),
                order_items(
                    id,
                    quantity,
                    unit_price,
                    subtotal,
                    special_instructions,
                    menu_item:menu_items(name, image_url),
                    variant:item_variants(name),
                    order_item_modifiers(
                        id,
                        quantity,
                        unit_price,
                        modifier:modifiers(name)
                    )
                )
            `, { count: "exact" }) // Request exact count
            .eq("restaurant_id", restaurantId)
            .order("created_at", { ascending: false });

        // Apply status filter
        if (filters?.status && filters.status !== 'ALL') {
            const dbStatus = filters.status.toLowerCase();
            query = query.eq("status", dbStatus);
        } else {
            // Default behavior: Don't show 'paid' or 'canceled' orders in the general list unless specifically asked
            query = query.neq("status", "paid");
        }

        // Apply table filter
        if (filters?.tableType && filters.tableType !== 'ALL') {
            if (filters.tableType === 'Table') {
                // Filter for simple table numbers
                query = query.like("table_number", "%");
            } else {
                query = query.ilike("table_number", `%${filters.tableType}%`);
            }
        }

        // Apply pagination
        if (filters?.page && filters?.limit) {
            const from = (filters.page - 1) * filters.limit;
            const to = from + filters.limit - 1;
            query = query.range(from, to);
        }

        const { data, count, error } = await query;

        if (error) throw error;

        return { success: true, data, count };
    } catch (error: any) {
        console.error("Error fetching orders:", error);
        return { success: false, error: error.message };
    }
}

// Fetch single order details
export async function getOrderDetailsAction(orderId: string) {
    const supabaseAdmin = createAdminClient();

    try {
        const { data, error } = await supabaseAdmin
            .from("orders")
            .select(`
                *,
                created_by_user:users!created_by(name, email, avatar_url),
                validated_by_user:users!validated_by(name),
                order_items(
                    id,
                    quantity,
                    unit_price,
                    subtotal,
                    special_instructions,
                    menu_item:menu_items(name, image_url),
                    variant:item_variants(name),
                    order_item_modifiers(
                        quantity,
                        unit_price,
                        modifier:modifiers(name)
                    )
                ),
                order_status_history(
                    from_status,
                    to_status,
                    notes,
                    created_at,
                    changed_by_user:users(name)
                )
            `)
            .eq("id", orderId)
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error("Error fetching order details:", error);
        return { success: false, error: error.message };
    }
}

// Update order status
export async function updateOrderStatusAction(
    orderId: string,
    newStatus: string,
    staffId: string,
    notes?: string,
    paymentDetails?: { paymentMethod?: string; customerEmail?: string }
) {
    const supabaseAdmin = createAdminClient();

    try {
        console.log(`[updateOrderStatus] Updating order: ${orderId} to ${newStatus} by ${staffId}`);

        // First, get current status
        const { data: currentOrder, error: fetchError } = await supabaseAdmin
            .from("orders")
            .select("status, restaurant_id")
            .eq("id", orderId)
            .single();

        if (fetchError || !currentOrder) {
            console.error("[updateOrderStatus] Fetch error:", fetchError);
            if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
                console.error("[updateOrderStatus] Invalid UUID format for orderId:", orderId);
            }
            throw new Error(`Order not found: ${fetchError?.message || 'No data returned'}`);
        }

        // Map UI status to database status
        const statusMap: Record<string, string> = {
            'PENDING': 'pending',
            'CONFIRMED': 'confirmed',
            'PREPARING': 'preparing',
            'READY': 'ready',
            'SERVED': 'served',
            'PAID': 'paid',
            'CANCELLED': 'canceled'
        };

        const dbStatus = statusMap[newStatus] || newStatus.toLowerCase();

        // Update timestamps based on status
        const updates: any = { status: dbStatus };
        const now = new Date().toISOString();

        if (dbStatus === 'confirmed') updates.validated_at = now;
        if (dbStatus === 'preparing') updates.preparing_started_at = now;
        if (dbStatus === 'ready') updates.ready_at = now;
        if (dbStatus === 'served') updates.served_at = now;
        if (dbStatus === 'served') updates.served_at = now;
        if (dbStatus === 'paid') {
            // updates.completed_at = now; // Column doesn't exist in user DB
        }
        if (dbStatus === 'canceled') updates.canceled_at = now;

        // Add payment details if provided
        // NOTE: User requested static handling as DB columns don't exist
        /*
        if (paymentDetails) {
            if (paymentDetails.paymentMethod) updates.payment_method = paymentDetails.paymentMethod;
            if (paymentDetails.customerEmail) updates.customer_email = paymentDetails.customerEmail;
        }
        */

        // Update order status
        const { error: updateError } = await supabaseAdmin
            .from("orders")
            .update(updates)
            .eq("id", orderId);

        if (updateError) throw updateError;

        // Create status history entry
        const { error: historyError } = await supabaseAdmin
            .from("order_status_history")
            .insert({
                order_id: orderId,
                from_status: currentOrder.status,
                to_status: dbStatus,
                changed_by: staffId,
                notes: notes || `Status changed to ${dbStatus}`
            });

        if (historyError) {
            // If error is foreign key violation on users table, try to sync user
            if (historyError.code === '23503' && historyError.details?.includes('changed_by')) {
                // Fetch user data from auth.users (requires admin privilege)
                const { data: { user: authUser }, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(staffId);

                if (authUser && !authUserError) {
                    // Insert into public.users
                    const { error: syncError } = await supabaseAdmin.from('users').insert({
                        id: staffId,
                        restaurant_id: currentOrder.restaurant_id, // We assume user belongs to this restaurant
                        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Staff',
                        email: authUser.email,
                        role: authUser.user_metadata?.role || 'waiter'
                    });

                    if (!syncError) {
                        // Retry history insert
                        await supabaseAdmin.from("order_status_history").insert({
                            order_id: orderId,
                            from_status: currentOrder.status,
                            to_status: dbStatus,
                            changed_by: staffId,
                            notes: notes || `Status changed to ${dbStatus}`
                        });
                    }
                }
            } else {
                throw historyError;
            }
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error updating order status:", error);
        return { success: false, error: error.message };
    }
}

// Cancel order
export async function cancelOrderAction(
    orderId: string,
    reason: string,
    staffId: string,
    restoreInventory: boolean = false
) {
    const supabaseAdmin = createAdminClient();

    try {
        // Update order to canceled
        const { error: updateError } = await supabaseAdmin
            .from("orders")
            .update({
                status: 'canceled',
                canceled_at: new Date().toISOString(),
                cancellation_reason: reason
            })
            .eq("id", orderId);

        if (updateError) throw updateError;

        // Create status history
        const { error: historyError } = await supabaseAdmin
            .from("order_status_history")
            .insert({
                order_id: orderId,
                from_status: 'pending', // You might want to fetch the actual current status
                to_status: 'canceled',
                changed_by: staffId,
                notes: `Order canceled: ${reason}`
            });

        if (historyError) {
            // Same sync logic for cancellation
            if (historyError.code === '23503' && historyError.details?.includes('changed_by')) {
                const { data: { user: authUser }, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(staffId);
                if (authUser && !authUserError) {
                    // We need restaurant_id, fetch from order
                    const { data: orderData } = await supabaseAdmin.from('orders').select('restaurant_id').eq('id', orderId).single();
                    if (orderData) {
                        await supabaseAdmin.from('users').insert({
                            id: staffId,
                            restaurant_id: orderData.restaurant_id,
                            name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Staff',
                            email: authUser.email,
                            role: authUser.user_metadata?.role || 'waiter'
                        });

                        // Retry
                        await supabaseAdmin.from("order_status_history").insert({
                            order_id: orderId,
                            from_status: 'pending',
                            to_status: 'canceled',
                            changed_by: staffId,
                            notes: `Order canceled: ${reason}`
                        });
                    }
                }
            } else {
                throw historyError;
            }
        }

        // TODO: If restoreInventory is true, restore inventory quantities
        // This would require inventory tracking tables which aren't in the current schema

        return { success: true };
    } catch (error: any) {
        console.error("Error canceling order:", error);
        return { success: false, error: error.message };
    }
}

// Delete order (only if canceled)
export async function deleteOrderAction(orderId: string) {
    const supabaseAdmin = createAdminClient();

    try {
        const { error } = await supabaseAdmin
            .from("orders")
            .delete()
            .eq("id", orderId);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error("Error deleting order:", error);
        return { success: false, error: error.message };
    }
}
