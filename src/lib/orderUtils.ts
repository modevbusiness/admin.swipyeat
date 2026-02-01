import { Order, OrderStatus } from "@/types/order";

// Transform database order to UI format
export function transformOrderForUI(dbOrder: any): Order {
    // Calculate elapsed time
    const orderCreatedAt = new Date(dbOrder.created_at);
    const currentTime = new Date();
    const elapsedMinutes = Math.floor((currentTime.getTime() - orderCreatedAt.getTime()) / 60000);
    const hours = Math.floor(elapsedMinutes / 60);
    const minutes = elapsedMinutes % 60;
    const elapsedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // Map database status to UI status for display
    const statusMap: Record<string, string> = {
        'ordered': 'PENDING',
        'pending': 'PENDING',
        'confirmed': 'CONFIRMED',
        'preparing': 'PREPARING',
        'ready': 'READY',
        'served': 'SERVED',
        'paid': 'PAID',
        'canceled': 'CANCELLED',
    };

    // Build timeline from status history and timestamps
    const timeline = [];
    const now = new Date();

    // Helper to calculate duration between two dates
    const calculateDuration = (start: Date, end: Date) => {
        const diffMs = end.getTime() - start.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);
        const minutes = diffMinutes % 60;
        const seconds = Math.floor((diffMs % 60000) / 1000);
        return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
    };

    const createdAt = new Date(dbOrder.created_at);
    const validatedAt = dbOrder.validated_at ? new Date(dbOrder.validated_at) : null;
    const preparingAt = dbOrder.preparing_started_at ? new Date(dbOrder.preparing_started_at) : null;
    const readyAt = dbOrder.ready_at ? new Date(dbOrder.ready_at) : null;
    const servedAt = dbOrder.served_at ? new Date(dbOrder.served_at) : null;
    const completedAt = dbOrder.completed_at ? new Date(dbOrder.completed_at) : null; // Paid/Completed
    const canceledAt = dbOrder.canceled_at ? new Date(dbOrder.canceled_at) : null;

    const statusRank: Record<string, number> = {
        'ordered': 0, // treating ordered same as pending/start
        'pending': 1,
        'confirmed': 2,
        'preparing': 3,
        'ready': 4,
        'served': 5,
        'paid': 6,
        'canceled': -1,
        'cancelled': -1
    };
    const currentStatus = dbOrder.status.toLowerCase();
    const currentRank = statusRank[currentStatus] || 0;
    const isCanceled = currentRank === -1;

    // Helper to check if a step is "passed" in the workflow
    const isStepCompleted = (stepRank: number) => {
        if (isCanceled) return false;
        return currentRank > stepRank; // Strictly greater means completed this stage and moved to next
    };

    const isStepActive = (stepRank: number) => {
        if (isCanceled) return false;
        return currentRank === stepRank;
    };

    // PENDING (Rank 1)
    // Always show pending
    timeline.push({
        status: 'PENDING',
        time: createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        duration: validatedAt ? calculateDuration(createdAt, validatedAt) : (currentRank >= 1 ? calculateDuration(createdAt, now) : null),
        isLive: currentRank <= 1 && !isCanceled,
        completed: isStepCompleted(1),
        timestamp: createdAt
    });

    // CONFIRMED (Rank 2)
    if (currentRank >= 1 || isCanceled) { // Show if at least pending or canceled
        timeline.push({
            status: 'CONFIRMED',
            time: validatedAt ? validatedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
            duration: preparingAt ? calculateDuration(validatedAt || createdAt, preparingAt) : (currentRank === 2 ? calculateDuration(validatedAt || createdAt, now) : null),
            isLive: isStepActive(2),
            completed: isStepCompleted(2),
            timestamp: validatedAt
        });
    }

    // PREPARING (Rank 3)
    if (currentRank >= 2 || isCanceled) { // Show if at least confirmed
        timeline.push({
            status: 'PREPARING',
            time: preparingAt ? preparingAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
            duration: readyAt ? calculateDuration(preparingAt || validatedAt || createdAt, readyAt) : (currentRank === 3 ? calculateDuration(preparingAt || validatedAt || createdAt, now) : null),
            isLive: isStepActive(3),
            completed: isStepCompleted(3),
            timestamp: preparingAt
        });
    }

    // READY (Rank 4)
    if (currentRank >= 3 || isCanceled) { // Show if at least preparing
        timeline.push({
            status: 'READY',
            time: readyAt ? readyAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
            duration: servedAt ? calculateDuration(readyAt || preparingAt || validatedAt || createdAt, servedAt) : (currentRank === 4 ? calculateDuration(readyAt || preparingAt || validatedAt || createdAt, now) : null),
            isLive: isStepActive(4),
            completed: isStepCompleted(4),
            timestamp: readyAt
        });
    }

    // SERVED (Rank 5)
    if (currentRank >= 4 || isCanceled) { // Show if at least ready
        timeline.push({
            status: 'SERVED',
            time: servedAt ? servedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
            duration: completedAt ? calculateDuration(servedAt || readyAt || preparingAt || validatedAt || createdAt, completedAt) : (currentRank === 5 ? calculateDuration(servedAt || readyAt || preparingAt || validatedAt || createdAt, now) : null),
            isLive: isStepActive(5),
            completed: isStepCompleted(5),
            timestamp: servedAt
        });
    }

    // PAID (Rank 6)
    if (currentRank >= 5 || isCanceled) { // Show if Served
        timeline.push({
            status: 'PAID',
            time: completedAt ? completedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
            duration: null,
            isLive: false, // Final state
            completed: isStepCompleted(6) || currentRank === 6,
            timestamp: completedAt
        });
    }

    // CANCELLED
    if (isCanceled) {
        timeline.push({
            status: 'CANCELLED',
            time: canceledAt ? canceledAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
            duration: null,
            isLive: false,
            completed: true,
            timestamp: canceledAt
        });
    }

    // Transform order items
    const items = (dbOrder.order_items || []).map((item: any) => {
        const modifiers = (item.order_item_modifiers || []).map((mod: any) =>
            mod.modifier?.name || 'Extra'
        );

        return {
            id: item.id,
            name: item.menu_item?.name || 'Unknown Item',
            quantity: item.quantity,
            price: parseFloat(item.unit_price),
            modifiers: modifiers.length > 0 ? modifiers : undefined,
            notes: item.special_instructions || undefined
        };
    });

    return {
        id: dbOrder.id,
        orderNumber: dbOrder.order_number,
        table: dbOrder.table_number || 'Unknown',
        status: (statusMap[dbOrder.status] || dbOrder.status.toUpperCase()) as OrderStatus,
        total: parseFloat(dbOrder.total_amount || '0'),
        createdByStaff: {
            name: dbOrder.created_by_user?.name || 'Staff',
            email: dbOrder.created_by_user?.email || '',
            avatar: dbOrder.created_by_user?.avatar_url
        },
        items,
        createdAt: dbOrder.created_at,
        elapsedTime,
        customerNote: dbOrder.customer_notes,
        waiterNotes: dbOrder.waiter_notes,
        timeline
    };
}
