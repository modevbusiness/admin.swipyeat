"use client";

import { useState } from "react";
import Image from "next/image";
import ProfileSettingsModal from "./ProfileSettingsModal";
import { updateProfileAction } from "@/app/actions/profile";
import { useProfile, useAuth } from "@/contexts/AuthProvider";

interface HeaderProps {
    title?: string;
    showStatus?: boolean;
}

export default function Header({ title = "Admin Overview", showStatus = true }: HeaderProps) {
    const { profile, loading } = useProfile();
    const { refreshAuth } = useAuth();

    const [showProfileModal, setShowProfileModal] = useState(false);

    // Derive user display info from profile
    const user = profile ? {
        name: profile.name || profile.email?.split('@')[0] || "Admin",
        email: profile.email || "",
        avatar: profile.avatar_url,
        id: profile.id,
        phone: profile.phone ?? undefined,
        role: profile.role || "restaurant_admin"
    } : null;

    const handleUpdateProfile = async (data: any) => {
        if (!user?.id) return;
        const result = await updateProfileAction(user.id, data);
        if (result.success) {
            // Refresh auth context to get updated profile
            await refreshAuth();
        } else {
            throw new Error(result.error);
        }
    };

    return (
        <>
            <header className="h-10 lg:h-9 bg-white flex items-center justify-between px-2 lg:px-2 sticky top-0 z-30 border-b border-gray-100 lg:border-b-0 max-w-full">
                {/* Left - Page Title + Status */}
                <div className="flex items-center gap-1 ml-12 lg:ml-0 flex-shrink min-w-0 max-w-[40%]">
                    <h1 className="text-xs lg:text-[10px] font-bold text-[#1a202c] truncate">{title}</h1>
                    {showStatus && (
                        <span className="hidden lg:inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-[#f0fff4] border border-[#c6f6d5] flex-shrink-0">
                            <span className="w-1 h-1 bg-[#48bb78] rounded-full animate-pulse"></span>
                            <span className="text-[8px] font-medium text-[#276749]">Online</span>
                        </span>
                    )}
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-1 flex-shrink-0">


                    {/* User Profile */}
                    <div
                        className="flex items-center gap-1 pl-1 border-l border-gray-200 cursor-pointer hover:bg-gray-50 p-0.5 rounded-lg transition-colors"
                        onClick={() => setShowProfileModal(true)}
                    >
                        <div className="text-right hidden lg:block">
                            <p className="text-[9px] font-semibold text-[#1a202c] truncate max-w-[60px]">{loading ? "..." : user?.name || "Admin"}</p>
                            <p className="text-[8px] text-gray-500 capitalize truncate max-w-[60px]">{user?.role?.replace(/_/g, " ") || "Admin"}</p>
                        </div>
                        {/* Avatar */}
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center border border-white shadow-sm flex-shrink-0">
                            {user?.avatar ? (
                                <Image
                                    src={user.avatar}
                                    alt="User Avatar"
                                    width={24}
                                    height={24}
                                    className="rounded-full object-cover w-full h-full"
                                    unoptimized
                                />
                            ) : (
                                <span className="text-white font-bold text-[9px]">
                                    {user?.name?.charAt(0).toUpperCase() || "A"}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {showProfileModal && user && (
                <ProfileSettingsModal
                    user={{ ...user, avatar_url: user.avatar ? user.avatar : undefined }}
                    onClose={() => setShowProfileModal(false)}
                    onSave={handleUpdateProfile}
                />
            )}
        </>
    );
}
