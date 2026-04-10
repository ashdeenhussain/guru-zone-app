"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";

interface DailySpinItem {
    _id: string;
    label: string;
    value: number;
    probability: number;
    color: string;
    isActive: boolean;
}

export default function AdminDailySpinPage() {
    const [items, setItems] = useState<DailySpinItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<DailySpinItem | null>(null);
    const [formData, setFormData] = useState({ label: "", value: 0, probability: 0, color: "#9333ea" });
    const [saving, setSaving] = useState(false);

    const totalProbability = items.reduce((sum, i) => sum + (i.probability || 0), 0);

    useEffect(() => { fetchItems(); }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/finance/daily-spin/items");
            const data = await res.json();
            if (data.success) setItems(data.items || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const openAdd = () => {
        setEditingItem(null);
        setFormData({ label: "", value: 0, probability: 0, color: "#9333ea" });
        setIsModalOpen(true);
    };

    const openEdit = (item: DailySpinItem) => {
        setEditingItem(item);
        setFormData({ label: item.label, value: item.value, probability: item.probability, color: item.color });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.label) { alert("Label is required"); return; }
        if (formData.probability < 0 || formData.probability > 100) { alert("Probability must be 0–100"); return; }
        setSaving(true);
        try {
            const url = editingItem
                ? `/api/admin/finance/daily-spin/items/${editingItem._id}`
                : "/api/admin/finance/daily-spin/items";
            const method = editingItem ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setIsModalOpen(false);
                fetchItems();
            } else {
                const d = await res.json();
                alert(d.error || "Failed to save");
            }
        } catch (e) {
            alert("Error saving item");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this spin item?")) return;
        try {
            await fetch(`/api/admin/finance/daily-spin/items/${id}`, { method: "DELETE" });
            fetchItems();
        } catch (e) {
            alert("Delete failed");
        }
    };

    // Preset items for quick setup
    const PRESETS = [
        { label: "Nothing 😔", value: 0, probability: 50, color: "#6b7280" },
        { label: "1 Coin", value: 1, probability: 20, color: "#9333ea" },
        { label: "2 Coins", value: 2, probability: 15, color: "#eab308" },
        { label: "5 Coins", value: 5, probability: 8, color: "#9333ea" },
        { label: "10 Coins", value: 10, probability: 5, color: "#eab308" },
        { label: "20 Coins", value: 20, probability: 1.5, color: "#9333ea" },
        { label: "100 Coins", value: 100, probability: 0.4, color: "#eab308" },
        { label: "1000 Coins", value: 1000, probability: 0.1, color: "#22c55e" },
    ];

    const seedPresets = async () => {
        if (!confirm("This will add 8 preset items. Continue?")) return;
        setSaving(true);
        try {
            for (const preset of PRESETS) {
                await fetch("/api/admin/finance/daily-spin/items", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(preset),
                });
            }
            fetchItems();
        } catch (e) {
            alert("Error seeding presets");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Win 1K Spinner</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Control daily reward spin — items & probabilities.
                    </p>
                </div>
                <div className="flex gap-2">
                    {items.length === 0 && (
                        <button
                            onClick={seedPresets}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-500 border border-purple-500/20 rounded-xl text-sm font-bold transition-all"
                        >
                            <RefreshCw size={16} className={saving ? "animate-spin" : ""} />
                            Quick Setup
                        </button>
                    )}
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold transition-all hover:brightness-110"
                    >
                        <Plus size={16} /> Add Item
                    </button>
                </div>
            </div>

            {/* Probability Warning */}
            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${totalProbability === 100
                ? "bg-green-500/10 border-green-500/30"
                : totalProbability > 100
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-yellow-500/10 border-yellow-500/30"
                }`}>
                {totalProbability === 100
                    ? <CheckCircle size={18} className="text-green-500 shrink-0" />
                    : <AlertTriangle size={18} className={totalProbability > 100 ? "text-red-500" : "text-yellow-500"} />
                }
                <div className="flex-1">
                    <p className={`font-bold text-sm ${totalProbability === 100 ? "text-green-500" : totalProbability > 100 ? "text-red-500" : "text-yellow-500"}`}>
                        Total Probability: {totalProbability.toFixed(1)}%
                        {totalProbability !== 100 && ` (Should be exactly 100%)`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Lower probability = less likely to win. Keep "Nothing" at ~50% for balance.
                    </p>
                </div>
            </div>

            {/* Strategy Tips */}
            <div className="bg-card/50 border border-border/50 rounded-2xl p-4 space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">💡 Recommended Strategy</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {[
                        { label: "Nothing", prob: "~50%", color: "text-gray-400" },
                        { label: "1–2 Coins", prob: "~30%", color: "text-purple-400" },
                        { label: "5–10 Coins", prob: "~15%", color: "text-yellow-400" },
                        { label: "100–1000 Coins", prob: "~5%", color: "text-green-400" },
                    ].map((tip, i) => (
                        <div key={i} className="bg-background/50 rounded-xl p-2.5 border border-border/50">
                            <p className={`font-bold ${tip.color}`}>{tip.label}</p>
                            <p className="text-muted-foreground">{tip.prob} chance</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase tracking-widest">
                        <tr>
                            <th className="px-5 py-4">Label</th>
                            <th className="px-5 py-4 text-center">Coins Won</th>
                            <th className="px-5 py-4 text-center">Probability</th>
                            <th className="px-5 py-4 text-center">Bar</th>
                            <th className="px-5 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-10 text-center text-muted-foreground">
                                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                                    Loading...
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-10 text-center">
                                    <p className="text-muted-foreground text-sm mb-3">No spin items yet.</p>
                                    <button onClick={seedPresets} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold">
                                        Quick Setup with Presets
                                    </button>
                                </td>
                            </tr>
                        ) : items.map((item) => (
                            <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                        <span className="font-bold text-sm text-foreground">{item.label}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-center">
                                    <span className={`font-bold text-sm ${item.value === 0 ? "text-muted-foreground" : "text-yellow-500"}`}>
                                        {item.value === 0 ? "—" : `${item.value} 🪙`}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-center">
                                    <span className="font-mono font-bold text-sm">{item.probability}%</span>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{ width: `${Math.min(item.probability, 100)}%`, backgroundColor: item.color }}
                                        />
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => openEdit(item)}
                                            className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-all"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item._id)}
                                            className="p-2 hover:bg-red-500/10 rounded-xl text-muted-foreground hover:text-red-500 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-5">{editingItem ? "Edit Spin Item" : "Add Spin Item"}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-muted-foreground font-bold uppercase block mb-1.5">Label</label>
                                <input
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-foreground focus:ring-2 focus:ring-primary outline-none text-sm"
                                    placeholder="e.g. Nothing 😔 or 10 Coins"
                                    value={formData.label}
                                    onChange={e => setFormData({ ...formData, label: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-muted-foreground font-bold uppercase block mb-1.5">Coins Won</label>
                                    <input
                                        type="number"
                                        min={0}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-foreground focus:ring-2 focus:ring-primary outline-none text-sm"
                                        placeholder="0"
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">Set 0 for "Nothing"</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground font-bold uppercase block mb-1.5">Probability %</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={0.1}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-foreground focus:ring-2 focus:ring-primary outline-none text-sm"
                                        placeholder="50"
                                        value={formData.probability}
                                        onChange={e => setFormData({ ...formData, probability: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground font-bold uppercase block mb-1.5">Color</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        className="w-12 h-10 bg-background border border-border rounded-xl cursor-pointer"
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                    />
                                    <span className="text-sm font-mono text-muted-foreground">{formData.color}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-muted text-muted-foreground hover:text-foreground rounded-xl text-sm font-bold transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50">
                                {saving ? "Saving..." : editingItem ? "Update Item" : "Add Item"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
