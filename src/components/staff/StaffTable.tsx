"use client";

import { Edit2, Trash2, MoreVertical, Search, Filter, Key, Check, Copy, AlertTriangle, Loader2, X } from "lucide-react";
import { useState } from "react";
import { useRestaurant } from "@/contexts/AuthProvider";
import { resetStaffPasswordAction } from "@/app/actions/staff";
import ConfirmationModal from "@/components/dashboard/ConfirmationModal";

interface StaffMember {
    id: string;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    avatar_url?: string;
}

interface StaffTableProps {
    staff: StaffMember[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (id: string, currentStatus: boolean) => void;
    onResetFlow: (userId: string, email: string, name: string, tempCode: string) => void;
}

export default function StaffTable({ staff, onEdit, onDelete, onToggleStatus, onResetFlow }: StaffTableProps) {
    const { restaurant } = useRestaurant();

    // Removed local resetData state as we now bubble up the flow
    const [isResetting, setIsResetting] = useState<string | null>(null);
    const [confirmResetId, setConfirmResetId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const getRoleBadgeColor = (role: string) => {
        switch (role.toLowerCase()) {
            case "manager":
                return "bg-purple-50 text-purple-600 border-purple-100";
            case "head chef":
            case "chef":
                return "bg-orange-50 text-orange-600 border-orange-100";
            case "waiter":
                return "bg-orange-50 text-orange-600 border-orange-100";
            default:
                return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    const handleResetPassword = async () => {
        if (!confirmResetId) return;

        // Find member details first
        const member = staff.find(s => s.id === confirmResetId);
        if (!member) return;

        setIsResetting(confirmResetId);
        setConfirmResetId(null);
        try {
            const result = await resetStaffPasswordAction(confirmResetId);
            if (result.success && result.tempPassword) {
                // Trigger the parent flow
                onResetFlow(member.id, member.email, member.name, result.tempPassword);
            } else {
                alert("Failed to reset password: " + result.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsResetting(null);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
            {/* Confirmation Modals */}
            <ConfirmationModal
                isOpen={!!confirmResetId}
                onClose={() => setConfirmResetId(null)}
                onConfirm={handleResetPassword}
                title="Reset Password?"
                message="This will generate a temporary code. The staff member must change it on their next login."
                confirmText="Yes, Reset"
                type="warning"
                isLoading={isResetting === confirmResetId}
            />

            <ConfirmationModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => {
                    if (confirmDeleteId) {
                        onDelete(confirmDeleteId);
                        setConfirmDeleteId(null);
                    }
                }}
                title="Remove Staff?"
                message="Are you sure you want to remove this staff member? This action cannot be undone."
                confirmText="Yes, Remove"
                type="danger"
            />
            {/* Removed Local Reset Success Modal */}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-50 bg-gray-50/50">
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {staff.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 overflow-hidden">
                                            {member.avatar_url ? (
                                                <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                                            ) : (
                                                member.name.split(" ").map(n => n[0]).join("")
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{member.name}</p>
                                            <p className="text-xs text-gray-500">{member.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${getRoleBadgeColor(member.role)}`}>
                                        {member.role === 'kitchen_staff' ? 'Chef' : member.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => onToggleStatus(member.id, member.is_active)}
                                        className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${member.is_active ? "bg-[#FF4D00]" : "bg-gray-200"}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${member.is_active ? "translate-x-5" : ""}`} />
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onEdit(member.id)}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Edit Staff"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setConfirmResetId(member.id)}
                                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                            disabled={isResetting === member.id}
                                            title="Reset Password"
                                        >
                                            {isResetting === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => setConfirmDeleteId(member.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Staff"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {staff.length === 0 && (
                <div className="p-12 text-center">
                    <p className="text-gray-500">No staff members found.</p>
                </div>
            )}
        </div>
    );
}
