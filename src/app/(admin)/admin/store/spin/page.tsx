"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2, Trash2, Edit, Plus, RefreshCw, Send, CheckCircle, Package, Disc } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

interface SpinItem {
    _id: string;
    label: string;
    type: "Coin" | "Product";

    value?: number | string;
    probability: number;
    color: string;
    imageUrl: string;
    isActive: boolean;
}

interface SpinHistoryItem {
    _id: string;
    date: string;
    user: {
        name: string;
        email: string;
        image?: string;
    };
    type: "Coin" | "Product";
    prize: string;
    status: string;
    originalData: any; // ID for order updates
}

export default function AdminSpinPage() {
    const [activeTab, setActiveTab] = useState<"config" | "history">("config");

    // Config State
    const [items, setItems] = useState<SpinItem[]>([]);
    const [isLoadingItems, setIsLoadingItems] = useState(true);
    const [isEditing, setIsEditing] = useState<SpinItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New: Available Products for Selection
    const [availableProducts, setAvailableProducts] = useState<any[]>([]);

    // History State
    const [history, setHistory] = useState<SpinHistoryItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<SpinHistoryItem | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        label: "",
        type: "Coin",
        value: "",
        probability: 0,
        color: "#ffffff",
        imageUrl: "",
    });

    useEffect(() => {
        if (activeTab === "config") {
            fetchItems();
            fetchProducts();
        } else {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/admin/store/products");
            const data = await res.json();
            if (data.success && Array.isArray(data.products)) {
                // Filter only active products
                setAvailableProducts(data.products.filter((p: any) => p.isActive));
            }
        } catch (error) {
            console.error("Failed to fetch products", error);
        }
    };

    const fetchItems = async () => {
        setIsLoadingItems(true);
        try {
            const res = await fetch("/api/admin/store/spin/items");
            const data = await res.json();
            if (Array.isArray(data)) setItems(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingItems(false);
        }
    };

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const res = await fetch("/api/admin/store/spin/history");
            const data = await res.json();
            if (Array.isArray(data)) setHistory(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleSaveItem = async () => {
        // Validation (Image is now optional)
        if (!formData.label) {
            alert("Label is required");
            return;
        }

        const method = isEditing ? "PUT" : "POST";
        const url = isEditing
            ? `/api/admin/store/spin/items/${isEditing._id}`
            : "/api/admin/store/spin/items";

        const payload = {
            ...formData,
            type: formData.type
        };

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to save");

            setIsModalOpen(false);
            fetchItems();
            resetForm();
        } catch (error) {
            alert("Error saving item");
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        try {
            await fetch(`/api/admin/store/spin/items/${id}`, { method: "DELETE" });
            setIsModalOpen(false);
            fetchItems();
        } catch (error) {
            alert("Error deleting item");
        }
    };

    const handleMarkDelivered = async (orderId: string) => {
        if (!confirm("Mark this prize as delivered?")) return;

        try {
            const res = await fetch(`/api/admin/store/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: 'approve' }) // Using existing Order Approval Route!
            });
            if (res.ok) {
                fetchHistory();
                setSelectedHistoryItem(null); // Close modal on success
            } else {
                alert("Failed to update order");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const resetForm = () => {
        setIsEditing(null);
        setFormData({
            label: "",
            type: "Coin",
            value: "",
            probability: 0,
            color: "#ffffff",
            imageUrl: "",
        });
    };

    const openEdit = (item: SpinItem) => {
        setIsEditing(item);
        setFormData({
            label: item.label,
            type: item.type,
            value: item.value?.toString() || "",
            probability: item.probability,
            color: item.color,
            imageUrl: item.imageUrl,
        });
        setIsModalOpen(true);
    };

    const totalProbability = items.reduce((sum, item) => sum + (item.probability || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold font-heading">Lucky Spin Manager</h1>
                    <p className="text-muted-foreground">Configure prizes and track winners</p>
                </div>
            </div>

            <div className="h-px w-full bg-border/50" />

            <div className="flex gap-2 items-center bg-card/40 backdrop-blur-sm p-1 rounded-xl w-fit border border-border/50">
                <button
                    onClick={() => setActiveTab("config")}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'config' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                    Config
                </button>
                <button
                    onClick={() => setActiveTab("history")}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'history' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                    History
                </button>
            </div>

            {/* TAB 1: CONFIG */}
            {activeTab === "config" && (
                <div>
                    {/* Stats / Warnings */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className={`p-4 rounded-xl border ${totalProbability === 100 ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Total Probability</p>
                            <div className="flex items-end gap-2">
                                <span className={`text-2xl font-bold ${totalProbability === 100 ? 'text-green-500' : 'text-yellow-500'}`}>
                                    {totalProbability}%
                                </span>
                                {totalProbability !== 100 && (
                                    <span className="text-xs text-yellow-500 mb-1">Should be 100%</span>
                                )}
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-card border border-border">
                            <p className="text-xs text-muted-foreground uppercase font-bold">Active Items</p>
                            <p className="text-2xl font-bold text-foreground">{items.length}</p>
                        </div>
                        <button
                            onClick={() => { resetForm(); setIsModalOpen(true); }}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl p-4 flex items-center justify-center gap-2 font-bold transition-colors"
                        >
                            <Plus size={20} /> Add New Item
                        </button>
                    </div>

                    {/* Table */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-muted text-muted-foreground text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-4">Item</th>
                                    <th className="px-6 py-4">Probability</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {isLoadingItems ? (
                                    <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                                ) : items.map((item) => (
                                    <tr key={item._id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            {item.imageUrl && (
                                                <div className="w-10 h-10 rounded-lg overflow-hidden relative bg-muted shrink-0">
                                                    <Image src={item.imageUrl} alt={item.label} fill className="object-cover" />
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground text-sm">{item.label}</span>
                                                <span className={`text-[10px] font-bold uppercase ${item.type === 'Coin' ? 'text-yellow-500' : 'text-blue-500'}`}>
                                                    {item.type} • {item.value || 'No Value'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-full max-w-[80px] h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div className="h-full bg-red-500" style={{ width: `${item.probability}%` }}></div>
                                                </div>
                                                <span className="text-xs font-bold">{item.probability}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openEdit(item)} className="p-2 hover:bg-muted rounded-lg text-foreground transition-colors bg-muted/50">
                                                    <Edit size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: HISTORY */}
            {activeTab === "history" && (
                <div className="bg-card border border-border rounded-xl overflow-hidden overflow-x-auto loading-section">
                    <table className="w-full text-left">
                        <thead className="bg-muted text-muted-foreground text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Prize</th>
                                <th className="px-6 py-4 text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoadingHistory ? (
                                <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">Loading History...</td></tr>
                            ) : history.length === 0 ? (
                                <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No spin history found.</td></tr>
                            ) : history.map((record) => (
                                <tr
                                    key={record._id}
                                    onClick={() => setSelectedHistoryItem(record)}
                                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                                                {record.user?.image ?
                                                    <Image src={record.user.image} alt="" width={32} height={32} /> :
                                                    <span className="text-xs font-bold text-muted-foreground">{record.user?.name?.[0]}</span>
                                                }
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground">{record.user?.name || 'Unknown'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {record.type === 'Coin' ? '🪙' : '🎁'}
                                            <span className={`text-sm font-medium ${record.type === 'Coin' ? 'text-yellow-500' : 'text-blue-400'}`}>
                                                {record.prize}
                                            </span>
                                            {record.status === 'Pending' && <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-xs text-muted-foreground">
                                        {new Date(record.date).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Config Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6">
                        <h2 className="text-xl font-bold mb-4 text-foreground">{isEditing ? 'Edit Item' : 'New Item'}</h2>
                        <div className="space-y-4">
                            <div>
                                <ImageUpload
                                    value={formData.imageUrl}
                                    onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                                    label="Item Image (Optional)"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground font-bold uppercase block mb-1">Label</label>
                                <input
                                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="100 Coins"
                                    value={formData.label}
                                    onChange={e => setFormData({ ...formData, label: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-muted-foreground font-bold uppercase block mb-1">Type</label>
                                    <select
                                        className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="Coin">Coins</option>
                                        <option value="Product">Product</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground font-bold uppercase block mb-1">Val / ID</label>

                                    {formData.type === 'Product' ? (
                                        <select
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                                            value={formData.value}
                                            onChange={e => {
                                                const selectedProduct = availableProducts.find(p => p._id === e.target.value);
                                                setFormData({
                                                    ...formData,
                                                    value: e.target.value,
                                                    label: selectedProduct ? selectedProduct.title : formData.label // Auto-fill label
                                                });
                                            }}
                                        >
                                            <option value="">-- Select Active Product --</option>
                                            {availableProducts.map(p => (
                                                <option key={p._id} value={p._id}>
                                                    {p.title} ({p.priceCoins} 🪙)
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                                            placeholder="100"
                                            value={formData.value}
                                            onChange={e => setFormData({ ...formData, value: e.target.value })}
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-muted-foreground font-bold uppercase block mb-1">Probability %</label>
                                    <input
                                        type="number"
                                        className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                                        value={formData.probability}
                                        onChange={e => setFormData({ ...formData, probability: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground font-bold uppercase block mb-1">Color (Hex)</label>
                                    <input
                                        type="color"
                                        className="w-full h-10 bg-background border border-input rounded-lg cursor-pointer"
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
                            <div>
                                {isEditing && (
                                    <button
                                        onClick={() => handleDeleteItem(isEditing._id)}
                                        className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 flex items-center gap-2 transition-colors"
                                    >
                                        <Trash2 size={18} /> Delete
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg bg-muted text-muted-foreground font-bold hover:text-foreground transition-colors">Cancel</button>
                                <button onClick={handleSaveItem} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">Save Item</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedHistoryItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 relative">
                        <button
                            onClick={() => setSelectedHistoryItem(null)}
                            className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full text-muted-foreground"
                        >
                            <Trash2 className="rotate-45" size={20} />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-3 overflow-hidden border-2 border-border">
                                {selectedHistoryItem.user?.image ?
                                    <Image src={selectedHistoryItem.user.image} alt="" width={80} height={80} className="object-cover w-full h-full" /> :
                                    <span className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">{selectedHistoryItem.user?.name?.[0]}</span>
                                }
                            </div>
                            <h2 className="text-xl font-bold font-heading">{selectedHistoryItem.user?.name}</h2>
                            <p className="text-xs text-muted-foreground">{selectedHistoryItem.user?.email}</p>

                            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                <RefreshCw size={12} />
                                {history.filter(h => h.user?.email === selectedHistoryItem.user?.email).length} Total Spins
                            </div>
                        </div>

                        <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold uppercase text-muted-foreground">Prize Won</span>
                                <div className="flex items-center gap-2">
                                    {selectedHistoryItem.type === 'Coin' ? '🪙' : '🎁'}
                                    <span className={`text-lg font-bold ${selectedHistoryItem.type === 'Coin' ? 'text-yellow-500' : 'text-blue-500'}`}>
                                        {selectedHistoryItem.prize}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold uppercase text-muted-foreground">Date won</span>
                                <span className="text-sm font-medium text-foreground">
                                    {new Date(selectedHistoryItem.date).toLocaleString()}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold uppercase text-muted-foreground">Status</span>
                                {selectedHistoryItem.status === 'Pending' ? (
                                    <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-xs font-bold uppercase tracking-wider">
                                        Pending Delivery
                                    </span>
                                ) : selectedHistoryItem.status === 'Auto-Credited' ? (
                                    <span className="px-2 py-1 rounded bg-green-500/10 text-green-500 border border-green-500/20 text-xs font-bold uppercase tracking-wider">
                                        Auto Credited
                                    </span>
                                ) : (
                                    <span className="px-2 py-1 rounded bg-gray-700 text-gray-300 text-xs font-bold uppercase tracking-wider">
                                        {selectedHistoryItem.status}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        {selectedHistoryItem.type === 'Product' && selectedHistoryItem.status === 'Pending' && (
                            <div className="mt-6">
                                <button
                                    onClick={() => handleMarkDelivered(selectedHistoryItem._id)}
                                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                >
                                    <Package size={20} /> Mark as Delivered
                                </button>
                                <p className="text-center text-[10px] text-muted-foreground mt-2">
                                    This will update the order status to approved.
                                </p>
                            </div>
                        )}

                        <div className="mt-4 text-center">
                            <button onClick={() => setSelectedHistoryItem(null)} className="text-sm text-muted-foreground hover:text-foreground font-bold">
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
