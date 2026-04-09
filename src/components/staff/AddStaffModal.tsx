"use client";

import { useState } from "react";
import { X, User, Mail, Briefcase, Clock, Link as LinkIcon, Copy, CheckCircle } from "lucide-react";
import { generateStaffInviteAction } from "@/app/actions/staff";
import { useRestaurant } from "@/contexts/AuthProvider";

interface AddStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddStaffModal({ isOpen, onClose }: AddStaffModalProps) {
    const { restaurant } = useRestaurant();
    const [isLoading, setIsLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        role: "waiter",
        validity: "24", // hours
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurant?.id) {
            alert("Restaurant data is not loaded yet.");
            return;
        }

        setIsLoading(true);
        try {
            const validityHours = parseInt(formData.validity, 10);
            const result = await generateStaffInviteAction(
                formData.email,
                formData.role,
                validityHours,
                restaurant.id
            );

            if (result.success && result.link) {
                setGeneratedLink(result.link);
            } else {
                alert("Error generating invite link: " + result.error);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to generate invite.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const roles = [
        { id: "manager", label: "Manager", description: "Full System & Staff Control", icon: Briefcase },
        { id: "kitchen_staff", label: "Chef", description: "KDS View & Order Status", icon: User },
        { id: "waiter", label: "Waiter", description: "Order Taking & Table Mgmt", icon: User },
    ];

    const validityOptions = [
        { value: "1", label: "1 Hour" },
        { value: "24", label: "24 Hours" },
        { value: "72", label: "3 Days" },
        { value: "168", label: "7 Days" }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                            {generatedLink ? <LinkIcon className="w-5 h-5 text-[#FF4D00]" /> : <User className="w-5 h-5 text-[#FF4D00]" />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{generatedLink ? "Invite Link Generated" : "Invite Staff Member"}</h2>
                            <p className="text-xs text-gray-500">{generatedLink ? "Share this link with the staff member." : "Generate a secure link for staff to set up their account."}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {generatedLink ? (
                    <div className="p-8 space-y-6 flex-1 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Share!</h3>
                            <p className="text-sm text-gray-500 max-w-sm mx-auto">
                                Copy the link below and send it to <strong>{formData.email}</strong>. This link will expire in {formData.validity} hours.
                            </p>
                        </div>
                        
                        <div className="w-full max-w-md bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center gap-3">
                            <input 
                                type="text" 
                                readOnly 
                                value={generatedLink} 
                                className="flex-1 bg-transparent text-sm font-medium text-gray-700 outline-none"
                            />
                            <button 
                                onClick={handleCopy}
                                className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-[#FF4D00] hover:text-[#FF4D00] transition-colors"
                                title="Copy to clipboard"
                            >
                                {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-500" />}
                            </button>
                        </div>
                        
                        <button
                            onClick={onClose}
                            className="bg-[#FF4D00] hover:bg-[#E04400] text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1">
                        <div className="p-6 space-y-6">
                            <section>
                                <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    <Mail className="w-3.5 h-3.5" />
                                    Account Details
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Link Validity</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Clock className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <select
                                                required
                                                value={formData.validity}
                                                onChange={(e) => setFormData({ ...formData, validity: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all appearance-none"
                                            >
                                                {validityOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </section>

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

                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
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
                                {isLoading ? "Generating..." : "Generate Link"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
