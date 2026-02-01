"use client";

import { Users, UserCheck, UserMinus } from "lucide-react";

interface StaffStatsProps {
    total: number;
    active: number;
    inactive: number;
}

export default function StaffStats({ total, active, inactive }: StaffStatsProps) {
    const stats = [
        {
            label: "Total Staff",
            value: total,
            icon: Users,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
        },
        {
            label: "Active Now",
            value: active,
            icon: UserCheck,
            iconBg: "bg-green-50",
            iconColor: "text-green-600",
        },
        {
            label: "Inactive",
            value: inactive,
            icon: UserMinus,
            iconBg: "bg-orange-50",
            iconColor: "text-orange-600",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
                >
                    <div className={`${stat.iconBg} p-3 rounded-xl`}>
                        <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
