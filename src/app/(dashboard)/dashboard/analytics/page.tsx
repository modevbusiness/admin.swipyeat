"use client";

import React, { useState, useEffect } from "react";
import {
    Users,
    ShoppingBag,
    ChevronDown,
    Search,
    Calendar,
    AlertCircle,
    Loader2,
    CheckCircle2,
    PieChart,
    BarChart3,
    Flame,
    User,
    DollarSign,
    Clock1
} from "lucide-react";
import { getAnalyticsDataAction } from "@/app/actions/analytics";
import { useRestaurant } from "@/contexts/AuthProvider";

export default function AnalyticsPage() {
    const { restaurant, loading: restaurantLoading } = useRestaurant();

    const [timeframe, setTimeframe] = useState<'today' | '7days' | '30days'>('today');
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!restaurantLoading && restaurant) {
            fetchAnalytics();
        }
    }, [timeframe, restaurant, restaurantLoading]);

    const fetchAnalytics = async () => {
        if (!restaurant?.id) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await getAnalyticsDataAction(restaurant.id, timeframe);
            if (result.success) {
                setData(result.data);
            } else {
                console.error("Analytics fetch failed:", result.error);
                setError("Failed to load analytics data. Please try again.");
            }
        } catch (error) {
            console.error("Error fetching analytics:", error);
            setError("Network error loading analytics");
        } finally {
            setIsLoading(false);
        }
    };

    const timeframeLabels = {
        today: "Today",
        '7days': "Last 7 Days",
        '30days': "Last 30 Days"
    };

    if ((isLoading || restaurantLoading) && !data) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#559701]" />
                    <p className="text-gray-500 font-medium font-outfit">Cooking your data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10 font-outfit">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-[#1a202c] tracking-tight">Kitchen Intelligence</h1>
                    <p className="text-gray-500 mt-1 font-medium">Real-time operational suite for <span className="text-[#559701] font-bold">{restaurant?.name}</span></p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 shadow-inner">
                        {(['today', '7days', '30days'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTimeframe(t)}
                                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ease-in-out ${timeframe === t
                                    ? "bg-white text-[#559701] shadow-lg shadow-gray-100 ring-1 ring-black/5"
                                    : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
                                    }`}
                            >
                                {timeframeLabels[t]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-3xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            {/* Metric Cards Grid - Including Revenue */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 sm:gap-6 gap-3">
                {/* Revenue Card - Same style as others */}
                <div className="group relative bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden col-span-1">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6 duration-300">
                            <DollarSign className="w-7 h-7 text-green-500" />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">Revenue</p>
                    <h3 className="text-2xl font-semibold text-[#1a202c] tracking-tight">
                        {(data?.totalRevenue || 0).toLocaleString()} <span className="text-sm text-gray-400">DH</span>
                    </h3>
                </div>

                {[
                    {
                        label: "Total Orders",
                        value: data?.totalOrders || "0",
                        icon: ShoppingBag,
                        color: "bg-blue-500",
                        bg: "bg-blue-50"
                    },
                    {
                        label: "Avg. Prep Time",
                        value: data?.avgPrepTime || "0m",
                        icon: Clock1,
                        color: "bg-orange-500",
                        bg: "bg-orange-50"
                    },
                    {
                        label: "Cancelled Orders",
                        value: `${data?.canceledOrders || 0}`,
                        icon: AlertCircle,
                        color: "bg-red-500",
                        bg: "bg-red-50"
                    },
                    {
                        label: "Order Accuracy",
                        value: data?.orderAccuracy || "0%",
                        icon: CheckCircle2,
                        color: "bg-purple-500",
                        bg: "bg-purple-50"
                    },
                ].map((stat, i) => (
                    <div key={i} className="group relative bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                        <div className={`absolute -right-4 -top-4 w-24 h-24 ${stat.bg} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                        <div className="flex items-center justify-between mb-6">
                            <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6 duration-300`}>
                                <stat.icon className={`w-7 h-7 ${stat.color.replace('bg-', 'text-')}`} />
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-2xl font-semibold text-[#1a202c] tracking-tight">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Orders Chart - Adapts to timeframe */}
                    <div className="bg-white p-5 sm:p-8 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                            <div>
                                <h3 className="text-lg sm:text-xl font-black text-[#1a202c]">Orders Overview</h3>
                                <p className="text-xs sm:text-sm text-gray-400 font-medium">
                                    {timeframe === 'today' ? 'Hourly order distribution' : 
                                     timeframe === '7days' ? 'Orders in the last 7 days' : 'Orders in the last 30 days'}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                                    <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase">Orders</span>
                                </div>
                                <div className="text-right bg-blue-50 px-3 py-1.5 rounded-xl">
                                    <p className="text-[10px] text-blue-600 font-bold uppercase">Total</p>
                                    <p className="text-sm sm:text-base font-black text-blue-600">
                                        {data?.totalOrders || 0} orders
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Chart Area with Grid Background */}
                        <div className="relative bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                            {/* Horizontal Grid Lines */}
                            <div className="absolute inset-4 flex flex-col justify-between pointer-events-none">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-full border-b border-dashed border-gray-200" />
                                ))}
                            </div>
                            
                            {/* TODAY: Show hourly data */}
                            {timeframe === 'today' ? (
                                <div className="h-[220px] sm:h-[280px] w-full flex items-end gap-1 sm:gap-2 overflow-x-auto relative z-10">
                                    {data?.hourlyTraffic?.length > 0 ? (
                                        data.hourlyTraffic.map((d: any, i: number) => {
                                            const maxVal = Math.max(...data.hourlyTraffic.map((t: any) => t.count)) || 1;
                                            const heightPct = d.count > 0 ? Math.max((d.count / maxVal) * 85, 15) : 6;
                                            const isHighest = d.count === maxVal && d.count > 0;
                                            return (
                                                <div key={i} className="flex-1 min-w-[28px] sm:min-w-[36px] flex flex-col items-center group/bar relative">
                                                    <div className={`mb-1 text-xs sm:text-sm font-black transition-all
                                                        ${d.count > 0 
                                                            ? (isHighest ? 'text-blue-600 text-sm sm:text-base' : 'text-gray-800') 
                                                            : 'text-gray-300 text-[10px]'
                                                        }
                                                    `}>
                                                        {d.count}
                                                    </div>
                                                    <div className="w-full flex-1 flex items-end">
                                                        <div
                                                            className={`w-full rounded-t-lg transition-all duration-300 cursor-pointer relative
                                                                ${isHighest 
                                                                    ? 'bg-blue-500 shadow-lg shadow-blue-500/30' 
                                                                    : d.count > 0 
                                                                        ? 'bg-blue-400 hover:bg-blue-500 hover:shadow-md hover:shadow-blue-500/20' 
                                                                        : 'bg-gray-100'
                                                                }
                                                            `}
                                                            style={{ height: `${heightPct}%` }}
                                                        >
                                                            {isHighest && (
                                                                <div className="absolute top-1 left-1/2 -translate-x-1/2">
                                                                    <div className="text-white text-[7px] font-bold">★</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className={`mt-2 text-[8px] sm:text-[10px] font-bold tracking-tight text-center
                                                        ${isHighest ? 'text-blue-600' : 'text-gray-400'}
                                                    `}>
                                                        {i}h
                                                    </div>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                            <BarChart3 className="w-12 h-12 text-gray-200 mb-3" />
                                            <p className="font-medium text-sm">No orders data yet</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* 7 DAYS / 30 DAYS: Show daily data */
                                <div className="h-[220px] sm:h-[280px] w-full flex items-end gap-2 sm:gap-3 overflow-x-auto relative z-10">
                                    {data?.revenueTrends?.length > 0 ? (
                                        (() => {
                                            const totalRevenue = data.revenueTrends.reduce((sum: number, t: any) => sum + t.value, 0) || 1;
                                            const totalOrders = data.totalOrders || 0;
                                            
                                            return data.revenueTrends.map((d: any, i: number) => {
                                                // Calculate estimated orders based on revenue proportion
                                                const orderCount = Math.round((d.value / totalRevenue) * totalOrders);
                                                const maxOrders = Math.max(...data.revenueTrends.map((t: any) => Math.round((t.value / totalRevenue) * totalOrders))) || 1;
                                                const heightPct = orderCount > 0 ? Math.max((orderCount / maxOrders) * 85, 12) : 6;
                                                const isHighest = orderCount === maxOrders && orderCount > 0;
                                                
                                                return (
                                                    <div key={i} className="flex-1 min-w-[40px] sm:min-w-[50px] flex flex-col items-center group/bar relative">
                                                        <div className={`mb-1 text-xs sm:text-sm font-black transition-all
                                                            ${orderCount > 0 
                                                                ? (isHighest ? 'text-blue-600 text-sm sm:text-base' : 'text-gray-800') 
                                                                : 'text-gray-300 text-[10px]'
                                                            }
                                                        `}>
                                                            {orderCount}
                                                        </div>
                                                        <div className="w-full flex-1 flex items-end">
                                                            <div
                                                                className={`w-full rounded-t-lg transition-all duration-300 cursor-pointer relative
                                                                    ${isHighest 
                                                                        ? 'bg-blue-500 shadow-lg shadow-blue-500/30' 
                                                                        : orderCount > 0 
                                                                            ? 'bg-blue-400 hover:bg-blue-500 hover:shadow-md hover:shadow-blue-500/20' 
                                                                            : 'bg-gray-100'
                                                                    }
                                                                `}
                                                                style={{ height: `${heightPct}%` }}
                                                            >
                                                                {isHighest && (
                                                                    <div className="absolute top-1 left-1/2 -translate-x-1/2">
                                                                        <div className="text-white text-[7px] font-bold">★</div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className={`mt-2 text-[7px] sm:text-[9px] font-bold tracking-tight text-center
                                                            ${isHighest ? 'text-blue-600' : 'text-gray-400'}
                                                        `}>
                                                            {d.day}
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        })()
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                            <BarChart3 className="w-12 h-12 text-gray-200 mb-3" />
                                            <p className="font-medium text-sm">No orders data yet</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {/* Bottom Stats - Adapts to timeframe */}
                        <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-3 gap-4">
                            {timeframe === 'today' ? (
                                <>
                                    <div className="text-center bg-blue-50 rounded-xl py-3">
                                        <p className="text-[10px] text-blue-600 font-bold uppercase">Peak Hour</p>
                                        <p className="text-base font-black text-blue-700">
                                            {data?.hourlyTraffic?.length > 0 
                                                ? `${data.hourlyTraffic.reduce((max: any, t: any, i: number, arr: any[]) => t.count > (arr[max]?.count || 0) ? i : max, 0)}:00`
                                                : '-'
                                            }
                                        </p>
                                    </div>
                                    <div className="text-center bg-green-50 rounded-xl py-3">
                                        <p className="text-[10px] text-green-600 font-bold uppercase">Most Orders</p>
                                        <p className="text-base font-black text-green-700">
                                            {data?.hourlyTraffic?.length > 0 
                                                ? Math.max(...data.hourlyTraffic.map((t: any) => t.count))
                                                : 0
                                            } <span className="text-xs">orders</span>
                                        </p>
                                    </div>
                                    <div className="text-center bg-orange-50 rounded-xl py-3">
                                        <p className="text-[10px] text-orange-600 font-bold uppercase">Avg/Hour</p>
                                        <p className="text-base font-black text-orange-700">
                                            {data?.hourlyTraffic?.length > 0 
                                                ? (data.hourlyTraffic.reduce((sum: number, t: any) => sum + t.count, 0) / 24).toFixed(1)
                                                : '0'
                                            }
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-center bg-blue-50 rounded-xl py-3">
                                        <p className="text-[10px] text-blue-600 font-bold uppercase">Total Orders</p>
                                        <p className="text-base font-black text-blue-700">
                                            {data?.totalOrders || 0}
                                        </p>
                                    </div>
                                    <div className="text-center bg-green-50 rounded-xl py-3">
                                        <p className="text-[10px] text-green-600 font-bold uppercase">Avg/Day</p>
                                        <p className="text-base font-black text-green-700">
                                            {data?.revenueTrends?.length > 0 
                                                ? Math.round((data?.totalOrders || 0) / data.revenueTrends.length)
                                                : 0
                                            }
                                        </p>
                                    </div>
                                    <div className="text-center bg-orange-50 rounded-xl py-3">
                                        <p className="text-[10px] text-orange-600 font-bold uppercase">Days</p>
                                        <p className="text-base font-black text-orange-700">
                                            {data?.revenueTrends?.length || 0}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Top Categories & Modifiers Grid */}
                    <div className="grid grid-cols-1 w-full md:grid-cols-2 gap-8">
                        {/* Top Categories */}
                        <div className="bg-white p-8 rounded-2xl border w-full border-gray-100 shadow-sm">
                            <h3 className="text-xl font-black text-[#1a202c] mb-6">Top Categories</h3>
                            <div className="space-y-6">
                                {data?.topCategories?.map((cat: any, i: number) => (
                                    <div key={i} className="group">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="font-bold text-gray-700">{cat.name}</span>
                                            <span className="text-sm font-black text-[#1a202c]">{cat.value} sold</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#559701] rounded-full transition-all duration-1000 group-hover:bg-[#437a01]"
                                                style={{ width: `${(cat.value / (data.topCategories[0]?.value || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {(!data?.topCategories?.length) && <p className="text-gray-400 italic">No category data available.</p>}
                            </div>
                        </div>

                        
                    </div>

                    {/* Top Selling Items Enhanced */}
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-[#1a202c]">Menu Superstars</h3>
                            <span className="text-xs font-bold text-[#559701] uppercase tracking-widest">Top 5 Items</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data?.topItems?.map((item: any, i: number) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-lg transition-all">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-200 overflow-hidden relative flex-shrink-0">
                                        <div className="absolute top-0 left-0 bg-[#1a202c] text-white text-[10px] font-black px-2 py-1 rounded-br-md z-10">
                                            #{i + 1}
                                        </div>
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400"><ShoppingBag className="w-6 h-6" /></div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#1a202c] leading-tight mb-1">{item.name}</h4>
                                        <p className="text-xs font-medium text-gray-500">{item.sales} orders · <span className="text-[#559701] font-bold">{item.revenue.toLocaleString()} DH</span></p>
                                    </div>
                                </div>
                            ))}
                            {(!data?.topItems?.length) && <p className="text-gray-400 italic col-span-2 text-center py-4">No top items data available.</p>}
                        </div>
                    </div>

                </div>

                {/* Right Sidebar - Kitchen Efficiency & Staff */}
                <div className="space-y-8">
                    {/* Live Occupancy Gauge */}
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="mb-8 text-center">
                            <h3 className="text-xl font-black text-[#1a202c]">Live Occupancy</h3>
                            <p className="text-sm text-gray-400 font-medium">Real-time table status</p>
                        </div>
                        <div className="relative flex items-center justify-center mb-8">
                            <div className="w-48 h-48 rounded-full flex flex-col items-center justify-center relative">
                                {/* Circular Progress - SVG based */}
                                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    {/* Background Circle */}
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="#f9fafb" strokeWidth="8" />
                                    {/* Progress Circle */}
                                    <circle
                                        cx="50" cy="50" r="45" fill="none" stroke="#559701" strokeWidth="8"
                                        strokeDasharray="282.7" // 2 * pi * 45
                                        strokeDashoffset={282.7 - (282.7 * (data?.liveOccupancy?.percentage || 0)) / 100}
                                        className="transition-all duration-1000 ease-out"
                                        strokeLinecap="round"
                                    />
                                </svg>

                                <div className="z-10 flex flex-col items-center">
                                    <h4 className="text-4xl font-black text-[#1a202c]">
                                        {data?.liveOccupancy?.occupied}/{data?.liveOccupancy?.capacity}
                                    </h4>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Tables Busy</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <span className="w-2.5 h-2.5 bg-[#559701] rounded-full" />
                                    <span className="text-xs font-bold text-gray-600">Occupancy Rate</span>
                                </div>
                                <span className="text-sm font-black text-[#1a202c]">{data?.liveOccupancy?.percentage}%</span>
                            </div>

                            {/* Status Breakdown (Mini) */}
                            {[
                                { label: "Ready", count: data?.statusBreakdown?.ready || 0, color: "bg-[#559701]" },
                                { label: "Preparing", count: data?.statusBreakdown?.preparing || 0, color: "bg-orange-500" },
                                { label: "Pending", count: data?.statusBreakdown?.pending || 0, color: "bg-gray-400" },
                            ].map((status, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition-all">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2 h-2 ${status.color} rounded-full`} />
                                        <span className="text-xs font-bold text-gray-500">{status.label}</span>
                                    </div>
                                    <span className="text-xs font-black text-[#1a202c]">{status.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Staff */}
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-[#1a202c]">Top Staff</h3>
                        </div>
                        <div className="space-y-4">
                            {data?.topStaff?.length > 0 ? data.topStaff.map((staff: any, i: number) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-gray-100 overflow-hidden relative border border-transparent group-hover:border-[#559701] transition-all">
                                            {staff.avatar ? <img src={staff.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-gray-400" /></div>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#1a202c] text-sm">{staff.name}</p>
                                            <p className="text-[9px] text-[#559701] font-bold uppercase tracking-widest leading-none">Rank #{i + 1}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-[#1a202c]">{staff.avgPrep}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase leading-none">Avg Time</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-4 text-center text-gray-400 text-sm italic">No staff data found</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
