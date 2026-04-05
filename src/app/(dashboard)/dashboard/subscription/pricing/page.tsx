"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreditCard, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRestaurant } from "@/contexts/AuthProvider";

export default function PricingPage() {
    const router = useRouter();
    const { restaurant, loading: isLoadingRestaurant } = useRestaurant();
    const supabase = createClient();

    const [isLoading, setIsLoading] = useState(true);
    const [currentPlan, setCurrentPlan] = useState<any>(null);
    const [subscription, setSubscription] = useState<any>(null);
    const [allPlans, setAllPlans] = useState<any[]>([]);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    useEffect(() => {
        if (restaurant) {
            fetchSubscriptionData();
        }
    }, [restaurant]);

    const fetchSubscriptionData = async () => {
        if (!restaurant) return;

        try {
            // Fetch current subscription
            const { data: subs } = await supabase
                .from("subscriptions")
                .select(`*, subscription_plans (*)`)
                .eq("restaurant_id", restaurant.id)
                .order("created_at", { ascending: false });

            const activeSub = subs?.find((s: any) => s.is_current) || subs?.[0];
            setSubscription(activeSub);
            setCurrentPlan(activeSub?.subscription_plans);

            // Fetch all active plans
            const { data: plans } = await supabase
                .from("subscription_plans")
                .select("*")
                .eq("is_active", true)
                .order("price_monthly", { ascending: true }); // Assume price sort

            if (plans) {
                setAllPlans(plans);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };



    const isPro = currentPlan?.plan_type === 'pro';

    // Filter plans based on logic: If pro, hide free. If free, show all.
    const displayPlans = [
        { type: 'free_trial', id: 'free' },
        { type: 'pro', id: 'pro' },
        { type: 'premium', id: 'premium' }
    ].filter(p => !isPro || p.type !== 'free_trial');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#FF4D00]" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white min-h-screen">
            <div className="space-y-6">
                <Link
                    href={`/dashboard/subscription`}
                    className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2"
                >
                    <ChevronRight className="w-4 h-4 rotate-180" /> Back to Billing
                </Link>

                <div className="text-center space-y-4 pt-4">
                    <h1 className="text-4xl md:text-5xl font-black text-[#1a202c] tracking-tight leading-tight">
                        Choose the right plan for your kitchen
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto font-medium text-lg">
                        Scale your operations with advanced AI and dedicated support.
                    </p>
                </div>
            </div>

            {/* Toggle */}
            <div className="flex justify-center items-center gap-4">
                <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-[#1a202c]' : 'text-gray-400'}`}>Monthly</span>
                <button
                    onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                    className="w-12 h-6 bg-gray-200 rounded-full relative transition-colors duration-200"
                >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${billingCycle === 'yearly' ? 'left-7' : 'left-1'}`} />
                </button>
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${billingCycle === 'yearly' ? 'text-[#1a202c]' : 'text-gray-400'}`}>Yearly</span>
                    <span className="text-[10px] font-black text-[#FF4D00] bg-[#FFF0EB] px-2 py-0.5 rounded-full border border-[#e1f3d8]">SAVE 10%</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start pt-8 pb-12">
                {allPlans.map((p) => {
                    const isCurrent = currentPlan?.plan_type === p.plan_type;
                    const isPremium = p.plan_type === 'premium';

                    // Generate features based on DB limits and plan type
                    const featuresList: { text: string; included: boolean }[] = [];

                    if (p.plan_type === 'premium') {
                        featuresList.push(
                            { text: "Unlimited Tables & Staff", included: true },
                            { text: "Unlimited Menu Items", included: true },
                            { text: "AI Forecasting & Demand Prediction", included: true },
                            { text: "Multi-location HQ Dashboard", included: true },
                            { text: "24/7 Priority VIP Support", included: true }
                        );
                    } else {
                        featuresList.push(
                            { text: `Up to ${p.max_tables} Active Tables`, included: true },
                            { text: `${p.max_staff} Staff Accounts`, included: true },
                            { text: `${p.max_menu_items} Menu Items`, included: true }
                        );

                        if (p.plan_type === 'free_trial') {
                            featuresList.push(
                                { text: "Daily Sales Reports", included: true }
                            );
                        } else if (p.plan_type === 'pro') {
                            featuresList.push(
                                { text: "Advanced Menu Management", included: true },
                                
                            );
                        }
                    }


                    return (
                        <div
                            key={p.id}
                            className={`
                bg-white rounded-[32px] p-10 border-2 transition-all duration-300 relative h-full flex flex-col
                ${isPremium ? 'border-[#FF6B2B] shadow-2xl shadow-orange-100 scale-105 z-10' : 'border-[#f2f4f7] shadow-xl shadow-gray-100/50 hover:border-gray-200'}
              `}
                        >
                            {isPremium && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6B2B] text-white text-[10px] font-black uppercase tracking-widest px-6 py-1.5 rounded-full shadow-lg">
                                    Best Value
                                </span>
                            )}

                            <div className="flex flex-col h-full space-y-8">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-black text-[#1a202c]">{p.name}</h3>
                                        {isCurrent && (
                                            <span className="text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-500 px-2 py-1 rounded-md">
                                                Current Plan
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-black text-[#1a202c]">
                                            {billingCycle === 'monthly' ? p.price_monthly : p.price_yearly} <span className="text-xl">DH</span>
                                        </span>
                                        <span className="text-gray-400 font-bold text-lg">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                                    </div>
                                    {billingCycle === 'yearly' && (
                                        <p className="text-xs font-bold text-[#FF6B2B] mt-1 animate-in fade-in slide-in-from-top-1 duration-300">
                                            Billed annually — {p.price_yearly} DH/year (equivalent to {(p.price_yearly / 12).toFixed(0)} DH/month)
                                        </p>
                                    )}
                                    <p className="text-gray-400 text-sm font-medium leading-relaxed">
                                        {p.description || "The best plan for your needs."}
                                    </p>
                                </div>

                                <div className="flex-1 space-y-5 pt-4">
                                    {featuresList.map((f: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-[#FFF0EB] flex items-center justify-center flex-shrink-0">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6B2B]" />
                                            </div>
                                            <span className="text-sm font-extrabold text-[#4a5568]">
                                                {f.text || f}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-8 space-y-4">
                                    {(!isCurrent) ? (
                                        p.plan_type === 'free_trial' ? (
                                            <button
                                                disabled
                                                className="w-full py-4 rounded-3xl font-black transition-all text-base bg-gray-100 text-gray-400 cursor-not-allowed"
                                            >
                                                Free Trial
                                            </button>
                                        ) : (
                                            <Link
                                                href={`/dashboard/subscription/payment-method?plan=${p.id}&cycle=${billingCycle}`}
                                                className={`
                            block text-center w-full py-4 rounded-3xl font-black transition-all text-base
                            ${isPremium
                                                        ? "bg-[#FF6B2B] hover:bg-[#E04400] text-white shadow-xl shadow-orange-100"
                                                        : "bg-white border-2 border-[#eaecf0] hover:bg-gray-50 text-[#4a5568]"
                                                    }
                          `}
                                            >
                                                Upgrade Plan
                                            </Link>
                                        )
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full py-4 rounded-3xl font-black transition-all text-base bg-[#f2f4f7] text-[#98a2b3] cursor-default"
                                        >
                                            Active
                                        </button>
                                    )}

                                    {isPremium && (
                                        <div className="text-center space-y-2">
                                            <div className="flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#FF6B2B]">
                                                <CheckCircle2 className="w-3 h-3" /> Secure Payment Processing
                                            </div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[#98a2b3]">
                                                Cancel anytime • Pro-rated refund
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
