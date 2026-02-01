"use client";

import { useState } from "react";
import { X, Camera, ShieldCheck, Mail, Phone, User as UserIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface ProfileSettingsModalProps {
    user: {
        name: string;
        email: string;
        phone?: string;
        avatar_url?: string;
        role?: string;
    };
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
}

export default function ProfileSettingsModal({ user, onClose, onSave }: ProfileSettingsModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
    });

    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url || null);
    const [loadingImage, setLoadingImage] = useState(false);

    const isReadOnly = user.role === 'manager';

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoadingImage(true);
        try {
            // Check file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload an image file');
                return;
            }

            // Check file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Image size must be less than 2MB');
                return;
            }

            // Ideally this should be a client-side supabase upload
            // We need to import createClient first, let's assume it's imported in the component or passed down
            // For now, we'll try to use the client text
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();

            const fileExt = file.name.split('.').pop();
            // Create a clean filename
            const cleanFileName = user.email?.split('@')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'user';
            const fileName = `${cleanFileName}-${Date.now()}.${fileExt}`;
            // Structure: users/filename.jpg
            const filePath = `users/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('Restaurants-Media')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('Restaurants-Media')
                .getPublicUrl(filePath);

            setAvatarPreview(publicUrl);
            setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
            toast.success("Image uploaded successfully");

        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error.message || "Failed to upload image");
        } finally {
            setLoadingImage(false);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await onSave(formData);
            toast.success("Profile updated successfully");
            onClose();
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {isReadOnly ? "Manager Profile" : "Admin Profile Settings"}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {isReadOnly ? "View your personal information." : "Manage your personal information and preferences."}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">

                    {/* Avatar Section */}
                    <div className="flex items-start gap-6">
                        <div className="relative group">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white border-4 border-white shadow-lg overflow-hidden
                                ${avatarPreview ? 'bg-white' : 'bg-gradient-to-br from-orange-400 to-orange-600'}`}>
                                {avatarPreview ? (
                                    <Image
                                        src={avatarPreview}
                                        alt="Profile"
                                        width={96}
                                        height={96}
                                        className="w-full h-full object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    formData.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            {!isReadOnly && (
                                <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-gray-100 text-gray-600 hover:text-[#559701] transition-colors cursor-pointer">
                                    <Camera className="w-4 h-4" />
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={loadingImage}
                                    />
                                </label>
                            )}
                        </div>
                        {!isReadOnly && (
                            <div className="pt-2">
                                <h3 className="text-sm font-bold text-gray-900 mb-1">Avatar</h3>
                                <div className="flex items-center gap-3">
                                    <label className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors cursor-pointer">
                                        {loadingImage ? "Uploading..." : "Upload New"}
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={loadingImage}
                                        />
                                    </label>
                                    <button
                                        onClick={() => {
                                            setAvatarPreview(null);
                                            setFormData(prev => ({ ...prev, avatar_url: '' }));
                                        }}
                                        className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Form Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Full Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserIcon className="w-4 h-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={isReadOnly}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition-all font-medium text-gray-900 ${isReadOnly ? 'bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500' : 'bg-gray-50 border-gray-200 focus:ring-2 focus:ring-[#559701] focus:border-transparent'}`}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-bold text-gray-700">Phone Number</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                </div>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+1 (555) 000-0000"
                                    disabled={isReadOnly}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition-all font-medium text-gray-900 ${isReadOnly ? 'bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500' : 'bg-gray-50 border-gray-200 focus:ring-2 focus:ring-[#559701] focus:border-transparent'}`}
                                />
                            </div>
                        </div>
                    </div>



                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-white hover:shadow-sm transition-all"
                    >
                        {isReadOnly ? "Close" : "Cancel"}
                    </button>
                    {!isReadOnly && (
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="px-6 py-2.5 bg-[#559701] text-white font-bold rounded-xl hover:bg-[#4a8501] shadow-lg shadow-[#559701]/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Changes
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
