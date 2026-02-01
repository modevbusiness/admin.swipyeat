"use client";

import React from "react";
import { AlertCircle, CheckCircle2, XCircle, Info, HelpCircle, AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "success" | "warning" | "info" | "question";
    isLoading?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "warning",
    isLoading = false,
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const getTypeStyles = () => {
        switch (type) {
            case "danger":
                return {
                    icon: <XCircle className="w-12 h-12 text-red-500" />,
                    button: "bg-red-500 hover:bg-red-600 shadow-red-100",
                    bg: "bg-red-50",
                    ring: "focus:ring-red-100",
                };
            case "success":
                return {
                    icon: <CheckCircle2 className="w-12 h-12 text-[#559701]" />,
                    button: "bg-[#559701] hover:bg-[#4a8001] shadow-green-100",
                    bg: "bg-green-50",
                    ring: "focus:ring-green-100",
                };
            case "info":
                return {
                    icon: <Info className="w-12 h-12 text-blue-500" />,
                    button: "bg-blue-500 hover:bg-blue-600 shadow-blue-100",
                    bg: "bg-blue-50",
                    ring: "focus:ring-blue-100",
                };
            case "question":
                return {
                    icon: <HelpCircle className="w-12 h-12 text-purple-500" />,
                    button: "bg-purple-500 hover:bg-purple-600 shadow-purple-100",
                    bg: "bg-purple-50",
                    ring: "focus:ring-purple-100",
                };
            default: // warning
                return {
                    icon: <AlertTriangle className="w-12 h-12 text-orange-500" />,
                    button: "bg-orange-500 hover:bg-orange-600 shadow-orange-100",
                    bg: "bg-orange-50",
                    ring: "focus:ring-orange-100",
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] w-full max-w-md shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 md:p-12 flex flex-col items-center text-center space-y-6">

                    {/* Icon Section */}
                    <div className={`w-24 h-24 ${styles.bg} rounded-full flex items-center justify-center relative`}>
                        <div className="absolute inset-0 bg-white/40 rounded-full blur-xl scale-125" />
                        <div className="relative z-10 scale-110">
                            {styles.icon}
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className="space-y-3">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
                            {title}
                        </h2>
                        <p className="text-gray-500 font-bold text-lg leading-relaxed max-w-[280px] mx-auto">
                            {message}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col w-full gap-4 pt-4">
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`w-full py-5 rounded-2xl font-black text-white text-lg transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 ${styles.button} ${styles.ring}`}
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                confirmText
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="w-full py-4 text-sm font-black text-gray-400 hover:text-gray-900 uppercase tracking-[0.2em] transition-colors"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>

                {/* Footer Polish Line */}
                <div className="h-2 w-full flex">
                    <div className="h-full flex-1 bg-red-400/10" />
                    <div className="h-full flex-1 bg-orange-400/10" />
                    <div className="h-full flex-1 bg-green-400/10" />
                    <div className="h-full flex-1 bg-blue-400/10" />
                </div>
            </div>
        </div>
    );
}
