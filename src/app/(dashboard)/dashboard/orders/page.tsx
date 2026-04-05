"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  Clock,
  CheckCircle2,
  XCircle,
  Printer,
  X,
  Layers,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Armchair,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { UIOrderStatus } from "@/types/order";
import CancellationModal from "@/components/CancellationModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import { getOrdersAction, updateOrderStatusAction, cancelOrderAction, deleteOrderAction } from "@/app/actions/orders";
import { transformOrderForUI } from "@/lib/orderUtils";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRestaurant, useUser } from "@/contexts/AuthProvider";

export default function OrdersPage() {
  const { restaurant, loading: restaurantLoading } = useRestaurant();
  const { user } = useUser();
  const currentUserId = user?.id || null;

  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<UIOrderStatus | 'ALL'>('ALL');
  const [filterTableType, setFilterTableType] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 9;


  const [showCancellation, setShowCancellation] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch orders from database
  useEffect(() => {
    const initData = async () => {
      if (!restaurant?.id) return;

      setIsLoading(true);
      try {
        // Fetch initial orders
        await fetchOrders(restaurant.id);

        // SET UP REALTIME SUBSCRIPTION
        const supabase = createClient();
        const channel = supabase
          .channel('orders-realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'orders',
              filter: `restaurant_id=eq.${restaurant.id}`
            },
            (payload) => {
              // Refresh orders on any change
              fetchOrders(restaurant.id);
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error("Error initializing:", error);
        toast.error("Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    if (!restaurantLoading && restaurant) {
      initData();
    }
  }, [restaurant, restaurantLoading]);

  // Separate fetch function to be called by filters/realtime
  const fetchOrders = async (restaurantId: string) => {
    try {
      const ordersRes = await getOrdersAction(restaurantId, {
        status: filterStatus === 'ALL' ? undefined : filterStatus,
        tableType: filterTableType === 'ALL' ? undefined : filterTableType
      });

      if (ordersRes.success && ordersRes.data) {
        const transformedOrders = ordersRes.data.map(transformOrderForUI);
        setOrders(transformedOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // Re-fetch when filters change
  useEffect(() => {
    if (restaurant?.id) {
      fetchOrders(restaurant.id);
    }
  }, [filterStatus, filterTableType]);


  // Filter Logic (now applied to fetched data)
  const filteredOrders = orders.filter(order => {
    const statusMatch = filterStatus === 'ALL' ||
      (order.status === filterStatus) || // Both are Uppercase now
      (filterStatus === 'SERVED' && order.status === 'SERVED') ||
      (filterStatus === 'CANCELLED' && order.status === 'CANCELLED');
    const tableMatch = filterTableType === 'ALL' ||
      (filterTableType === 'Table' && order.table.startsWith('Table')) ||
      order.table.includes(filterTableType);
    return statusMatch && tableMatch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || null;

  const STATUS_FILTERS: (UIOrderStatus | 'ALL')[] = ['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'];

  // Status Badge Colors - updated to handle database status
  const getStatusColor = (status: string) => {
    const dbStatus = status.toLowerCase();
    switch (dbStatus) {
      case "ordered":
      case "pending":
        return "bg-gray-100 text-gray-500 border-gray-200";
      case "confirmed":
        return "bg-orange-100 text-orange-600 border-orange-200";
      case "preparing":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "ready":
        return "bg-blue-100 text-blue-600 border-blue-200";
      case "served":
      case "delivered":
        return "bg-gray-800 text-white border-gray-800";
      case "paid":
        return "bg-[#FF4D00] text-white border-[#FF4D00]";
      case "canceled":
      case "cancelled":
        return "bg-red-100 text-red-600 border-red-200";
      default:
        return "bg-gray-100 text-gray-500";
    }
  };

  // Timeline Helper with live updates
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1); // Force re-render every second
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const TimelineItem = ({ status, time, user, duration, isLive, isCompleted, isCurrent, isLast }: any) => {
    return (
      <div className="relative pl-8 sm:pl-8 pb-6 sm:pb-6 last:pb-0">
        {!isLast && (
          <div className={`absolute left-[11px] sm:left-[11px] top-3 bottom-0 w-0.5 ${isCompleted ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
        )}
        <div className={`absolute left-0 top-1 w-6 sm:w-6 h-6 sm:h-6 rounded-full flex items-center justify-center border-2 z-10 transition-all
          ${isCompleted ? 'bg-orange-500 border-orange-500' :
            isCurrent ? 'bg-orange-500 border-orange-200 shadow-[0_0_0_4px_rgba(255,77,0,0.2)]' :
              'bg-white border-gray-200'
          }`}>
          {isCompleted && <CheckCircle2 className="w-3.5 sm:w-3.5 h-3.5 sm:h-3.5 text-white" />}
          {isCurrent && <div className="w-2 sm:w-2 h-2 sm:h-2 bg-white rounded-full animate-pulse"></div>}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1 sm:mb-1 gap-2">
            <h4 className={`text-sm sm:text-sm font-bold uppercase tracking-wide ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
              {status}
            </h4>
            {duration && (
              <span className={`text-[10px] sm:text-xs font-bold px-2 sm:px-2 py-0.5 rounded-full shrink-0 ${isLive
                ? 'bg-red-50 text-red-500 border border-red-200'
                : duration.startsWith('Expected')
                  ? 'text-gray-400'
                  : 'text-gray-500'
                }`}>
                {isLive ? 'Live: ' : duration.startsWith('Expected') ? '' : 'Final: '}
                {duration.replace('Expected: ', 'Expected: ')}
              </span>
            )}
          </div>
          {time && (
            <div className="text-xs sm:text-xs text-gray-500">
              {time}
            </div>
          )}
          {!time && !isCompleted && (
            <div className="text-xs sm:text-xs text-gray-400 italic">
              {status === 'PAID' ? 'Waiting for payment' : 'Waiting for kitchen signal'}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row bg-gray-50/50 overflow-hidden font-sans rounded-xl md:rounded-2xl border border-gray-200 shadow-sm relative ">
      {/* LEFT PANEL: Grid of Active Orders */}
      <div className="flex-1 w-full flex flex-col min-w-0 md:border-r border-gray-200 bg-white">
        {/* Header - REMOVED Filter Button */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-base sm:text-xl font-bold text-gray-900">Active Orders</h1>
              <span className="text-[10px] sm:text-xs font-bold text-orange-600 bg-orange-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-orange-100">
                {filteredOrders.length} Results
              </span>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => {
              setIsLoading(true);
              if (restaurant) fetchOrders(restaurant.id).finally(() => setIsLoading(false));
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-200 rounded-lg text-[10px] sm:text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all active:scale-[0.98]"
          >
            <RotateCcw className={`w-3 sm:w-3.5 h-3 sm:h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">Refresh</span>
          </button>
        </div>

        {/* Filter Chips */}
        <div className="px-3 sm:px-6 py-2 sm:py-3 flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-full bg-gray-50/50 border-b border-gray-100">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`flex items-center gap-1 sm:gap-1.5 px-5 sm:px-3 py-2 sm:py-1.5 rounded-full text-[13px] sm:text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all flex-shrink-0
                ${filterStatus === status
                  ? 'bg-orange-600 text-white shadow-md transform scale-105'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}
              `}
            >
              {status}
              {filterStatus === status && <CheckCircle2 className="w-2.5 sm:w-3 h-2.5 sm:h-3" />}
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        <div className="p-3 sm:p-6 pt-3 sm:pt-4 flex-1 overflow-y-auto bg-gray-50/30">
          <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {paginatedOrders.map((order) => {
              const isActive = selectedOrderId === order.id;
              const isLate = parseInt(order.elapsedTime) > 20;

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`relative p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all cursor-pointer bg-white group hover:shadow-lg
                    ${isActive ? "border-[#FF4D00] shadow-md ring-1 ring-[#FF4D00]/20" : "border-gray-100 hover:border-[#FF4D00]/50"}
                  `}
                >

                <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <div>
                      <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">Table</span>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mt-0.5">{order.table}</h3>
                    </div>
                    <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-wide border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-50 pt-2 sm:pt-3">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600">
                      <Layers className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-gray-400" />
                      <span className="text-[10px] sm:text-xs font-bold">{order.items.reduce((acc: number, i: any) => acc + i.quantity, 0)} Items</span>
                    </div>
                    <div className={`flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-bold ${isLate ? 'text-red-500' : 'text-gray-400'}`}>
                      <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                      {order.elapsedTime}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Creative Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-2 sm:p-3 bg-white border-t border-gray-200 flex items-center justify-between px-3 sm:px-6">
            <span className="text-[10px] sm:text-xs text-gray-500 font-bold hidden sm:block">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredOrders.length)} of {filteredOrders.length}
            </span>
            <span className="text-[10px] text-gray-500 font-bold sm:hidden">
              {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredOrders.length)}/{filteredOrders.length}
            </span>

            <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 p-0.5 sm:p-1 rounded-lg sm:rounded-xl">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 sm:p-1.5 rounded-md sm:rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-gray-600" />
              </button>

              <div className="flex items-center px-1 sm:px-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(currentPage - p) <= 1)
                  .map((page, idx, arr) => (
                    <div key={page} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== page - 1 && <span className="text-gray-400 px-1 sm:px-2 text-[10px] sm:text-xs">...</span>}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-6 sm:w-7 h-6 sm:h-7 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition-all mx-0.5
                                            ${currentPage === page
                            ? 'bg-[#FF4D00] text-white shadow-md'
                            : 'text-gray-500 hover:bg-white hover:text-[#FF4D00]'}
                                        `}
                      >
                        {page}
                      </button>
                    </div>
                  ))
                }
              </div>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1 sm:p-1.5 rounded-md sm:rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronRight className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Overlay Backdrop */}
      {/* {selectedOrderId && (
        <div 
          className="fixed inset-0  z-11111 md:hidden"
          onClick={() => setSelectedOrderId(null)}
        />
      )} */}

      {/* RIGHT PANEL: Advanced Order Detail */}
      <div className={`
        fixed md:relative inset-y-0 sm:mt-0 mt-[56px] right-0 z-30 md:z-30
        w-full sm:w-[85%] md:w-[350px] lg:w-[400px] 
        bg-white border-l border-gray-200 flex flex-col shadow-xl 
        transition-transform duration-300 ease-in-out
        max-h-screen md:max-h-none
        ${selectedOrderId ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        {selectedOrder ? (
          <>
            {/* Detail Header */}
            <div className="p-5 sm:p-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-5 sm:mb-5">
                <h2 className="text-base sm:text-base font-bold text-gray-900">Order Detail</h2>
                <div className="flex items-center gap-2">
                  <button className="text-gray-400 hover:text-gray-600 hidden md:block"><MoreVertical className="w-4 h-4" /></button>
                  <button 
                    onClick={() => setSelectedOrderId(null)}
                    className="md:hidden p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Staff Card REMOVED as requested */}
              {/* <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-between mb-6">...</div> */}
              <div className="bg-gray-50/50 p-3.5 sm:p-3 rounded-xl sm:rounded-xl mb-5 sm:mb-5 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-2 text-gray-500">
                  <Clock className="w-4 sm:w-3.5 h-4 sm:h-3.5" />
                  <span className="text-xs sm:text-[10px] font-bold uppercase tracking-wider">Elapsed Time</span>
                </div>
                <span className="text-base sm:text-sm font-bold text-gray-900">{selectedOrder.elapsedTime}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-3">
                <div>
                  <span className="text-[11px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1 sm:mb-1">Order #</span>
                  <span className="text-sm sm:text-sm font-bold text-gray-900 break-all">{selectedOrder.orderNumber && selectedOrder.orderNumber.length > 8 ? selectedOrder.orderNumber.substring(0, 6) + '...' : selectedOrder.orderNumber}</span>
                </div>
                <div>
                  <span className="text-[11px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1 sm:mb-1">Table</span>
                  <span className="text-sm sm:text-sm font-bold text-gray-900">{selectedOrder.table}</span>
                </div>
                <div>
                  <span className="text-[11px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1 sm:mb-1">Total</span>
                  <span className="text-sm sm:text-sm font-bold text-orange-600">{selectedOrder.total.toFixed(2)} DH</span>
                </div>
              </div>
            </div>

            {/* Timeline & Details Scroll */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {/* Notes Section - New */}
              {(selectedOrder.customerNote || selectedOrder.waiterNotes) && (
                <div className="mb-5 sm:mb-6 space-y-3 sm:space-y-3">
                  {selectedOrder.customerNote && (
                    <div className="bg-orange-50 p-3.5 sm:p-3 rounded-lg border border-orange-100">
                      <span className="text-[11px] sm:text-[10px] font-bold text-orange-600 uppercase block mb-1 sm:mb-1">Customer Note</span>
                      <p className="text-xs sm:text-xs text-gray-700 italic">&quot;{selectedOrder.customerNote}&quot;</p>
                    </div>
                  )}
                  {selectedOrder.waiterNotes && (
                    <div className="bg-blue-50 p-3.5 sm:p-3 rounded-lg border border-blue-100">
                      <span className="text-[11px] sm:text-[10px] font-bold text-blue-600 uppercase block mb-1 sm:mb-1">Waiter Note</span>
                      <p className="text-xs sm:text-xs text-gray-700 italic">&quot;{selectedOrder.waiterNotes}&quot;</p>
                    </div>
                  )}
                </div>
              )}
              {/* Live Time Event Workflow */}
              <div className="mb-5 sm:mb-6">
                <h3 className="text-[11px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 sm:mb-4 flex items-center gap-2 sm:gap-2">
                  <Clock className="w-3.5 sm:w-3 h-3.5 sm:h-3" />
                  Live Workflow
                </h3>
                <div className="pl-2 sm:pl-2">
                  {selectedOrder.timeline.map((event: any, idx: number) => (
                    <TimelineItem
                      key={idx}
                      {...event}
                      isCompleted={event.completed}
                      isCurrent={!event.completed && selectedOrder.timeline[idx - 1]?.completed}
                      isLast={idx === selectedOrder.timeline.length - 1}
                    />
                  ))}
                </div>
              </div>

              {/* Detailed Event Log */}
              <div className="border-t border-gray-100 pt-5 sm:pt-5">
                <h3 className="text-[11px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 sm:mb-3 flex items-center gap-2 sm:gap-2">
                  <Layers className="w-3.5 sm:w-3 h-3.5 sm:h-3" />
                  Event Log
                </h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                  <table className="w-full text-xs sm:text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-100">
                        <th className="text-left py-2.5 sm:py-2 px-3 sm:px-3 font-bold text-gray-600 uppercase tracking-wider">Event</th>
                        <th className="text-right py-2.5 sm:py-2 px-3 sm:px-3 font-bold text-gray-600 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.timeline
                        .filter((event: any) => event.time)
                        .map((event: any, idx: number) => (
                          <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-white transition-colors">
                            <td className="py-2.5 sm:py-2 px-3 sm:px-3 font-medium text-gray-700">{event.status}</td>
                            <td className="py-2.5 sm:py-2 px-3 sm:px-3 text-right text-gray-600 font-mono">{event.time}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-4 border-t border-gray-100 bg-white space-y-3 pb-6 md:pb-4">
              {selectedOrder.status !== 'CANCELLED' && (
                <button
                  onClick={async () => {
                    if (!restaurant || !selectedOrder) return;
                    // ... (existing logic)
                    let nextStatus = 'SERVED';
                    if (selectedOrder.status === 'ordered' || selectedOrder.status === 'PENDING') nextStatus = 'CONFIRMED';
                    else if (selectedOrder.status === 'CONFIRMED') nextStatus = 'PREPARING';
                    else if (selectedOrder.status === 'PREPARING') nextStatus = 'READY';
                    else if (selectedOrder.status === 'READY') nextStatus = 'SERVED';
                    else if (selectedOrder.status === 'SERVED') nextStatus = 'PAID';

                    console.log("Updating order:", {
                      id: selectedOrder.id,
                      currentStatus: selectedOrder.status,
                      nextStatus,
                      userId: currentUserId
                    });

                    if (!selectedOrder.id) {
                      toast.error("Invalid order ID");
                      return;
                    }

                    const paymentDetails = nextStatus === 'PAID' ? { paymentMethod: 'Cash', customerEmail: '' } : undefined;

                    const result = await updateOrderStatusAction(
                      selectedOrder.id,
                      nextStatus,
                      currentUserId || 'system',
                      undefined,
                      paymentDetails
                    );
                    if (result.success) {
                      toast.success(`Order marked as ${nextStatus.toLowerCase()}`);
                      if (nextStatus === 'PAID') {
                        setSelectedOrderId(null);
                      }
                    } else {
                      toast.error("Failed to update order");
                    }
                  }}
                  className={`w-full py-3.5 sm:py-3 rounded-xl sm:rounded-xl font-bold text-sm sm:text-sm shadow-lg flex items-center justify-center gap-2 sm:gap-2 transition-all active:scale-[0.98]
                  ${(selectedOrder.status === 'PAID' || selectedOrder.status === 'CANCELLED')
                      ? 'bg-gray-100 text-gray-400 shadow-none cursor-not-allowed hidden'
                      : 'bg-[#FF4D00] hover:bg-[#E04400] text-white shadow-[#FF4D00]/20'}`}
                >
                  <CheckCircle2 className="w-5 sm:w-5 h-5 sm:h-5" />
                  {selectedOrder.status === 'SERVED' ? 'Confirm Payment' :
                    selectedOrder.status === 'READY' ? 'Mark as Served' :
                      selectedOrder.status === 'PREPARING' ? 'Mark as Ready' :
                        selectedOrder.status === 'CONFIRMED' ? 'Start Preparing' :
                          'Confirm Order'}
                </button>
              )}

              <div className="flex items-center gap-2">
                {selectedOrder.status === 'CANCELLED' ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex-1 py-3 sm:py-2.5 border border-red-100 bg-red-50 text-red-600 rounded-xl sm:rounded-xl font-bold text-xs sm:text-xs hover:bg-red-100 transition-colors flex items-center justify-center gap-2 sm:gap-2">
                    <Trash2 className="w-4 sm:w-3.5 h-4 sm:h-3.5" /> Delete Order
                  </button>
                ) : selectedOrder.status === 'SERVED' ? null : (
                  <button
                    onClick={() => setShowCancellation(true)}
                    className="flex-1 py-3 sm:py-2.5 border border-red-100 bg-red-50 text-red-600 rounded-xl sm:rounded-xl font-bold text-xs sm:text-xs hover:bg-red-100 transition-colors flex items-center justify-center gap-2 sm:gap-2">
                    <XCircle className="w-4 sm:w-3.5 h-4 sm:h-3.5" /> Cancel Order
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center text-gray-400 p-6 sm:p-8 text-center">
            <div className="w-12 sm:w-16 h-12 sm:h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <Layers className="w-6 sm:w-8 h-6 sm:h-8 opacity-20" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">No Selection</h3>
            <p className="text-xs sm:text-sm">Select an order to view details</p>
          </div>
        )}
      </div>

      {/* Cancellation Modal (Keep as is) */}
      {
        showCancellation && selectedOrder && (
          <CancellationModal
            orderId={selectedOrder.orderNumber}
            table={selectedOrder.table}
            onClose={() => setShowCancellation(false)}
            onConfirm={async (reason, restore) => {
              if (!restaurant || !selectedOrder) return;
              const result = await cancelOrderAction(
                selectedOrder.id,
                reason,
                restaurant.id,
                restore
              );
              if (result.success) {
                toast.success("Order cancelled");
                setShowCancellation(false);
              } else {
                toast.error("Failed to cancel order");
              }
            }}
          />
        )
      }

      {/* Delete Confirmation Modal (Keep as is) */}
      {
        showDeleteConfirm && selectedOrder && (
          <ConfirmationModal
            title="Delete Order"
            message={`Are you sure you want to permanently delete Order ${selectedOrder.orderNumber}? This action cannot be undone.`}
            confirmLabel="Delete Permanently"
            variant="danger"
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={async () => {
              if (!selectedOrder || !restaurant) return;
              const result = await deleteOrderAction(selectedOrder.id);
              if (result.success) {
                toast.success("Order deleted successfully");
                setSelectedOrderId(null);
                setShowDeleteConfirm(false);
                // Refresh orders list immediately
                await fetchOrders(restaurant.id);
              } else {
                toast.error("Failed to delete order");
              }
            }}
          />
        )
      }
    </div >
  );
}
