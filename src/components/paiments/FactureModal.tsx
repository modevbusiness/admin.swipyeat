"use client";

import { useRef } from "react";
import { X, Printer, Share2 } from "lucide-react";
import QRCode from "react-qr-code";
import Image from "next/image";

interface FactureModalProps {
    invoice: any;
    onClose: () => void;
}

export default function FactureModal({ invoice, onClose }: FactureModalProps) {
    const handlePrint = () => {
        window.print();
    };

    const handleShare = async () => {
        const itemsList = invoice.items.map((item: any) =>
            `- ${item.qty}x ${item.name} (${(item.price * item.qty).toFixed(2)} DH)`
        ).join('\n');

        const shareText = `RECEIPT - THE GREEN BISTRO
Order: ${invoice.id}
Date: ${invoice.date}

ITEMS:
${itemsList}

Subtotal: ${invoice.subtotal} DH
Tax: ${invoice.tax} DH
TOTAL: ${invoice.amount} DH

Thank you!`;

        const shareData = {
            title: `Receipt ${invoice.id}`,
            text: shareText,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share canceled');
            }
        } else {
            navigator.clipboard.writeText(shareText);
            alert("Receipt details copied to clipboard!");
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">

            {/* Styles for Printing */}
            <style jsx global>{`
        @media print {
            body * {
                visibility: hidden;
            }
            .facture-paper, .facture-paper * {
                visibility: visible;
            }
            .facture-paper {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 20px;
                box-shadow: none;
                border: none;
            }
            @page {
                margin: 0;
                size: auto;
            }
            .no-print {
                display: none !important;
            }
        }
      `}</style>

            {/* Container to center content vertically/horizontally */}
            <div className="my-auto w-full max-w-md flex flex-col items-center relative">

                {/* Floating Action Bar */}
                <div className="w-full bg-white rounded-xl shadow-lg border border-gray-100 p-2 mb-4 flex items-center justify-between no-print animate-in slide-in-from-bottom-2 duration-300">
                    <button
                        onClick={onClose}
                        className="p-2.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-gray-500 transition-colors"
                        title="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShare}
                            className="p-2 px-3 hover:bg-gray-50 text-gray-600 rounded-lg font-bold text-sm transition-colors border border-transparent hover:border-gray-200 flex items-center gap-2"
                        >
                            <Share2 className="w-4 h-4" /> Share
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-[#FF4D00] text-white rounded-lg font-bold text-sm hover:bg-[#E04400] transition-colors shadow-sm"
                        >
                            <Printer className="w-4 h-4" /> Print
                        </button>
                    </div>
                </div>

                {/* Invoice Paper */}
                <div className="facture-paper bg-white w-full shadow-2xl p-8 md:p-12 rounded-sm relative text-center font-sans animate-in zoom-in-95 duration-200">

                    {/* Logo */}
                    <div className="w-16 h-16 mx-auto mb-4 bg-[#FF4D00] rounded-2xl flex items-center justify-center p-3">
                        <Image src="/SwipyEat_Logo_Clean.png" width={64} height={64} alt="Logo" className="object-contain brightness-0 invert" />
                    </div>

                    <h1 className="text-xl font-bold text-[#FF4D00] uppercase tracking-wider mb-2">The Green Bistro</h1>
                    <div className="text-xs text-gray-500 space-y-1 mb-8">
                        <p>124 Culinary Heights, Gastronomy District</p>
                        <p>San Francisco, CA 94103</p>
                        <p>+1 (555) 012 - 3456 • greenbistro.com</p>
                    </div>

                    <div className="border-t border-b border-dashed border-gray-200 py-8 mb-8">
                        {/* QR Code */}
                        <div className="w-32 h-32 mx-auto bg-gray-50 p-2 rounded-lg border border-gray-100 mb-4">
                            <QRCode
                                size={100}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                value={`https://swipyeat.com/receipt/${invoice.id}`}
                                viewBox={`0 0 256 256`}
                            />
                        </div>

                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Order Identification</p>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{invoice.id}</h2>
                        <p className="text-xs font-bold text-[#FF4D00]">Table {invoice.table} • Guest: {invoice.customerEmail.split('@')[0]}</p>
                    </div>

                    {/* Meta */}
                    <div className="flex justify-between items-end text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-1">
                        <div className="text-left">
                            <p>Date: {invoice.date === 'Today' ? 'May 24, 2024' : invoice.date}</p>
                            <p>Time: {invoice.time}</p>
                        </div>
                        <div className="text-right">
                            <p>Server: {invoice.server}</p>
                            <p>Status: <span className="text-gray-900">{invoice.status}</span></p>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="text-left mb-6">
                        <h3 className="text-xs font-bold text-gray-900 uppercase mb-4 border-b border-gray-100 pb-2">Itemized List</h3>
                        <div className="space-y-4">
                            {invoice.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-start text-sm">
                                    <div>
                                        <span className="font-bold text-gray-900">{item.name}</span> <span className="text-[#FF4D00] font-bold text-xs">x{item.qty}</span>
                                        <p className="text-[10px] text-gray-400 mt-0.5">Medium rare, No onions</p>
                                    </div>
                                    <span className="font-bold text-gray-900">{(item.price * item.qty).toFixed(2)} DH</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="border-t border-gray-100 pt-4 space-y-2 text-sm text-gray-600 mb-8">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{invoice.subtotal} DH</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tax (8%)</span>
                            <span>{invoice.tax} DH</span>
                        </div>
                        <div className="flex justify-between text-2xl font-bold text-gray-900 pt-4 items-end">
                            <span className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-1">Final Total</span>
                            <span className="text-[#FF4D00]">{invoice.amount} DH</span>
                        </div>
                    </div>

                    {/* Payment Info Box */}
                    <div className="bg-gray-50 rounded-lg p-4 text-xs">
                        <div className="flex justify-between mb-2">
                            <span className="font-bold text-gray-400 uppercase tracking-wide">Payment Method</span>
                            <span className="font-bold text-gray-900 uppercase">{invoice.method} {invoice.cardLast4 ? `(**** ${invoice.cardLast4})` : ''}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-bold text-gray-400 uppercase tracking-wide">Transaction ID</span>
                            <span className="font-mono text-gray-900">{invoice.transactionId}</span>
                        </div>
                    </div>

                    {/* Footer Message */}
                    <div className="mt-10 pt-8 border-t border-dashed border-gray-200">
                        <h4 className="text-sm font-bold text-[#FF4D00] italic mb-1">Thank You for Dining With Us!</h4>
                        <p className="text-[10px] text-gray-400 max-w-[200px] mx-auto leading-relaxed">Please scan the QR code to leave a review or download your digital receipt.</p>
                        <p className="text-[8px] text-gray-300 uppercase tracking-[0.2em] mt-6">KDS Manager • Secure Facture V2.4</p>
                    </div>

                    {/* Bottom Paper Edge visual */}
                    <div className="absolute bottom-[-10px] left-0 right-0 h-[10px] bg-[radial-gradient(circle,transparent_50%,white_50%)] bg-[length:20px_20px] rotate-180"></div>
                </div>
            </div>
        </div>
    );
}
