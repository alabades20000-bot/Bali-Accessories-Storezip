import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Coins,
  Store,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Package,
  Search,
  UserPlus,
  FileText,
  Eye,
  ImageOff,
  LogOut,
  LayoutGrid,
  Table as TableIcon,
  Percent,
  Upload,
  Link2,
  Tag,
  Boxes,
  Layers,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/cart";
import {
  getAdminProductsPrices,
  updateProductPrices,
  updateBatchProductPrices,
  upsertAdminProduct,
  deleteAdminProduct,
  upsertAdminCategory,
  deleteAdminCategory,
  getMerchantsListAdmin,
  setMerchantStatusAdmin,
  createMerchantAccountAdmin,
} from "@/lib/wholesale.functions";
import { InvoiceModal, type OrderForInvoice } from "@/components/site/InvoiceModal";
import { CategoryIcon, ICON_OPTIONS } from "@/components/site/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة تحكم المدير | Bali+" },
      { name: "description", content: "إدارة المنتجات والأقسام وتغيير أسعار المفرد والجملة وأصحاب المحلات والفواتير." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

export type ProductRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  wholesale_price: number;
  old_price: number | null;
  stock: number;
  image_url: string | null;
  open_image_url: string | null;
  category_id: string | null;
  featured: boolean;
  is_active: boolean;
};

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image_url: string | null;
  sort_order: number;
};

const DEFAULT_CATEGORIES = [
  { id: "mobiles", name: "موبايلات", slug: "mobiles", icon: "smartphone", image_url: null, sort_order: 1 },
  { id: "headphones", name: "سماعات", slug: "headphones", icon: "headphones", image_url: null, sort_order: 2 },
  { id: "accessories", name: "إكسسوارات", slug: "accessories", icon: "sparkles", image_url: null, sort_order: 3 },
  { id: "screen-protectors", name: "لاصقات شاشة", slug: "screen-protectors", icon: "shield", image_url: null, sort_order: 4 },
  { id: "wireless-earbuds", name: "إيربودز لاسلكية", slug: "wireless-earbuds", icon: "ear", image_url: null, sort_order: 5 },
  { id: "chargers", name: "شواحن سريعة", slug: "chargers", icon: "zap", image_url: null, sort_order: 6 },
  { id: "cables", name: "كيبلات ومحولات", slug: "cables", icon: "cable", image_url: null, sort_order: 7 },
  { id: "lenses", name: "حماية وعدسات", slug: "lenses", icon: "camera", image_url: null, sort_order: 8 },
  { id: "power-banks", name: "باور بنك وشحن", slug: "power-banks", icon: "battery-charging", image_url: null, sort_order: 9 },
  { id: "cases", name: "كفرات وحماية", slug: "cases", icon: "package", image_url: null, sort_order: 10 },
];

const emptyProduct: ProductRow = {
  id: "",
  name: "",
  description: "",
  price: 0,
  wholesale_price: 0,
  old_price: null,
  stock: 10,
  image_url: null,
  open_image_url: null,
  category_id: null,
  featured: false,
  is_active: true,
};

const emptyCategory: CategoryRow = {
  id: "",
  name: "",
  slug: "",
  icon: "package",
  image_url: null,
  sort_order: 0,
};

