"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useProfile } from "@/contexts/AuthProvider";

export default function RoleGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { profile, loading } = useProfile();

    useEffect(() => {
        if (!loading && profile) {
            const userRole = profile.role;
            const restrictedRoutes = ['/settings', '/staff', '/subscription'];

            // Check if current path contains any of the restricted routes
            const isRestrictedRoute = restrictedRoutes.some(route => pathname.includes(route));

            if (userRole === 'manager' && isRestrictedRoute) {
                // Redirect manager to dashboard root if they try to access restricted routes
                router.replace('/dashboard');
            }
        }
    }, [pathname, profile, loading, router]);

    // Optional: Return null or a loader while checking permission on restricted routes
    // to prevent flash of content
    if (!loading && profile?.role === 'manager') {
        const restrictedRoutes = ['/settings', '/staff', '/subscription'];
        if (restrictedRoutes.some(route => pathname.includes(route))) {
            return null;
        }
    }

    return <>{children}</>;
}
