"use client";
import React, { useState, useEffect } from "react";
import { logoutAction } from "@/app/actions/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile, useRestaurant } from "@/contexts/AuthProvider";
import {
    LayoutDashboard,
    TrendingUp,
    ShoppingCart,
    UtensilsCrossed,
    MonitorSmartphone,
    Users,
    CreditCard,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

const mainNavItems = [
    {
        name: "Dashboard",
        href: "",
        icon: LayoutDashboard,
    },
    {
        name: "Analytics",
        href: "/analytics",
        icon: TrendingUp,
    },
    {
        name: "Orders",
        href: "/orders",
        icon: ShoppingCart,
    },
    {
        name: "Menu",
        href: "/menu",
        icon: UtensilsCrossed,
    },
    {
        name: "Tables",
        href: "/QRCodetables",
        icon: MonitorSmartphone,
    },
    {
        name: "Staff",
        href: "/staff",
        icon: Users,
    },
    {
        name: "Payments History",
        href: "/paimentsHistory", // User requested path 'paimentsHistory'
        icon: CreditCard,
    },
];

const accountNavItems = [
    {
        name: "Subscription",
        href: "/subscription",
        icon: CreditCard,
    },
    {
        name: "Settings",
        href: "/settings",
        icon: Settings,
    },
];

interface SidebarProps {
    isOpen?: boolean;
    onToggle?: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const { profile, loading: profileLoading } = useProfile();
    const { restaurant, loading: restaurantLoading } = useRestaurant();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const userRole = profile?.role;

    // Update main content margin when sidebar collapses
    useEffect(() => {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            if (isCollapsed) {
                mainContent.style.marginLeft = '70px';
            } else {
                mainContent.style.marginLeft = '';
            }
        }
    }, [isCollapsed]);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    // Close mobile menu on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsMobileOpen(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileOpen]);

    // Filter Items Logic based on role
    const filteredMainNav = mainNavItems.filter(item => {
        if (userRole === 'manager') {
            // Manager cannot see Staff
            return item.name !== 'Staff';
        }
        return true;
    });

    const filteredAccountNav = accountNavItems.filter(item => {
        if (userRole === 'manager') {
            // Manager cannot see Settings or Subscription
            return item.name !== 'Settings' && item.name !== 'Subscription';
        }
        return true;
    });

    const isActive = (href: string) => {
        const fullPath = `/dashboard${href}`;
        return pathname === fullPath;
    };

    const NavLink = ({ item }: { item: { name: string; href: string; icon: any } }) => {
        const active = isActive(item.href);
        const Icon = item.icon;

        return (
            <Link
                href={`/dashboard${item.href}`}
                onClick={() => setIsMobileOpen(false)}
                className={`
                    flex items-center gap-3 px-3 py-2 rounded-xl text-xs lg:text-sm font-medium
                    transition-all duration-200 relative group
                    ${active
                        ? "bg-[#FF4D00] text-white shadow-sm"
                        : "text-[#4a5568] hover:bg-[#f7fafc] hover:text-[#1a202c]"
                    }
                `}
            >
                <Icon className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" strokeWidth={active ? 2.5 : 2} />
                <span className={`truncate ${isCollapsed ? 'hidden lg:hidden' : ''}`}>{item.name}</span>
                {isCollapsed && (
                    <span className="hidden lg:block absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                        {item.name}
                    </span>
                )}
            </Link>
        );
    };

    // Loading state skeleton
    const LoadingSkeleton = () => (
        <aside className="w-[200px] h-screen bg-white flex flex-col fixed left-0 top-0 border-r border-gray-100 z-40">
            <div className="p-4 pb-5">
                <div className="flex items-center gap-2">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-100 rounded-xl animate-pulse" />
                    <div className="flex flex-col gap-1.5">
                        <div className="w-20 h-3 bg-gray-100 rounded animate-pulse" />
                        <div className="w-12 h-2.5 bg-gray-100 rounded animate-pulse" />
                    </div>
                </div>
            </div>
            <nav className="flex-1 px-2 space-y-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-9 bg-gray-100 rounded-xl animate-pulse" />
                ))}
            </nav>
        </aside>
    );

    // Sidebar content component
    const SidebarContent = () => (
        <div className="relative w-full h-full flex flex-col">
            {/* Logo & Restaurant Info */}
            <div className="p-3 lg:p-4 pb-3 lg:pb-5 flex-shrink-0">
                <div className={`flex items-center gap-2 lg:gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                    {/* Logo */}
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-50 flex-shrink-0">
                        {restaurant?.logo_url ? (
                            <img
                                src={restaurant.logo_url}
                                alt="Logo"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-[#FF4D00] font-bold text-lg lg:text-xl uppercase">
                                {restaurant?.name?.charAt(0) || 'R'}
                            </div>
                        )}
                    </div>
                    {/* Restaurant Name */}
                    {!isCollapsed && (
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                            <h2 className="text-xs font-bold text-[#1a202c] leading-tight capitalize break-words line-clamp-2">
                                {restaurant?.name || 'Restaurant Name'}
                            </h2>
                            {restaurant?.subscription && (
                                <div className="flex">
                                    <span className={`
                                        text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border
                                        ${(restaurant.subscription.status === 'canceled' || restaurant.subscription.status === 'suspended')
                                            ? "bg-red-500 text-white border-red-600"
                                            : (restaurant.subscription.plan_type === 'pro')
                                                ? "bg-orange-50 text-orange-600 border-orange-100"
                                                : "bg-blue-50 text-blue-600 border-blue-100"}
                                    `}>
                                        {(restaurant.subscription.status === 'canceled') ? 'CANCELLED' :
                                            (restaurant.subscription.status === 'suspended') ? 'SUSPENDED' :
                                                (restaurant.subscription.plan_type === 'pro' ? 'Professional' : 'Free Trial')}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Navigation - Scrollable */}
            <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300 relative">
                {filteredMainNav.map((item) => (
                    <NavLink key={item.name} item={item} />
                ))}

                {/* Account Section Label - only show if there are items */}
                {filteredAccountNav.length > 0 && (
                    <div className={`pt-4 pb-1.5 ${isCollapsed ? 'hidden lg:hidden' : ''}`}>
                        <span className="px-3 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                            Account
                        </span>
                    </div>
                )}

                {filteredAccountNav.map((item) => (
                    <NavLink key={item.name} item={item} />
                ))}
            </nav>

            {/* Toggle Button - Positioned on the right edge */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-12 rounded-r-lg bg-white border border-l-0 border-gray-200 hover:bg-gray-50 transition-colors items-center justify-center shadow-md z-50"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                ) : (
                    <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
                )}
            </button>

            {/* Disconnect/Logout */}
            <div className="p-2 pb-4 flex-shrink-0">
                <button
                    onClick={async () => {
                        const res = await logoutAction();
                        if (res?.success && res?.redirectUrl) {
                            window.location.href = res.redirectUrl;
                        }
                    }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl w-full text-left text-[#e53e3e] hover:bg-red-50 transition-all duration-200 ${isCollapsed ? 'lg:justify-center' : ''} relative group`}
                >
                    <LogOut className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                    <span className={`text-xs lg:text-sm font-medium ${isCollapsed ? 'lg:hidden' : ''}`}>Disconnect</span>
                    {isCollapsed && (
                        <span className="hidden lg:block absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                            Disconnect
                        </span>
                    )}
                </button>
            </div>
        </div>
    );

    // Show loading state
    if (profileLoading || restaurantLoading) {
        return (
            <>
                {/* Mobile hamburger button */}
                <button
                    className="lg:hidden fixed top-3 left-3 z-50 w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center"
                    onClick={() => setIsMobileOpen(true)}
                >
                    <Menu className="w-4 h-4 text-gray-600" />
                </button>

                {/* Desktop sidebar skeleton */}
                <div className="hidden lg:block">
                    <LoadingSkeleton />
                </div>
            </>
        );
    }

    return (
        <>
            {/* Mobile hamburger button - visible on mobile/tablet */}
            <button
                className="lg:hidden fixed top-3 left-3 z-50 w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                onClick={() => setIsMobileOpen(true)}
                aria-label="Open menu"
            >
                <Menu className="w-4 h-4 text-gray-600" />
            </button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside
                className={`
                    lg:hidden fixed left-0 top-0 h-screen w-[260px] bg-white z-50
                    transform transition-transform duration-300 ease-in-out
                    flex flex-col shadow-xl
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* Close button */}
                <button
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors z-[60]"
                    onClick={() => setIsMobileOpen(false)}
                    aria-label="Close menu"
                >
                    <X className="w-4 h-4 text-gray-500" />
                </button>
                <SidebarContent />
            </aside>

            {/* Desktop Sidebar - Fixed Left */}
            <aside className={`hidden lg:flex h-screen bg-white flex-col fixed left-0 top-0 border-r border-gray-100 z-40 transition-all duration-300 ${isCollapsed ? 'w-[70px]' : 'w-[200px] xl:w-[220px] 2xl:w-[240px]'}`}>
                <SidebarContent />
            </aside>
        </>
    );
}
