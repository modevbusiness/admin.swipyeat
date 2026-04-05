"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle, ChevronDown } from "lucide-react";

interface CancellationModalProps {
    orderId: string;
    table: string;
    onClose: () => void;
    onConfirm: (reason: string, restoreInventory: boolean) => void;
}

const CANCELLATION_REASONS = [
    { value: "server_error", label: "Server Entry Error", restore: true },
    { value: "customer_cancel", label: "Customer Cancellation", restore: true },
    { value: "out_of_stock", label: "Out of Stock / 86'd", restore: false },
    { value: "waste", label: "Kitchen Waste / Spillage", restore: false },
    { value: "walk_out", label: "Guest Walk-Out", restore: false },
];

export default function CancellationModal({ orderId, table, onClose, onConfirm }: CancellationModalProps) {
    const [reason, setReason] = useState("");
    const [restoreInventory, setRestoreInventory] = useState(false);
    const [error, setError] = useState("");

    // Update Restore Inventory Toggle based on Reason
    useEffect(() => {
        const selected = CANCELLATION_REASONS.find(r => r.value === reason);
        if (selected) {
            setRestoreInventory(selected.restore);
        }
    }, [reason]);

    const handleConfirm = () => {
        if (!reason) {
            setError("Please select a cancellation reason.");
            return;
        }

        onConfirm(reason, restoreInventory);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between bg-red-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Confirm Cancellation</h2>
                            <p className="text-sm text-gray-500">Order {orderId} • {table}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {/* Reason Select */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Cancellation Reason</label>
                        <div className="relative">
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full appearance-none bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-red-500 focus:border-red-500 block p-3 pr-8 font-medium transition-colors"
                                style={{ backgroundImage: "none" }}
                            >
                                <option value="" disabled>Select a reason</option>
                                {CANCELLATION_REASONS.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* Toggle */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setRestoreInventory(!restoreInventory)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${restoreInventory ? 'bg-red-500' : 'bg-gray-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${restoreInventory ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        <span className="text-sm font-medium text-gray-700">Return items to inventory?</span>
                    </div>



                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> {error}
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-white hover:shadow-sm transition-all"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2"
                    >
                        <X className="w-4 h-4" /> Confirm Cancellation
                    </button>
                </div>
            </div>
        </div>
    );
}
