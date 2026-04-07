"use client";

import { AuthProvider, useAuth } from "@/contexts/AuthProvider";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    // useRouter is not needed anymore

    useEffect(() => {
        if (!loading && !user) {
            const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'http://localhost:3000';
            window.location.href = `${landingUrl}/sign-in`;
        }
    }, [user, loading]);

    // Show loading spinner while checking auth
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#f7fafc]">
                <Loader2 className="w-10 h-10 animate-spin text-[#FF4D00]" />
            </div>
        );
    }

    // If no user after loading, render nothing (redirect will happen)
    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#f7fafc]">
                <Loader2 className="w-10 h-10 animate-spin text-[#FF4D00]" />
            </div>
        );
    }

    return <>{children}</>;
}

export default function DashboardProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <AuthGuard>
                {children}
            </AuthGuard>
        </AuthProvider>
    );
}
