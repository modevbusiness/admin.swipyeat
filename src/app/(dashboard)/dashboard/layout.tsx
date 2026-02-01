import React from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import SubscriptionGuard from "@/components/dashboard/SubscriptionGuard";
import SecurityShield from "@/components/dashboard/SecurityShield";
import RoleGuard from "@/components/dashboard/RoleGuard";
import DashboardProviders from "@/components/dashboard/DashboardProviders";

type Props = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  return (
    <DashboardProviders>
      <div className="flex min-h-screen bg-[#f7fafc] text-xs lg:text-[0.8rem] overflow-x-hidden">
        {/* Sidebar - Fixed Left (responsive) */}
        <Sidebar />

        {/* Main Content Area - responsive margin for sidebar */}
        <div className="flex-1 flex flex-col ml-0 lg:ml-[200px] xl:ml-[220px] 2xl:ml-[240px] min-h-screen max-w-full transition-all duration-300" id="main-content" style={{ maxWidth: "-webkit-fill-available" }}>
          {/* Header */}
          <Header />

          {/* Page Content - responsive padding */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3 lg:p-3 bg-[#f7fafc] max-w-full">
            <SecurityShield>
              <RoleGuard>
                <SubscriptionGuard>
                  {children}
                </SubscriptionGuard>
              </RoleGuard>
            </SecurityShield>
          </main>
        </div>
      </div>
    </DashboardProviders>
  );
}
