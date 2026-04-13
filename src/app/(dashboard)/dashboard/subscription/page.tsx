"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  ChevronRight,
  Download,
  Layout,
  Users,
  Utensils,
  ShoppingCart,
  Crown,
  HelpCircle,
  Loader2,
  CheckCircle2,
  X,
  Receipt,
  Clock,
  RefreshCw,
  AlertTriangle,
  Ban,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";

interface UsageMetric {
  label: string;
  current: number;
  limit: number;
  icon: React.ReactNode;
  unit?: string;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { restaurant, loading: isLoadingRestaurant, refreshAuth } = useAuth();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const upgraded = searchParams.get("upgraded");
  const sessionId = searchParams.get("session_id");

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [savedCard, setSavedCard] = useState<any>(null);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isTogglingAutoRenew, setIsTogglingAutoRenew] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  // Verify Stripe session and update subscription in DB
  const verifySession = useCallback(async () => {
    if (!sessionId || isVerifying) return;
    setIsVerifying(true);
    try {
      const res = await fetch("/api/stripe/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const result = await res.json();
      if (result.success) {
        setShowUpgradeBanner(true);
        // Clean the URL
        router.replace("/dashboard/subscription", { scroll: false });
        // Refetch data to show the new plan
        if (restaurant) {
          await fetchSubscriptionData();
        }
      }
    } catch (err) {
      console.error("Session verification failed:", err);
    } finally {
      setIsVerifying(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (restaurant) {
      fetchSubscriptionData();
      loadSavedCard();
    }
  }, [restaurant]);

  // Auto-verify if returning from Stripe
  useEffect(() => {
    if (upgraded === "true" && sessionId && restaurant && !isVerifying) {
      verifySession();
    } else if (upgraded === "true" && !sessionId) {
      setShowUpgradeBanner(true);
    }
  }, [upgraded, sessionId, restaurant]);

  // Realtime listener: auto-refresh when subscription changes in DB
  useEffect(() => {
    if (!restaurant?.id) return;

    const channel = supabase
      .channel('sub-page-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        () => {
          console.log('[SUB PAGE] Realtime change detected, refetching...');
          fetchSubscriptionData();
        }
      )
      .subscribe();

    // Polling fallback (every 30s) in case realtime is not enabled
    const pollInterval = setInterval(() => {
      fetchSubscriptionData();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [restaurant?.id]);

  const loadSavedCard = () => {
    if (!restaurant) return;
    const stored = localStorage.getItem(`payment_method_${restaurant.slug}`);
    if (stored) {
      try {
        setSavedCard(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved card", e);
      }
    }
  };

  const fetchSubscriptionData = async () => {
    if (!restaurant) return;

    setIsLoading(true);
    try {
      const { data: subs, error: sError } = await supabase
        .from("subscriptions")
        .select(`*, subscription_plans (*)`)
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false });

      if (sError) throw sError;

      const subscription =
        subs?.find((s: any) => s.is_current) || subs?.[0];

      const { data: plans, error: pError } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true);

      if (pError) throw pError;

      const [staffCount, menuItemsCount, ordersCount] = await Promise.all([
        supabase
          .from("users")
          .select("id", { count: "exact", head: true })
          .eq("restaurant_id", restaurant.id),
        supabase
          .from("menu_items")
          .select("id", { count: "exact", head: true })
          .eq("restaurant_id", restaurant.id),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("restaurant_id", restaurant.id)
          .gte(
            "created_at",
            new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            ).toISOString()
          ),
      ]);

      setData({
        restaurant,
        subscription: subscription || null,
        plan: subscription?.subscription_plans || null,
        allPlans: plans || [],
        usage: {
          tables: {
            current: restaurant.number_of_tables || 0,
            limit: subscription?.subscription_plans?.max_tables || 20,
          },
          staff: {
            current: staffCount.count || 0,
            limit: subscription?.subscription_plans?.max_staff || 10,
          },
          menuItems: {
            current: menuItemsCount.count || 0,
            limit: subscription?.subscription_plans?.max_menu_items || 100,
          },
          orders: {
            current: ordersCount.count || 0,
            limit: 5000,
          },
        },
      });
    } catch (err: any) {
      console.error("Error fetching subscription data:", err);
      setError(err.message || "An unknown error occurred");
      if (!data && err.message?.includes("not found")) {
        setData(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!restaurant || isCancelling) return;
    setIsCancelling(true);
    try {
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          status: "canceled",
          auto_renew: false,
        })
        .eq("restaurant_id", restaurant.id)
        .eq("is_current", true);

      if (updateError) throw updateError;

      setShowCancelConfirm(false);
      await fetchSubscriptionData();
      await refreshAuth();
    } catch (err: any) {
      console.error("Cancel error:", err);
      alert("Failed to cancel subscription. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    if (!restaurant || isTogglingAutoRenew) return;
    setIsTogglingAutoRenew(true);
    try {
      const newValue = !data?.subscription?.auto_renew;
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({ auto_renew: newValue })
        .eq("restaurant_id", restaurant.id)
        .eq("is_current", true);

      if (updateError) throw updateError;

      await fetchSubscriptionData();
      await refreshAuth();
    } catch (err: any) {
      console.error("Toggle auto-renew error:", err);
      alert("Failed to update auto-renew. Please try again.");
    } finally {
      setIsTogglingAutoRenew(false);
    }
  };

  const handleResumeSubscription = async () => {
    if (!restaurant || isResuming) return;
    setIsResuming(true);
    try {
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          status: "active",
          auto_renew: true,
        })
        .eq("restaurant_id", restaurant.id)
        .eq("status", "canceled") // Make sure we only resume the canceled one
        .eq("is_current", true);

      if (updateError) throw updateError;

      // Refetch
      await fetchSubscriptionData();
      await refreshAuth();
    } catch (err: any) {
      console.error("Resume error:", err);
      alert("Failed to resume subscription. Please try again.");
    } finally {
      setIsResuming(false);
    }
  };

  if (isLoading || isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF4D00]" />
        {isVerifying && (
          <p className="text-sm font-bold text-gray-500">
            Verifying your payment...
          </p>
        )}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-red-500 font-bold text-center max-w-sm">
          {error || "Failed to load subscription data."}
        </p>
        <button
          onClick={() => {
            setError(null);
            fetchSubscriptionData();
          }}
          className="px-6 py-2 bg-[#FF4D00] text-white rounded-xl font-bold shadow-lg shadow-orange-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  const plan = data?.plan;
  const subscription = data?.subscription;
  const planType = plan?.plan_type || "free_trial";
  const isFreeTrial = planType === "free_trial";
  const isCanceled = subscription?.status === "canceled" || subscription?.status === "cancelled";

  // Calculate trial/subscription remaining days
  const getRemainingDays = () => {
    if (!subscription?.ends_at) return null;
    const now = new Date();
    const end = new Date(subscription.ends_at);
    const diff = Math.ceil(
      (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff;
  };

  const remainingDays = getRemainingDays();
  const isExpiringSoon = remainingDays !== null && remainingDays <= 7 && remainingDays > 0;
  const isExpired = remainingDays !== null && remainingDays <= 0;

  // Plan-specific colors
  const planAccentColors: Record<
    string,
    {
      bg: string;
      badge: string;
      text: string;
      gradientFrom: string;
      gradientTo: string;
    }
  > = {
    free_trial: {
      bg: "bg-blue-50",
      badge: "bg-blue-50 text-blue-600 border-blue-100",
      text: "text-blue-600",
      gradientFrom: "from-blue-500",
      gradientTo: "to-blue-600",
    },
    pro: {
      bg: "bg-orange-50",
      badge: "bg-orange-50 text-orange-600 border-orange-100",
      text: "text-orange-600",
      gradientFrom: "from-[#FF4D00]",
      gradientTo: "to-[#FF6B2B]",
    },
    unlimited: {
      bg: "bg-violet-50",
      badge: "bg-violet-50 text-violet-600 border-violet-100",
      text: "text-violet-600",
      gradientFrom: "from-violet-500",
      gradientTo: "to-violet-600",
    },
  };
  const colors = planAccentColors[planType] || planAccentColors.free_trial;

  return (
    <div className="w-full mx-auto p-6 space-y-8 bg-gray-50/50 min-h-screen">
      {/* Upgrade Success Banner */}
      {showUpgradeBanner && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-bold text-green-800">
                Plan upgraded successfully! 🎉
              </p>
              <p className="text-xs text-green-600">
                Your new plan is now active. Enjoy the new features!
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowUpgradeBanner(false)}
            className="text-green-400 hover:text-green-600 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Trial Expiring Soon Warning */}
      {isFreeTrial && isExpiringSoon && !isCanceled && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-sm font-bold text-amber-800">
                Your free trial expires in {remainingDays} day{remainingDays !== 1 ? "s" : ""}!
              </p>
              <p className="text-xs text-amber-600">
                Upgrade now to keep all your data and features.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/subscription/pricing"
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors"
          >
            Upgrade Now
          </Link>
        </div>
      )}

      {/* Expired Warning */}
      {isExpired && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-bold text-red-800">
                Your subscription has expired
              </p>
              <p className="text-xs text-red-600">
                Upgrade to restore full access to your dashboard features.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/subscription/pricing"
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors"
          >
            Renew Plan
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Subscription & Usage
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Manage your plan, billing history, and resource limits
          </p>
        </div>
        <div className="flex items-center gap-3">
          {planType !== "unlimited" && !isCanceled && (
            <>
              <span className="text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                Save 17% on Yearly
              </span>
              <Link
                href={`/dashboard/subscription/pricing`}
                className={`bg-gradient-to-r ${colors.gradientFrom} ${colors.gradientTo} text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-200 hover:scale-[1.02] transition-all`}
              >
                {planType === "pro"
                  ? "Upgrade to Unlimited"
                  : "Upgrade Plan"}
              </Link>
            </>
          )}
          {planType === "unlimited" && !isCanceled && (
            <span className="text-sm font-bold text-violet-600 bg-violet-50 px-4 py-2 rounded-full border border-violet-100 flex items-center gap-2">
              <Crown className="w-4 h-4" /> Maximum Plan Active
            </span>
          )}
          {isCanceled && (
            isExpired ? (
              <Link
                href="/dashboard/subscription/pricing"
                className="bg-gradient-to-r from-[#FF4D00] to-[#FF6B2B] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-200 hover:scale-[1.02] transition-all"
              >
                Reactivate Plan
              </Link>
            ) : (
              <button
                onClick={handleResumeSubscription}
                disabled={isResuming}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-green-200 hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isResuming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Resuming...
                  </>
                ) : (
                  "Resume Plan"
                )}
              </button>
            )
          )}
        </div>
      </div>

      <div className="space-y-8">
        <div className="space-y-8">
          {/* Current Plan Card */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
            <div
              className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110`}
            />

            <div className="relative flex flex-col justify-between gap-6">
              {/* Header: Plan Name & Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-extrabold text-gray-900">
                    {plan?.name || "Free Trial"}
                  </h2>
                  <span
                    className={`
                    text-[10px] uppercase tracking-widest font-black px-3 py-1.5 rounded-lg border
                    ${isCanceled
                      ? "bg-red-50 text-red-600 border-red-100"
                      : isExpired
                        ? "bg-gray-100 text-gray-500 border-gray-200"
                        : colors.badge
                    }
                  `}
                  >
                    {isCanceled
                      ? "CANCELLED"
                      : isExpired
                        ? "EXPIRED"
                        : subscription?.status || "Active"}
                  </span>
                </div>
              </div>

              {/* Price & Cycle */}
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-gray-900">
                    {(() => {
                      const cycle =
                        subscription?.billing_cycle || "monthly";
                      const monthlyPrice = parseFloat(
                        plan?.price_monthly || "0"
                      );
                      if (cycle === "yearly") {
                        return `${
                          plan?.price_yearly ||
                          (monthlyPrice * 12).toFixed(2)
                        }`;
                      }
                      return `${monthlyPrice.toFixed(2)}`;
                    })()}{" "}
                    <span className="text-2xl">DH</span>
                  </span>
                  <span className="text-gray-500 font-bold uppercase text-xs tracking-wider">
                    / {subscription?.billing_cycle || "month"}
                  </span>
                </div>
              </div>

              {/* Dates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 rounded-2xl p-5 border border-gray-100 max-w-3xl">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                    Started On
                  </p>
                  <p className="font-bold text-gray-700">
                    {subscription?.started_at
                      ? new Date(
                          subscription.started_at
                        ).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                    {isFreeTrial
                      ? "Trial Ends"
                      : subscription?.auto_renew
                        ? "Renews On"
                        : "Expires On"}
                  </p>
                  <p
                    className={`font-bold ${
                      isExpiringSoon
                        ? "text-amber-600"
                        : isExpired
                          ? "text-red-600"
                          : "text-gray-700"
                    }`}
                  >
                    {subscription?.ends_at
                      ? new Date(
                          subscription.ends_at
                        ).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "-"}
                    {remainingDays !== null && remainingDays > 0 && (
                      <span
                        className={`ml-2 text-xs font-bold ${
                          isExpiringSoon
                            ? "text-amber-500"
                            : "text-gray-400"
                        }`}
                      >
                        ({remainingDays}d left)
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                    Auto-Renew
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleToggleAutoRenew}
                      disabled={isTogglingAutoRenew || isFreeTrial || isCanceled}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                        subscription?.auto_renew
                          ? "bg-green-500"
                          : "bg-gray-200"
                      } ${(isTogglingAutoRenew || isFreeTrial || isCanceled) ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-90"}`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm ${
                          subscription?.auto_renew ? "left-6" : "left-1"
                        }`}
                      />
                      {isTogglingAutoRenew && (
                        <Loader2 className="w-3 h-3 animate-spin text-white absolute top-1.5 left-4" />
                      )}
                    </button>
                    <p
                      className={`font-bold text-sm ${
                        subscription?.auto_renew
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      {subscription?.auto_renew ? "On" : "Off"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cancel / Manage Subscription Actions */}
              {!isFreeTrial && !isCanceled && (
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 max-w-3xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-50 rounded-xl">
                        <Ban className="w-4 h-4 text-red-400" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-700 text-sm">Cancel Subscription</p>
                        <p className="text-xs text-gray-400">You can reactivate anytime. Data is preserved.</p>
                      </div>
                    </div>
                    {!showCancelConfirm ? (
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="text-sm font-bold text-red-400 hover:text-red-600 border border-red-200 hover:border-red-300 px-4 py-2 rounded-xl transition-all hover:bg-red-50"
                      >
                        Cancel Plan
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCancelSubscription}
                          disabled={isCancelling}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          {isCancelling ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Cancelling...
                            </>
                          ) : (
                            "Yes, Cancel"
                          )}
                        </button>
                        <button
                          onClick={() => setShowCancelConfirm(false)}
                          className="text-sm font-bold text-gray-500 hover:text-gray-700 px-3 py-2 transition-colors"
                        >
                          Keep
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Resume Subscription Actions */}
              {!isFreeTrial && isCanceled && !isExpired && (
                <div className="bg-green-50 rounded-2xl p-5 border border-green-100 max-w-3xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-xl">
                        <RefreshCw className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-bold text-green-800 text-sm">Resume Subscription</p>
                        <p className="text-xs text-green-600">Your plan hasn't expired yet. You can resume it immediately to keep auto-renew active.</p>
                      </div>
                    </div>
                    <button
                        onClick={handleResumeSubscription}
                        disabled={isResuming}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isResuming ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Resuming...
                        </>
                        ) : (
                        "Resume Plan"
                        )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Usage Metrics Grid */}
          <div className="space-y-6">
            <h3 className="text-xl font-extrabold text-gray-900">
              Usage Metrics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <UsageCard
                label="Tables"
                current={data.usage.tables.current}
                limit={data.usage.tables.limit}
                icon={<Layout className="w-5 h-5" />}
              />
              <UsageCard
                label="Staff Members"
                current={data.usage.staff.current}
                limit={data.usage.staff.limit}
                icon={<Users className="w-5 h-5" />}
              />
              <UsageCard
                label="Monthly Orders"
                current={data.usage.orders.current}
                limit={data.usage.orders.limit}
                unit="k"
                icon={<ShoppingCart className="w-5 h-5" />}
              />
              <UsageCard
                label="Menu Items"
                current={data.usage.menuItems.current}
                limit={data.usage.menuItems.limit}
                icon={<Utensils className="w-5 h-5" />}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsageCard({
  label,
  current,
  limit,
  icon,
  unit = "",
}: UsageMetric) {
  const percentage = Math.min(Math.round((current / limit) * 100), 100);
  const isHigh = percentage > 80;

  const formatValue = (val: number) => {
    if (val >= 1000) return (val / 1000).toFixed(1) + (unit || "");
    return val;
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 group hover:border-orange-100 transition-all">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gray-50/80 rounded-xl group-hover:bg-orange-50 transition-colors">
            {React.cloneElement(icon as React.ReactElement<any>, {
              className:
                "w-5 h-5 text-gray-400 group-hover:text-orange-600",
            })}
          </div>
          <p className="font-bold text-gray-700">{label}</p>
        </div>
        <p className="text-sm font-bold text-gray-400">
          <span className="text-gray-900">{formatValue(current)}</span> /{" "}
          {formatValue(limit)}
        </p>
      </div>

      <div className="space-y-2">
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-out rounded-full ${
              isHigh ? "bg-orange-400" : "bg-orange-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p
          className={`text-[10px] font-black uppercase tracking-widest ${
            isHigh ? "text-orange-500" : "text-gray-400"
          }`}
        >
          {percentage}% of capacity used
        </p>
      </div>
    </div>
  );
}
