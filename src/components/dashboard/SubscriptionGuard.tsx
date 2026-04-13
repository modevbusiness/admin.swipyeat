"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Lock, ShieldX, Clock } from "lucide-react";
import { useRestaurant } from "@/contexts/AuthProvider";

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { restaurant, loading } = useRestaurant();

    // If we're on the subscription page, don't show the modal to allow reactivation
    const isSubscriptionPage = pathname.endsWith("/subscription") || pathname.endsWith("/subscription/payment-method") || pathname.endsWith("/subscription/pricing");

    if (loading) {
        return null;
    }

    const status = restaurant?.subscription?.status;
    const isSuspended = status === "suspended";
    const isCanceled = status === "canceled";

    // Expiration Check Logic
    const endsAt = restaurant?.subscription?.ends_at;
    let isExpired = false;

    if (endsAt) {
        const expiryDate = new Date(endsAt);
        const today = new Date();
        expiryDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        if (today > expiryDate) {
            isExpired = true;
        }
    }

    // If cancelled but still has time left (ends_at not passed), let them through
    // They can resume their plan from the subscription page
    const isCanceledButStillActive = isCanceled && !isExpired;

    // === SUSPENDED: Full block with harsh message ===
    if (isSuspended) {
        return (
            <div className="relative">
                {/* Blurred Content */}
                <div className="filter blur-md pointer-events-none select-none opacity-30">
                    {children}
                </div>

                {/* Suspended Overlay */}
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
                    <div className="bg-white rounded-[32px] p-8 md:p-12 max-w-lg w-full text-center space-y-8 shadow-2xl animate-in zoom-in-95 duration-300 border-2 border-red-100">
                        {/* Shield Icon */}
                        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto relative">
                            <div className="absolute inset-0 bg-red-100/50 rounded-full animate-ping opacity-20" />
                            <ShieldX className="w-12 h-12 text-red-500 relative z-10" />
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                                Account Suspended
                            </h2>
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                                <p className="text-red-700 font-bold text-lg">
                                    Sorry, you don't deserve this service.
                                </p>
                            </div>
                            <p className="text-gray-500 font-medium leading-relaxed text-sm">
                                Your account has been suspended by the administrator. 
                                All dashboard features are disabled until further notice.
                                If you believe this is a mistake, please contact support.
                            </p>
                        </div>

                        <div className="space-y-4 pt-4">
                            <a
                                href="mailto:support@swipyeat.com"
                                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-2xl font-black text-base transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                 Contact our Support
                            </a>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Reference: {restaurant?.id?.slice(0, 8)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // === CANCELED + EXPIRED, or just EXPIRED: Show reactivation overlay ===
    if (((isCanceled && isExpired) || (isExpired && !isCanceled)) && !isSubscriptionPage) {
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
                        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto relative">
                            <div className="absolute inset-0 bg-orange-100/50 rounded-full animate-ping opacity-20" />
                            {isExpired 
                                ? <Clock className="w-10 h-10 text-orange-500 relative z-10" /> 
                                : <Lock className="w-10 h-10 text-red-500 relative z-10" />
                            }
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center justify-center gap-3">
                                {isExpired
                                    ? <>⌛ Plan Expired</>
                                    : <>🔒 Subscription Cancelled</>
                                }
                            </h2>
                            <p className="text-gray-500 font-medium leading-relaxed">
                                {isExpired
                                    ? "Your subscription period has ended. Please upgrade your plan to continue using all features."
                                    : "Your subscription has been cancelled. Reactivate your plan to regain full access to your dashboard."
                                }
                            </p>
                        </div>

                        <div className="space-y-4 pt-4">
                            <button
                                onClick={() => router.push(`/dashboard/subscription/pricing`)}
                                className="w-full bg-[#FF4D00] hover:bg-[#E04400] text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-[#FF4D00]/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                👉 {isExpired ? "Upgrade Plan" : "Reactivate Plan"}
                            </button>

                            <button
                                onClick={() => router.push(`/dashboard/subscription`)}
                                className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors mx-auto block"
                            >
                                View subscription details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
