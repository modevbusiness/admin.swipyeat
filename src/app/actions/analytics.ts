"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function getAnalyticsDataAction(restaurantId: string, timeframe: 'today' | '7days' | '30days') {
    console.log(`[Analytics] Fetching data for restaurant: ${restaurantId}, timeframe: ${timeframe}`);
    const supabaseAdmin = createAdminClient();

    // Calculate date ranges
    const now = new Date();
    const startDate = new Date();
    if (timeframe === 'today') {
        startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === '7days') {
        startDate.setDate(now.getDate() - 7);
    } else if (timeframe === '30days') {
        startDate.setDate(now.getDate() - 30);
    }
    const startDateISO = startDate.toISOString();
    console.log(`[Analytics] Start Date: ${startDateISO}`);

    try {
        const [
            ordersResult,
            topSellingItemsResult,
            revenueTrendsResult,
            popularModifiersResult,
            restaurantCapacityResult,
            activeOrdersResult
        ] = await Promise.all([
            // 1. Fetch Orders for calculations (Consolidated with Staff info)
            supabaseAdmin
                .from("orders")
                .select("total_amount, status, table_number, created_at, preparing_started_at, ready_at, created_by:users!orders_created_by_fkey(name, avatar_url)")
                .eq("restaurant_id", restaurantId)
                .gte("created_at", startDateISO),

            // 2. Top Selling Items (With Category Info)
            supabaseAdmin
                .from("order_items")
                .select(`
                    quantity,
                    unit_price,
                    order:orders!inner(restaurant_id),
                    menu_item:menu_items(
                        name,
                        image_url,
                        category:categories(name)
                    )
                `)
                .eq("order.restaurant_id", restaurantId)
                .gte("created_at", startDateISO),

            // 3. Daily Revenue Trends (Simplified for now)
            supabaseAdmin
                .from("orders")
                .select("total_amount, created_at")
                .eq("restaurant_id", restaurantId)
                .neq("status", "canceled") // Exclude canceled
                .gte("created_at", startDateISO),

            // 4. Popular Modifiers
            supabaseAdmin
                .from("order_item_modifiers")
                .select(`
                    modifier_name,
                    order_item:order_items!inner(
                        order:orders!inner(restaurant_id)
                    )
                `)
                .eq("order_item.order.restaurant_id", restaurantId)
                .gte("created_at", startDateISO),

            // 5. Get Restaurant Capacity
            supabaseAdmin
                .from("restaurants")
                .select("number_of_tables")
                .eq("id", restaurantId)
                .single(),

            // 6. Fetch ALL Active Orders for Occupancy (Ignore Timeframe)
            supabaseAdmin
                .from("orders")
                .select("id, table_number, status")
                .eq("restaurant_id", restaurantId)
                .in("status", ['ordered', 'pending', 'confirmed', 'preparing', 'ready', 'served'])
        ]);

        if (ordersResult.error) {
            console.error("[Analytics] Error fetching orders:", ordersResult.error);
            throw ordersResult.error;
        }
        if (topSellingItemsResult.error) console.error("[Analytics] Error fetching top items:", topSellingItemsResult.error);

        const orders = ordersResult.data || [];
        console.log(`[Analytics] Fetched ${orders.length} orders`);

        // --- Calculate Core Metrics ---
        const totalOrders = orders.length;
        const totalRevenue = orders
            .filter(o => o.status === 'served' || o.status === 'completed' || o.status === 'preparing' || o.status === 'ready' || o.status === 'paid')
            .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

        // Calculate Avg Prep Time (only for orders that have both timestamps)
        const ordersWithPrepTimes = orders.filter(o => o.preparing_started_at && o.ready_at);
        const totalPrepMinutes = ordersWithPrepTimes.reduce((sum, o) => {
            const start = new Date(o.preparing_started_at!).getTime();
            const end = new Date(o.ready_at!).getTime();
            return sum + (end - start) / (1000 * 60);
        }, 0);
        const avgPrepTime = ordersWithPrepTimes.length > 0 ? Math.round(totalPrepMinutes / ordersWithPrepTimes.length) : 0;

        // Calculate Canceled Orders Count & Revenue
        const canceledOrdersList = orders.filter(o => o.status === 'canceled');
        const canceledOrders = canceledOrdersList.length;
        const canceledRevenue = canceledOrdersList.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

        // Order Accuracy (Completed vs Total excluding pending/preparing/ready)
        const finishedOrders = orders.filter(o => ['served', 'completed', 'canceled'].includes(o.status));
        const successfulOrders = finishedOrders.filter(o => o.status !== 'canceled');
        const orderAccuracy = finishedOrders.length > 0 ? (successfulOrders.length / finishedOrders.length) * 100 : 100;

        // Status Breakdown
        const statusBreakdown = {
            ready: orders.filter(o => o.status === 'ready').length,
            preparing: orders.filter(o => o.status === 'preparing').length,
            pending: orders.filter(o => o.status === 'pending').length,
        };

        // Staff Analysis
        const staffMap = new Map();
        orders.forEach(o => {
            // Handle potential array or single object response for joined relationship
            const waiterData = o.created_by;
            const waiter = Array.isArray(waiterData) ? waiterData[0] : waiterData;

            if (!waiter) return;

            const name = waiter.name || 'Unknown Staff';
            if (!staffMap.has(name)) {
                staffMap.set(name, { name, avatar: waiter.avatar_url, orders: 0, totalTime: 0, count: 0 });
            }
            const stats = staffMap.get(name);
            stats.orders++;
            if (o.preparing_started_at && o.ready_at) {
                const time = (new Date(o.ready_at).getTime() - new Date(o.preparing_started_at).getTime()) / (1000 * 60);
                stats.totalTime += time;
                stats.count++;
            }
        });
        const topStaff = Array.from(staffMap.values()).map(s => ({
            name: s.name,
            avatar: s.avatar,
            avgPrep: s.count > 0 ? Math.round(s.totalTime / s.count) + "m" : "N/A"
        })).slice(0, 4);

        return {
            success: true,
            data: {
                totalOrders,
                totalRevenue,
                avgPrepTime: avgPrepTime + "m",
                orderAccuracy: orderAccuracy.toFixed(1) + "%",
                canceledOrders,
                canceledRevenue,
                statusBreakdown,
                topStaff,

                // 1. Real Revenue Trends (Dynamic Grouping)
                revenueTrends: (() => {
                    const trendsMap = new Map();

                    if (timeframe === 'today') {
                        // Initialize all hours for today
                        for (let i = 0; i < 24; i++) {
                            trendsMap.set(`${i}:00`, 0);
                        }
                        orders.forEach(o => {
                            const d = new Date(o.created_at);
                            const key = `${d.getHours()}:00`;
                            trendsMap.set(key, (trendsMap.get(key) || 0) + (Number(o.total_amount) || 0));
                        });
                    } else {
                        // Initialize dates for 7/30 days to ensure continuous timeline (fill gaps)
                        const days = timeframe === '7days' ? 7 : 30;
                        for (let i = days - 1; i >= 0; i--) {
                            const d = new Date();
                            d.setDate(d.getDate() - i);
                            const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // "Jan 25"
                            trendsMap.set(key, 0);
                        }

                        orders.forEach(o => {
                            const d = new Date(o.created_at);
                            const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            if (trendsMap.has(key)) {
                                trendsMap.set(key, (trendsMap.get(key) || 0) + (Number(o.total_amount) || 0));
                            }
                        });
                    }

                    return Array.from(trendsMap.entries()).map(([day, value]) => ({ day, value }));
                })(),

                // 2. Top Selling Categories
                topCategories: topSellingItemsResult.data?.reduce((acc: any[], item: any) => {
                    // Safety check for joined data
                    const menuItem = Array.isArray(item.menu_item) ? item.menu_item[0] : item.menu_item;
                    const category = menuItem?.category;
                    const categoryName = (Array.isArray(category) ? category[0]?.name : category?.name) || 'Uncategorized';

                    const existingCat = acc.find(c => c.name === categoryName);
                    if (existingCat) {
                        existingCat.value += item.quantity;
                        existingCat.sales += (item.quantity * item.unit_price);
                    } else {
                        acc.push({
                            name: categoryName,
                            value: item.quantity,
                            sales: item.quantity * item.unit_price,
                            color: '#FF4D00' // We can assign dynamic colors in UI
                        });
                    }
                    return acc;
                }, []).sort((a, b) => b.value - a.value).slice(0, 5) || [],

                // 3. Popular Modifiers
                popularModifiers: popularModifiersResult.data?.reduce((acc: any[], mod: any) => {
                    const existingMod = acc.find(m => m.name === mod.modifier_name);
                    if (existingMod) {
                        existingMod.count++;
                    } else {
                        acc.push({ name: mod.modifier_name, count: 1 });
                    }
                    return acc;
                }, []).sort((a, b) => b.count - a.count).slice(0, 8) || [], // Top 8 modifiers

                // 4. Enhanced Top Items
                topItems: topSellingItemsResult.data?.reduce((acc: any[], item: any) => {
                    const menuItem = Array.isArray(item.menu_item) ? item.menu_item[0] : item.menu_item;
                    const itemName = menuItem?.name || 'Unknown Item';
                    const itemImage = menuItem?.image_url;

                    const existingItem = acc.find(i => i.name === itemName);
                    if (existingItem) {
                        existingItem.sales += item.quantity;
                        existingItem.revenue += (item.quantity * item.unit_price);
                    } else {
                        acc.push({
                            name: itemName,
                            image: itemImage,
                            sales: item.quantity,
                            revenue: item.quantity * item.unit_price
                        });
                    }
                    return acc;
                }, []).sort((a, b) => b.sales - a.sales).slice(0, 5) || [],

                // 5. Live Occupancy
                liveOccupancy: (() => {
                    const totalCapacity = restaurantCapacityResult.data?.number_of_tables || 10;
                    // Use the separate activeOrders list (Result #6) from the desctructured array
                    const activeOrdersList = activeOrdersResult?.data || [];

                    const occupiedTables = new Set(activeOrdersList.map((o: any) => o.table_number)).size;
                    return {
                        occupied: occupiedTables,
                        capacity: totalCapacity,
                        percentage: Math.min(Math.round((occupiedTables / totalCapacity) * 100), 100)
                    };
                })(),

                // 6. Hourly Traffic Heatmap (Today's Data)
                hourlyTraffic: (() => {
                    const hours = Array(24).fill(0);
                    // Filter orders from "Today" strictly for this chart, or use the 'orders' array if timeframe is 'today'
                    // For heatmap, usually we want "Average" or "Aggregate" if timeframe > 1 day, but user asked for "Hourly Sales Heatmap"
                    // Let's use the fetched 'orders' which respects the selected timeframe.
                    // If timeframe is 'today', it shows today's curve.
                    // If timeframe is '7days', it shows the aggregate distribution (e.g. usually busy at 1PM).
                    orders.forEach(o => {
                        if (o.status === 'canceled') return;
                        const hour = new Date(o.created_at).getHours();
                        hours[hour]++;
                    });
                    return hours.map((count, hour) => ({
                        hour: `${hour}:00`,
                        count,
                        intensity: count // Simple mapping, UI handles color interpolation
                    }));
                })()
            }
        };

    } catch (error: any) {
        console.error("Analytics Error:", error);
        return { success: false, error: error.message };
    }
}
