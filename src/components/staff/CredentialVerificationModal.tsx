"use client";

import { useState } from "react";
import { Lock, Mail, ArrowRight, Loader2, AlertCircle } from "lucide-react";

interface CredentialVerificationModalProps {
    isOpen: boolean;
    expectedEmail: string;
    expectedCode: string; // The temp code to verify against
    onVerified: () => void;
    onCancel: () => void;
}

export default function CredentialVerificationModal({
    isOpen,
    expectedEmail,
    expectedCode,
    onVerified,
    onCancel
}: CredentialVerificationModalProps) {
    const [email, setEmail] = useState(expectedEmail); // Pre-fill but allow edit if needed? Usually just confirm.
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsVerifying(true);

        // Simulate verification delay for better UX
        setTimeout(() => {
            if (code.trim() !== expectedCode) {
                setError("Invalid temporary code. Please try again.");
                setIsVerifying(false);
            } else {
                setIsVerifying(false);
                onVerified();
            }
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                        <Lock className="w-6 h-6 text-blue-500" />
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-2">Verify Credential</h2>
                    <p className="text-sm text-gray-500 mb-8">
                        Please confirm the temporary credential you just saved.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Email Address</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    readOnly
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 font-medium cursor-not-allowed pl-10"
                                />
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Temporary Code</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value);
                                    setError("");
                                }}
                                placeholder="Paste code here"
                                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono ${error ? "border-red-300 bg-red-50 text-red-900 placeholder:text-red-300" : "border-gray-200"
                                    }`}
                            />
                            {error && (
                                <div className="flex items-center gap-2 text-red-500 text-xs font-bold mt-2 animate-in slide-in-from-left-2">
                                    <AlertCircle className="w-3 h-3" /> {error}
                                </div>
                            )}
                        </div>

                        <div className="pt-4 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isVerifying || !code}
                                className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                Verify & Continue
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
