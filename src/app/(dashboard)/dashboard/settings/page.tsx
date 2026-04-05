"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, Store, MapPin, Phone, Mail, Hash, Image as ImageIcon, Loader2, Link, Upload, X, Lock, Unlock, Eye, EyeOff, Map, Instagram } from "lucide-react";
import { toast } from "sonner";
import { updateRestaurantAction } from "@/app/actions/restaurant";
import { useRestaurant } from "@/contexts/AuthProvider";

export default function SettingsPage() {
  const { restaurant, loading: restaurantLoading } = useRestaurant();

  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    number_of_tables: "10",
    logo_url: "",
    cover_image_url: "",
    pin: "0000",
    is_locked: false,
    google_map_url: "",
    instagram_url: "",
  });

  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    if (!restaurantLoading && restaurant) {
      setFormData({
        name: restaurant.name || "",
        slug: restaurant.slug || "",
        address: restaurant.address || "",
        city: restaurant.city || "",
        phone: restaurant.phone || "",
        email: restaurant.email || "",
        number_of_tables: restaurant.number_of_tables?.toString() || "10",
        logo_url: restaurant.logo_url || "",
        cover_image_url: restaurant.cover_image_url || "",
        pin: restaurant.pin || "0000",
        is_locked: restaurant.is_locked || false,
        google_map_url: restaurant.google_map_url || "",
        instagram_url: restaurant.instagram_url || "",
      });
      setIsLoading(false);
    }
  }, [restaurant, restaurantLoading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo_url' | 'cover_image_url') => {
    const file = e.target.files?.[0];
    if (!file || !restaurant) return;

    setIsUploading(type);
    try {
      const { uploadMedia } = await import("@/lib/storage-utils");
      const result = await uploadMedia(file, 'restaurants', restaurant.id);

      if (result.success && result.publicUrl) {
        setFormData({ ...formData, [type]: result.publicUrl });
        toast.success("Image uploaded successfully");
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(null);
    }
  };

  const handleNameChange = (name: string) => {
    // Decoupled: Slug does not update automatically with name change
    setFormData({ ...formData, name });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    setIsSaving(true);
    try {
      const result = await updateRestaurantAction(restaurant.id, restaurant.slug, formData);
      if (!result.success) throw new Error(result.error);

      if (formData.slug !== restaurant.slug) {
        // If slug changed, redirect to new settings URL
        router.push(`/dashboard/${formData.slug}/settings`);
      }

      toast.success("Settings updated successfully!");
    } catch (error: any) {
      console.error("Error updating settings:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const [isRetrying, setIsRetrying] = useState(false);

  if (isLoading || restaurantLoading) {
    // If not loading but no restaurant, show error modal
    if (!restaurantLoading && !restaurant) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
              <Store className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Connection Issue</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                We couldn't load your restaurant data. This might be due to a poor internet connection or a temporary server issue.
              </p>
            </div>
            <button
              onClick={() => {
                setIsRetrying(true);
                window.location.reload();
              }}
              disabled={isRetrying}
              className="w-full flex items-center justify-center gap-2 bg-[#FF4D00] hover:bg-[#E04400] text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-[#FF4D00]/20 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
            >
              {isRetrying ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Retry Connection</span>
              )}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF4D00]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 md:shadow-none mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restaurant Management</h1>
          <p className="text-sm text-gray-500 mt-1">Update your restaurant profile and general settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Profile Section */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-[#FF4D00]" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Restaurant Profile</h2>
          </div>

          {/* Logo & Cover Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700">Restaurant Logo</label>
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden group-hover:border-[#FF4D00] transition-colors">
                    {formData.logo_url ? (
                      <img src={formData.logo_url} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-8 h-8 text-gray-300" />
                    )}
                    {isUploading === 'logo_url' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  {formData.logo_url && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logo_url: "" })}
                      className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md border border-gray-100 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={!!isUploading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:border-[#FF4D00] hover:text-[#FF4D00] transition-all disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    Choose Picture
                  </button>
                  <p className="text-[10px] text-gray-400">JPG, PNG or SVG. Max size 2MB.</p>
                  <input
                    type="file"
                    ref={logoInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'logo_url')}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700">Cover Image</label>
              <div className="relative group">
                <div className="w-full h-24 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden group-hover:border-[#FF4D00] transition-colors">
                  {formData.cover_image_url ? (
                    <img src={formData.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  )}
                  {isUploading === 'cover_image_url' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={!!isUploading}
                  className="absolute bottom-2 right-2 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white rounded-lg text-[10px] font-bold hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Change Cover
                </button>
                <input
                  type="file"
                  ref={coverInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'cover_image_url')}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Restaurant Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Slug (URL)</label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed focus:ring-0 outline-none transition-all pl-12"
                  value={formData.slug}
                />
                <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Changes the URL: dashboard/<b>{formData.slug || '...'}</b>/settings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Phone Number</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-4 py-11/12 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all pl-12"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all pl-12"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              </div>
            </div>
            <div className="space-y-2 opacity-50">
              <label className="text-sm  font-bold text-gray-700">Number of Tables</label>
              <div className="relative">
                <input
                  type="number"
                  disabled
                  className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all pl-12"
                  value={formData.number_of_tables}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    const maxTables = restaurant?.subscription?.max_tables || 10;

                    if (val > maxTables) {
                      toast.error(`Whoa! Your plan is capped at ${maxTables} tables. Ready to upgrade? 🚀`, {
                        description: "You've reached the maximum number of tables for your current subscription.",
                        duration: 4000,
                        className: "bg-red-50 border-red-200 text-red-800",
                        descriptionClassName: "text-red-600"
                      });
                      setFormData({ ...formData, number_of_tables: maxTables.toString() });
                      return;
                    }
                    setFormData({ ...formData, number_of_tables: e.target.value });
                  }}
                />
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-bold text-gray-700">Full Address</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all pl-12"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">City</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
          </div>
        </div>



        {/* Social Media Section */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Link className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Social Accounts</h2>
              <p className="text-xs text-gray-400 font-medium">Link your online presence.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Google Maps URL</label>
              <div className="relative">
                <input
                  type="url"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all pl-12"
                  value={formData.google_map_url}
                  onChange={(e) => setFormData({ ...formData, google_map_url: e.target.value })}
                  placeholder="https://maps.google.com/..."
                />
                <Map className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Instagram URL</label>
              <div className="relative">
                <input
                  type="url"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all pl-12"
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  placeholder="https://instagram.com/..."
                />
                <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Sticky Bottom Save Bar */}
      <div className="sticky bottom-0 z-30 bg-white border-t border-gray-200 p-4 -mx-4 sm:-mx-5 lg:-mx-6 -mb-4 sm:-mb-5 lg:-mb-6 flex items-center justify-end shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 bg-[#FF4D00] hover:bg-[#E04400] text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#FF4D00]/20 disabled:opacity-50 w-full sm:w-auto justify-center"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Changes
        </button>
      </div>
    </form >
  );
}
