"use client";

import { X, Printer, Mail, CreditCard, CheckCircle2 } from "lucide-react";

interface InvoiceDrawerProps {
    invoice: any;
    onClose: () => void;
    onPrint: () => void; // Connect to the Facture Modal printing
}

export default function InvoiceDrawer({ invoice, onClose, onPrint }: InvoiceDrawerProps) {
    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            ></div>

            {/* Drawer */}
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-bold text-gray-900">{invoice.id}</h2>
                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                                Paid
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">Table {invoice.table} • Server: {invoice.server}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Timeline (Simplified Vertical) */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Order Timeline</h3>
                        <div className="pl-2 border-l-2 border-green-100 space-y-6 relative ml-1">
                            {['Ordered', 'Preparing', 'Ready', 'Served'].map((step, idx) => (
                                <div key={step} className="relative pl-6">
                                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-green-500 rounded-full ring-4 ring-white"></div>
                                    <h4 className="text-sm font-bold text-gray-900">{step}</h4>
                                    <p className="text-xs text-gray-400">14:10</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Items List */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Items List</h3>
                        <div className="space-y-4">
                            {invoice.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-start">
                                    <div>
                                        <div className="text-sm font-bold text-gray-900">
                                            {item.name} <span className="text-green-600 ml-1">x{item.qty}</span>
                                        </div>
                                        <p className="text-xs text-gray-400">Medium rare, No onions</p>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{(item.price * item.qty).toFixed(2)} DH</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-6 border-t border-dashed border-gray-200 space-y-2">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Subtotal</span>
                                <span>{invoice.subtotal} DH</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Tax (8%)</span>
                                <span>{invoice.tax} DH</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2">
                                <span>Total</span>
                                <span>{invoice.amount} DH</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Payment Details</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="block text-gray-400 text-xs mb-1">Method</span>
                                <div className="flex items-center gap-2 font-bold text-gray-900">
                                    <CreditCard className="w-4 h-4 text-gray-500" />
                                    {invoice.method} {invoice.cardLast4 ? `(**** ${invoice.cardLast4})` : ''}
                                </div>
                            </div>
                            <div>
                                <span className="block text-gray-400 text-xs mb-1">Transaction ID</span>
                                <span className="font-mono text-gray-900">{invoice.transactionId}</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-3">
                    <button
                        onClick={onPrint}
                        className="w-full py-3 bg-[#559701] hover:bg-[#4a8501] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#559701]/20 flex items-center justify-center gap-2 transition-all"
                    >
                        <Printer className="w-4 h-4" /> Print Facture
                    </button>
                    <button className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                        <Mail className="w-4 h-4" /> Send via Email
                    </button>
                </div>
            </div>
        </div>
    );
}
