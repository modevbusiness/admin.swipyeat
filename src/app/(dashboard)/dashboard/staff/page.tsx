"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import StaffStats from "@/components/staff/StaffStats";
import StaffTable from "@/components/staff/StaffTable";
import AddStaffModal from "@/components/staff/AddStaffModal";
import SecurityNoticeModal from "@/components/staff/SecurityNoticeModal";
import CredentialVerificationModal from "@/components/staff/CredentialVerificationModal";
import UpdatePasswordModal from "@/components/staff/UpdatePasswordModal";
import { createStaffAction } from "@/app/actions/staff";
import { useRestaurant } from "@/contexts/AuthProvider";

export default function StaffPage() {
  const router = useRouter();
  const { restaurant, loading: restaurantLoading } = useRestaurant();
  const supabase = createClient();

  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Secure Credential Flow State
  const [modalStep, setModalStep] = useState<"none" | "security" | "verify" | "update">("none");
  const [tempCredential, setTempCredential] = useState<{ email: string, code: string, userId: string, name: string } | null>(null);

  useEffect(() => {
    if (!restaurantLoading && restaurant) {
      fetchStaff();
    }
  }, [restaurant, restaurantLoading]);

  const fetchStaff = async () => {
    if (!restaurant?.id) return;

    setIsLoading(true);
    try {
      // Fetch Staff for this Restaurant
      const { data: staffData, error: staffError } = await supabase
        .from("users")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .neq("role", "restaurant_admin")
        .neq("role", "super_admin")
        .order("created_at", { ascending: false });

      if (staffError) throw staffError;
      setStaff(staffData || []);
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStaff = async (formData: any) => {
    if (!restaurant?.id) {
      alert("Restaurant data is still loading. Please try again in a moment.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createStaffAction(formData, restaurant.id);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Check if we got an ID back (should happen with new action)
      if (result.data?.id) {
        setIsModalOpen(false);
        // Removed: Automatic temp credential flow on creation
        // setTempCredential({ ... });
        // setModalStep("security");
      } else {
        // Fallback if no ID (old behavior)
        setIsModalOpen(false);
      }

      fetchStaff();
    } catch (error: any) {
      console.error("Error adding staff:", error);
      alert(`Failed to add staff member: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartResetFlow = (userId: string, email: string, name: string, tempCode: string) => {
    setTempCredential({
      userId,
      email,
      name,
      code: tempCode
    });
    setModalStep("security");
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      fetchStaff();
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      // Use Server Action to delete from Auth AND DB
      const { deleteStaffAction } = await import("@/app/actions/staff");
      const result = await deleteStaffAction(id);

      if (!result.success) throw new Error(result.error);

      fetchStaff();
    } catch (error: any) {
      console.error("Error deleting staff:", error);
      alert("Failed to delete staff: " + error.message);
    }
  };

  const filteredStaff = staff.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: staff.length,
    active: staff.filter(s => s.is_active).length,
    inactive: staff.filter(s => !s.is_active).length,
  };

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Directory</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your team, assign roles and monitor activity.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#FF4D00] hover:bg-[#E04400] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-[#FF4D00]/20"
        >
          <Plus className="w-5 h-5" />
          Add New Staff
        </button>
      </div>

      {/* Stats */}
      <StaffStats {...stats} />

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-gray-200 rounded-lg outline-none text-sm transition-all font-bold"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-100 rounded-lg text-sm text-gray-600 outline-none focus:border-[#FF4D00] font-bold"
          >
            <option value="all">All Roles</option>
            <option value="manager">Manager</option>
            <option value="waiter">Waiter</option>
            <option value="kitchen_staff">Chef</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm font-bold text-gray-400">
          Loading staff directory...
        </div>
      ) : (
        <StaffTable
          staff={filteredStaff}
          onEdit={(id) => router.push(`/dashboard/staff/${id}/edit`)}
          onDelete={handleDeleteStaff}
          onToggleStatus={handleToggleStatus}
          onResetFlow={handleStartResetFlow}
        />
      )}

      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddStaff}
        isLoading={isSubmitting}
      />

      {/* Security Flow Modals */}
      {tempCredential && (
        <>
          <SecurityNoticeModal
            isOpen={modalStep === "security"}
            tempCode={tempCredential.code}
            staffName={tempCredential.name}
            onSecureSave={() => setModalStep("verify")}
          />

          <CredentialVerificationModal
            isOpen={modalStep === "verify"}
            expectedEmail={tempCredential.email}
            expectedCode={tempCredential.code}
            onVerified={() => setModalStep("update")}
            onCancel={() => setModalStep("none")} // or warn
          />

          <UpdatePasswordModal
            isOpen={modalStep === "update"}
            userId={tempCredential.userId}
            onSuccess={() => {
              setModalStep("none");
              setTempCredential(null);
            }}
            onCancel={() => {
              setModalStep("none");
              setTempCredential(null);
            }}
          />
        </>
      )}
    </div>
  );
}