function AdminPage() {
  const { user, isAdmin, isMerchant, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // مقتصر حصراً على المدير - صاحب المحل أو الزبون العادي لا يستطيع الوصول
  if (!user || !isAdmin || isMerchant) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="rounded-3xl glass-card p-8 border border-destructive/40 shadow-xl">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-destructive/20 text-destructive">
            <XCircle className="size-9" />
          </div>
          <h1 className="font-display text-2xl font-black">لوحة التحكم مخصصة للمدير فقط</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            يرجى تسجيل الدخول بحساب المدير الرئيسي (alipppppp62@gmail.com) للتحكم الكامل وتعديل المنتجات والأقسام والأسعار.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link to="/auth">تسجيل دخول المدير</Link>
          </Button>
          <Button asChild variant="secondary" className="mt-2 w-full">
            <Link to="/">العودة للمتجر</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const runUpdatePrices = useServerFn(updateProductPrices);
  const runUpdateBatchPrices = useServerFn(updateBatchProductPrices);
  const runUpsertProduct = useServerFn(upsertAdminProduct);
  const runDeleteProduct = useServerFn(deleteAdminProduct);
  const runUpsertCategory = useServerFn(upsertAdminCategory);
  const runDeleteCategory = useServerFn(deleteAdminCategory);
  const runSetMerchantStatus = useServerFn(setMerchantStatusAdmin);
  const runCreateMerchant = useServerFn(createMerchantAccountAdmin);
  const runGetAdminPrices = useServerFn(getAdminProductsPrices);
  const runGetMerchants = useServerFn(getMerchantsListAdmin);

  // جلب التصنيفات والأقسام
  const { data: categories = [], refetch: refetchCategories, isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,slug,icon,image_url,sort_order")
        .order("sort_order");
      if (error || !data || data.length === 0) return DEFAULT_CATEGORIES as CategoryRow[];
      return data as CategoryRow[];
    },
  });

  // جلب كافة المنتجات
  const { data: products = [], refetch: refetchProducts, isLoading: loadingProducts } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      try {
        const res = await runGetAdminPrices();
        if (res && Array.isArray(res) && res.length > 0) {
          return res.map((p: any) => ({
            ...p,
            wholesale_price:
              p.wholesale_price !== undefined && p.wholesale_price !== null
                ? Number(p.wholesale_price)
                : Math.round(Number(p.price || 0) * 0.85),
          })) as ProductRow[];
        }
      } catch (err) {
        console.warn("Falling back to client products query", err);
      }

      const { data, error } = await supabase
        .from("products")
        .select("id,name,description,price,wholesale_price,old_price,stock,image_url,open_image_url,category_id,featured,is_active")
        .order("created_at", { ascending: false });

      if (error) return [];
      return (data ?? []).map((p: any) => ({
        ...p,
        wholesale_price:
          p.wholesale_price !== undefined && p.wholesale_price !== null
            ? Number(p.wholesale_price)
            : Math.round(Number(p.price || 0) * 0.85),
      })) as ProductRow[];
    },
  });

  // جلب الفواتير والطلبات
  const { data: orders = [], refetch: refetchOrders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) return [];
      return (data ?? []) as OrderForInvoice[];
    },
  });

  // جلب أصحاب المحلات
  const { data: merchants = [], refetch: refetchMerchants } = useQuery({
    queryKey: ["admin-merchants"],
    queryFn: async () => {
      try {
        const res = await runGetMerchants();
        return res ?? [];
      } catch {
        return [];
      }
    },
  });

  const [activeTab, setActiveTab] = useState("products");
  const [productViewMode, setProductViewMode] = useState<"grid" | "table">("grid");
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "out_of_stock">("all");

  // نافذة إضافة / تعديل منتج شامل
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [draft, setDraft] = useState<ProductRow>({ ...emptyProduct });
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<"image_url" | "open_image_url" | null>(null);

  // نافذة إضافة / تعديل قسم
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState<CategoryRow>({ ...emptyCategory });
  const [savingCategory, setSavingCategory] = useState(false);
  const [uploadingCatImage, setUploadingCatImage] = useState(false);

  // نافذة التعديل السريع للأسعار بنقرة واحدة
  const [quickPriceModalOpen, setQuickPriceModalOpen] = useState(false);
  const [quickPriceProduct, setQuickPriceProduct] = useState<ProductRow | null>(null);
  const [quickRetailPrice, setQuickRetailPrice] = useState<number>(0);
  const [quickWholesalePrice, setQuickWholesalePrice] = useState<number>(0);
  const [quickStock, setQuickStock] = useState<number>(0);
  const [savingQuickPrice, setSavingQuickPrice] = useState(false);

  // تعديل الأسعار السريع في الجدول
  const [editingPrices, setEditingPrices] = useState<
    Record<string, { price: number; wholesalePrice: number; stock: number }>
  >({});
  const [savingRow, setSavingRow] = useState<Record<string, boolean>>({});
  const [savingBatch, setSavingBatch] = useState(false);
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState<number>(15);

  // فواتير وتجار
  const [selectedInvoice, setSelectedInvoice] = useState<OrderForInvoice | null>(null);
  const [openAddMerchant, setOpenAddMerchant] = useState(false);
  const [creatingMerchant, setCreatingMerchant] = useState(false);
  const [newMerchant, setNewMerchant] = useState({
    email: "",
    password: "",
    shop_name: "",
    owner_name: "",
    phone: "",
    address: "",
  });

  // تصفية المنتجات
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = productSearch.trim().toLowerCase();
      const matchSearch =
        !q || p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
      const matchCat = categoryFilter === "all" || p.category_id === categoryFilter;
      let matchStock = true;
      if (stockFilter === "in_stock") matchStock = p.stock > 0;
      if (stockFilter === "out_of_stock") matchStock = p.stock <= 0;
      return matchSearch && matchCat && matchStock;
    });
  }, [products, productSearch, categoryFilter, stockFilter]);

  // المنتجات المعدلة في الجدول
  const modifiedList = useMemo(() => {
    return products.filter((p) => {
      const row = editingPrices[p.id];
      if (!row) return false;
      return (
        row.price !== Number(p.price) ||
        row.wholesalePrice !== Number(p.wholesale_price) ||
        row.stock !== Number(p.stock)
      );
    });
  }, [products, editingPrices]);

  const totalSales = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const handleLogout = async () => {
    await logout();
    toast.success("تم تسجيل الخروج");
    void navigate({ to: "/" });
  };

  const openNewProductModal = () => {
    setDraft({ ...emptyProduct });
    setEditModalOpen(true);
  };

  const openEditProductModal = (product: ProductRow) => {
    setDraft({
      id: product.id,
      name: product.name,
      description: product.description || "",
      price: Number(product.price) || 0,
      wholesale_price: Number(product.wholesale_price) || 0,
      old_price: product.old_price !== null && product.old_price !== undefined ? Number(product.old_price) : null,
      stock: Number(product.stock) || 0,
      image_url: product.image_url,
      open_image_url: product.open_image_url,
      category_id: product.category_id,
      featured: Boolean(product.featured),
      is_active: Boolean(product.is_active),
    });
    setEditModalOpen(true);
  };

  const openQuickPriceModal = (product: ProductRow) => {
    setQuickPriceProduct(product);
    setQuickRetailPrice(Number(product.price) || 0);
    setQuickWholesalePrice(Number(product.wholesale_price) || 0);
    setQuickStock(Number(product.stock) || 0);
    setQuickPriceModalOpen(true);
  };

  const openNewCategoryModal = () => {
    setCategoryDraft({
      ...emptyCategory,
      sort_order: categories.length + 1,
    });
    setCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: CategoryRow) => {
    setCategoryDraft({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || "package",
      image_url: cat.image_url,
      sort_order: Number(cat.sort_order) || 0,
    });
    setCategoryModalOpen(true);
  };

  // رفع صور المنتجات إلى Supabase Storage
  const handleImageUpload = async (file: File, field: "image_url" | "open_image_url") => {
    setUploadingImage(field);
    try {
      const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "")}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setDraft((prev) => ({ ...prev, [field]: data.publicUrl }));
      toast.success("تم رفع الصورة بنجاح");
    } catch (err: any) {
      toast.error(err?.message || "تعذر رفع الصورة");
    } finally {
      setUploadingImage(null);
    }
  };

  // رفع صورة القسم
  const handleCatImageUpload = async (file: File) => {
    setUploadingCatImage(true);
    try {
      const path = `cat-${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "")}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setCategoryDraft((prev) => ({ ...prev, image_url: data.publicUrl }));
      toast.success("تم رفع صورة القسم بنجاح");
    } catch (err: any) {
      toast.error(err?.message || "تعذر رفع الصورة");
    } finally {
      setUploadingCatImage(false);
    }
  };

  // حفظ القسم
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryDraft.name.trim()) {
      toast.error("يرجى إدخال اسم القسم");
      return;
    }
    const slug = categoryDraft.slug.trim() || categoryDraft.name.trim().toLowerCase().replace(/\s+/g, "-");

    setSavingCategory(true);
    try {
      await runUpsertCategory({
        data: {
          id: categoryDraft.id || undefined,
          name: categoryDraft.name.trim(),
          slug,
          icon: categoryDraft.icon || "package",
          image_url: categoryDraft.image_url,
          sort_order: Number(categoryDraft.sort_order) || 0,
        },
      });

      toast.success(categoryDraft.id ? "تم حفظ تعديلات القسم بنجاح!" : "تمت إضافة القسم الجديد بنجاح!");
      setCategoryModalOpen(false);
      void refetchCategories();
      void qc.invalidateQueries({ queryKey: ["categories"] });
    } catch {
      try {
        const payload = {
          name: categoryDraft.name.trim(),
          slug,
          icon: categoryDraft.icon || "package",
          image_url: categoryDraft.image_url,
          sort_order: Number(categoryDraft.sort_order) || 0,
        };
        if (categoryDraft.id) {
          await supabase.from("categories").update(payload).eq("id", categoryDraft.id);
        } else {
          await supabase.from("categories").insert(payload);
        }
        toast.success("تم حفظ القسم بنجاح!");
        setCategoryModalOpen(false);
        void refetchCategories();
        void qc.invalidateQueries({ queryKey: ["categories"] });
      } catch (err: any) {
        toast.error(err?.message || "تعذر حفظ القسم");
      }
    } finally {
      setSavingCategory(false);
    }
  };

  // حذف قسم
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك بحذف قسم "${name}"؟`)) return;
    try {
      await runDeleteCategory({ data: { categoryId: id } });
      toast.success("تم حذف القسم بنجاح");
      void refetchCategories();
      void qc.invalidateQueries({ queryKey: ["categories"] });
    } catch {
      await supabase.from("categories").delete().eq("id", id);
      toast.success("تم حذف القسم");
      void refetchCategories();
    }
  };

  // حفظ المنتج بالكامل وسعري المفرد والجملة المستقلين
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      toast.error("يرجى إدخال اسم المنتج");
      return;
    }

    setSavingProduct(true);
    const safePrice = Math.max(0, Number(draft.price) || 0);
    const safeWholesale = Math.max(0, Number(draft.wholesale_price) || 0);
    const safeStock = Math.max(0, Number(draft.stock) || 0);
    const safeOldPrice = draft.old_price !== null && draft.old_price !== undefined ? Math.max(0, Number(draft.old_price)) : null;

    const payload = {
      name: draft.name.trim(),
      description: draft.description ? draft.description.trim() : "",
      price: safePrice,
      wholesale_price: safeWholesale,
      old_price: safeOldPrice,
      stock: safeStock,
      image_url: draft.image_url,
      open_image_url: draft.open_image_url,
      category_id: draft.category_id || null,
      featured: Boolean(draft.featured),
      is_active: Boolean(draft.is_active),
      updated_at: new Date().toISOString(),
    };

    try {
      // 1. Server function
      try {
        await runUpsertProduct({
          data: {
            id: draft.id || undefined,
            ...payload,
          },
        });
      } catch (srvErr) {
        console.warn("[admin] server upsert warning:", srvErr);
      }

      // 2. Direct client update
      try {
        if (draft.id) {
          await supabase.from("products").update(payload).eq("id", draft.id);
        } else {
          await supabase.from("products").insert(payload);
        }
      } catch (clientErr) {
        console.warn("[admin] direct supabase error:", clientErr);
      }

      // 3. Immediately mutate caches
      if (draft.id) {
        setEditingPrices((prev) => {
          const next = { ...prev };
          delete next[draft.id];
          return next;
        });

        const updateList = (list: any) => {
          if (!Array.isArray(list)) return list;
          return list.map((item) => (item.id === draft.id ? { ...item, ...payload } : item));
        };

        qc.setQueriesData({ queryKey: ["admin-products"] }, (old: any) => updateList(old));
        qc.setQueriesData({ queryKey: ["all-home-products"] }, (old: any) => updateList(old));
        qc.setQueriesData({ queryKey: ["products-in-category"] }, (old: any) => updateList(old));
        qc.setQueriesData({ queryKey: ["search-all-products"] }, (old: any) => updateList(old));
      }

      toast.success(draft.id ? "تم حفظ التعديلات والأسعار بنجاح!" : "تمت إضافة المنتج بنجاح!");
      setEditModalOpen(false);

      void refetchProducts();
      void qc.invalidateQueries({ queryKey: ["admin-products"] });
      void qc.invalidateQueries({ queryKey: ["all-home-products"] });
      void qc.invalidateQueries({ queryKey: ["products-in-category"] });
      void qc.invalidateQueries({ queryKey: ["wholesale-prices"] });
    } catch (err: any) {
      toast.error(err?.message || "تعذر حفظ المنتج");
    } finally {
      setSavingProduct(false);
    }
  };

  // حفظ سريع من نافذة السعر الفورية
  const handleSaveQuickPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPriceProduct) return;
    setSavingQuickPrice(true);

    const safePrice = Math.max(0, Number(quickRetailPrice));
    const safeWholesale = Math.max(0, Number(quickWholesalePrice));
    const safeStock = Math.max(0, Number(quickStock));
    const prodId = quickPriceProduct.id;

    try {
      try {
        await runUpdatePrices({
          data: {
            productId: prodId,
            price: safePrice,
            wholesalePrice: safeWholesale,
            stock: safeStock,
          },
        });
      } catch (err) {
        console.warn("[admin] server quick price warning:", err);
      }

      try {
        await supabase
          .from("products")
          .update({
            price: safePrice,
            wholesale_price: safeWholesale,
            stock: safeStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", prodId);
      } catch (cErr) {
        console.warn("[admin] direct quick price warning:", cErr);
      }

      // Update cache immediately
      setEditingPrices((prev) => {
        const next = { ...prev };
        delete next[prodId];
        return next;
      });

      const updateList = (list: any) => {
        if (!Array.isArray(list)) return list;
        return list.map((item) =>
          item.id === prodId
            ? { ...item, price: safePrice, wholesale_price: safeWholesale, stock: safeStock }
            : item,
        );
      };

      qc.setQueriesData({ queryKey: ["admin-products"] }, (old: any) => updateList(old));
      qc.setQueriesData({ queryKey: ["all-home-products"] }, (old: any) => updateList(old));
      qc.setQueriesData({ queryKey: ["products-in-category"] }, (old: any) => updateList(old));
      qc.setQueriesData({ queryKey: ["search-all-products"] }, (old: any) => updateList(old));

      toast.success(`تم تحديث أسعار "${quickPriceProduct.name}" بنجاح!`);
      setQuickPriceModalOpen(false);

      void refetchProducts();
      void qc.invalidateQueries({ queryKey: ["admin-products"] });
      void qc.invalidateQueries({ queryKey: ["all-home-products"] });
      void qc.invalidateQueries({ queryKey: ["wholesale-prices"] });
    } catch {
      toast.error("تعذر حفظ الأسعار");
    } finally {
      setSavingQuickPrice(false);
    }
  };

  // حذف منتج
  const handleDeleteProduct = async (id: string) => {
    if (!confirm("هل أنت متأكد من رغبتك بحذف هذا المنتج؟")) return;
    try {
      await runDeleteProduct({ data: { productId: id } });
      toast.success("تم حذف المنتج بنجاح");
      setEditModalOpen(false);
      void refetchProducts();
      void qc.invalidateQueries({ queryKey: ["admin-products"] });
      void qc.invalidateQueries({ queryKey: ["all-home-products"] });
    } catch {
      await supabase.from("products").delete().eq("id", id);
      toast.success("تم حذف المنتج");
      setEditModalOpen(false);
      void refetchProducts();
    }
  };

  // حفظ سطر واحد من جدول الأسعار
  const handleSaveSinglePriceRow = async (productId: string) => {
    const row = editingPrices[productId];
    if (!row) return;

    setSavingRow((prev) => ({ ...prev, [productId]: true }));
    const safePrice = Math.max(0, Number(row.price));
    const safeWholesale = Math.max(0, Number(row.wholesalePrice));
    const safeStock = Math.max(0, Number(row.stock));

    try {
      try {
        await runUpdatePrices({
          data: {
            productId,
            price: safePrice,
            wholesalePrice: safeWholesale,
            stock: safeStock,
          },
        });
      } catch (err) {
        console.warn("[admin] single row server warning:", err);
      }

      try {
        await supabase
          .from("products")
          .update({
            price: safePrice,
            wholesale_price: safeWholesale,
            stock: safeStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", productId);
      } catch (cErr) {
        console.warn("[admin] single row client warning:", cErr);
      }

      // Clear from dirty editing map
      setEditingPrices((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });

      // Update cache
      const updateList = (list: any) => {
        if (!Array.isArray(list)) return list;
        return list.map((item) =>
          item.id === productId
            ? { ...item, price: safePrice, wholesale_price: safeWholesale, stock: safeStock }
            : item,
        );
      };

      qc.setQueriesData({ queryKey: ["admin-products"] }, (old: any) => updateList(old));
      qc.setQueriesData({ queryKey: ["all-home-products"] }, (old: any) => updateList(old));
      qc.setQueriesData({ queryKey: ["products-in-category"] }, (old: any) => updateList(old));
      qc.setQueriesData({ queryKey: ["search-all-products"] }, (old: any) => updateList(old));

      toast.success("تم حفظ السعرين والمخزون بنجاح");
      void refetchProducts();
      void qc.invalidateQueries({ queryKey: ["admin-products"] });
      void qc.invalidateQueries({ queryKey: ["all-home-products"] });
    } catch {
      toast.error("تعذر حفظ السعر");
    } finally {
      setSavingRow((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // حفظ جماعي لكافة الأسعار المعدلة
  const handleSaveAllModifiedPrices = async () => {
    if (modifiedList.length === 0) return;
    setSavingBatch(true);
    try {
      const updates = modifiedList.map((p) => {
        const row = editingPrices[p.id]!;
        return {
          productId: p.id,
          price: Math.max(0, Number(row.price)),
          wholesalePrice: Math.max(0, Number(row.wholesalePrice)),
          stock: Math.max(0, Number(row.stock)),
        };
      });

      try {
        await runUpdateBatchPrices({ data: { updates } });
      } catch (err) {
        console.warn("[admin] batch server warning:", err);
      }

      for (const item of updates) {
        try {
          await supabase
            .from("products")
            .update({
              price: item.price,
              wholesale_price: item.wholesalePrice,
              stock: item.stock,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.productId);
        } catch {
          /* ignore */
        }
      }

      // Update cache
      const updateMap = new Map(updates.map((u) => [u.productId, u]));
      const updateList = (list: any) => {
        if (!Array.isArray(list)) return list;
        return list.map((item) => {
          const found = updateMap.get(item.id);
          if (found) {
            return { ...item, price: found.price, wholesale_price: found.wholesalePrice, stock: found.stock };
          }
          return item;
        });
      };

      qc.setQueriesData({ queryKey: ["admin-products"] }, (old: any) => updateList(old));
      qc.setQueriesData({ queryKey: ["all-home-products"] }, (old: any) => updateList(old));
      qc.setQueriesData({ queryKey: ["products-in-category"] }, (old: any) => updateList(old));

      setEditingPrices({});
      toast.success(`تم حفظ أسعار ${modifiedList.length} منتجات بنجاح!`);
      void refetchProducts();
      void qc.invalidateQueries({ queryKey: ["admin-products"] });
      void qc.invalidateQueries({ queryKey: ["all-home-products"] });
    } catch {
      toast.error("تعذر حفظ الأسعار");
    } finally {
      setSavingBatch(false);
    }
  };

  // تطبيق نسبة خصم الجملة تلقائياً على كل المنتجات المعروضة
  const handleApplyBulkDiscountPercent = () => {
    if (bulkDiscountPercent <= 0 || bulkDiscountPercent >= 100) {
      toast.error("يرجى إدخال نسبة خصم صحيحة بين 1% و 99%");
      return;
    }

    const nextEditing = { ...editingPrices };
    let count = 0;

    for (const p of filteredProducts) {
      const current = nextEditing[p.id] ?? {
        price: Number(p.price) || 0,
        wholesalePrice: Number(p.wholesale_price) || 0,
        stock: Number(p.stock) || 0,
      };

      if (current.price > 0) {
        const calculatedWholesale = Math.round(
          current.price * (1 - bulkDiscountPercent / 100),
        );
        nextEditing[p.id] = {
          ...current,
          wholesalePrice: calculatedWholesale,
        };
        count++;
      }
    }

    setEditingPrices(nextEditing);
    toast.success(
      `تم احتساب خصم ${bulkDiscountPercent}% لسعر الجملة على ${count} منتجاً. اضغط "حفظ كل التعديلات" لتثبيت الأسعار!`,
    );
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) {
      toast.error("تعذر تحديث الحالة");
      return;
    }
    toast.success("تم تحديث حالة الطلب");
    void refetchOrders();
  };

  const handleUpdateMerchantStatus = async (merchantId: string, status: string) => {
    try {
      await runSetMerchantStatus({ data: { merchantId, status } });
      toast.success("تم تحديث حالة صاحب المحل");
      void refetchMerchants();
    } catch {
      await supabase.from("merchant_profiles").update({ status }).eq("id", merchantId);
      toast.success("تم تحديث الحالة");
      void refetchMerchants();
    }
  };

  const handleCreateMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMerchant.email.trim() || !newMerchant.password || !newMerchant.shop_name.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    setCreatingMerchant(true);
    try {
      await runCreateMerchant({ data: newMerchant });
      toast.success("تم إنشاء واعتماد حساب صاحب المحل بنجاح");
      setOpenAddMerchant(false);
      setNewMerchant({
        email: "",
        password: "",
        shop_name: "",
        owner_name: "",
        phone: "",
        address: "",
      });
      void refetchMerchants();
    } catch (err: any) {
      toast.error(err?.message || "تعذر إنشاء الحساب");
    } finally {
      setCreatingMerchant(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* الترويسة وأزرار الإجراءات */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl sea-gradient text-primary-foreground glow-shadow">
              <Package className="size-5" />
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-black">لوحة تحكم المدير الكاملة</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            تحكم كامل بالمتجر: عدّل الأقسام والتصنيفات، اضغط على أي منتج لتعديل كافة تفاصيله وسعري المفرد والجملة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
            <Link to="/">
              <Eye className="size-3.5" />
              عرض المتجر
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 font-bold"
          >
            <LogOut className="size-3.5" />
            تسجيل الخروج
          </Button>

          {modifiedList.length > 0 && (
            <Button
              size="sm"
              onClick={handleSaveAllModifiedPrices}
              disabled={savingBatch}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs animate-pulse"
            >
              {savingBatch ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              حفظ كل التعديلات ({modifiedList.length})
            </Button>
          )}

          <Button onClick={openNewProductModal} className="gap-2 font-bold sea-gradient text-primary-foreground text-xs h-9">
            <Plus className="size-4" />
            إضافة منتج جديد
          </Button>
        </div>
      </div>

      {/* بطاقات الإحصاءات */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl glass-card p-4">
          <p className="text-xs text-muted-foreground">عدد المنتجات</p>
          <p className="font-display text-2xl font-black text-primary mt-1">{products.length}</p>
        </div>
        <div className="rounded-2xl glass-card p-4">
          <p className="text-xs text-muted-foreground">أقسام المتجر</p>
          <p className="font-display text-2xl font-black text-accent mt-1">{categories.length}</p>
        </div>
        <div className="rounded-2xl glass-card p-4">
          <p className="text-xs text-muted-foreground">حسابات المحلات</p>
          <p className="font-display text-2xl font-black text-foreground mt-1">{merchants.length}</p>
        </div>
        <div className="rounded-2xl glass-card p-4">
          <p className="text-xs text-muted-foreground">إجمالي المبيعات</p>
          <p className="font-display text-xl font-black text-emerald-400 mt-1">{formatPrice(totalSales)} د.ع</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="products" className="font-bold text-xs gap-1.5">
            <Package className="size-4" />
            المنتجات ({products.length})
          </TabsTrigger>
          <TabsTrigger value="categories" className="font-bold text-xs gap-1.5">
            <Layers className="size-4" />
            الأقسام ({categories.length})
          </TabsTrigger>
          <TabsTrigger value="merchants" className="font-bold text-xs gap-1.5">
            <Store className="size-4" />
            أصحاب المحلات ({merchants.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="font-bold text-xs gap-1.5">
            <FileText className="size-4" />
            الفواتير ({orders.length})
          </TabsTrigger>
        </TabsList>

        {/* تبويب 1: إدارة المنتجات وعرض الأسعار */}
        <TabsContent value="products" className="mt-6 space-y-4">
          <div className="rounded-3xl glass-card p-5 border border-border/70">
            {/* شريط الأدوات والبحث والتبديل بين الشبكة والجدول */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div>
                <h2 className="font-display text-lg font-bold flex items-center gap-2">
                  <Boxes className="size-5 text-primary" />
                  قائمة المنتجات ({filteredProducts.length})
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  انقر على أي منتج لفتح نافذة التعديل الشامل وتغيير الاسم، الوصف، الصور، سعر المفرد، سعر الجملة، أو المخزون.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* البحث الفوري */}
                <div className="relative flex-1 sm:w-56">
                  <Search className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث باسم المنتج…"
                    className="pr-9 text-xs h-9"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>

                {/* تصنيف الأقسام */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-36 h-9 text-xs">
                    <SelectValue placeholder="كافة الأقسام" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كافة الأقسام</SelectItem>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* فلترة المخزون */}
                <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as any)}>
                  <SelectTrigger className="w-28 h-9 text-xs">
                    <SelectValue placeholder="المخزون" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="in_stock">متوفر</SelectItem>
                    <SelectItem value="out_of_stock">نفد المخزون</SelectItem>
                  </SelectContent>
                </Select>

                {/* زر التبديل بين عرض البطاقات والجدول */}
                <div className="flex items-center rounded-xl bg-secondary/40 p-1 border border-border/50">
                  <button
                    type="button"
                    onClick={() => setProductViewMode("grid")}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      productViewMode === "grid"
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="عرض البطاقات المرئية"
                  >
                    <LayoutGrid className="size-3.5" />
                    <span className="hidden sm:inline">بطاقات</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProductViewMode("table")}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      productViewMode === "table"
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="عرض جدول الأسعار السريع"
                  >
                    <TableIcon className="size-3.5" />
                    <span className="hidden sm:inline">جدول</span>
                  </button>
                </div>
              </div>
            </div>

            {/* أداة احتساب سعر الجملة السريعة */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-secondary/20 p-3 border border-border/40 text-xs">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-accent/20 text-accent">
                  <Percent className="size-4" />
                </span>
                <span className="font-bold text-foreground">احتساب سريع لسعر الجملة كنسبة من المفرد:</span>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={99}
                  className="w-16 h-8 text-xs font-bold text-center"
                  value={bulkDiscountPercent}
                  onChange={(e) => setBulkDiscountPercent(Number(e.target.value))}
                />
                <span>% خصم للمحل</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-bold border-accent text-accent hover:bg-accent/15"
                  onClick={handleApplyBulkDiscountPercent}
                >
                  تطبيق الحساب
                </Button>
              </div>
            </div>

            {loadingProducts ? (
              <p className="text-center py-12 text-sm text-muted-foreground">جاري تحميل المنتجات…</p>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="size-12 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="font-bold">لا توجد منتجات مطابقة للبحث</p>
                <Button onClick={openNewProductModal} size="sm" className="mt-3 gap-1">
                  <Plus className="size-4" />
                  إضافة منتج جديد الآن
                </Button>
              </div>
            ) : productViewMode === "grid" ? (
              /* عرض البطاقات المرئية المريح */
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((p) => {
                  const retailPrice = Number(p.price) || 0;
                  const wholesalePrice = Number(p.wholesale_price) || 0;
                  const categoryName = categories.find((c: any) => c.id === p.category_id)?.name || "عام";

                  return (
                    <div
                      key={p.id}
                      onClick={() => openEditProductModal(p)}
                      className="group rounded-2xl glass-card p-3.5 border border-border/60 hover:border-primary/60 hover:glow-shadow transition-all duration-300 flex flex-col justify-between cursor-pointer"
                    >
                      <div>
                        {/* صورة المنتج مع شارات الحالة */}
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary/40 mb-3">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              loading="lazy"
                              className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="size-full flex items-center justify-center text-muted-foreground">
                              <ImageOff className="size-8 opacity-40" />
                            </div>
                          )}

                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            {p.featured && (
                              <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5">
                                مميز
                              </Badge>
                            )}
                            {!p.is_active && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                                مخفي
                              </Badge>
                            )}
                          </div>

                          <div className="absolute bottom-2 right-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md shadow ${
                                p.stock > 0
                                  ? "bg-emerald-500/90 text-white"
                                  : "bg-destructive/90 text-white"
                              }`}
                            >
                              {p.stock > 0 ? `المخزون: ${p.stock}` : "نفد المخزون"}
                            </span>
                          </div>

                          <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5 backdrop-blur-xs">
                            <Pencil className="size-4 text-accent" />
                            انقر لتعديل كل التفاصيل
                          </span>
                        </div>

                        {/* اسم المنتج وقسمه */}
                        <div className="flex items-center justify-between gap-1 text-[11px] text-muted-foreground mb-1">
                          <span className="flex items-center gap-1 font-bold">
                            <Tag className="size-3 text-primary" />
                            {categoryName}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                          {p.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {p.description || "لا يوجد وصف إضافي"}
                        </p>
                      </div>

                      {/* بطاقة الأسعار المزدوجة والمستقلة */}
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                        <div className="flex items-center justify-between bg-primary/10 rounded-xl px-2.5 py-1.5 text-xs">
                          <span className="text-muted-foreground font-bold flex items-center gap-1">
                            <Coins className="size-3.5 text-primary" />
                            سعر المفرد:
                          </span>
                          <span className="font-black text-primary font-display text-sm">
                            {formatPrice(retailPrice)} د.ع
                          </span>
                        </div>

                        <div className="flex items-center justify-between bg-accent/15 rounded-xl px-2.5 py-1.5 text-xs border border-accent/30">
                          <span className="text-accent font-black flex items-center gap-1">
                            <Store className="size-3.5" />
                            سعر الجملة:
                          </span>
                          <span className="font-black text-accent font-display text-sm">
                            {wholesalePrice > 0 ? `${formatPrice(wholesalePrice)} د.ع` : "غير محدد"}
                          </span>
                        </div>

                        {/* أزرار الإجراءات السريعة على كل منتج */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <Button
                            size="sm"
                            className="text-xs font-bold gap-1 bg-accent text-accent-foreground hover:bg-accent/90"
                            onClick={(e) => {
                              e.stopPropagation();
                              openQuickPriceModal(p);
                            }}
                          >
                            <Coins className="size-3" />
                            تغيير السعر
                          </Button>

                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-xs font-bold gap-1 sea-gradient text-primary-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditProductModal(p);
                            }}
                          >
                            <Pencil className="size-3" />
                            تعديل شامل
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* عرض الجدول السريع مع حقول التعديل المباشرة */
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-xs text-muted-foreground bg-secondary/30">
                      <th className="p-3 font-bold">المنتج والصورة</th>
                      <th className="p-3 font-bold text-primary">سعر المفرد (الزبون)</th>
                      <th className="p-3 font-bold text-accent">سعر الجملة (المحل)</th>
                      <th className="p-3 font-bold">المخزون</th>
                      <th className="p-3 font-bold text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredProducts.map((p) => {
                      const current = editingPrices[p.id] ?? {
                        price: Number(p.price) || 0,
                        wholesalePrice: Number(p.wholesale_price) || 0,
                        stock: Number(p.stock) || 0,
                      };
                      const isDirty =
                        current.price !== Number(p.price) ||
                        current.wholesalePrice !== Number(p.wholesale_price) ||
                        current.stock !== Number(p.stock);
                      const isSaving = Boolean(savingRow[p.id]);

                      return (
                        <tr
                          key={p.id}
                          className={`transition ${isDirty ? "bg-amber-500/10" : "hover:bg-secondary/20"}`}
                        >
                          {/* صورة واسم المنتج */}
                          <td className="p-3">
                            <div
                              className="flex items-center gap-3 cursor-pointer group"
                              onClick={() => openEditProductModal(p)}
                            >
                              <div className="size-12 rounded-xl overflow-hidden bg-secondary/50 shrink-0">
                                {p.image_url ? (
                                  <img src={p.image_url} alt={p.name} className="size-full object-cover" />
                                ) : (
                                  <div className="size-full flex items-center justify-center text-muted-foreground">
                                    <ImageOff className="size-5 opacity-40" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                  {p.name}
                                </p>
                                <span className="text-[11px] text-muted-foreground">
                                  انقر لتعديل كامل البيانات والصور
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* سعر المفرد (الزبون العادي) */}
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={0}
                                className="w-28 text-xs font-bold text-primary"
                                value={current.price}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value));
                                  setEditingPrices((prev) => ({
                                    ...prev,
                                    [p.id]: {
                                      price: val,
                                      wholesalePrice: prev[p.id]?.wholesalePrice ?? Number(p.wholesale_price) ?? 0,
                                      stock: prev[p.id]?.stock ?? Number(p.stock) ?? 0,
                                    },
                                  }));
                                }}
                              />
                              <span className="text-[11px] text-muted-foreground">د.ع</span>
                            </div>
                          </td>

                          {/* سعر الجملة (صاحب المحل) */}
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={0}
                                className="w-28 text-xs font-black text-accent border-accent/40"
                                value={current.wholesalePrice}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value));
                                  setEditingPrices((prev) => ({
                                    ...prev,
                                    [p.id]: {
                                      price: prev[p.id]?.price ?? Number(p.price) ?? 0,
                                      wholesalePrice: val,
                                      stock: prev[p.id]?.stock ?? Number(p.stock) ?? 0,
                                    },
                                  }));
                                }}
                              />
                              <span className="text-[11px] text-accent">د.ع</span>
                            </div>
                          </td>

                          {/* المخزون */}
                          <td className="p-3">
                            <Input
                              type="number"
                              min={0}
                              className="w-20 text-xs font-bold"
                              value={current.stock}
                              onChange={(e) => {
                                const val = Math.max(0, Number(e.target.value));
                                setEditingPrices((prev) => ({
                                  ...prev,
                                  [p.id]: {
                                    price: prev[p.id]?.price ?? Number(p.price) ?? 0,
                                    wholesalePrice: prev[p.id]?.wholesalePrice ?? Number(p.wholesale_price) ?? 0,
                                    stock: val,
                                  },
                                }));
                              }}
                            />
                          </td>

                          {/* أزرار الإجراء */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="sm"
                                disabled={!isDirty || isSaving}
                                onClick={() => handleSaveSinglePriceRow(p.id)}
                                className="h-8 text-xs gap-1 font-bold"
                              >
                                {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                                حفظ
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8"
                                onClick={() => openEditProductModal(p)}
                                title="تعديل التفاصيل الكاملة"
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* تبويب 2: إدارة الأقسام والتصنيفات */}
        <TabsContent value="categories" className="mt-6 space-y-4">
          <div className="rounded-3xl glass-card p-6 border border-border/70">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <h2 className="font-display text-lg font-bold flex items-center gap-2">
                  <Layers className="size-5 text-accent" />
                  أقسام وتصنيفات المتجر ({categories.length})
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  يمكنك إضافة أقسام جديدة، وتغيير أسماء الأيقونات والصور والترتيب الظاهر في المتجر.
                </p>
              </div>

              <Button size="sm" onClick={openNewCategoryModal} className="gap-1.5 font-bold sea-gradient text-primary-foreground">
                <Plus className="size-4" />
                إضافة قسم جديد
              </Button>
            </div>

            {loadingCategories ? (
              <p className="text-center py-12 text-sm text-muted-foreground">جاري تحميل الأقسام…</p>
            ) : categories.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="size-12 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="font-bold">لا توجد أقسام مسجلة بعد</p>
                <Button onClick={openNewCategoryModal} size="sm" className="mt-3 gap-1">
                  <Plus className="size-4" />
                  إضافة أول قسم الآن
                </Button>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat: CategoryRow) => {
                  const productCount = products.filter((p) => p.category_id === cat.id || p.category_id === cat.slug).length;

                  return (
                    <div
                      key={cat.id || cat.slug}
                      className="group rounded-2xl glass-card p-4 border border-border/60 hover:border-primary/60 transition flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl sea-gradient text-primary-foreground shadow">
                          <CategoryIcon name={cat.icon || "package"} className="size-6" />
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base truncate text-foreground group-hover:text-primary transition-colors">
                              {cat.name}
                            </h3>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            الرابط: <code className="font-mono text-[11px] bg-secondary/50 px-1 py-0.5 rounded">{cat.slug}</code>
                          </p>
                          <p className="text-[11px] text-accent font-bold mt-1">
                            {productCount} منتج مرتبط بهذا القسم
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1"
                          onClick={() => openEditCategoryModal(cat)}
                        >
                          <Pencil className="size-3" />
                          تعديل
                        </Button>
                        <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground">
                          <Link to="/category/$slug" params={{ slug: cat.slug }} target="_blank">
                            <ExternalLink className="size-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* تبويب 3: أصحاب المحلات */}
        <TabsContent value="merchants" className="mt-6">
          <div className="rounded-3xl glass-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <h2 className="font-display text-lg font-bold flex items-center gap-2">
                  <Store className="size-5 text-accent" />
                  حسابات أصحاب المحلات المسجلة
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  المحلات المعتمدة تظهر لها أسعار الجملة تلقائياً في المتجر.
                </p>
              </div>
              <Button size="sm" className="gap-1.5" onClick={() => setOpenAddMerchant(true)}>
                <UserPlus className="size-4" />
                إضافة صاحب محل
              </Button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {merchants.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">لا توجد حسابات محلات بعد.</p>
              ) : (
                merchants.map((m: any) => (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-secondary/20 p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base">{m.shop_name}</span>
                        <Badge
                          variant={
                            m.status === "approved"
                              ? "default"
                              : m.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                          className="text-[11px]"
                        >
                          {m.status === "approved" ? "معتمد (جملة)" : m.status === "pending" ? "بانتظار الموافقة" : "موقوف"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        المالك: {m.owner_name} | هاتف: {m.phone} | العنوان: {m.address || "غير محدد"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {m.status !== "approved" && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          onClick={() => handleUpdateMerchantStatus(m.id, "approved")}
                        >
                          <CheckCircle2 className="size-3.5" />
                          اعتماد المحل
                        </Button>
                      )}
                      {m.status === "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-amber-400 border-amber-500/40 gap-1"
                          onClick={() => handleUpdateMerchantStatus(m.id, "suspended")}
                        >
                          <Clock className="size-3.5" />
                          إيقاف مؤقت
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* تبويب 4: الفواتير */}
        <TabsContent value="orders" className="mt-6 flex flex-col gap-4">
          <div className="rounded-3xl glass-card p-6">
            <h2 className="font-display text-lg font-bold mb-4">كشف الفواتير والطلبات الأخيرة</h2>
            {orders.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">لا توجد طلبات مسجلة بعد.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <div key={o.id} className="rounded-2xl border border-border/60 bg-secondary/15 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-black text-lg">فاتورة #{o.order_number}</span>
                          <Badge variant={o.status === "delivered" ? "default" : "secondary"}>{o.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          العميل: {o.customer_name} | الهاتف: {o.phone} | العنوان: {o.address}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setSelectedInvoice(o)}>
                          <FileText className="size-3.5" />
                          معاينة الفاتورة
                        </Button>
                        <Select value={o.status} onValueChange={(v) => handleUpdateOrderStatus(o.id, v)}>
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">قيد المراجعة</SelectItem>
                            <SelectItem value="confirmed">مؤكد</SelectItem>
                            <SelectItem value="shipped">تم الشحن</SelectItem>
                            <SelectItem value="delivered">تم التسليم</SelectItem>
                            <SelectItem value="cancelled">ملغي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-between text-xs font-bold text-primary">
                      <span>إجمالي الفاتورة:</span>
                      <span className="font-display text-base">{formatPrice(Number(o.total))} د.ع</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* نافذة التعديل السريع للأسعار بنقرة واحدة */}
      <Dialog open={quickPriceModalOpen} onOpenChange={setQuickPriceModalOpen}>
        <DialogContent className="max-w-md p-6 sm:rounded-3xl">
          <DialogHeader className="border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground font-black">
                <Coins className="size-5" />
              </span>
              <div>
                <DialogTitle className="font-display text-lg font-bold">
                  تعديل أسعار: {quickPriceProduct?.name}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  حدد سعر المفرد للزبون وسعر الجملة للمحل والمخزون
                </p>
              </div>
            </div>
          </DialogHeader>

          {quickPriceProduct && (
            <form onSubmit={handleSaveQuickPrice} className="space-y-4 pt-2">
              {/* ملخص المنتج */}
              <div className="flex items-center gap-3 rounded-2xl bg-secondary/30 p-3 border border-border/50">
                <div className="size-14 rounded-xl overflow-hidden bg-secondary/50 shrink-0">
                  {quickPriceProduct.image_url ? (
                    <img src={quickPriceProduct.image_url} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="size-full flex items-center justify-center text-muted-foreground">
                      <ImageOff className="size-5 opacity-40" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{quickPriceProduct.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    القسم: {categories.find((c: any) => c.id === quickPriceProduct.category_id)?.name || "عام"}
                  </p>
                </div>
              </div>

              {/* سعر المفرد */}
              <div className="rounded-2xl bg-primary/10 p-3.5 border border-primary/20">
                <Label htmlFor="qp-retail" className="text-primary font-bold text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Coins className="size-4" />
                    سعر المفرد (للزبائن والزوار)
                  </span>
                  <span className="text-[10px] text-muted-foreground">يظهر في المتجر العام</span>
                </Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <Input
                    id="qp-retail"
                    type="number"
                    min={0}
                    required
                    value={quickRetailPrice}
                    className="font-display font-black text-lg bg-background"
                    onChange={(e) => setQuickRetailPrice(Math.max(0, Number(e.target.value)))}
                  />
                  <span className="text-xs font-bold text-primary">د.ع</span>
                </div>
              </div>

              {/* سعر الجملة */}
              <div className="rounded-2xl bg-accent/15 p-3.5 border border-accent/30">
                <Label htmlFor="qp-wholesale" className="text-accent font-black text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Store className="size-4" />
                    سعر الجملة (لأصحاب المحلات فقط)
                  </span>
                  <span className="text-[10px] text-accent/80">خاص بالمحلات المعتمدة</span>
                </Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <Input
                    id="qp-wholesale"
                    type="number"
                    min={0}
                    required
                    value={quickWholesalePrice}
                    className="font-display font-black text-lg text-accent border-accent/40 bg-background"
                    onChange={(e) => setQuickWholesalePrice(Math.max(0, Number(e.target.value)))}
                  />
                  <span className="text-xs font-bold text-accent">د.ع</span>
                </div>
              </div>

              {/* المخزون */}
              <div>
                <Label htmlFor="qp-stock" className="text-xs font-bold">المخزون المتوفر في المستودع</Label>
                <Input
                  id="qp-stock"
                  type="number"
                  min={0}
                  required
                  className="mt-1"
                  value={quickStock}
                  onChange={(e) => setQuickStock(Math.max(0, Number(e.target.value)))}
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={savingQuickPrice}
                  className="flex-1 font-bold h-11 sea-gradient text-primary-foreground gap-1.5"
                >
                  {savingQuickPrice ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  حفظ السعرين وتحديث المتجر
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11"
                  onClick={() => setQuickPriceModalOpen(false)}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* نافذة إضافة / تعديل المنتج بالكامل */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 sm:rounded-3xl">
          <DialogHeader className="p-5 border-b border-border/60 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Pencil className="size-4" />
              </span>
              <DialogTitle className="font-display text-lg font-bold">
                {draft.id ? `تعديل منتج: ${draft.name}` : "إضافة منتج جديد"}
              </DialogTitle>
            </div>

            {draft.id && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive text-xs gap-1 hover:bg-destructive/10"
                onClick={() => handleDeleteProduct(draft.id)}
              >
                <Trash2 className="size-3.5" />
                حذف المنتج
              </Button>
            )}
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
            <div>
              <Label htmlFor="dlg-name" className="text-xs font-bold">اسم المنتج</Label>
              <Input
                id="dlg-name"
                required
                value={draft.name}
                className="mt-1"
                placeholder="مثال: شاحن Anker 65W GaN سريع"
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="dlg-cat" className="text-xs font-bold">القسم / التصنيف</Label>
              <Select value={draft.category_id ?? ""} onValueChange={(v) => setDraft({ ...draft, category_id: v })}>
                <SelectTrigger id="dlg-cat" className="mt-1">
                  <SelectValue placeholder="اختر القسم المناسب" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* الحقلان المنفصلان لسعر المفرد وسعر الجملة */}
            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-secondary/25 p-4 border border-border/60">
              <div>
                <Label htmlFor="dlg-price" className="text-primary font-bold text-xs flex items-center gap-1.5">
                  <Coins className="size-4" />
                  سعر المفرد (للزبون العادي)
                </Label>
                <div className="mt-1 flex items-center gap-1.5">
                  <Input
                    id="dlg-price"
                    type="number"
                    min={0}
                    required
                    value={draft.price}
                    className="font-bold text-base bg-background"
                    onChange={(e) => setDraft({ ...draft, price: Math.max(0, Number(e.target.value)) })}
                  />
                  <span className="text-xs text-muted-foreground font-bold">د.ع</span>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 block">يظهر للزبائن والزوار العاديين</span>
              </div>

              <div>
                <Label htmlFor="dlg-wholesale" className="text-accent font-bold text-xs flex items-center gap-1.5">
                  <Store className="size-4" />
                  سعر الجملة (لأصحاب المحلات)
                </Label>
                <div className="mt-1 flex items-center gap-1.5">
                  <Input
                    id="dlg-wholesale"
                    type="number"
                    min={0}
                    required
                    value={draft.wholesale_price}
                    className="font-black text-base border-accent text-accent bg-background"
                    onChange={(e) =>
                      setDraft({ ...draft, wholesale_price: Math.max(0, Number(e.target.value)) })
                    }
                  />
                  <span className="text-xs text-accent font-bold">د.ع</span>
                </div>
                <span className="text-[10px] text-accent/80 mt-1 block">يظهر حصرياً لحسابات المحلات المعتمدة</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dlg-old" className="text-xs font-bold">السعر قبل الخصم (اختياري)</Label>
                <Input
                  id="dlg-old"
                  type="number"
                  className="mt-1"
                  value={draft.old_price ?? ""}
                  placeholder="سعر سابق مشطوب"
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      old_price: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="dlg-stock" className="text-xs font-bold">المخزون المتوفر</Label>
                <Input
                  id="dlg-stock"
                  type="number"
                  min={0}
                  required
                  className="mt-1"
                  value={draft.stock}
                  onChange={(e) => setDraft({ ...draft, stock: Math.max(0, Number(e.target.value)) })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dlg-desc" className="text-xs font-bold">الوصف والمواصفات الكاملة</Label>
              <Textarea
                id="dlg-desc"
                rows={3}
                className="mt-1"
                value={draft.description}
                placeholder="مواصفات المنتج، التوافق، الضمان…"
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>

            {/* صور المنتج: رابط مباشر أو رفع من الجهاز */}
            <div className="grid gap-3 sm:grid-cols-2">
              {/* صورة الغلاف */}
              <div className="rounded-2xl border border-border/60 p-3.5 bg-secondary/15 space-y-2">
                <Label className="text-xs font-bold flex items-center gap-1">
                  <Upload className="size-3.5 text-primary" />
                  صورة الغلاف (البكج)
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  disabled={uploadingImage !== null}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleImageUpload(f, "image_url");
                  }}
                />
                <div className="flex items-center gap-1.5">
                  <Link2 className="size-3 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="أو ضع رابط الصورة المباشر هنا"
                    value={draft.image_url ?? ""}
                    className="text-xs h-8"
                    onChange={(e) => setDraft({ ...draft, image_url: e.target.value || null })}
                  />
                </div>
                {uploadingImage === "image_url" && <Loader2 className="size-4 animate-spin text-primary" />}
                {draft.image_url && (
                  <div className="flex items-center justify-between rounded-xl bg-background/60 p-1.5 border border-border/40">
                    <img src={draft.image_url} alt="الغلاف" className="size-12 rounded-lg object-cover" />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive text-xs h-7"
                      onClick={() => setDraft({ ...draft, image_url: null })}
                    >
                      إزالة
                    </Button>
                  </div>
                )}
              </div>

              {/* صورة المنتج مفتوح */}
              <div className="rounded-2xl border border-border/60 p-3.5 bg-secondary/15 space-y-2">
                <Label className="text-xs font-bold flex items-center gap-1">
                  <Upload className="size-3.5 text-accent" />
                  صورة المنتج مفتوح (اختياري)
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  disabled={uploadingImage !== null}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleImageUpload(f, "open_image_url");
                  }}
                />
                <div className="flex items-center gap-1.5">
                  <Link2 className="size-3 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="أو ضع رابط الصورة المباشر هنا"
                    value={draft.open_image_url ?? ""}
                    className="text-xs h-8"
                    onChange={(e) => setDraft({ ...draft, open_image_url: e.target.value || null })}
                  />
                </div>
                {uploadingImage === "open_image_url" && <Loader2 className="size-4 animate-spin text-accent" />}
                {draft.open_image_url && (
                  <div className="flex items-center justify-between rounded-xl bg-background/60 p-1.5 border border-border/40">
                    <img src={draft.open_image_url} alt="مفتوح" className="size-12 rounded-lg object-cover" />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive text-xs h-7"
                      onClick={() => setDraft({ ...draft, open_image_url: null })}
                    >
                      إزالة
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 text-xs font-bold pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
                />
                <span>عرض كمنتج مميز بالرئيسية</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.is_active}
                  onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                />
                <span>نشط ومعروض بالمتجر</span>
              </label>
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center gap-2">
              <Button type="submit" disabled={savingProduct} className="flex-1 font-bold h-11 sea-gradient text-primary-foreground">
                {savingProduct ? "جاري الحفظ…" : "حفظ تفاصيل المنتج والأسعار"}
              </Button>
              <Button type="button" variant="secondary" className="h-11" onClick={() => setEditModalOpen(false)}>
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* نافذة إضافة وتعديل الأقسام */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="max-w-md p-6 sm:rounded-3xl">
          <DialogHeader className="border-b border-border/60 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Layers className="size-4" />
              </span>
              <DialogTitle className="font-display text-lg font-bold">
                {categoryDraft.id ? `تعديل قسم: ${categoryDraft.name}` : "إضافة قسم جديد"}
              </DialogTitle>
            </div>

            {categoryDraft.id && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive text-xs gap-1"
                onClick={() => handleDeleteCategory(categoryDraft.id, categoryDraft.name)}
              >
                <Trash2 className="size-3.5" />
                حذف
              </Button>
            )}
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-4 pt-2">
            <div>
              <Label htmlFor="cat-name" className="text-xs font-bold">اسم القسم</Label>
              <Input
                id="cat-name"
                required
                placeholder="مثال: شواحن سريعة"
                className="mt-1"
                value={categoryDraft.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setCategoryDraft((prev) => ({
                    ...prev,
                    name,
                    slug: prev.slug ? prev.slug : name.trim().toLowerCase().replace(/\s+/g, "-"),
                  }));
                }}
              />
            </div>

            <div>
              <Label htmlFor="cat-slug" className="text-xs font-bold">الرابط اللطيف (Slug)</Label>
              <Input
                id="cat-slug"
                required
                dir="ltr"
                placeholder="chargers"
                className="mt-1 font-mono text-xs"
                value={categoryDraft.slug}
                onChange={(e) => setCategoryDraft((prev) => ({ ...prev, slug: e.target.value }))}
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">يستخدم في رابط الصفحة: bali.com/category/slug</span>
            </div>

            <div>
              <Label htmlFor="cat-icon" className="text-xs font-bold">أيقونة القسم</Label>
              <Select
                value={categoryDraft.icon}
                onValueChange={(v) => setCategoryDraft((prev) => ({ ...prev, icon: v }))}
              >
                <SelectTrigger id="cat-icon" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((iconName) => (
                    <SelectItem key={iconName} value={iconName}>
                      <div className="flex items-center gap-2">
                        <CategoryIcon name={iconName} className="size-4 text-primary" />
                        <span>{iconName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cat-order" className="text-xs font-bold">ترتيب الظهور في الموقع</Label>
              <Input
                id="cat-order"
                type="number"
                min={0}
                className="mt-1"
                value={categoryDraft.sort_order}
                onChange={(e) => setCategoryDraft((prev) => ({ ...prev, sort_order: Number(e.target.value) }))}
              />
            </div>

            <div className="rounded-2xl border border-border/60 p-3 bg-secondary/15 space-y-2">
              <Label className="text-xs font-bold">صورة القسم (اختياري)</Label>
              <Input
                type="file"
                accept="image/*"
                disabled={uploadingCatImage}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleCatImageUpload(f);
                }}
              />
              <div className="flex items-center gap-1.5">
                <Link2 className="size-3 text-muted-foreground shrink-0" />
                <Input
                  placeholder="أو رابط الصورة المباشر"
                  value={categoryDraft.image_url ?? ""}
                  className="text-xs h-8"
                  onChange={(e) => setCategoryDraft((prev) => ({ ...prev, image_url: e.target.value || null }))}
                />
              </div>
              {uploadingCatImage && <Loader2 className="size-4 animate-spin text-accent" />}
              {categoryDraft.image_url && (
                <div className="flex items-center justify-between rounded-xl bg-background/60 p-1.5">
                  <img src={categoryDraft.image_url} alt="" className="size-12 rounded-lg object-cover" />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive text-xs"
                    onClick={() => setCategoryDraft((prev) => ({ ...prev, image_url: null }))}
                  >
                    إزالة
                  </Button>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <Button type="submit" disabled={savingCategory} className="flex-1 font-bold h-11 sea-gradient text-primary-foreground">
                {savingCategory ? "جاري الحفظ…" : "حفظ القسم وتحديث الموقع"}
              </Button>
              <Button type="button" variant="secondary" className="h-11" onClick={() => setCategoryModalOpen(false)}>
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* نافذة إضافة صاحب محل جديد */}
      <Dialog open={openAddMerchant} onOpenChange={setOpenAddMerchant}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-bold">إضافة وتفعيل حساب صاحب محل</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateMerchant} className="flex flex-col gap-3 mt-2">
            <div>
              <Label htmlFor="nm-email">البريد الإلكتروني</Label>
              <Input
                id="nm-email"
                type="email"
                dir="ltr"
                required
                value={newMerchant.email}
                onChange={(e) => setNewMerchant({ ...newMerchant, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="nm-pass">كلمة المرور</Label>
              <Input
                id="nm-pass"
                type="password"
                dir="ltr"
                required
                value={newMerchant.password}
                onChange={(e) => setNewMerchant({ ...newMerchant, password: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="nm-shop">اسم المحل</Label>
              <Input
                id="nm-shop"
                required
                value={newMerchant.shop_name}
                onChange={(e) => setNewMerchant({ ...newMerchant, shop_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="nm-owner">اسم المالك</Label>
              <Input
                id="nm-owner"
                value={newMerchant.owner_name}
                onChange={(e) => setNewMerchant({ ...newMerchant, owner_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="nm-phone">رقم الهاتف</Label>
              <Input
                id="nm-phone"
                dir="ltr"
                value={newMerchant.phone}
                onChange={(e) => setNewMerchant({ ...newMerchant, phone: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={creatingMerchant} className="mt-2 w-full">
              {creatingMerchant ? "جاري الحفظ…" : "تفعيل الحساب فوراً"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* معاينة الفاتورة */}
      <InvoiceModal
        order={selectedInvoice}
        open={selectedInvoice !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedInvoice(null);
        }}
      />
    </div>
  );
}