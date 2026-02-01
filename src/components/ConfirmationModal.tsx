"use client";

import { X, AlertTriangle, Trash2 } from "lucide-react";

interface ConfirmationModalProps {
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "info";
    onClose: () => void;
    onConfirm: () => void;
}

export default function ConfirmationModal({
    title = "Are you sure?",
    message = "This action cannot be undone.",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "danger",
    onClose,
    onConfirm
}: ConfirmationModalProps) {
    const isDanger = variant === "danger";

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all scale-100 ring-4 ring-black/5">
                {/* Header */}
                <div className={`px-6 py-5 border-b border-gray-100 flex items-start justify-between ${isDanger ? 'bg-red-50/50' : 'bg-gray-50/50'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDanger ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                            {isDanger ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-600 leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-white hover:text-gray-900 hover:shadow-sm transition-all focus:ring-2 focus:ring-gray-200"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2.5 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]
                            ${isDanger
                                ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20 focus:ring-red-500'
                                : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20 focus:ring-orange-500'
                            }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
