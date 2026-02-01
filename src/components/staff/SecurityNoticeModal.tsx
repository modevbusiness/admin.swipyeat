"use client";

import { AlertTriangle, Copy, Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SecurityNoticeModalProps {
    isOpen: boolean;
    tempCode: string; // The generated password
    onSecureSave: () => void;
    staffName?: string;
}

export default function SecurityNoticeModal({ isOpen, tempCode, onSecureSave, staffName }: SecurityNoticeModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(tempCode);
        setCopied(true);
        toast.success("Credential copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-[#1a1a1a] rounded-[32px] overflow-hidden shadow-2xl border border-gray-800 animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="bg-red-500/10 border-b border-red-500/20 p-6 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
                    <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-red-500/30 animate-pulse">
                        <AlertTriangle className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-black text-red-500 uppercase tracking-widest mb-1">Critical Security Notice</h2>
                    <p className="text-xs text-red-400/80 font-medium max-w-xs leading-relaxed">
                        This code will never be shown again. Please share it with {staffName || "the staff member"} immediately.
                    </p>
                </div>

                <div className="p-8 space-y-8">
                    <div className="text-center">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Temporary Credential</p>
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#559701] to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
                            <div className="relative bg-[#111] border border-gray-700 rounded-2xl p-8 flex items-center justify-center">
                                <span className="font-mono text-3xl text-white font-bold tracking-wider select-all break-all text-center">
                                    {tempCode}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleCopy}
                            className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${copied
                                ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
                                : "bg-[#559701] hover:bg-[#4a8001] text-white shadow-lg shadow-[#559701]/20 transform hover:scale-[1.02] active:scale-[0.98]"
                                }`}
                        >
                            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            {copied ? "Copied!" : "Copy to Clipboard"}
                        </button>

                        <button
                            onClick={onSecureSave}
                            className="w-full py-4 bg-[#222] hover:bg-[#2a2a2a] text-gray-400 hover:text-white rounded-xl font-bold text-sm uppercase tracking-wider border border-gray-700 transition-all flex items-center justify-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            I have securely saved this code
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-black/20 text-center text-[10px] text-gray-600 font-medium uppercase tracking-widest border-t border-gray-800">
                    Security Policy: Temporary passwords expire after 24 hours
                </div>
            </div>
        </div>
    );
}
