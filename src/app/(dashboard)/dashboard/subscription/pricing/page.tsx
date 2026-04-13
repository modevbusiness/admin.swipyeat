"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Sparkles,
  Crown,
  Zap,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRestaurant } from "@/contexts/AuthProvider";
import { useUser } from "@clerk/nextjs";

export default function PricingPage() {
  const router = useRouter();
  const { restaurant, loading: isLoadingRestaurant } = useRestaurant();
  const { user } = useUser();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (restaurant) {
      fetchSubscriptionData();
    }
  }, [restaurant]);

  const fetchSubscriptionData = async () => {
    if (!restaurant) return;

    try {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select(`*, subscription_plans (*)`)
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false });

      const activeSub =
        subs?.find((s: any) => s.is_current) || subs?.[0];
      setSubscription(activeSub);
      setCurrentPlan(activeSub?.subscription_plans);

      const { data: plans } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price_monthly", { ascending: true });

      if (plans) {
        setAllPlans(plans);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (plan: any) => {
    if (!restaurant || upgradingPlan) return;

    setUpgradingPlan(plan.id);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          planType: plan.plan_type,
          billingCycle,
          email: user?.primaryEmailAddress?.emailAddress,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error("Upgrade error:", err);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setUpgradingPlan(null);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  // Plan icon mapping
  const planIcons: Record<string, React.ReactNode> = {
    free_trial: <Sparkles className="w-6 h-6" />,
    pro: <Crown className="w-6 h-6" />,
    unlimited: <Zap className="w-6 h-6" />,
  };

  // Plan badge colors
  const planColors: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
    free_trial: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      text: "text-gray-600",
      iconBg: "bg-gray-100",
    },
    pro: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-600",
      iconBg: "bg-orange-100",
    },
    unlimited: {
      bg: "bg-violet-50",
      border: "border-violet-200",
      text: "text-violet-600",
      iconBg: "bg-violet-100",
    },
  };

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
        {/* Back + Cancel */}
        <div className="flex items-center justify-between">
          <Link
            href={`/dashboard/subscription`}
            className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2"
          >
            <ChevronRight className="w-4 h-4 rotate-180" /> Back to Billing
          </Link>
          <button
            onClick={handleCancel}
            className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" /> Cancel
          </button>
        </div>

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
        <span
          className={`text-sm font-bold ${
            billingCycle === "monthly" ? "text-[#1a202c]" : "text-gray-400"
          }`}
        >
          Monthly
        </span>
        <button
          onClick={() =>
            setBillingCycle(
              billingCycle === "monthly" ? "yearly" : "monthly"
            )
          }
          className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${
            billingCycle === "yearly" ? "bg-[#FF4D00]" : "bg-gray-200"
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm ${
              billingCycle === "yearly" ? "left-7" : "left-1"
            }`}
          />
        </button>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-bold ${
              billingCycle === "yearly" ? "text-[#1a202c]" : "text-gray-400"
            }`}
          >
            Yearly
          </span>
          <span className="text-[10px] font-black text-[#FF4D00] bg-[#FFF0EB] px-2 py-0.5 rounded-full border border-[#FFE0D3]">
            SAVE 17%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch pt-8 pb-12">
        {allPlans.map((p) => {
          const isCurrent = currentPlan?.plan_type === p.plan_type;
          const isUpgrade =
            !isCurrent &&
            p.plan_type !== "free_trial" &&
            (currentPlan?.plan_type === "free_trial" ||
              (currentPlan?.plan_type === "pro" &&
                p.plan_type === "unlimited"));
          const isDowngrade =
            !isCurrent &&
            !isUpgrade &&
            p.plan_type !== currentPlan?.plan_type;
          const colors = planColors[p.plan_type] || planColors.free_trial;
          const isHighlighted = p.plan_type === "unlimited";
          const isUpgrading = upgradingPlan === p.id;

          // Generate features from DB data
          const featuresList: string[] = [];
          if (p.plan_type === "unlimited") {
            featuresList.push(
              `Up to ${p.max_tables === -1 ? "99" : p.max_tables} Active Tables`,
              `${p.max_staff === -1 ? "100" : p.max_staff} Staff Accounts`,
              `${p.max_menu_items === -1 ? "999" : p.max_menu_items} Menu Items`
            );
          } else {
            featuresList.push(
              `Up to ${p.max_tables === -1 ? "Unlimited" : p.max_tables} Active Tables`,
              `${p.max_staff === -1 ? "Unlimited" : p.max_staff} Staff Accounts`,
              `${p.max_menu_items === -1 ? "Unlimited" : p.max_menu_items} Menu Items`
            );
          }

          if (p.plan_type === "free_trial") {
            featuresList.push("Daily Sales Reports");
          } else if (p.plan_type === "pro") {
            featuresList.push("Advanced Menu Management");
          } else if (p.plan_type === "unlimited") {
            featuresList.push("Advanced Menu Management");
          }

          return (
            <div
              key={p.id}
              className={`
                bg-white rounded-[32px] p-10 border-2 transition-all duration-300 relative h-full flex flex-col
                ${
                  isHighlighted
                    ? "border-[#FF6B2B] shadow-2xl shadow-orange-100 scale-[1.02] z-10"
                    : isCurrent
                    ? "border-[#FF4D00]/30 shadow-xl shadow-orange-50"
                    : "border-[#f2f4f7] shadow-xl shadow-gray-100/50 hover:border-gray-200"
                }
              `}
            >
              {isHighlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6B2B] text-white text-[10px] font-black uppercase tracking-widest px-6 py-1.5 rounded-full shadow-lg">
                  Best Value
                </span>
              )}

              <div className="flex flex-col h-full space-y-8">
                <div className="space-y-3">
                  {/* Plan header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl ${colors.iconBg} ${colors.text}`}
                      >
                        {planIcons[p.plan_type] || (
                          <Sparkles className="w-6 h-6" />
                        )}
                      </div>
                      <h3 className="text-xl font-black text-[#1a202c]">
                        {p.name}
                      </h3>
                    </div>
                    {isCurrent && (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-green-50 text-green-600 px-2 py-1 rounded-md border border-green-100">
                        Current Plan
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-[#1a202c]">
                      {billingCycle === "monthly"
                        ? p.price_monthly
                        : p.price_yearly}{" "}
                      <span className="text-xl">DH</span>
                    </span>
                    <span className="text-gray-400 font-bold text-lg">
                      /{billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  </div>
                  {billingCycle === "yearly" && p.price_yearly > 0 && (
                    <p className="text-xs font-bold text-[#FF6B2B] mt-1 animate-in fade-in slide-in-from-top-1 duration-300">
                      Billed annually — {p.price_yearly} DH/year (equivalent
                      to {(p.price_yearly / 12).toFixed(0)} DH/month)
                    </p>
                  )}
                  <p className="text-gray-400 text-sm font-medium leading-relaxed">
                    {p.description || "The best plan for your needs."}
                  </p>
                </div>

                {/* Features */}
                <div className="flex-1 space-y-5 pt-4">
                  {featuresList.map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#FFF0EB] flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6B2B]" />
                      </div>
                      <span className="text-sm font-extrabold text-[#4a5568]">
                        {f}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="pt-8 space-y-4">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-4 rounded-3xl font-black transition-all text-base bg-[#f2f4f7] text-[#98a2b3] cursor-default"
                    >
                      ✓ Active
                    </button>
                  ) : p.plan_type === "free_trial" ? (
                    <button
                      disabled
                      className="w-full py-4 rounded-3xl font-black transition-all text-base bg-gray-100 text-gray-400 cursor-not-allowed"
                    >
                      Free Trial
                    </button>
                  ) : isUpgrade ? (
                    <button
                      onClick={() => handleUpgrade(p)}
                      disabled={isUpgrading}
                      className={`
                        w-full py-4 rounded-3xl font-black transition-all text-base flex items-center justify-center gap-2
                        ${
                          isHighlighted
                            ? "bg-[#FF6B2B] hover:bg-[#E04400] text-white shadow-xl shadow-orange-100"
                            : "bg-[#1a202c] hover:bg-[#2d3748] text-white shadow-xl shadow-gray-200"
                        }
                        ${isUpgrading ? "opacity-70 cursor-wait" : "hover:scale-[1.02]"}
                      `}
                    >
                      {isUpgrading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Redirecting to Stripe...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          Upgrade Plan
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-4 rounded-3xl font-black transition-all text-base bg-gray-100 text-gray-400 cursor-not-allowed"
                    >
                      Not Available
                    </button>
                  )}

                  {isHighlighted && (
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#FF6B2B]">
                        <Shield className="w-3 h-3" /> Secure Payment via
                        Stripe
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
