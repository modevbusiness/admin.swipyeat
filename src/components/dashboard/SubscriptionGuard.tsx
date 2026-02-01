"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { useRestaurant } from "@/contexts/AuthProvider";

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { restaurant, loading } = useRestaurant();

    // If we're on the subscription page, don't show the modal to allow reactivation
    const isSubscriptionPage = pathname.endsWith("/subscription") || pathname.endsWith("/subscription/payment-method");

    if (loading) {
        return null; // Or a subtle loader
    }

    const status = restaurant?.subscription?.status;
    const restaurantSlug = restaurant?.slug;
    const isSuspended = status === "canceled" || status === "suspended";

    // Expiration Check Logic (Date Only Comparison)
    const endsAt = restaurant?.subscription?.ends_at; // ISO string
    let isExpired = false;

    if (endsAt && status === 'active') { // Only check expiry if currently marked active
        const expiryDate = new Date(endsAt);
        const today = new Date();

        // Normalize to midnight to compare dates only, ignoring time
        expiryDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        // If today is strictly AFTER the expiry date
        if (today > expiryDate) {
            isExpired = true;
        }
    }

    if ((isSuspended || isExpired) && !isSubscriptionPage) {
        return (
            <div className="relative">
                {/* Blurred Content */}
                <div className="filter blur-sm pointer-events-none select-none">
                    {children}
                </div>

                {/* Overlaid Modal */}
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 font-sans">
                    <div className="bg-white rounded-[32px] p-8 md:p-12 max-w-lg w-full text-center space-y-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        {/* Lock Icon */}
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto relative">
                            <div className="absolute inset-0 bg-red-100/50 rounded-full animate-ping opacity-20" />
                            <Lock className="w-10 h-10 text-red-500 relative z-10" />
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center justify-center gap-3">
                                {isSuspended ? <span className="text-2xl">🔒</span> : <span className="text-2xl">⌛</span>}
                                {isSuspended ? "Subscription Suspended" : "Plan Expired"}
                            </h2>
                            <p className="text-gray-500 font-medium leading-relaxed">
                                {isSuspended
                                    ? "Your subscription is currently inactive. To regain full access to your dashboard and features, please reactivate your plan."
                                    : "Your subscription period has ended. Please upgrade your plan to verify your account and continue using professional features."
                                }
                            </p>
                        </div>

                        <div className="space-y-4 pt-4">
                            <button
                                onClick={() => router.push(`/dashboard/subscription/pricing`)}
                                className="w-full bg-[#559701] hover:bg-[#4a8001] text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-[#559701]/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                <span className="text-xl">👉</span> {isSuspended ? "Reactivate Plan" : "Upgrade Plan"}
                            </button>

                            <button className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2 mx-auto uppercase">
                                Contact support if you think this is a mistake
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
