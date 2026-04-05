"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Search,
  Plus,
  Filter,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Upload,
  Tags,
  Edit2,
  Trash2,
  MoreVertical,
  Check,
  Layers,
  Settings,
  Languages,
  Clock,
  AlertTriangle,
  Loader2,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import {
  MenuItem,
  Category,
  Variant,
  Modifier,
} from "@/types/menu";
import { v4 as uuidv4 } from "uuid";
import {
  getMenuItemsPaginatedAction,
  getCategoriesAction,
  upsertMenuItemAction,
  deleteMenuItemAction,
  toggleItemAvailabilityAction,
  upsertCategoryAction,
  deleteCategoryAction,
  getItemVariantsAction,
  upsertItemVariantsAction,
  deleteItemVariantAction,
  getRestaurantModifiersAction,
  upsertModifierAction,
  deleteModifierAction,
  getMenuItemModifiersAction,
  linkModifierToItemAction,
  unlinkModifierFromItemAction
} from "@/app/actions/menu";
import { useRestaurant } from "@/contexts/AuthProvider";

export default function MenuPage() {
  const { restaurant, loading: restaurantLoading } = useRestaurant();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [activeCategory, setActiveCategory] = useState("All Items");
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(undefined);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 15;
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form State
  const defaultFormState: Partial<MenuItem> = {
    name: "",
    name_ar: "",
    name_fr: "",
    description: "",
    description_ar: "",
    description_fr: "",
    category_id: "",
    base_price: 0,
    image_url: "",
    preparation_time: 15,
    allergens: [],
    is_available: true,
    is_active: true,
  };

  const [formData, setFormData] = useState<Partial<MenuItem>>(defaultFormState);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category Form State
  const defaultCategoryState: Partial<Category> = {
    name: "",
    name_ar: "",
    name_fr: "",
    description: "",
    description_ar: "",
    description_fr: "",
    image_url: "",
    is_active: true,
  };

  const [categoryFormData, setCategoryFormData] = useState<Partial<Category>>(defaultCategoryState);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const categoryFileInputRef = useRef<HTMLInputElement>(null);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    type: "item" | "category" | "variant" | "modifier" | null;
    id: string | null;
    name: string | null;
  }>({
    show: false,
    type: null,
    id: null,
    name: null,
  });

  const [activeItemTab, setActiveItemTab] = useState<"details" | "variants" | "modifiers">("details");
  const [itemVariants, setItemVariants] = useState<Variant[]>([]);
  const [restaurantModifiers, setRestaurantModifiers] = useState<Modifier[]>([]);
  const [itemModifierLinks, setItemModifierLinks] = useState<any[]>([]);

  // Global Modifiers Modal State
  const [showGlobalModsModal, setShowGlobalModsModal] = useState(false);
  const [editingModifier, setEditingModifier] = useState<Modifier | null>(null);
  const defaultModifierState: Partial<Modifier> = {
    name: "",
    name_ar: "",
    name_fr: "",
    modifier_type: "extra",
    price: 0,
    is_active: true,
  };
  const [modifierFormData, setModifierFormData] = useState<Partial<Modifier>>(defaultModifierState);

  useEffect(() => {
    if (!restaurantLoading && restaurant) {
      fetchInitialData();
    }
  }, [restaurant, restaurantLoading]);

  const fetchInitialData = async () => {
    if (!restaurant?.id) return;

    setIsLoading(true);
    try {
      // Fetch Categories & Modifiers (items will be fetched separately with pagination)
      const [catsRes, modsRes] = await Promise.all([
        getCategoriesAction(restaurant.id),
        getRestaurantModifiersAction(restaurant.id)
      ]);

      if (catsRes.success && catsRes.data) setCategories(catsRes.data as Category[]);
      if (modsRes.success && modsRes.data) setRestaurantModifiers(modsRes.data as Modifier[]);

    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load menu data");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch paginated items
  const fetchPaginatedItems = async () => {
    if (!restaurant?.id) return;

    try {
      const itemsRes = await getMenuItemsPaginatedAction(
        restaurant.id,
        currentPage,
        ITEMS_PER_PAGE,
        activeCategoryId,
        debouncedSearch,
        availabilityFilter
      );

      if (itemsRes.success && itemsRes.data) {
        setItems(itemsRes.data as MenuItem[]);
        setTotalPages(itemsRes.totalPages || 1);
        setTotalCount(itemsRes.totalCount || 0);
      }
    } catch (error: any) {
      console.error("Error fetching paginated items:", error);
      toast.error("Failed to load menu items");
    }
  };

  // Fetch items when page, category, search, or availability filter changes
  useEffect(() => {
    if (!restaurantLoading && restaurant) {
      fetchPaginatedItems();
    }
  }, [restaurant, restaurantLoading, currentPage, activeCategoryId, debouncedSearch, availabilityFilter]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to page 1 on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when category or availability filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategoryId, availabilityFilter]);

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
    } else {
      setFormData(defaultFormState);
    }
  }, [editingItem]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData(defaultFormState);
    setItemVariants([]);
    setItemModifierLinks([]);
    setActiveItemTab("details");
    setShowItemModal(true);
  };

  const handleOpenEditModal = async (item: MenuItem) => {
    setEditingItem(item);
    setFormData(item);
    setActiveItemTab("details");
    setShowItemModal(true);

    // Fetch related data
    const [variantsRes, linksRes] = await Promise.all([
      getItemVariantsAction(item.id),
      getMenuItemModifiersAction(item.id)
    ]);

    if (variantsRes.success && variantsRes.data) setItemVariants(variantsRes.data as Variant[]);
    if (linksRes.success && linksRes.data) setItemModifierLinks(linksRes.data);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurant) return;

    const toastId = toast.loading("Uploading image...");
    try {
      const { uploadMedia } = await import("@/lib/storage-utils");
      const result = await uploadMedia(file, 'products', restaurant.id);

      if (result.success && result.publicUrl) {
        setFormData((prev) => ({ ...prev, image_url: result.publicUrl }));
        toast.success("Image uploaded", { id: toastId });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error("Upload failed", { id: toastId });
    }
  };

  const handleSaveDetails = async () => {
    if (!formData.name || !formData.base_price || !formData.category_id) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsSaving(true);
    const itemToSave = {
      ...formData,
      restaurant_id: restaurant!.id,
      updated_at: new Date().toISOString(),
      created_at: editingItem ? editingItem.created_at : new Date().toISOString(),
    };

    try {
      const res = await upsertMenuItemAction(itemToSave, restaurant!.slug);
      if (res.success) {
        setEditingItem(res.data); // Ensure we have the ID for the next steps
        setActiveItemTab("variants");
        toast.success("Details saved");
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save item");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVariants = async () => {
    if (!editingItem) return;

    // Validate Variants
    if (itemVariants.some(v => !v.name.trim())) {
      toast.error("All variants must have a name");
      return;
    }

    setIsSaving(true);
    try {
      const variantsToSave = itemVariants.map(v => ({
        ...v,
        menu_item_id: editingItem.id,
      }));
      const res = await upsertItemVariantsAction(variantsToSave, restaurant!.slug);

      if (res.success) {
        setActiveItemTab("modifiers");
        toast.success("Variants saved");
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save variants");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleModifierLink = async (modifierId: string) => {
    if (!editingItem) return;

    const existingLink = itemModifierLinks.find(l => l.modifier_id === modifierId);

    try {
      if (existingLink) {
        const res = await unlinkModifierFromItemAction(editingItem.id, modifierId, restaurant!.slug);
        if (res.success) {
          setItemModifierLinks(prev => prev.filter(l => l.modifier_id !== modifierId));
          toast.success("Modifier unlinked");
        }
      } else {
        const newLink = {
          menu_item_id: editingItem.id,
          modifier_id: modifierId,
          is_required: false,
          max_selections: 1
        };
        const res = await linkModifierToItemAction(newLink, restaurant!.slug);
        if (res.success) {
          setItemModifierLinks(prev => [...prev, res.data]);
          toast.success("Modifier linked");
        }
      }
    } catch (error: any) {
      toast.error("Failed to update modifier link");
    }
  };

  const updateModifierLink = async (modifierId: string, updates: any) => {
    if (!editingItem) return;
    const existingLink = itemModifierLinks.find(l => l.modifier_id === modifierId);
    if (!existingLink) return;

    try {
      const updatedLink = { ...existingLink, ...updates };
      const res = await linkModifierToItemAction(updatedLink, restaurant!.slug);
      if (res.success) {
        setItemModifierLinks(prev => prev.map(l => l.modifier_id === modifierId ? res.data : l));
        toast.info("Link updated");
      }
    } catch (error: any) {
      toast.error("Failed to update constraints");
    }
  };

  const handleSaveModifier = async () => {
    if (!modifierFormData.name || !restaurant) return;

    setIsSaving(true);
    try {
      const modToSave = {
        ...modifierFormData,
        restaurant_id: restaurant!.id,
      };
      const res = await upsertModifierAction(modToSave, restaurant!.slug);
      if (res.success) {
        toast.success(editingModifier ? "Modifier updated" : "Modifier created");
        setEditingModifier(null);
        setModifierFormData(defaultModifierState);
        setShowGlobalModsModal(false);
        fetchInitialData();
      } else throw new Error(res.error);
    } catch (error: any) {
      toast.error(error.message || "Failed to save modifier");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteModifier = (id: string, name: string) => {
    setDeleteModal({
      show: true,
      type: "modifier",
      id,
      name,
    });
  };

  const handleDeleteItem = (id: string, name: string) => {
    setDeleteModal({
      show: true,
      type: "item",
      id,
      name,
    });
  };

  const handleDeleteCategory = (id: string, name: string) => {
    setDeleteModal({
      show: true,
      type: "category",
      id,
      name,
    });
  };

  const handleDeleteVariant = (id: string, name: string) => {
    setDeleteModal({
      show: true,
      type: "variant",
      id,
      name,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.id || !deleteModal.type) return;

    setIsSaving(true);
    try {
      if (deleteModal.type === "item") {
        const res = await deleteMenuItemAction(deleteModal.id, restaurant!.slug);
        if (res.success) {
          toast.success("Item deleted successfully");
          setShowItemModal(false);
        } else throw new Error(res.error);
      } else if (deleteModal.type === "category") {
        const res = await deleteCategoryAction(deleteModal.id, restaurant!.slug);
        if (res.success) {
          toast.success("Category deleted successfully");
          setShowCategoryModal(false);
        } else throw new Error(res.error);
      } else if (deleteModal.type === "variant") {
        const res = await deleteItemVariantAction(deleteModal.id, restaurant!.slug);
        if (res.success) {
          toast.success("Variant removed");
          setItemVariants(prev => prev.filter(v => v.id !== deleteModal.id));
        } else throw new Error(res.error);
      } else if (deleteModal.type === "modifier") {
        const res = await deleteModifierAction(deleteModal.id, restaurant!.slug);
        if (res.success) {
          toast.success("Modifier permanently removed");
          fetchInitialData();
        } else throw new Error(res.error);
      }

      if (deleteModal.type !== "variant" && deleteModal.type !== "modifier") {
        fetchInitialData();
        fetchPaginatedItems();
      }
      setDeleteModal({ show: false, type: null, id: null, name: null });
    } catch (error: any) {
      toast.error(error.message || "Deletion failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const res = await toggleItemAvailabilityAction(id, !currentStatus, restaurant!.slug);
      if (res.success) {
        setItems(prev => prev.map(item => item.id === id ? { ...item, is_available: !currentStatus } : item));
        toast.success(`Item is now ${!currentStatus ? 'available' : 'unavailable'}`);
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      toast.error(error.message || "Update failed");
    }
  };

  const handleOpenAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryFormData(defaultCategoryState);
    setShowCategoryModal(true);
  };

  const handleOpenEditCategoryModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData(category);
    setShowCategoryModal(true);
  };

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurant) return;

    const toastId = toast.loading("Uploading category image...");
    try {
      const { uploadMedia } = await import("@/lib/storage-utils");
      const result = await uploadMedia(file, 'categories', restaurant!.id);

      if (result.success && result.publicUrl) {
        setCategoryFormData((prev) => ({ ...prev, image_url: result.publicUrl }));
        toast.success("Image uploaded", { id: toastId });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error("Upload failed", { id: toastId });
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryFormData.name) {
      toast.error("Category name is required");
      return;
    }

    setIsSaving(true);
    const catToSave = {
      ...categoryFormData,
      restaurant_id: restaurant!.id,
      updated_at: new Date().toISOString(),
      created_at: editingCategory ? editingCategory.created_at : new Date().toISOString(),
    };

    try {
      const res = await upsertCategoryAction(catToSave, restaurant!.slug);
      if (res.success) {
        toast.success(editingCategory ? "Category updated" : "Category created");
        setShowCategoryModal(false);
        fetchInitialData();
        fetchPaginatedItems();
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save category");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate counts from current page items
  const availableCount = items.filter((item) => item.is_available).length;
  const outOfStockCount = items.filter((item) => !item.is_available).length;

  // Pagination display values
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalCount);

  if (isLoading || restaurantLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#FF4D00]" />
        <p className="text-gray-500 font-medium">Loading menu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 lg:space-y-2 pb-16 w-full max-w-full" id="ggg">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-1.5 lg:gap-1 w-full max-w-full">
        <div className="flex-shrink min-w-0 max-w-[45%]">
          <h1 className="text-sm lg:text-xs font-bold text-[#1a202c] truncate">Menu Items</h1>
          <p className="text-[9px] lg:text-[8px] text-gray-500 mt-0.5 hidden sm:block truncate">
            Manage your restaurant's offerings
          </p>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-1 lg:gap-1 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-24 lg:w-20 pl-6 pr-1.5 py-1 rounded-lg border border-gray-200 bg-white text-[10px] focus:outline-none focus:ring-1 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00] transition-all"
            />
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1 px-1.5 py-1 bg-[#FF4D00] text-white rounded-lg font-semibold text-[10px] hover:bg-[#E04400] transition-colors shadow-lg shadow-[#FF4D00]/20 whitespace-nowrap flex-shrink-0"
          >
            <Plus className="w-3 h-3" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Availability Filters */}
      <div className="flex items-center gap-2 lg:gap-1.5 overflow-x-auto pb-2 lg:pb-1 w-full">
        <span className="text-xs lg:text-[10px] font-medium text-gray-500 mr-1 lg:mr-0.5 flex-shrink-0">Status:</span>
        <button
          onClick={() => setAvailabilityFilter('all')}
          className={`px-2.5 lg:px-2 py-1 lg:py-0.5 rounded-lg text-xs lg:text-[10px] font-semibold transition-all ${availabilityFilter === 'all'
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
        >
          All
        </button>
        <button
          onClick={() => setAvailabilityFilter('active')}
          className={`px-2.5 lg:px-2 py-1 lg:py-0.5 rounded-lg text-xs lg:text-[10px] font-semibold transition-all flex items-center gap-1.5 lg:gap-1 ${availabilityFilter === 'active'
              ? "bg-[#FF4D00] text-white"
              : "bg-orange-50 text-orange-700 hover:bg-orange-100"
            }`}
        >
          <span className="w-1.5 h-1.5 lg:w-1 lg:h-1 rounded-full bg-current"></span>
          Active
        </button>
        <button
          onClick={() => setAvailabilityFilter('inactive')}
          className={`px-2.5 lg:px-2 py-1 lg:py-0.5 rounded-lg text-xs lg:text-[10px] font-semibold transition-all flex items-center gap-1.5 lg:gap-1 ${availabilityFilter === 'inactive'
              ? "bg-red-500 text-white"
              : "bg-red-50 text-red-600 hover:bg-red-100"
            }`}
        >
          <span className="w-1.5 h-1.5 lg:w-1 lg:h-1 rounded-full bg-current"></span>
          Inactive
        </button>
      </div>

      {/* Categories */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 lg:gap-1.5 overflow-x-auto pb-2 lg:pb-1 scrollbar-hide w-full">
          <button
            onClick={() => {
              setActiveCategory("All Items");
              setActiveCategoryId(undefined);
            }}
            className={`px-3 lg:px-2 py-1.5 lg:py-1 rounded-full text-xs lg:text-[10px] font-medium whitespace-nowrap transition-all ${activeCategory === "All Items"
              ? "bg-[#FF4D00] text-white shadow-md"
              : "bg-white text-gray-600 border border-gray-200 hover:border-[#FF4D00] hover:text-[#FF4D00]"
              }`}
          >
            All Items ({totalCount})
          </button>
          {categories.map((category) => (
            <div
              key={category.id}
              className={`group flex items-center gap-2 lg:gap-1 px-3 lg:px-2 py-1.5 lg:py-1 rounded-full text-xs lg:text-[10px] font-medium whitespace-nowrap transition-all border ${activeCategory === category.name
                ? "bg-[#FF4D00] text-white shadow-md border-[#FF4D00]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#FF4D00] hover:text-[#FF4D00]"
                }`}
            >
              <button
                onClick={() => {
                  setActiveCategory(category.name);
                  setActiveCategoryId(category.id);
                }}
                className="flex-1 text-left"
              >
                {category.name} ({category.item_count || 0})
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEditCategoryModal(category);
                }}
                className={`p-1 rounded-md transition-all ${activeCategory === category.name
                  ? "hover:bg-white/20 text-white"
                  : "text-gray-400 hover:text-[#FF4D00] hover:bg-gray-50"
                  }`}
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={handleOpenAddCategoryModal}
            className="px-2.5 lg:px-2 py-1.5 lg:py-1 rounded-full text-xs lg:text-[10px] font-medium border-2 border-dashed border-gray-300 text-gray-500 hover:border-[#FF4D00] hover:text-[#FF4D00] transition-all flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5 lg:w-3 lg:h-3" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 lg:gap-2 w-full max-w-full">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all group flex flex-col"
          >
            <div className="relative h-24 lg:h-20 bg-gray-100 overflow-hidden">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${!item.is_available ? "grayscale opacity-60" : ""
                    }`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span className="text-xs">No Image</span>
                </div>
              )}

              {/* Tag logic removed as it doesn't match DB schema */}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEditModal(item);
                }}
                className="absolute top-1.5 lg:top-1 right-1.5 lg:right-1 p-0.5 bg-white/90 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-[#FF4D00] hover:text-white"
              >
                <Edit2 className="w-3 h-3 lg:w-2.5 lg:h-2.5" />
              </button>
            </div>

            <div className="p-2 lg:p-1.5 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-1.5 lg:gap-1 mb-1 lg:mb-0.5">
                <h3 className="font-bold text-[10px] lg:text-[9px] text-[#1a202c] group-hover:text-[#FF4D00] transition-colors line-clamp-1">
                  {item.name}
                </h3>
                <span className="text-xs lg:text-[10px] font-bold text-[#FF4D00] whitespace-nowrap">
                  {Number(item.base_price).toFixed(2)} DH
                </span>
              </div>
              <p className="text-[9px] lg:text-[8px] text-gray-500 line-clamp-1 mb-1.5 lg:mb-1 flex-1">
                {item.description}
              </p>

              <div className="flex items-center justify-between pt-1.5 lg:pt-1 border-t border-gray-100 mt-auto">
                <div className="flex items-center gap-1">
                  <span
                    className={`w-1 h-1 rounded-full ${item.is_available ? "bg-[#FF4D00]" : "bg-red-500"
                      }`}
                  ></span>
                  <span
                    className={`text-[9px] lg:text-[8px] font-medium ${item.is_available ? "text-[#FF4D00]" : "text-red-500"
                      }`}
                  >
                    {item.is_available ? "Available" : "Inactive"}
                  </span>
                </div>
                <button
                  onClick={() => handleToggleAvailability(item.id, item.is_available)}
                  className={`relative w-7 h-3.5 lg:w-6 lg:h-3 rounded-full transition-colors ${item.is_available ? "bg-[#FF4D00]" : "bg-gray-300"
                    }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 lg:w-2 lg:h-2 bg-white rounded-full shadow-md transition-transform ${item.is_available ? "translate-x-3.5 lg:translate-x-3" : "translate-x-0"
                      }`}
                  ></span>
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={handleOpenAddModal}
          className="bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-[#FF4D00] flex flex-col items-center justify-center min-h-[180px] lg:min-h-[160px] text-gray-400 hover:text-[#FF4D00] transition-all group"
        >
          <div className="w-8 h-8 lg:w-6 lg:h-6 rounded-lg bg-gray-100 group-hover:bg-[#FF4D00]/10 flex items-center justify-center mb-1.5 lg:mb-1 transition-colors">
            <Plus className="w-4 h-4 lg:w-3 lg:h-3" />
          </div>
          <span className="font-semibold text-[10px] lg:text-[9px] text-[#1a202c]">Add Item</span>
        </button>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 py-4 w-full">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
              const showPage = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
              const showEllipsis = page === 2 && currentPage > 3 || page === totalPages - 1 && currentPage < totalPages - 2;

              if (showEllipsis && !showPage) {
                return <span key={page} className="px-2 text-gray-400">...</span>;
              }

              if (!showPage) return null;

              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${currentPage === page
                      ? "bg-[#FF4D00] text-white shadow-md"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-[#FF4D00] hover:text-[#FF4D00]"
                    }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>

          <span className="ml-4 text-sm text-gray-500">
            Showing {startIndex + 1}-{endIndex} of {totalCount}
          </span>
        </div>
      )}

      {/* Footer Stats */}
      <div className="fixed bottom-0 left-0 lg:left-[200px] xl:left-[220px] 2xl:left-[240px] right-0 bg-white border-t border-gray-200 p-2 lg:p-1.5 flex items-center justify-between z-10 px-3 lg:px-2">
        <p className="text-[10px] lg:text-[9px] text-gray-600 whitespace-nowrap">
          Total Items: <span className="font-bold text-[#1a202c]">{totalCount}</span>
        </p>
        <div className="flex items-center gap-2 lg:gap-3">
          <p className="text-[10px] lg:text-[9px] text-gray-600 whitespace-nowrap">
            Available: <span className="font-bold text-[#FF4D00]">{availableCount}</span>
          </p>
          <p className="text-[10px] lg:text-[9px] text-gray-600 whitespace-nowrap">
            OutOfStock: <span className="font-bold text-red-500">{outOfStockCount}</span>
          </p>
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col mx-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white z-20 flex flex-col border-b border-gray-100">
              <div className="flex items-center justify-between p-4 sm:p-6 gap-2">
                <div>
                  <h2 className="text-xl font-bold text-[#1a202c]">
                    {editingItem ? "Update Menu Item" : "Create Menu Item"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {editingItem ? `Editing: ${editingItem.name}` : "Add details for new item"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {editingItem && (
                    <button
                      onClick={() => handleDeleteItem(editingItem.id, editingItem.name)}
                      className="px-3 py-2 text-red-500 bg-red-50 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  )}
                  <button
                    onClick={() => setShowItemModal(false)}
                    className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Stepper Header */}
              <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                <div className="flex items-center justify-between max-w-lg mx-auto relative">
                  {/* Connecting Line */}
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 -translate-y-1/2" />

                  {/* Step 1 */}
                  <button
                    onClick={() => setActiveItemTab("details")}
                    className={`relative flex flex-col items-center gap-2 group outline-none ${activeItemTab === "details" ? "text-[#FF4D00]" : "text-gray-400"}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 bg-white ${activeItemTab === "details" ? "border-[#FF4D00] text-[#FF4D00]" :
                      (activeItemTab === "variants" || activeItemTab === "modifiers") ? "border-[#FF4D00] bg-[#FF4D00] text-white" : "border-gray-300"
                      }`}>
                      {(activeItemTab === "variants" || activeItemTab === "modifiers") ? <Check className="w-4 h-4" /> : "1"}
                    </div>
                    <span className="text-xs font-bold bg-gray-50 px-2 rounded">Details</span>
                  </button>

                  {/* Step 2 */}
                  <button
                    onClick={() => editingItem && setActiveItemTab("variants")}
                    disabled={!editingItem}
                    className={`relative flex flex-col items-center gap-2 group outline-none ${activeItemTab === "variants" ? "text-[#FF4D00]" : "text-gray-400"} ${!editingItem && "opacity-50 cursor-not-allowed"}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 bg-white ${activeItemTab === "variants" ? "border-[#FF4D00] text-[#FF4D00]" :
                      (activeItemTab === "modifiers") ? "border-[#FF4D00] bg-[#FF4D00] text-white" : "border-gray-300"
                      }`}>
                      {activeItemTab === "modifiers" ? <Check className="w-4 h-4" /> : "2"}
                    </div>
                    <span className="text-xs font-bold bg-gray-50 px-2 rounded">Variants</span>
                  </button>

                  {/* Step 3 */}
                  <button
                    onClick={() => editingItem && setActiveItemTab("modifiers")}
                    disabled={!editingItem}
                    className={`relative flex flex-col items-center gap-2 group outline-none ${activeItemTab === "modifiers" ? "text-[#FF4D00]" : "text-gray-400"} ${!editingItem && "opacity-50 cursor-not-allowed"}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 bg-white ${activeItemTab === "modifiers" ? "border-[#FF4D00] text-[#FF4D00]" : "border-gray-300"
                      }`}>
                      3
                    </div>
                    <span className="text-xs font-bold bg-gray-50 px-2 rounded">Modifiers</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-x-hidden">
              {activeItemTab === "details" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-2 duration-300">
                  {/* Section 1: Basic Details & Pricing */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-[#FF4D00] font-semibold text-lg border-b border-gray-100 pb-2">
                        <span className="w-8 h-8 rounded-full bg-[#FF4D00]/10 flex items-center justify-center text-sm">1</span>
                        Basic Details
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Languages className="w-4 h-4 text-gray-400" />
                          <label className="text-sm font-medium text-gray-700">Multi-language Names *</label>
                        </div>
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all"
                            placeholder="English Name (e.g. Classic Burger)"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              dir="rtl"
                              value={formData.name_ar || ""}
                              onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all text-right"
                              placeholder="الاسم بالعربية"
                            />
                            <input
                              type="text"
                              value={formData.name_fr || ""}
                              onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all"
                              placeholder="Nom en Français"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Multilingual Descriptions</label>
                        <div className="space-y-3">
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all min-h-[80px]"
                            placeholder="English Description"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <textarea
                              dir="rtl"
                              value={formData.description_ar || ""}
                              onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all min-h-[80px] text-right"
                              placeholder="الوصف بالعربية"
                            />
                            <textarea
                              value={formData.description_fr || ""}
                              onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all min-h-[80px]"
                              placeholder="Description en Français"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                          <select
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all bg-white"
                          >
                            <option value="">Select Category</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <label className="text-sm font-medium text-gray-700">Prep Time (min)</label>
                          </div>
                          <input
                            type="number"
                            value={formData.preparation_time}
                            onChange={(e) => setFormData({ ...formData, preparation_time: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <AlertTriangle className="w-4 h-4 text-gray-400" />
                          <label className="text-sm font-medium text-gray-700">Allergens</label>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. nuts, dairy, gluten (comma separated)"
                          value={formData.allergens?.join(", ")}
                          onChange={(e) => setFormData({ ...formData, allergens: e.target.value.split(",").map(t => t.trim()).filter(t => t) })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-[#FF4D00] font-semibold text-lg border-b border-gray-100 pb-2">
                        <span className="w-8 h-8 rounded-full bg-[#FF4D00]/10 flex items-center justify-center text-sm">2</span>
                        Pricing & Media
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Base Price ($) *</label>
                          <input
                            type="number"
                            value={formData.base_price}
                            onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Image Upload */}
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-[#FF4D00] transition-colors cursor-pointer relative group"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {formData.image_url ? (
                          <div className="relative h-48 w-full">
                            <img src={formData.image_url} className="w-full h-full object-cover rounded-xl" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                              <span className="text-white font-medium">Change Image</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                              <Upload className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">Click to upload image</p>
                          </>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeItemTab === "variants" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#1a202c]">Item Variants</h3>
                      <p className="text-sm text-gray-500">Manage different sizes or versions of this item (e.g. Small, Medium, Large)</p>
                    </div>
                    <button
                      onClick={() => {
                        const newVariant: Variant = {
                          id: uuidv4(),
                          menu_item_id: editingItem?.id || "",
                          name: "New Variant",
                          price_adjustment: 0,
                          is_default: itemVariants.length === 0,
                          is_available: true
                        };
                        setItemVariants([...itemVariants, newVariant]);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF4D00]/10 text-[#FF4D00] rounded-xl font-bold text-sm hover:bg-[#FF4D00]/20 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Add Variant
                    </button>
                  </div>

                  {itemVariants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <Layers className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-gray-500 font-medium">No variants added yet</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-[40%]">Variant Name</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-[25%]">Price Adj.</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider w-[20%]">Availability</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider w-[15%]">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {itemVariants.map((v, idx) => (
                            <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={v.name}
                                    onChange={(e) => {
                                      const updated = [...itemVariants];
                                      updated[idx].name = e.target.value;
                                      setItemVariants(updated);
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none"
                                    placeholder="Name (e.g. Large)"
                                  />
                                  <input
                                    type="text"
                                    dir="rtl"
                                    value={v.name_ar || ""}
                                    onChange={(e) => {
                                      const updated = [...itemVariants];
                                      updated[idx].name_ar = e.target.value;
                                      setItemVariants(updated);
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none text-right placeholder:text-right"
                                    placeholder="الاسم بالعربية"
                                  />
                                  <input
                                    type="text"
                                    value={v.name_fr || ""}
                                    onChange={(e) => {
                                      const updated = [...itemVariants];
                                      updated[idx].name_fr = e.target.value;
                                      setItemVariants(updated);
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none"
                                    placeholder="Nom en Français"
                                  />
                                </div>
                              </td>
                              <td className="px-6 py-4 align-top pt-6">
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={v.price_adjustment}
                                    onChange={(e) => {
                                      const updated = [...itemVariants];
                                      updated[idx].price_adjustment = parseFloat(e.target.value);
                                      setItemVariants(updated);
                                    }}
                                    className="w-full px-3 py-2 pl-6 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none font-medium"
                                  />
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 align-top pt-6 text-center">
                                <button
                                  onClick={() => {
                                    const updated = [...itemVariants];
                                    updated[idx].is_available = !v.is_available;
                                    setItemVariants(updated);
                                  }}
                                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:ring-offset-2 ${v.is_available ? 'bg-[#FF4D00]' : 'bg-gray-200'
                                    }`}
                                  title={v.is_available ? "Click to Disable" : "Click to Enable"}
                                >
                                  <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${v.is_available ? 'translate-x-6' : 'translate-x-1'
                                      }`}
                                  />
                                </button>
                              </td>
                              <td className="px-6 py-4 align-top pt-6 text-center">
                                <button
                                  onClick={() => handleDeleteVariant(v.id, v.name)}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                  title="Delete Variant"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!editingItem && (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                      <p className="text-sm text-amber-700">
                        <strong>Note:</strong> Variants will be saved after you create the menu item.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeItemTab === "modifiers" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#1a202c]">Modifiers & Add-ons</h3>
                      <p className="text-sm text-gray-500">Link extra toppings, customizations, or required options to this item.</p>
                    </div>
                    <button
                      onClick={() => setShowGlobalModsModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF4D00] text-white rounded-xl font-bold text-sm hover:bg-[#E04400] transition-all shadow-md"
                    >
                      <Plus className="w-4 h-4" /> Global Modifiers
                    </button>
                  </div>

                  {!editingItem ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
                      <p className="text-gray-500 font-medium text-center px-6">
                        Please save the basic details of the item first before linking modifiers.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {restaurantModifiers.map((modifier) => {
                        const link = itemModifierLinks.find(l => l.modifier_id === modifier.id);
                        const isLinked = !!link;

                        return (
                          <div
                            key={modifier.id}
                            className={`p-5 rounded-2xl border-2 transition-all ${isLinked ? 'border-[#FF4D00] bg-[#FF4D00]/5' : 'border-gray-100 bg-white hover:border-gray-200 shadow-sm'
                              }`}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="font-bold text-[#1a202c]">{modifier.name}</h4>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{modifier.modifier_type}</p>
                              </div>
                              <button
                                onClick={() => toggleModifierLink(modifier.id)}
                                className={`w-12 h-6 rounded-full relative transition-all ${isLinked ? 'bg-[#FF4D00]' : 'bg-gray-200'
                                  }`}
                              >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${isLinked ? 'translate-x-6' : 'translate-x-0'}`} />
                              </button>
                            </div>

                            {isLinked && (
                              <div className="space-y-4 pt-4 border-t border-[#FF4D00]/10">
                                {/* <div className="flex items-center justify-between">
                                  <label className="text-xs font-bold text-gray-500">Required Option?</label>
                                  <input
                                    type="checkbox"
                                    checked={link.is_required}
                                    onChange={(e) => updateModifierLink(modifier.id, { is_required: e.target.checked })}
                                    className="w-4 h-4 text-[#FF4D00] rounded bg-white border-gray-300 focus:ring-[#FF4D00]"
                                  />
                                </div> */}
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-bold text-gray-500">Max Selections</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={link.max_selections || 1}
                                    onChange={(e) => updateModifierLink(modifier.id, { max_selections: parseInt(e.target.value) })}
                                    className="w-16 px-2 py-1 text-xs rounded-lg border border-gray-200 focus:ring-1 focus:ring-[#FF4D00] outline-none"
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-400">Price: <span className="text-[#FF4D00] font-bold">+${Number(modifier.price).toFixed(2)}</span></span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Stepper Footer */}
            <div className="sticky bottom-0 bg-white p-4 sm:p-6 border-t border-gray-100 flex items-center justify-between z-10 w-full overflow-hidden">
              <span className="text-sm text-gray-500 hidden sm:block">
                {isSaving ? "Saving changes..." : "All changes are saved to cloud"}
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">

                {/* Step 1: Details Actions */}
                {activeItemTab === "details" && (
                  <>
                    <button onClick={() => setShowItemModal(false)} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                      Cancel
                    </button>
                    <button
                      disabled={isSaving}
                      onClick={handleSaveDetails}
                      className="px-6 py-2.5 bg-[#FF4D00] text-white rounded-xl font-semibold hover:bg-[#E04400] transition-colors shadow-lg shadow-[#FF4D00]/20 flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                      {editingItem ? "Update & Next" : "Save & Next"}
                    </button>
                  </>
                )}

                {/* Step 2: Variants Actions */}
                {activeItemTab === "variants" && (
                  <>
                    <button
                      onClick={() => setActiveItemTab("details")}
                      className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      disabled={isSaving}
                      onClick={handleSaveVariants}
                      className="px-6 py-2.5 bg-[#FF4D00] text-white rounded-xl font-semibold hover:bg-[#E04400] transition-colors shadow-lg shadow-[#FF4D00]/20 flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                      Save & Next
                    </button>
                  </>
                )}

                {/* Step 3: Modifiers Actions */}
                {activeItemTab === "modifiers" && (
                  <>
                    <button
                      onClick={() => setActiveItemTab("variants")}
                      className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => { setShowItemModal(false); fetchInitialData(); fetchPaginatedItems(); }}
                      className="px-6 py-2.5 bg-[#FF4D00] text-white rounded-xl font-semibold hover:bg-[#E04400] transition-colors shadow-lg shadow-[#FF4D00]/20 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Finish
                    </button>
                  </>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal (Enhanced) */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col mx-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 gap-2">
              <div>
                <h2 className="text-xl font-bold text-[#1a202c]">
                  {editingCategory ? "Update Category" : "Add Category"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {editingCategory ? `Editing: ${editingCategory.name}` : "Create a new menu category"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {editingCategory && (
                  <button
                    onClick={() => handleDeleteCategory(editingCategory.id, editingCategory.name)}
                    className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                )}
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-6 overflow-x-hidden">
              {/* Name Fields */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Languages className="w-4 h-4 text-gray-400" />
                  <label className="text-sm font-medium text-gray-700">Category Names *</label>
                </div>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all"
                  placeholder="English Name"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    dir="rtl"
                    value={categoryFormData.name_ar || ""}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name_ar: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all text-right"
                    placeholder="الاسم بالعربية"
                  />
                  <input
                    type="text"
                    value={categoryFormData.name_fr || ""}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name_fr: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all"
                    placeholder="Nom en Français"
                  />
                </div>
              </div>

              {/* Description Fields */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descriptions</label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all min-h-[80px]"
                  placeholder="English Description"
                />
                <div className="grid grid-cols-2 gap-3">
                  <textarea
                    dir="rtl"
                    value={categoryFormData.description_ar || ""}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, description_ar: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all min-h-[80px] text-right"
                    placeholder="الوصف بالعربية"
                  />
                  <textarea
                    value={categoryFormData.description_fr || ""}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, description_fr: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent outline-none transition-all min-h-[80px]"
                    placeholder="Description en Français"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-[#FF4D00] transition-colors cursor-pointer relative group"
                onClick={() => categoryFileInputRef.current?.click()}
              >
                {categoryFormData.image_url ? (
                  <div className="relative h-40 w-full">
                    <img src={categoryFormData.image_url} className="w-full h-full object-cover rounded-xl" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                      <span className="text-white font-medium">Change Image</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">Category Cover Image</p>
                  </>
                )}
                <input
                  ref={categoryFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCategoryImageUpload}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white overflow-hidden">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isSaving}
                onClick={handleSaveCategory}
                className="px-6 py-2.5 bg-[#FF4D00] text-white rounded-xl font-semibold hover:bg-[#E04400] transition-colors shadow-lg shadow-[#FF4D00]/20 flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingCategory ? "Update" : "Add Category"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Professional Deletion Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100 mx-auto">
            <div className="p-6 sm:p-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mb-6 animate-bounce-subtle">
                <Trash2 className="w-10 h-10 text-red-500" />
              </div>

              <h3 className="text-2xl font-bold text-[#1a202c] mb-2">
                Delete {deleteModal.type === "item" ? "Item" : deleteModal.type === "category" ? "Category" : deleteModal.type === "variant" ? "Variant" : "Modifier"}?
              </h3>
              <p className="text-gray-500 leading-relaxed mb-8">
                Are you sure you want to permanently remove <span className="font-semibold text-red-500">"{deleteModal.name}"</span>?
                {deleteModal.type === "category" ? " This will not delete items inside, but will remove their association." :
                  deleteModal.type === "modifier" ? " This will permanently remove it from the restaurant and all linked items." :
                    " This action cannot be undone."}
              </p>

              <div className="flex flex-col w-full gap-3">
                <button
                  disabled={isSaving}
                  onClick={handleConfirmDelete}
                  className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-red-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : "Yes, Delete Permanently"}
                </button>
                <button
                  onClick={() => setDeleteModal({ show: false, type: null, id: null, name: null })}
                  className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl font-bold text-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 text-center border-t border-gray-100 italic text-[11px] text-gray-400">
              This operation is protected and monitored for security.
            </div>
          </div>
        </div>
      )}

      {/* Global Modifiers CRUD Modal */}
      {showGlobalModsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col mx-auto">
            <div className="p-4 sm:p-8 flex items-center justify-between border-b border-gray-100 gap-2">
              <div>
                <h3 className="text-2xl font-bold text-[#1a202c]">Manage Modifiers</h3>
                <p className="text-sm text-gray-500">Create global options available for all menu items</p>
              </div>
              <button onClick={() => setShowGlobalModsModal(false)} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-4 sm:p-8 space-y-8 overflow-x-hidden">
              {/* Form to Add/Edit */}
              <div className="bg-gray-50 p-4 sm:p-6 rounded-[2rem] border border-gray-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-gray-500">Modifier Name *</label>
                    <input
                      type="text"
                      value={modifierFormData.name}
                      onChange={(e) => setModifierFormData({ ...modifierFormData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF4D00] outline-none transition-all"
                      placeholder="e.g. Extra Cheese"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        dir="rtl"
                        value={modifierFormData.name_ar || ""}
                        onChange={(e) => setModifierFormData({ ...modifierFormData, name_ar: e.target.value })}
                        className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF4D00] outline-none text-right"
                        placeholder="الاسم بالعربية"
                      />
                      <input
                        type="text"
                        value={modifierFormData.name_fr || ""}
                        onChange={(e) => setModifierFormData({ ...modifierFormData, name_fr: e.target.value })}
                        className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF4D00] outline-none"
                        placeholder="En Français"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-gray-500">Type & Price</label>
                    <select
                      value={modifierFormData.modifier_type}
                      onChange={(e) => setModifierFormData({ ...modifierFormData, modifier_type: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF4D00] outline-none bg-white"
                    >
                      <option value="extra">Extra / Add-on</option>
                      <option value="option">Option / Removal</option>
                      <option value="size">Size Variance</option>
                      <option value="customization">Customization</option>
                    </select>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                      <input
                        type="number"
                        value={modifierFormData.price}
                        onChange={(e) => setModifierFormData({ ...modifierFormData, price: parseFloat(e.target.value) })}
                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF4D00] outline-none font-bold"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveModifier}
                    className="flex-1 py-3 bg-[#FF4D00] text-white rounded-xl font-bold hover:bg-[#E04400] transition-all"
                  >
                    {editingModifier ? "Update Modifier" : "Create New Modifier"}
                  </button>
                  {editingModifier && (
                    <button
                      onClick={() => {
                        setEditingModifier(null);
                        setModifierFormData(defaultModifierState);
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-300 transition-all"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>

              {/* List of Modifiers */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-[#1a202c]">Existing Modifiers ({restaurantModifiers.length})</h4>
                <div className="grid grid-cols-1 gap-3">
                  {restaurantModifiers.map((mod) => (
                    <div key={mod.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-[#FF4D00]">
                          <Tags className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-[#1a202c]">{mod.name} <span className="text-[10px] text-gray-400 font-normal uppercase ml-2">{mod.modifier_type}</span></p>
                          <p className="text-sm text-[#FF4D00] font-bold">+${Number(mod.price).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => {
                            setEditingModifier(mod);
                            setModifierFormData(mod);
                          }}
                          className="p-2 text-gray-400 hover:text-[#FF4D00] hover:bg-[#FF4D00]/5 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteModifier(mod.id, mod.name)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
