
'use client';

import { useState, useEffect } from 'react';
import {
    Package,
    Plus,
    Edit2,
    Trash2,
    Search,
    CheckCircle,
    XCircle,
    AlertCircle,
    Filter,
    Layers,
    Tag,
    ArrowUp,
    ArrowDown,
    GripVertical,
    LayoutList,
    RefreshCcw,
    X
} from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';

interface Product {
    _id: string;
    title: string;
    category: 'TopUp' | 'SpecialDeal';
    priceCoins: number;
    costPrice: number;
    infoDescription: string;
    imageType: 'Emoji' | 'Upload';
    imageUrl?: string;
    isActive: boolean;
    totalSold?: number;
}

export default function ProductInventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [activeView, setActiveView] = useState<'inventory' | 'arrange' | 'analytics'>('inventory');

    // Filter States

    // Filter States
    const [activeCategory, setActiveCategory] = useState<'All' | 'TopUp' | 'SpecialDeal'>('All');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

    // Form State
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        category: 'TopUp',
        priceCoins: 0,
        costPrice: 0,
        infoDescription: '',
        imageType: 'Upload', // Enforced
        imageUrl: '',
        isActive: true
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/admin/store/products');
            const data = await res.json();
            if (data.success) {
                setProducts(data.products);
            }
        } catch (error) {
            console.error('Failed to fetch products', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Enforce validations
            if (!formData.imageUrl) {
                alert("Image URL is mandatory.");
                return;
            }

            const payload = {
                ...formData,
                id: editingProduct ? editingProduct._id : undefined,
                imageType: 'Upload' // Ensure it's always upload
            };

            const res = await fetch('/api/admin/store/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                fetchProducts();
                setIsModalOpen(false);
                setViewingProduct(null); // Close detail view if open
                resetForm();
            } else {
                alert(data.message || 'Failed to save product');
            }
        } catch (error) {
            console.error('Error saving product', error);
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

        try {
            const res = await fetch(`/api/admin/store/products?id=${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setProducts(prev => prev.filter(p => p._id !== id));
                setViewingProduct(null); // Close modal if open
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("Error deleting product", error);
        }
    }

    const resetForm = () => {
        setEditingProduct(null);
        setFormData({
            title: '',
            category: 'TopUp',
            priceCoins: 0,
            costPrice: 0,
            infoDescription: '',
            imageType: 'Upload',
            imageUrl: '',
            isActive: true
        });
    };

    const openEditProduct = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            title: product.title,
            category: product.category as any,
            priceCoins: product.priceCoins,
            costPrice: product.costPrice,
            infoDescription: product.infoDescription || '',
            imageType: 'Upload',
            imageUrl: product.imageUrl || '',
            isActive: product.isActive
        });
        setIsModalOpen(true);
        // We keep viewingProduct open or close it? 
        // Logic: Editing replaces the view modal usually.
        setViewingProduct(null);
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
        const matchesStatus = statusFilter === 'All'
            ? true
            : statusFilter === 'Active' ? p.isActive : !p.isActive;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    // Computed Stats
    const stats = {
        total: products.length,
        active: products.filter(p => p.isActive).length,
        inactive: products.filter(p => !p.isActive).length
    };

    return (
        <div className="space-y-8 pt-24 pb-12">

            {/* Header & Title */}
            <div className="flex items-center justify-between gap-4 px-1">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl shrink-0 border border-white/5 shadow-inner">
                        <Package className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">
                            Product Inventory
                        </h1>
                        <p className="text-xs text-muted-foreground font-medium mt-1">
                            Manage items & pricing
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Product</span>
                    </button>
                </div>
            </div>

            {/* Separator Line */}
            <div className="h-px w-full bg-border/50" />

            {/* Navigation Tabs */}
            <div className="bg-background/95 backdrop-blur z-20 border-b border-border/40 py-2">
                <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveView('inventory')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap border ${activeView === 'inventory'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'text-muted-foreground border-transparent hover:bg-muted'
                            }`}
                    >
                        <Package size={16} />
                        Inventory
                    </button>
                    <button
                        onClick={() => setActiveView('arrange')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap border ${activeView === 'arrange'
                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            : 'text-muted-foreground border-transparent hover:bg-muted'
                            }`}
                    >
                        <LayoutList size={16} />
                        Arrange Items
                    </button>
                    <button
                        onClick={() => setActiveView('analytics')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap border ${activeView === 'analytics'
                            ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                            : 'text-muted-foreground border-transparent hover:bg-muted'
                            }`}
                    >
                        <Layers size={16} />
                        Statistics
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-6 pt-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">

                {activeView === 'inventory' ? (
                    <>
                        {/* Quick Stats Overlay */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-card border border-border p-4 rounded-xl flex flex-col items-center justify-center gap-1 shadow-sm">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Total Items</span>
                                <span className="text-2xl font-bold text-foreground">{stats.total}</span>
                            </div>
                            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex flex-col items-center justify-center gap-1">
                                <span className="text-[10px] uppercase tracking-wider text-green-600 font-bold">Active</span>
                                <span className="text-2xl font-bold text-foreground">{stats.active}</span>
                            </div>
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex flex-col items-center justify-center gap-1">
                                <span className="text-[10px] uppercase tracking-wider text-red-600 font-bold">Inactive</span>
                                <span className="text-2xl font-bold text-foreground">{stats.inactive}</span>
                            </div>
                        </div>

                        {/* Advanced Filter Bar */}
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card border border-border p-2 rounded-2xl">

                            {/* Category Tabs */}
                            <div className="flex bg-muted/50 p-1 rounded-xl overflow-x-auto w-full md:w-auto no-scrollbar">
                                {(['All', 'TopUp', 'SpecialDeal'] as const).map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeCategory === cat
                                            ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                                            }`}
                                    >
                                        {cat === 'All' && <Layers size={14} />}
                                        {cat === 'TopUp' && <Package size={14} />}
                                        {cat === 'SpecialDeal' && <Tag size={14} />}
                                        {cat === 'All' ? 'All Items' : cat === 'SpecialDeal' ? 'Special Deals' : 'TopUps'}
                                    </button>
                                ))}
                            </div>

                            {/* Search & Status Controls */}
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search inventory..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>

                                {/* Status Filter Dropdown Trigger */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                                        className={`p-2 rounded-xl border transition-all ${statusFilter !== 'All'
                                            ? 'bg-primary/10 border-primary/20 text-primary'
                                            : 'bg-background border-input text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <Filter size={18} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {isFilterOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-40 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                            <div className="p-2 space-y-1">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1">Filter Status</div>
                                                {(['All', 'Active', 'Inactive'] as const).map(status => (
                                                    <button
                                                        key={status}
                                                        onClick={() => { setStatusFilter(status); setIsFilterOpen(false); }}
                                                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === status ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                                                            }`}
                                                    >
                                                        {status === 'Active' && <CheckCircle size={12} className="text-green-500" />}
                                                        {status === 'Inactive' && <XCircle size={12} className="text-red-500" />}
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Simplified Grid/List View */}
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            {loading ? (
                                <div className="p-8 text-center text-muted-foreground">Loading inventory...</div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">No products found.</div>
                            ) : (
                                <div className="grid grid-cols-1 divide-y divide-border">
                                    {filteredProducts.map(product => (
                                        <div
                                            key={product._id}
                                            onClick={() => setViewingProduct(product)}
                                            className="p-4 flex items-center gap-4 hover:bg-muted/50 cursor-pointer transition-all active:scale-[0.99]"
                                        >
                                            <div className="w-14 h-14 bg-muted rounded-xl border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative">
                                                {product.imageUrl ? (
                                                    <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="text-muted-foreground" />
                                                )}
                                                {!product.isActive && (
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                        <span className="text-[8px] uppercase font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full">Solid Out</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-foreground text-sm truncate pr-2">{product.title}</h3>
                                                    <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full shrink-0">
                                                        <span className="text-xs font-black text-yellow-600">{product.priceCoins}</span>
                                                        <span className="text-[10px]">🪙</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between mt-1">
                                                    <p className="text-xs text-muted-foreground truncate">{product.category}</p>
                                                    {product.totalSold && product.totalSold > 0 ? (
                                                        <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                                            🔥 {product.totalSold} Sold
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Detail Modal (View) */}
                        {viewingProduct && !isModalOpen && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                                <div className="bg-card border border-border rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative">

                                    <button
                                        onClick={() => setViewingProduct(null)}
                                        className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>

                                    {/* Modal Image Header */}
                                    <div className="w-full aspect-video bg-muted relative">
                                        {viewingProduct.imageUrl ? (
                                            <img src={viewingProduct.imageUrl} alt={viewingProduct.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <Package size={48} className="text-muted-foreground/30" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
                                            <div className="flex gap-2 mb-1">
                                                <span className="bg-white/20 backdrop-blur-md text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-white/10">
                                                    {viewingProduct.category}
                                                </span>
                                                {viewingProduct.isActive ? (
                                                    <span className="bg-green-500/80 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">Active</span>
                                                ) : (
                                                    <span className="bg-red-500/80 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">Inactive</span>
                                                )}
                                            </div>
                                            <h2 className="text-xl font-bold text-white leading-tight">{viewingProduct.title}</h2>
                                        </div>
                                    </div>

                                    {/* Modal Content */}
                                    <div className="p-6 space-y-6">

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Selling Price</label>
                                                <div className="flex items-center gap-1.5 text-xl font-black text-yellow-500">
                                                    <span>{viewingProduct.priceCoins}</span>
                                                    <span className="text-xs text-muted-foreground font-medium">Coins</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Cost Price</label>
                                                <div className="flex items-center gap-1.5 text-base font-bold text-green-600">
                                                    <span className="text-xs">Rs.</span>
                                                    <span>{viewingProduct.costPrice}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold text-blue-500">Total Sold</label>
                                                <div className="flex items-center gap-1.5 text-xl font-black text-blue-500">
                                                    <span>{viewingProduct.totalSold || 0}</span>
                                                    <span className="text-xs opacity-50">Freq.</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 bg-muted/30 p-4 rounded-xl border border-border/50">
                                            <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Description</label>
                                            <p className="text-sm text-foreground leading-relaxed">
                                                {viewingProduct.infoDescription || <span className="text-muted-foreground italic">No description provided.</span>}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="pt-2">
                                            <button
                                                onClick={() => openEditProduct(viewingProduct)}
                                                className="flex w-full items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                                            >
                                                <Edit2 size={16} /> Edit Product
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Add/Edit Product Modal */}
                        {isModalOpen && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                                <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
                                    <h2 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2">
                                        <Package className="text-blue-500" />
                                        {editingProduct ? 'Edit Product' : 'Add New Product'}
                                    </h2>

                                    <form onSubmit={handleSaveProduct} className="space-y-4">

                                        {/* Title */}
                                        <div>
                                            <label className="block text-xs text-muted-foreground mb-1">Title</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full bg-background border border-input rounded-lg p-2.5 text-foreground focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors"
                                                placeholder="e.g. Weekly Pass"
                                            />
                                        </div>

                                        {/* Category & Status */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-muted-foreground mb-1">Category</label>
                                                <select
                                                    value={formData.category}
                                                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                                    className="w-full bg-background border border-input rounded-lg p-2.5 text-foreground focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors"
                                                >
                                                    <option value="TopUp">TopUp</option>
                                                    <option value="SpecialDeal">Special Deal</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-muted-foreground mb-1">Availability Status</label>
                                                <select
                                                    value={formData.isActive ? 'active' : 'inactive'}
                                                    onChange={e => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                                                    className="w-full bg-background border border-input rounded-lg p-2.5 text-foreground focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors"
                                                >
                                                    <option value="active">Stock Available (Active)</option>
                                                    <option value="inactive">Sold Out (Inactive)</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Prices */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-muted-foreground mb-1">Selling Price (Coins)</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        required
                                                        min="0"
                                                        value={formData.priceCoins}
                                                        onChange={e => setFormData({ ...formData, priceCoins: Number(e.target.value) })}
                                                        className="w-full bg-background border border-input rounded-lg p-2.5 pl-8 text-foreground focus:ring-2 focus:ring-yellow-500 outline-none text-sm"
                                                    />
                                                    <span className="absolute left-3 top-2.5 text-yellow-500 text-sm">🪙</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-muted-foreground mb-1">Cost Price (PKR)</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        required
                                                        min="0"
                                                        value={formData.costPrice}
                                                        onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                                                        className="w-full bg-background border border-input rounded-lg p-2.5 pl-8 text-foreground focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                                    />
                                                    <span className="absolute left-3 top-2.5 text-green-500 text-sm">Rs</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Image URL (Mandatory) */}
                                        <div>
                                            <ImageUpload
                                                value={formData.imageUrl}
                                                onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                                                label="Product Image"
                                            />
                                        </div>

                                        {/* Info Description */}
                                        <div>
                                            <label className="block text-xs text-muted-foreground mb-1">Bonus Description / Details <span className="opacity-50 font-normal">(Optional)</span></label>
                                            <textarea
                                                rows={3}
                                                value={formData.infoDescription}
                                                onChange={e => setFormData({ ...formData, infoDescription: e.target.value })}
                                                className="w-full bg-background border border-input rounded-lg p-2.5 text-foreground focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                                                placeholder="Details about the pack..."
                                            />
                                        </div>

                                        <div className={`flex ${editingProduct ? 'justify-between' : 'justify-end'} gap-3 mt-6 pt-4 border-t border-border`}>
                                            {editingProduct && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (confirm("Are you sure you want to delete this product?")) {
                                                            handleDeleteProduct(editingProduct._id);
                                                            setIsModalOpen(false);
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-bold transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsModalOpen(false)}
                                                    className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-sm font-medium"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-600/20"
                                                >
                                                    {editingProduct ? 'Save Changes' : 'Create Product'}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </>
                ) : activeView === 'arrange' ? (
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-full text-blue-500">
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-blue-500 text-sm">Arrangement Mode</h3>
                                <p className="text-xs text-muted-foreground">Drag and drop or use arrows to change how items appear in the user app.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {filteredProducts.map((product, index) => (
                                <div key={product._id} className="bg-card border border-border p-3 rounded-xl flex items-center justify-between group hover:border-blue-500/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="cursor-grab text-muted-foreground hover:text-foreground">
                                            <GripVertical size={20} />
                                        </div>
                                        <div className="w-10 h-10 bg-muted rounded-lg border border-border flex items-center justify-center overflow-hidden">
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <Package size={16} className="text-muted-foreground" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground text-sm">{product.title}</h4>
                                            <p className="text-[10px] text-muted-foreground">{product.category} • {product.priceCoins} Coins</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors disabled:opacity-20" disabled={index === 0}>
                                            <ArrowUp size={16} />
                                        </button>
                                        <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors disabled:opacity-20" disabled={index === filteredProducts.length - 1}>
                                            <ArrowDown size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4">
                            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20">
                                Save Arrangement
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Analytics Overview Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-card border border-border p-4 rounded-xl space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-bold">Total Sales Count</p>
                                <p className="text-2xl font-black text-blue-500">
                                    {products.reduce((acc, p) => acc + (p.totalSold || 0), 0)}
                                </p>
                            </div>
                            <div className="bg-card border border-border p-4 rounded-xl space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-bold">Est. Coin Revenue</p>
                                <p className="text-2xl font-black text-yellow-500">
                                    {products.reduce((acc, p) => acc + ((p.totalSold || 0) * p.priceCoins), 0).toLocaleString()} <span className="text-base text-muted-foreground">🪙</span>
                                </p>
                            </div>
                            <div className="bg-card border border-border p-4 rounded-xl space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-bold">Top Product</p>
                                <p className="text-sm font-bold text-foreground truncate">{products[0]?.title || 'N/A'}</p>
                            </div>
                            <div className="bg-card border border-border p-4 rounded-xl space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-bold">Active Items</p>
                                <p className="text-2xl font-black text-green-500">{stats.active}</p>
                            </div>
                        </div>

                        {/* Leaderboard Table */}
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-border bg-muted/20">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Tag className="text-purple-500" size={18} />
                                    Top Selling Products
                                </h3>
                            </div>
                            <div className="divide-y divide-border">
                                {products.map((product, index) => {
                                    const maxUserInfo = products[0]?.totalSold || 1;
                                    const percentage = ((product.totalSold || 0) / maxUserInfo) * 100;

                                    return (
                                        <div key={product._id} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                                            <div className="flex-shrink-0 w-8 text-center font-black text-muted-foreground">#{index + 1}</div>

                                            <div className="w-10 h-10 bg-muted rounded-lg border border-border flex items-center justify-center overflow-hidden shrink-0">
                                                {product.imageUrl ? (
                                                    <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package size={16} className="text-muted-foreground" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0 grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
                                                <div>
                                                    <h4 className="font-bold text-sm truncate">{product.title}</h4>
                                                    <p className="text-xs text-muted-foreground">{product.category}</p>
                                                </div>

                                                <div className="w-full">
                                                    <div className="flex justify-between text-xs mb-1 font-medium">
                                                        <span className="text-blue-500">{product.totalSold || 0} Sold</span>
                                                        <span className="text-yellow-600">Generated: {(product.totalSold || 0) * product.priceCoins} 🪙</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
