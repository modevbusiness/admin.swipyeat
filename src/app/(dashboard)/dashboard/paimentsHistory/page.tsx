"use client";
import { useState, useEffect } from "react";
import { useRestaurant } from "@/contexts/AuthProvider";
import {
    Filter,
    Download,
    Calendar,
    Banknote,
    Printer,
    Mail,
    Eye,
    CheckCircle2,
    TrendingUp,
    TrendingDown,
    Loader2
} from "lucide-react";
import ReceiptPreview from "@/components/ReceiptPreview";
import InvoiceDrawer from "@/components/paiments/InvoiceDrawer";
import FactureModal from "@/components/paiments/FactureModal";
import { getOrdersAction } from "@/app/actions/orders";
import { transformOrderForUI } from "@/lib/orderUtils"; // You might need to adjust this utils if it doesn't support paid fields perfectly, but likely works
import { toast } from "sonner";

export default function BillingPage() {
    const { restaurant, loading: isLoadingRestaurant } = useRestaurant();

    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [selectedTable, setSelectedTable] = useState("All");
    const [numberOfTables, setNumberOfTables] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 15;

    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'drawer' | 'facture' | null>(null);

    // Receipt Printing State
    const [showReceipt, setShowReceipt] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

    // Fetch Paid Orders
    useEffect(() => {
        const fetchPaidOrders = async () => {
            if (!restaurant) return;

            setLoading(true);
            try {
                // Set number of tables if available
                if (restaurant.number_of_tables) {
                    setNumberOfTables(restaurant.number_of_tables);
                }

                // 2. Prepare filters
                const filters: any = {
                    status: 'PAID',
                    page: currentPage,
                    limit: itemsPerPage
                };

                if (selectedTable !== "All") {
                    filters.tableType = selectedTable; // Pass specific table number
                }

                // 3. Get Orders
                const ordersRes = await getOrdersAction(restaurant.id, filters);

                if (ordersRes.success && ordersRes.data) {
                    // 4. Transform data
                    const transformed = ordersRes.data.map((order: any) => ({
                        id: order.order_number || order.id.substring(0, 8),
                        fullId: order.id,
                        orderNumber: order.order_number || order.id.substring(0, 8), // For Receipt compatibility
                        table: order.table_number?.toString() || "N/A",
                        amount: order.total_amount?.toFixed(2) || "0.00",
                        date: new Date(order.created_at).toLocaleDateString(),
                        createdAt: new Date(order.created_at).toLocaleDateString(), // For Receipt compatibility
                        time: new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        method: order.payment_method || "Cash",
                        invoiceMethod: "printed",
                        items: order.order_items?.map((item: any) => ({
                            id: item.id,
                            name: item.menu_item?.name || "Unknown Item",
                            quantity: item.quantity, // Ensure full word 'quantity' for Receipt
                            qty: item.quantity, // Keep 'qty' for Table display if needed
                            price: item.unit_price,
                            modifiers: item.order_item_modifiers?.map((m: any) => m.modifier?.name).filter(Boolean) || []
                        })) || [],
                        status: 'Paid'
                    }));
                    setInvoices(transformed);
                    if (typeof ordersRes.count === 'number') {
                        setTotalCount(ordersRes.count);
                    }
                } else {
                    console.error("Failed to load orders", ordersRes.error);
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load payment history");
            } finally {
                setLoading(false);
            }
        };

        if (restaurant) {
            fetchPaidOrders();
        }
    }, [restaurant, currentPage, selectedTable]); // Re-fetch on page or table change



    const handleOpenDrawer = (invoice: any) => {
        setSelectedInvoice(invoice);
        setViewMode('drawer');
    };

    const handleOpenFacture = (invoice: any) => {
        setSelectedInvoice(invoice);
        setViewMode('facture');
    };

    const handleClose = () => {
        setViewMode(null);
        setSelectedInvoice(null);
    };

    const totalRevenue = invoices.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const averageTicket = invoices.length > 0 ? totalRevenue / invoices.length : 0;

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payment History</h1>
                    <p className="text-gray-500 mt-1">Real-time invoicing and financial tracking.</p>
                </div>
                {/* Export buttons logic... omitted for brevity or implement if needed */}
            </div>

            {/* Stats Cards */}
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Revenue</span>
                        <div className="flex items-end gap-3 mt-1">
                            <h3 className="text-3xl font-bold text-gray-900">{totalRevenue.toFixed(2)} DH</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completed Orders</span>
                        <div className="flex items-end gap-3 mt-1">
                            <h3 className="text-3xl font-bold text-gray-900">{invoices.length}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Average Ticket</span>
                        <div className="flex items-end gap-3 mt-1">
                            <h3 className="text-3xl font-bold text-gray-900">{averageTicket.toFixed(2)} DH</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-64">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <select
                                value={selectedTable}
                                onChange={(e) => {
                                    setSelectedTable(e.target.value);
                                    setCurrentPage(1); // Reset to page 1 on filter change
                                }}
                                className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#559701]/20 focus:border-[#559701] transition-all appearance-none cursor-pointer"
                            >
                                <option value="All">All Tables</option>
                                {Array.from({ length: numberOfTables }, (_, i) => i + 1).map((num) => (
                                    <option key={num} value={num.toString()}>
                                        Table {num}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="text-sm text-gray-500">
                        Showing <span className="font-bold text-gray-900">{invoices.length}</span> of <span className="font-bold text-gray-900">{totalCount}</span> orders
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto min-h-[400px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Order ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Table</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date & Time</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Method</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Facture</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-gray-500">
                                            No payment history found based on filters.
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.map((inv) => (
                                        <tr key={inv.id} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-bold text-[#559701]">{inv.id}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-gray-900">{inv.table}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-bold text-gray-900">{inv.amount} DH</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {inv.date}, {inv.time}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md border
                                                ${inv.method === 'Card'
                                                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                        : 'bg-green-50 text-green-600 border-green-100'
                                                    }
                                            `}>
                                                    {inv.method}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full border bg-gray-100 text-gray-600 border-gray-200">
                                                    <Printer className="w-3 h-3" />
                                                    Available
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedReceipt(inv);
                                                            setShowReceipt(true);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Print Receipt"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                    </button>

                                                </div>
                                            </td>
                                        </tr>
                                    )))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1 || loading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600">
                        Page <span className="font-bold text-gray-900">{currentPage}</span> of <span className="font-bold text-gray-900">{Math.max(1, Math.ceil(totalCount / itemsPerPage))}</span>
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={invoices.length < itemsPerPage || (currentPage * itemsPerPage) >= totalCount || loading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Interactive Views */}
            {viewMode === 'drawer' && selectedInvoice && (
                <InvoiceDrawer
                    invoice={selectedInvoice}
                    onClose={handleClose}
                    onPrint={() => setViewMode('facture')}
                />
            )}

            {viewMode === 'facture' && selectedInvoice && (
                <FactureModal
                    invoice={selectedInvoice}
                    onClose={handleClose}
                />
            )}

            {/* Receipt Modal */}
            {showReceipt && selectedReceipt && restaurant && (
                <ReceiptPreview
                    order={selectedReceipt}
                    restaurant={{
                        name: restaurant.name,
                        image_url: restaurant.logo_url ?? undefined
                    }}
                    onClose={() => setShowReceipt(false)}
                />
            )}
        </div>
    );
}
