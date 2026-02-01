"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function getDashboardStatsAction(restaurantId: string) {
    const supabaseAdmin = createAdminClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    try {
        // Run all queries in parallel to reduce load time and avoid timeouts
        const [
            todayOrdersResult,
            activeOrdersResult,
            revenueResult,
            recentOrdersResult
        ] = await Promise.all([
            // 1. Get Today's Orders Count
            supabaseAdmin
                .from("orders")
                .select("*", { count: "exact", head: true })
                .eq("restaurant_id", restaurantId)
                .gte("created_at", todayISO),

            // 2. Get Active Orders Count (Pending -> Ready)
            supabaseAdmin
                .from("orders")
                .select("*", { count: "exact", head: true })
                .eq("restaurant_id", restaurantId)
                .in("status", ["pending", "confirmed", "preparing", "ready"]),

            // 3. Get Today's Revenue
            supabaseAdmin
                .from("orders")
                .select("total_amount")
                .eq("restaurant_id", restaurantId)
                .in("status", ["served", "paid"])
                .gte("created_at", todayISO),

            // 4. Get Recent Orders
            supabaseAdmin
                .from("orders")
                .select(`
                    id,
                    order_number,
                    table_number,
                    status,
                    created_at,
                    total_amount
                `)
                .eq("restaurant_id", restaurantId)
                .order("created_at", { ascending: false })
                .limit(5)
        ]);

        // Check for errors
        if (todayOrdersResult.error) throw todayOrdersResult.error;
        if (activeOrdersResult.error) throw activeOrdersResult.error;
        if (revenueResult.error) throw revenueResult.error;
        if (recentOrdersResult.error) throw recentOrdersResult.error;

        // Calculate Revenue
        const todayRevenue = revenueResult.data?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;

        return {
            success: true,
            data: {
                todayOrders: todayOrdersResult.count || 0,
                activeOrders: activeOrdersResult.count || 0,
                todayRevenue: todayRevenue,
                recentOrders: recentOrdersResult.data || []
            }
        };
    } catch (error: any) {
        console.error("Error fetching dashboard stats:", error);
        return { success: false, error: error.message };
    }
}
