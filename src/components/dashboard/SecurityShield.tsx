"use client";

import React from "react";

export default function SecurityShield({ children }: { children: React.ReactNode }) {
    // Auth disabled - just render children directly
    return <>{children}</>;
}
