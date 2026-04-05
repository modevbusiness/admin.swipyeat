"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Package,
  Plus,
  UserPlus,
  QrCode as QrCodeIcon,
  Layers,
} from "lucide-react";
import { getDashboardStatsAction } from "@/app/actions/dashboard";
import { toast } from "sonner";
import { useRestaurant } from "@/contexts/AuthProvider";

export default function DashboardPage() {
  const router = useRouter();
  const { restaurant, loading: restaurantLoading } = useRestaurant();
  const restaurantSlug = restaurant?.slug;

  const [isLoading, setIsLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    todayOrders: 0,
    activeOrders: 0,
    todayRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const initDashboard = async () => {
      if (!restaurant?.id) return;

      try {
        const statsRes = await getDashboardStatsAction(restaurant.id);
        if (statsRes.success && statsRes.data) {
          setStatsData({
            todayOrders: statsRes.data.todayOrders,
            activeOrders: statsRes.data.activeOrders,
            todayRevenue: statsRes.data.todayRevenue,
          });
          setRecentOrders(statsRes.data.recentOrders);
        }
      } catch (error) {
        console.error("Dashboard error:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    if (!restaurantLoading && restaurant) {
      initDashboard();
    }
  }, [restaurant, restaurantLoading]);

  const stats = [
    {
      title: "Today Orders",
      value: isLoading ? "-" : statsData.todayOrders.toString(),
      change: "Daily count",
      isPositive: true,
      icon: ShoppingCart,
      iconBg: "bg-[#e6f4ea]",
      iconColor: "text-[#FF4D00]",
    },
    {
      title: "Active Orders",
      value: isLoading ? "-" : statsData.activeOrders.toString(),
      change: "In progress",
      isPositive: true,
      icon: Package,
      iconBg: "bg-[#fff3e0]",
      iconColor: "text-[#f17900]",
    },
    {
      title: "Revenue (Today)",
      value: isLoading ? "-" : `${statsData.todayRevenue.toLocaleString()} DH`,
      change: "Served orders",
      isPositive: true,
      icon: DollarSign,
      iconBg: "bg-[#e6f4ea]",
      iconColor: "text-[#FF4D00]",
    },
  ];

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
      case "ordered":
        return "bg-gray-100 text-gray-600";
      case "confirmed":
        return "bg-orange-100 text-orange-600";
      case "preparing":
        return "bg-blue-100 text-blue-600";
      case "ready":
        return "bg-orange-100 text-orange-600";
      case "served":
        return "bg-gray-800 text-white";
      case "paid":
        return "bg-[#FF4D00] text-white";
      case "canceled":
      case "cancelled":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-500";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Show loading while restaurant is loading
  if (restaurantLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <div className="md:flex md:space-y-0 space-y-2 items-start justify-between">
                <div className={`${stat.iconBg} max-w-max ${stat.iconColor} p-3 rounded-xl`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-[#FF4D00]" />
                  <span className="text-sm font-semibold text-[#FF4D00]">
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">{stat.title}</p>
                <h3 className="text-3xl font-bold text-[#1a202c] mt-1">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="p-5 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#1a202c]">Recent Orders</h2>
              {statsData.activeOrders > 0 && (
                <span className="w-2 h-2 bg-[#f17900] rounded-full animate-pulse"></span>
              )}
            </div>
            <button
              onClick={() => router.push(`/dashboard/orders`)}
              className="text-sm text-[#FF4D00] font-semibold hover:underline"
            >
              View All
            </button>
          </div>

          {/* Table Header */}
          <div className="px-5 py-3 grid grid-cols-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">
            <span>Order</span>
            <span>Table</span>
            <span>Time</span>
            <span>Status</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-50 flex-1">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400">Loading orders...</div>
            ) : recentOrders.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center text-gray-400">
                <Layers className="w-8 h-8 opacity-20 mb-2" />
                <p>No orders yet today</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="px-5 py-4 grid grid-cols-4 items-center hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/orders`)}
                >
                  <div>
                    <span className="block text-sm font-bold text-[#1a202c]">{order.order_number}</span>
                    <span className="text-xs text-orange-600 font-medium">{order.total_amount} DH</span>
                  </div>
                  <span className="text-sm text-gray-600">{order.table_number || 'N/A'}</span>
                  <span className="text-sm text-gray-500">{formatTimeAgo(order.created_at)}</span>
                  <span className="">
                    <span
                      className={`inline-flex px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-lg border border-transparent ${getStatusStyle(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-bold text-[#1a202c] mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/dashboard/menu`)}
                className="w-full flex items-center gap-4 p-3 rounded-xl bg-[#f7fafc] hover:bg-gray-100 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-[#e6f4ea] rounded-lg flex items-center justify-center">
                  <Plus className="w-5 h-5 text-[#FF4D00]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a202c]">Add Menu Item</p>
                  <p className="text-xs text-gray-500">Create a new dish entry</p>
                </div>
              </button>

              <button
                onClick={() => router.push(`/dashboard/staff`)}
                className="w-full flex items-center gap-4 p-3 rounded-xl bg-[#f7fafc] hover:bg-gray-100 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-[#e6f4ea] rounded-lg flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-[#FF4D00]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a202c]">Add Staff Member</p>
                  <p className="text-xs text-gray-500">Onboard kitchen staff</p>
                </div>
              </button>

              <button
                onClick={() => router.push(`/dashboard/QRCodetables`)}
                className="w-full flex items-center gap-4 p-3 rounded-xl bg-[#f7fafc] hover:bg-gray-100 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-[#e6f4ea] rounded-lg flex items-center justify-center">
                  <QrCodeIcon className="w-5 h-5 text-[#FF4D00]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a202c]">Generate QR Code</p>
                  <p className="text-xs text-gray-500">Digital menu access</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
