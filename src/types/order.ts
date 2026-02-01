// Database status values
export type OrderStatus = 'ordered' | 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'canceled';

// UI display status (for backward compatibility)
export type UIOrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'SERVED' | 'CANCELLED';

export interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    modifiers?: string[];
    notes?: string;
}

export interface TimelineEvent {
    status: string;
    time: string | null;
    description?: string;
    user?: string | null;
    duration?: string | null;
    isLive?: boolean;
    completed: boolean;
    timestamp?: Date | null;
}

// Staff who created the order (NOT customer)
export interface Staff {
    name: string;
    email: string;
    avatar?: string;
}

export interface Order {
    id: string;
    orderNumber: string;
    table: string;
    status: OrderStatus;
    total: number;
    createdByStaff: Staff; // Changed from 'customer' to 'createdByStaff'
    items: OrderItem[];
    createdAt: string;
    elapsedTime?: string;
    customerNote?: string;
    waiterNotes?: string;
    timeline: TimelineEvent[];
}
