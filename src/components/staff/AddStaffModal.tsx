"use client";

import { useState } from "react";
import { X, User, Mail, Lock, Briefcase, CheckCircle, Clock, Eye, EyeOff } from "lucide-react";

interface AddStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    isLoading?: boolean;
}

export default function AddStaffModal({ isOpen, onClose, onSubmit, isLoading }: AddStaffModalProps) {
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: "",
        role: "waiter",
    });
    const [showPassword, setShowPassword] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const roles = [
        { id: "manager", label: "Manager", description: "Full System & Staff Control", icon: Briefcase },
        { id: "kitchen_staff", label: "Chef", description: "KDS View & Order Status", icon: User }, // UI calls it Chef
        { id: "waiter", label: "Waiter", description: "Order Taking & Table Mgmt", icon: User },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                {/* Header */}
                <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-white relative flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-[#FF4D00]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Add Staff Member</h2>
                            <p className="text-xs text-gray-500">Create a new account for kitchen or floor staff.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                    {/* Progress line if needed, but UI screenshot doesn't show one */}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="p-6 space-y-4 overflow-y-auto flex-1">
                        {/* Account Details */}
                        <section>
                            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                <Mail className="w-3.5 h-3.5" />
                                Account Details
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Alex Rivera"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all placeholder:text-gray-300"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="alex@restaurant.com"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all placeholder:text-gray-300"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="mt-3">
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        placeholder="Min. 8 characters"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all placeholder:text-gray-300 pr-12"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Role Assignment */}
                        <section>
                            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                <Briefcase className="w-3.5 h-3.5" />
                                Role Assignment
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {roles.map((role) => (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: role.id })}
                                        className={`p-3 rounded-xl border-2 text-center transition-all ${formData.role === role.id
                                            ? "border-[#FF4D00] bg-[#FF4D00]/5"
                                            : "border-gray-100 bg-white hover:border-gray-200"
                                            }`}
                                    >
                                        <div className={`w-9 h-9 rounded-full mx-auto mb-2 flex items-center justify-center ${formData.role === role.id ? "bg-[#FF4D00] text-white" : "bg-gray-100 text-gray-400"
                                            }`}>
                                            <role.icon className="w-4 h-4" />
                                        </div>
                                        <p className="font-bold text-sm text-gray-900">{role.label}</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">{role.description}</p>
                                    </button>
                                ))}
                            </div>
                        </section>

                    </div>

                    <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3 flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-[#FF4D00] hover:bg-[#E04400] text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-[#FF4D00]/20 transition-all flex items-center gap-2 disabled:opacity-50 text-sm"
                        >
                            {isLoading ? "Creating..." : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Create Staff Account
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
