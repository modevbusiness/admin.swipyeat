"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, User, Mail, Briefcase, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateStaffAction } from "@/app/actions/staff";
import { useRestaurant } from "@/contexts/AuthProvider";

export default function EditStaffPage() {
    const params = useParams();
    const router = useRouter();
    const staffId = params.id as string;
    const { restaurant } = useRestaurant();
    const supabase = createClient();

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        role: "waiter",
    });

    useEffect(() => {
        fetchStaffMember();
    }, [staffId]);

    const fetchStaffMember = async () => {
        try {
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", staffId)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    full_name: data.name,
                    email: data.email,
                    role: data.role,
                });
            }
        } catch (error) {
            console.error("Error fetching staff member:", error);
            alert("Failed to load staff member data.");
            router.back();
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const result = await updateStaffAction(staffId, formData);
            if (result.success) {
                router.push(`/dashboard/staff`);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            console.error("Error updating staff:", error);
            alert(`Failed to update staff: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const roles = [
        { id: "manager", label: "Manager", description: "Full System & Staff Control", icon: Briefcase },
        { id: "kitchen_staff", label: "Chef", description: "KDS View & Order Status", icon: User },
        { id: "waiter", label: "Waiter", description: "Order Taking & Table Mgmt", icon: User },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#FF4D00]" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <span>Staff Directory</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-gray-900 font-bold">Edit Member</span>
                </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-[#FFF0EB] rounded-2xl flex items-center justify-center">
                            <User className="w-7 h-7 text-[#FF4D00]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Edit Staff Member</h2>
                            <p className="text-sm text-gray-500 font-medium">Update account details and role permissions.</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-10">
                    <div className="space-y-10">
                        {/* Account Details */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 text-xs font-black text-gray-400 uppercase tracking-widest">
                                <Mail className="w-4 h-4" />
                                Account Details
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Alex Rivera"
                                        className="w-full px-6 py-4 rounded-2xl bg-gray-50/50 border border-transparent focus:bg-white focus:border-[#FF4D00] focus:ring-4 focus:ring-[#FF4D00]/5 outline-none transition-all placeholder:text-gray-300 font-bold"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Email Address (Read Only)</label>
                                    <input
                                        type="email"
                                        readOnly
                                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent text-gray-400 outline-none font-bold"
                                        value={formData.email}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Role Assignment */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 text-xs font-black text-gray-400 uppercase tracking-widest">
                                <Briefcase className="w-4 h-4" />
                                Role Assignment
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {roles.map((role) => (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: role.id })}
                                        className={`p-6 rounded-[32px] border-2 text-center transition-all flex flex-col items-center gap-4 ${formData.role === role.id
                                            ? "border-[#FF4D00] bg-[#FFF0EB]/30 shadow-lg shadow-[#FF4D00]/5"
                                            : "border-gray-50 bg-white hover:border-gray-200"
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${formData.role === role.id ? "bg-[#FF4D00] text-white shadow-lg" : "bg-gray-50 text-gray-400"
                                            }`}>
                                            <role.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900">{role.label}</p>
                                            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">{role.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="mt-12 flex items-center justify-end gap-6 border-t border-gray-50 pt-10">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-8 py-4 text-sm font-black text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[#FF4D00] hover:bg-[#E04400] text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-[#FF4D00]/20 transition-all flex items-center gap-3 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                <>
                                    <CheckCircle className="w-6 h-6" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
