"use client";

import React, { useRef } from 'react';
import { X, Printer, Share2, Mail } from 'lucide-react';
import QRCode from "react-qr-code";
import { Order } from '@/types/order';

interface ReceiptPreviewProps {
    order: Order;
    restaurant: {
        name: string;
        image_url?: string;
    };
    onClose: () => void;
}

export default function ReceiptPreview({ order, restaurant, onClose }: ReceiptPreviewProps) {
    // Calculate totals
    const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = subtotal * 0; // Assuming 0 tax based on screenshot "Tax (0%)"
    const total = subtotal + tax;
    const receiptRef = useRef<HTMLDivElement>(null);

    // ACTION HANDLERS
    const handlePrint = () => {
        window.print();
    };

    const handleEmail = () => {
        const subject = `Receipt for Order ${order.orderNumber}`;
        const body = `Here is your receipt for order ${order.orderNumber} at ${restaurant.name}.\n\nTotal: ${total.toFixed(2)} DH\n\nThank you for dining with us!`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleShare = async () => {
        const shareData = {
            title: 'Receipt',
            text: `Receipt for Order ${order.orderNumber} - Total: ${total.toFixed(2)} DH`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(`Receipt for Order ${order.orderNumber}: ${window.location.href}`);
            alert('Receipt link copied to clipboard!');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .receipt-modal-content, .receipt-modal-content * {
                        visibility: visible;
                    }
                    .receipt-modal-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 0;
                        background: white;
                        box-shadow: none;
                    }
                    .no-print {
                        display: none !important;
                    }
                    /* Ensure full width on print */
                    @page {
                        margin: 0;
                    }
                }
            `}</style>

            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Modal Header - HIDDEN ON PRINT */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 no-print">
                    <h2 className="text-lg font-bold text-gray-900">Receipt Preview</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Receipt Content Scrollable Area */}
                <div className="overflow-y-auto p-6 bg-gray-100 flex-1 flex justify-center no-print-background">
                    <div ref={receiptRef} className="receipt-modal-content bg-white w-full max-w-[380px] px-6 py-8 shadow-[0_0_15px_rgba(0,0,0,0.05)] relative font-mono text-sm">
                        {/* Receipt Top Edge Decoration */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHBhdGggZD0iTTAgMTBMNSAwIDEwIDEwweiIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg==')] opacity-50"></div>

                        {/* Header */}
                        <div className="text-center mb-8">
                            {restaurant.image_url && (
                                <div className="w-16 h-16 mx-auto mb-3">
                                    <img src={restaurant.image_url} alt="Logo" className="w-full h-full object-contain" />
                                </div>
                            )}
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight uppercase">{restaurant.name}</h1>
                        </div>

                        {/* Meta Data */}
                        <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-wider mb-6 pb-6 border-b border-dashed border-gray-200">
                            <div className="text-left">
                                <span className="block mb-1">Receipt ID</span>
                                <span className="text-gray-900 font-bold">#{order.orderNumber.replace('#', '')}-2024</span>
                            </div>
                            <div className="text-right">
                                <span className="block mb-1">{order.table}</span>
                                <span className="text-gray-900 font-bold">{order.createdAt} • 24 Oct</span>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-4 mb-6 border-b border-gray-100 pb-6">
                            <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">
                                <span>Description</span>
                                <span>Amount</span>
                            </div>

                            {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-start group">
                                    <div>
                                        <div className="text-gray-900 font-bold text-sm">
                                            {item.name} <span className="text-green-600 text-xs ml-0.5">x{item.quantity}</span>
                                        </div>
                                        {item.modifiers && item.modifiers.length > 0 && (
                                            <div className="text-[10px] text-gray-400 uppercase mt-0.5 max-w-[180px] leading-tight">
                                                {item.modifiers.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                    <span className="font-medium text-gray-900">{(item.price * item.quantity).toFixed(2)} DH</span>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="space-y-2 mb-8">
                            <div className="flex justify-between text-xs text-gray-600">
                                <span>Subtotal</span>
                                <span>{subtotal.toFixed(2)} DH</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600">
                                <span>Tax (0%)</span>
                                <span>{tax.toFixed(2)} DH</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-gray-900 pt-4 border-t border-dashed border-gray-200 mt-4 items-end">
                                <span className="text-sm font-bold uppercase tracking-widest">Total Amount</span>
                                <span className="text-[#00B05C]">{total.toFixed(2)} DH</span>
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="bg-green-50/50 p-6 rounded-xl border border-dashed border-green-100 mb-6 flex flex-col items-center justify-center text-center">
                            <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 mb-3">
                                <QRCode
                                    size={100}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    value={`
${restaurant.name.toUpperCase()}
Receipt ID: #${order.orderNumber}
Date: ${order.createdAt}
Table: ${order.table}

ITEMS:
${order.items.map(item => `- ${item.name} x${item.quantity}: ${(item.price * item.quantity).toFixed(2)} DH`).join('\n')}

Total: ${total.toFixed(2)} DH
                                    `.trim()}
                                    viewBox={`0 0 256 256`}
                                />
                            </div>
                            <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Scan for Loyalty Points</p>
                        </div>

                        {/* Footer */}
                        <div className="text-center space-y-2">
                            <p className="text-[10px] font-bold text-gray-900 uppercase">Thank you for dining with us!</p>
                        </div>

                        {/* Receipt Bottom Edge Decoration */}
                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDEwIDEwIiBmaWxsPSIjZjNmNGY2Ij48cGF0aCBkPSJNMCAwIEw1IDEwIEwxMCAweiIvPjwvc3ZnPg==')] opacity-50"></div>
                    </div>
                </div>

                {/* Footer Actions - HIDDEN ON PRINT */}
                <div className="px-6 py-4 border-t border-gray-100 bg-white grid grid-cols-3 gap-3 no-print">
                    <button onClick={handlePrint} className="flex items-center justify-center gap-2 py-2.5 bg-[#425e4c] hover:bg-[#354d3d] text-white rounded-lg text-sm font-bold transition-colors">
                        <Printer className="w-4 h-4" /> Print
                    </button>
                    <button onClick={handleEmail} className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                        <Mail className="w-4 h-4" /> Email
                    </button>
                    <button onClick={handleShare} className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                        <Share2 className="w-4 h-4" /> Share
                    </button>
                </div>
            </div>
        </div>
    );
}
