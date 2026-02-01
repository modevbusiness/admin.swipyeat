"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Receipt
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRestaurant } from "@/contexts/AuthProvider";

interface UsageMetric {
  label: string;
  current: number;
  limit: number;
  icon: React.ReactNode;
  unit?: string;
}

export default function SubscriptionPage() {
  const { restaurant, loading: isLoadingRestaurant } = useRestaurant();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [savedCard, setSavedCard] = useState<any>(null);

  useEffect(() => {
    if (restaurant) {
      fetchSubscriptionData();
      loadSavedCard();
    }
  }, [restaurant]);

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
      // 2. Get active subscription (fallback to latest if no current specified)
      const { data: subs, error: sError } = await supabase
        .from("subscriptions")
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false });

      if (sError) throw sError;

      const subscription = subs?.find((s: any) => s.is_current) || subs?.[0];

      // 3. Get all available plans
      const { data: plans, error: pError } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true);

      if (pError) throw pError;

      // 4. Get usage counts
      const [staffCount, menuItemsCount, ordersCount] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurant.id),
        supabase.from("menu_items").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurant.id),
        supabase.from("orders").select("id", { count: "exact", head: true })
          .eq("restaurant_id", restaurant.id)
          .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      ]);

      setData({
        restaurant,
        subscription: subscription || null,
        plan: subscription?.subscription_plans || null,
        allPlans: plans || [],
        usage: {
          tables: {
            current: restaurant.number_of_tables || 0,
            limit: subscription?.subscription_plans?.max_tables || 20
          },
          staff: {
            current: staffCount.count || 0,
            limit: subscription?.subscription_plans?.max_staff || 10
          },
          menuItems: {
            current: menuItemsCount.count || 0,
            limit: subscription?.subscription_plans?.max_menu_items || 100
          },
          orders: {
            current: ordersCount.count || 0,
            limit: 5000 // Static limit as requested
          }
        }
      });
    } catch (err: any) {
      console.error("Error fetching subscription data:", err);
      setError(err.message || "An unknown error occurred");
      // Fallback for missing data if restaurant exists but queries fail
      if (!data && err.message?.includes('not found')) {
        setData(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#559701]" />
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
          className="px-6 py-2 bg-[#559701] text-white rounded-xl font-bold shadow-lg shadow-green-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  const plan = data?.plan;
  const subscription = data?.subscription;



  return (
    <div className="w-full mx-auto p-6 space-y-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Subscription & Usage</h1>
          <p className="text-gray-500 mt-1 font-medium">Manage your plan, billing history, and resource limits</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
            Save 10% on Yearly
          </span>
          <Link
            href={`/dashboard/subscription/pricing`}
            className="bg-gradient-to-r from-[#559701] to-[#6fb301] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-green-200 hover:scale-[1.02] transition-all"
          >
            Upgrade to Premium
          </Link>
        </div>
      </div>

      <div className="space-y-8">
        <div className="space-y-8">
          {/* Current Plan Card */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

            <div className="relative flex flex-col justify-between gap-6">
              {/* Header: Plan Name & Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-extrabold text-gray-900">{plan?.name || "Free Trial"}</h2>
                  <span className={`
                    text-[10px] uppercase tracking-widest font-black px-3 py-1.5 rounded-lg border
                    ${(subscription?.status === 'canceled' || subscription?.status === 'cancelled')
                      ? "bg-red-50 text-red-600 border-red-100"
                      : "bg-green-50 text-green-600 border-green-100"}
                  `}>
                    {(subscription?.status === 'canceled' || subscription?.status === 'cancelled') ? "CANCELLED" : (subscription?.status || "Active")}
                  </span>
                </div>
              </div>

              {/* Price & Cycle Calculation */}
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-gray-900">
                    {(() => {
                      const cycle = subscription?.billing_cycle || 'monthly';
                      const monthlyPrice = parseFloat(plan?.price_monthly || "0");

                      if (cycle === '6 months') {
                        return `${(monthlyPrice * 6).toFixed(2)}`;
                      }
                      if (cycle === 'yearly') {
                        return `${plan?.price_yearly || (monthlyPrice * 12).toFixed(2)}`;
                      }
                      return `${monthlyPrice.toFixed(2)}`;
                    })()} <span className="text-2xl">DH</span>
                  </span>
                  <span className="text-gray-500 font-bold uppercase text-xs tracking-wider">
                    / {subscription?.billing_cycle || 'month'}
                  </span>
                </div>
                {/* Monthly Breakdown for longer cycles */}
                {subscription?.billing_cycle === '6 months' && (
                  <p className="text-sm font-medium text-gray-500 mt-1">
                    ({parseFloat(plan?.price_monthly || "0").toFixed(2)} DH / month)
                  </p>
                )}
              </div>

              {/* Dates Grid - Made responsive */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-2xl p-5 border border-gray-100 max-w-2xl">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Started On</p>
                  <p className="font-bold text-gray-700">
                    {subscription?.started_at ? new Date(subscription.started_at).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'long', day: 'numeric'
                    }) : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                    {subscription?.auto_renew ? "Renews On" : "Expires On"}
                  </p>
                  <p className="font-bold text-gray-700">
                    {subscription?.ends_at ? new Date(subscription.ends_at).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'long', day: 'numeric'
                    }) : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>


          {/* Usage Metrics Grid */}
          <div className="space-y-6">
            <h3 className="text-xl font-extrabold text-gray-900">Usage Metrics</h3>
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



function UsageCard({ label, current, limit, icon, unit = "" }: UsageMetric) {
  const percentage = Math.min(Math.round((current / limit) * 100), 100);
  const isHigh = percentage > 80;

  // Format numbers for display (e.g. 2.4k / 5k)
  const formatValue = (val: number) => {
    if (val >= 1000) return (val / 1000).toFixed(1) + (unit || "");
    return val;
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 group hover:border-green-100 transition-all">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gray-50/80 rounded-xl group-hover:bg-green-50 transition-colors">
            {React.cloneElement(icon as React.ReactElement<any>, { className: "w-5 h-5 text-gray-400 group-hover:text-green-600" })}
          </div>
          <p className="font-bold text-gray-700">{label}</p>
        </div>
        <p className="text-sm font-bold text-gray-400">
          <span className="text-gray-900">{formatValue(current)}</span> / {formatValue(limit)}
        </p>
      </div>

      <div className="space-y-2">
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-out rounded-full ${isHigh ? 'bg-orange-400' : 'bg-green-500'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className={`text-[10px] font-black uppercase tracking-widest ${isHigh ? 'text-orange-500' : 'text-gray-400'}`}>
          {percentage}% of capacity used
        </p>
      </div>
    </div>
  );
}
