    "use client";

    import { useEffect, useState } from "react";
    import { useRouter } from "next/navigation";
    import {
    collection, getDocs, addDoc, updateDoc, deleteDoc,
    doc, orderBy, query
    } from "firebase/firestore";
    import { signOut, onAuthStateChanged } from "firebase/auth";
    import { db, auth } from "@/lib/firebase";

    // ── Types ─────────────────────────────────────────────────────────────────────

    type Category = { id: string; name: string; order: number };
    type Product  = { id: string; name: string; price: number; imageUrl: string; categoryId: string };

    // ── Helpers ───────────────────────────────────────────────────────────────────

    function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1">{label}</label>
        <input
            {...props}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E3DD] bg-[#FAFAF8] text-[#1C1C1A] focus:outline-none focus:border-[#D97706] transition-colors"
        />
        </div>
    );
    }

    function Select({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
    return (
        <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1">{label}</label>
        <select
            {...props}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E3DD] bg-[#FAFAF8] text-[#1C1C1A] focus:outline-none focus:border-[#D97706] transition-colors"
        >
            {children}
        </select>
        </div>
    );
    }

    // ── Main Page ─────────────────────────────────────────────────────────────────

    export default function AdminPage() {
    const router = useRouter();
    const [tab, setTab] = useState<"categories" | "products">("categories");
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts]     = useState<Product[]>([]);
    const [loading, setLoading]       = useState(true);

    // Category form state
    const [catForm, setCatForm] = useState({ name: "", order: "" });
    const [editingCat, setEditingCat] = useState<Category | null>(null);

    // Product form state
    const [prodForm, setProdForm] = useState({ name: "", price: "", imageUrl: "", categoryId: "" });
    const [editingProd, setEditingProd] = useState<Product | null>(null);

    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState("");

    // ── Auth guard ──────────────────────────────────────────────────────────────

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
        if (!user) router.push("/admin/login");
        });
        return () => unsub();
    }, [router]);

    // ── Fetch ───────────────────────────────────────────────────────────────────

    async function loadMenuData() {
        const [catSnap, prodSnap] = await Promise.all([
        getDocs(query(collection(db, "categories"), orderBy("order"))),
        getDocs(collection(db, "Products")),
        ]);
        return {
        categories: catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)),
        products: prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)),
        };
    }

    async function fetchAll() {
        const data = await loadMenuData();
        setCategories(data.categories);
        setProducts(data.products);
        setLoading(false);
    }

    useEffect(() => {
        let cancelled = false;

        void loadMenuData().then((data) => {
        if (cancelled) return;
        setCategories(data.categories);
        setProducts(data.products);
        setLoading(false);
        });

        return () => { cancelled = true; };
    }, []);

    // ── Category CRUD ───────────────────────────────────────────────────────────

    function startEditCat(cat: Category) {
        setEditingCat(cat);
        setCatForm({ name: cat.name, order: String(cat.order) });
    }

    function resetCatForm() {
        setEditingCat(null);
        setCatForm({ name: "", order: "" });
        setError("");
    }

    async function saveCat() {
        if (!catForm.name.trim()) return setError("Name is required.");
        setSaving(true); setError("");
        const data = { name: catForm.name.trim(), order: Number(catForm.order) || 0 };
        if (editingCat) {
        await updateDoc(doc(db, "categories", editingCat.id), data);
        } else {
        await addDoc(collection(db, "categories"), data);
        }
        await fetchAll();
        resetCatForm();
        setSaving(false);
    }

    async function deleteCat(id: string) {
        if (!confirm("Delete this category? Products under it will become uncategorized.")) return;
        await deleteDoc(doc(db, "categories", id));
        await fetchAll();
    }

    // ── Product CRUD ────────────────────────────────────────────────────────────

    function startEditProd(prod: Product) {
        setEditingProd(prod);
        setProdForm({ name: prod.name, price: String(prod.price), imageUrl: prod.imageUrl, categoryId: prod.categoryId });
    }

    function resetProdForm() {
        setEditingProd(null);
        setProdForm({ name: "", price: "", imageUrl: "", categoryId: "" });
        setError("");
    }

    async function saveProd() {
        if (!prodForm.name.trim()) return setError("Name is required.");
        if (!prodForm.categoryId)  return setError("Select a category.");
        setSaving(true); setError("");
        const data = {
        name: prodForm.name.trim(),
        price: Number(prodForm.price) || 0,
        imageUrl: prodForm.imageUrl.trim() || "https://res.cloudinary.com/dwcy6vc23/image/upload/v1781523194/Digital%20menue/Screenshot_2026-06-15_143303_dwsts2.png",
        categoryId: prodForm.categoryId,
        };
        if (editingProd) {
        await updateDoc(doc(db, "Products", editingProd.id), data);
        } else {
        await addDoc(collection(db, "Products"), data);
        }
        await fetchAll();
        resetProdForm();
        setSaving(false);
    }

    async function deleteProd(id: string) {
        if (!confirm("Delete this product?")) return;
        await deleteDoc(doc(db, "Products", id));
        await fetchAll();
    }

    // ── Render ──────────────────────────────────────────────────────────────────

    if (loading) {
        return (
        <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
            <p className="text-sm text-[#9CA3AF]">Loading...</p>
        </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAF8]">

        {/* Top bar */}
        <header className="bg-white border-b border-[#EDECEA] px-6 py-4 flex items-center justify-between">
            <h1 className="text-base font-bold text-[#1C1C1A]">Menu Admin</h1>
            <button
            onClick={() => signOut(auth).then(() => router.push("/admin/login"))}
            className="text-sm text-[#9CA3AF] hover:text-[#1C1C1A] transition-colors"
            >
            Sign out
            </button>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-6">

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
            {(["categories", "products"] as const).map((t) => (
                <button
                key={t}
                onClick={() => { setTab(t); resetCatForm(); resetProdForm(); }}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                    tab === t
                    ? "bg-[#D97706] text-white"
                    : "bg-white text-[#6B7280] border border-[#E5E3DD] hover:border-[#D97706]"
                }`}
                >
                {t}
                </button>
            ))}
            </div>

            {/* ── Categories Tab ── */}
            {tab === "categories" && (
            <div className="space-y-4">

                {/* Form */}
                <div className="bg-white rounded-xl border border-[#EDECEA] p-5 space-y-3">
                <h2 className="text-sm font-semibold text-[#1C1C1A]">
                    {editingCat ? "Edit Category" : "Add Category"}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                    <Input
                    label="Name"
                    placeholder="e.g. Burgers"
                    value={catForm.name}
                    onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                    />
                    <Input
                    label="Order"
                    type="number"
                    placeholder="1"
                    value={catForm.order}
                    onChange={e => setCatForm(f => ({ ...f, order: e.target.value }))}
                    />
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
                <div className="flex gap-2">
                    <button
                    onClick={saveCat}
                    disabled={saving}
                    className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                    {saving ? "Saving..." : editingCat ? "Update" : "Add"}
                    </button>
                    {editingCat && (
                    <button
                        onClick={resetCatForm}
                        className="px-4 py-2 text-sm text-[#6B7280] border border-[#E5E3DD] rounded-lg hover:border-[#D97706] transition-colors"
                    >
                        Cancel
                    </button>
                    )}
                </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-xl border border-[#EDECEA] divide-y divide-[#F5F4EF]">
                {categories.length === 0 && (
                    <p className="text-sm text-[#9CA3AF] text-center py-8">No categories yet.</p>
                )}
                {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                        <p className="text-sm font-medium text-[#1C1C1A]">{cat.name}</p>
                        <p className="text-xs text-[#9CA3AF]">Order: {cat.order}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                        onClick={() => startEditCat(cat)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-[#E5E3DD] text-[#6B7280] hover:border-[#D97706] hover:text-[#D97706] transition-colors"
                        >
                        Edit
                        </button>
                        <button
                        onClick={() => deleteCat(cat.id)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-[#FCA5A5] text-red-400 hover:bg-red-50 transition-colors"
                        >
                        Delete
                        </button>
                    </div>
                    </div>
                ))}
                </div>
            </div>
            )}

            {/* ── Products Tab ── */}
            {tab === "products" && (
            <div className="space-y-4">

                {/* Form */}
                <div className="bg-white rounded-xl border border-[#EDECEA] p-5 space-y-3">
                <h2 className="text-sm font-semibold text-[#1C1C1A]">
                    {editingProd ? "Edit Product" : "Add Product"}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                    <Input
                    label="Name"
                    placeholder="e.g. Classic Burger"
                    value={prodForm.name}
                    onChange={e => setProdForm(f => ({ ...f, name: e.target.value }))}
                    />
                    <Input
                    label="Price (EGP)"
                    type="number"
                    placeholder="50"
                    value={prodForm.price}
                    onChange={e => setProdForm(f => ({ ...f, price: e.target.value }))}
                    />
                </div>
                <Input
                    label="Image URL"
                    placeholder="https://..."
                    value={prodForm.imageUrl}
                    onChange={e => setProdForm(f => ({ ...f, imageUrl: e.target.value }))}
                />
                <Select
                    label="Category"
                    value={prodForm.categoryId}
                    onChange={e => setProdForm(f => ({ ...f, categoryId: e.target.value }))}
                >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </Select>
                {error && <p className="text-xs text-red-500">{error}</p>}
                <div className="flex gap-2">
                    <button
                    onClick={saveProd}
                    disabled={saving}
                    className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                    {saving ? "Saving..." : editingProd ? "Update" : "Add"}
                    </button>
                    {editingProd && (
                    <button
                        onClick={resetProdForm}
                        className="px-4 py-2 text-sm text-[#6B7280] border border-[#E5E3DD] rounded-lg hover:border-[#D97706] transition-colors"
                    >
                        Cancel
                    </button>
                    )}
                </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-xl border border-[#EDECEA] divide-y divide-[#F5F4EF]">
                {products.length === 0 && (
                    <p className="text-sm text-[#9CA3AF] text-center py-8">No products yet.</p>
                )}
                {products.map(prod => {
                    const catName = categories.find(c => c.id === prod.categoryId)?.name ?? "—";
                    return (
                    <div key={prod.id} className="flex items-center gap-3 px-5 py-3">
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F5F4EF] flex-shrink-0">
                        {prod.imageUrl
                            ? <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full" />
                        }
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1C1C1A] truncate">{prod.name}</p>
                        <p className="text-xs text-[#9CA3AF]">{catName} · {prod.price} EGP</p>
                        </div>
                        {/* Actions */}
                        <div className="flex gap-2 flex-shrink-0">
                        <button
                            onClick={() => startEditProd(prod)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-[#E5E3DD] text-[#6B7280] hover:border-[#D97706] hover:text-[#D97706] transition-colors"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => deleteProd(prod.id)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-[#FCA5A5] text-red-400 hover:bg-red-50 transition-colors"
                        >
                            Delete
                        </button>
                        </div>
                    </div>
                    );
                })}
                </div>
            </div>
            )}
        </div>
        </div>
    );
    }