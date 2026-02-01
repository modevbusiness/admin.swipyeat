// Menu Item Types
export interface Variant {
    id: string;
    menu_item_id: string;
    name: string;
    name_ar?: string;
    name_fr?: string;
    price_adjustment: number;
    is_default: boolean;
    is_available: boolean;
}

export interface Modifier {
    id: string;
    restaurant_id: string;
    name: string;
    name_ar?: string;
    name_fr?: string;
    modifier_type: 'extra' | 'option' | 'size' | 'customization';
    price: number;
    is_active: boolean;
}

export interface MenuItemModifier {
    menu_item_id: string;
    modifier_id: string;
    is_required: boolean;
    max_selections?: number;
}

export interface MenuItem {
    id: string;
    restaurant_id: string;
    category_id: string;
    name: string;
    name_ar?: string;
    name_fr?: string;
    description?: string;
    description_ar?: string;
    description_fr?: string;
    base_price: number;
    image_url?: string;
    preparation_time?: number;
    allergens?: string[];
    is_available: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    // Relationships (optional for nested data)
    variants?: Variant[];
    modifiers?: (Modifier & { pivot: MenuItemModifier })[];
}

export interface Category {
    id: string;
    restaurant_id: string;
    name: string;
    name_ar?: string;
    name_fr?: string;
    description?: string;
    description_ar?: string;
    description_fr?: string;
    image_url?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    item_count?: number; // Calculated field
}
