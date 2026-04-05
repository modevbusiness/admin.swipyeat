"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { updateUserPasswordAction } from "@/app/actions/auth-utils";

interface UpdatePasswordModalProps {
    isOpen: boolean;
    userId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function UpdatePasswordModal({ isOpen, userId, onSuccess, onCancel }: UpdatePasswordModalProps) {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [showConfirmPwd, setShowConfirmPwd] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const validatePassword = (pwd: string) => {
        const hasLength = pwd.length >= 8;
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
        const hasNumber = /\d/.test(pwd);
        return { hasLength, hasSpecial, hasNumber };
    };

    const checks = validatePassword(newPassword);
    const isMatch = newPassword && confirmPassword && newPassword === confirmPassword;
    const isValid = checks.hasLength && checks.hasSpecial && checks.hasNumber && isMatch;

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        setIsUpdating(true);
        setError("");

        try {
            const res = await updateUserPasswordAction(userId, newPassword);
            if (res.success) {
                toast.success("Password updated successfully");
                onSuccess();
            } else {
                throw new Error(res.error || "Failed to update password");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message);
            toast.error("Failed to update password");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8">
                    <div className="w-12 h-12 bg-[#FF4D00]/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <RefreshCw className="w-6 h-6 text-[#FF4D00]" />
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Secure Your Account</h2>
                    <p className="text-sm text-gray-500 text-center mb-8 max-w-xs mx-auto">
                        Since this is a new account, we need you to update your temporary credential to a secure, permanent one.
                    </p>

                    <form onSubmit={handleUpdate} className="space-y-6">

                        {/* New Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPwd ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none pr-12"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd(!showPwd)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Confirm New Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPwd ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none pr-12 ${confirmPassword && !isMatch ? "border-red-300 bg-red-50" : ""
                                        }`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Requirements */}
                        <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Password Security</p>

                            <div className={`flex items-center gap-2 text-xs ${checks.hasLength ? "text-[#FF4D00] font-bold" : "text-gray-500"}`}>
                                <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${checks.hasLength ? "bg-[#FF4D00] border-[#FF4D00]" : "border-gray-300"}`}>
                                    {checks.hasLength && <CheckCircle className="w-2 h-2 text-white" />}
                                </div>
                                At least 8 characters long
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${checks.hasSpecial ? "text-[#FF4D00] font-bold" : "text-gray-500"}`}>
                                <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${checks.hasSpecial ? "bg-[#FF4D00] border-[#FF4D00]" : "border-gray-300"}`}>
                                    {checks.hasSpecial && <CheckCircle className="w-2 h-2 text-white" />}
                                </div>
                                Contains at least one special character (!@#$%)
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${checks.hasNumber ? "text-[#FF4D00] font-bold" : "text-gray-500"}`}>
                                <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${checks.hasNumber ? "bg-[#FF4D00] border-[#FF4D00]" : "border-gray-300"}`}>
                                    {checks.hasNumber && <CheckCircle className="w-2 h-2 text-white" />}
                                </div>
                                Contains at least one number
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-500 text-sm font-bold justify-center">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isUpdating || !isValid}
                            className="w-full py-4 bg-[#FF4D00] hover:bg-[#E04400] text-white rounded-xl font-bold shadow-lg shadow-[#FF4D00]/20 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update & Sign In"}
                        </button>
                    </form>
                </div>

                <div className="flex justify-between px-8 py-4 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    <span>Gourmet Bistro KDS v2.4</span>
                    <div className="flex gap-4">
                        <span>Help Center</span>
                        <span>Privacy Policy</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
