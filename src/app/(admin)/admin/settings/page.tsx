'use client';

import React, { useState, useEffect } from 'react';
import {
    Settings, Image as ImageIcon, CreditCard, Bell,
    Save, Trash2, Plus, Info, CheckCircle, AlertTriangle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
type SystemSettings = {
    maintenanceMode: boolean;
    minAppVersion: string;
    supportLink: string;
    bannerImages: {
        url: string;
        location: 'home' | 'shop' | 'both';
    }[];
    announcement: string;
};

type PaymentMethod = {
    _id: string;
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    isActive: boolean;
    instructions?: string;
    proofGuideImageUrl?: string;
};

const BANK_OPTIONS = ['Easypaisa', 'JazzCash', 'Sadapay', 'Nayapay', 'U-Paisa', 'Bank Transfer'];

export default function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState<'general' | 'banners' | 'payments' | 'notifications'>('general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Data State
    const [settings, setSettings] = useState<SystemSettings>({
        maintenanceMode: false,
        minAppVersion: '1.0.0',
        supportLink: '',
        bannerImages: [],
        announcement: ''
    });
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

    // Form State for new Payment Method
    const [newMethod, setNewMethod] = useState({
        bankName: 'Easypaisa',
        accountTitle: '',
        accountNumber: '',
        instructions: '',
        proofGuideImageUrl: ''
    });

    const [uploadingGuide, setUploadingGuide] = useState(false);

    // Form State for Notification
    const [notification, setNotification] = useState({ title: '', message: '' });
    const [showNotifyModal, setShowNotifyModal] = useState(false);

    // --- Fetch Data ---
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [settingsRes, methodsRes] = await Promise.all([
                fetch('/api/admin/settings'),
                fetch('/api/admin/settings/payment-methods')
            ]);

            if (settingsRes.ok) setSettings(await settingsRes.json());
            if (methodsRes.ok) setPaymentMethods(await methodsRes.json());
        } catch (error) {
            console.error('Error loading data:', error);
            showToast('error', 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    // --- Handlers ---

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (!res.ok) throw new Error('Failed to update');
            showToast('success', 'System settings updated successfully');
        } catch (error) {
            showToast('error', 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const handleTogglePaymentMethod = async (id: string, currentStatus: boolean) => {
        try {
            // Optimistic UI update
            setPaymentMethods(prev => prev.map(p => p._id === id ? { ...p, isActive: !currentStatus } : p));

            const res = await fetch(`/api/admin/settings/payment-methods/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            if (!res.ok) throw new Error('Failed to toggle');
        } catch (error) {
            showToast('error', 'Failed to toggle payment method');
            fetchData(); // Revert on error
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingGuide(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (data.success) {
                setNewMethod({ ...newMethod, proofGuideImageUrl: data.url });
                showToast('success', 'Guide image uploaded');
            } else {
                showToast('error', 'Upload failed');
            }
        } catch (error) {
            showToast('error', 'Error uploading image');
        } finally {
            setUploadingGuide(false);
        }
    };

    const handleAddPaymentMethod = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings/payment-methods', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMethod),
            });

            if (!res.ok) throw new Error('Failed to add method');

            const added = await res.json();
            setPaymentMethods([added, ...paymentMethods]);
            setNewMethod({
                bankName: 'Easypaisa',
                accountTitle: '',
                accountNumber: '',
                instructions: '',
                proofGuideImageUrl: ''
            });
            showToast('success', 'Payment method added');
        } catch (error) {
            showToast('error', 'Failed to add payment method');
        } finally {
            setSaving(false);
        }
    };

    const handleSendNotification = async () => {
        setShowNotifyModal(false);
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings/notify-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notification),
            });

            if (!res.ok) throw new Error('Failed to send');

            const data = await res.json();
            showToast('success', data.message || 'Notification sent');
            setNotification({ title: '', message: '' });
        } catch (error) {
            showToast('error', 'Failed to send notification');
        } finally {
            setSaving(false);
        }
    };

    // --- Render Helpers ---

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center text-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-background text-foreground p-2 lg:p-6 pb-20 lg:pb-6">
            <div className="max-w-7xl mx-auto">
                <header className="mb-6 lg:mb-8">
                    <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                        System Settings
                    </h1>
                    <p className="text-sm lg:text-base text-muted-foreground mt-1 lg:mt-2">Manage global configurations, payments, and notifications.</p>
                </header>

                {message && (
                    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/20 text-green-500 border border-green-500/50' : 'bg-red-500/20 text-red-500 border border-red-500/50'}`}>
                        {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                        {message.text}
                    </div>
                )}

                {/* Background Glows for Premium Feel */}
                <div className="fixed top-0 left-0 w-full h-[500px] bg-purple-500/10 blur-[100px] pointer-events-none -z-10" />
                <div className="fixed bottom-0 right-0 w-full h-[500px] bg-pink-500/10 blur-[100px] pointer-events-none -z-10" />

                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 relative z-0">
                    {/* Navigation - Premium Pill Style on Mobile, Sidebar on Desktop */}
                    <nav className="w-full lg:w-64 shrink-0 h-fit sticky top-4 z-40">
                        <div className="flex flex-row lg:flex-col lg:bg-card/50 lg:backdrop-blur-md lg:border lg:border-white/5 lg:p-2 lg:rounded-2xl overflow-x-auto no-scrollbar gap-2 lg:gap-1">
                            {['general', 'banners', 'payments', 'notifications'].map((tab) => {
                                const isActive = activeTab === tab;
                                const icons = { general: Settings, banners: ImageIcon, payments: CreditCard, notifications: Bell };
                                const labels = { general: 'General', banners: 'Banners', payments: 'Payments', notifications: 'Announcements' };
                                const Icon = icons[tab as keyof typeof icons];

                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`relative flex items-center gap-3 px-4 lg:px-6 py-2.5 lg:py-4 transition-all duration-300 rounded-full lg:rounded-xl whitespace-nowrap flex-shrink-0 border lg:border-none ${isActive
                                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 border-transparent'
                                            : 'bg-card/80 lg:bg-transparent text-muted-foreground hover:text-foreground border-white/5 hover:bg-white/5'
                                            }`}
                                    >
                                        <Icon className={`h-4 w-4 lg:h-5 lg:w-5 ${isActive ? 'text-white' : ''}`} />
                                        <span className={`text-sm lg:text-base font-medium ${isActive ? 'font-bold' : ''}`}>{labels[tab as keyof typeof labels]}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </nav>

                    {/* Content Area */}
                    <main className="flex-1 bg-card rounded-2xl border border-border p-3 lg:p-6 min-h-[600px] relative">
                        <AnimatePresence mode="wait">

                            {/* --- General Settings --- */}
                            {activeTab === 'general' && (
                                <motion.div
                                    key="general"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-purple-500/10 rounded-lg">
                                            <Settings className="text-purple-500 w-5 h-5" />
                                        </div>
                                        <h2 className="text-xl font-bold font-heading">General Controls</h2>
                                    </div>

                                    <div className="grid gap-6">
                                        {/* Maintenance Mode Card */}
                                        <div className="p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-white/5 hover:border-purple-500/20 transition-all shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <label className="text-lg font-bold text-foreground">Maintenance Mode</label>
                                                    <p className="text-sm text-muted-foreground font-medium">Temporarily disable access for users</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={settings.maintenanceMode}
                                                        onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                                                    />
                                                    <div className="w-12 h-7 bg-muted/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-purple-500"></div>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Configuration Inputs */}
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="p-5 bg-card/50 backdrop-blur-sm rounded-2xl border border-white/5 space-y-2 focus-within:border-purple-500/40 transition-colors">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Min App Version</label>
                                                <input
                                                    type="text"
                                                    value={settings.minAppVersion}
                                                    onChange={(e) => setSettings({ ...settings, minAppVersion: e.target.value })}
                                                    placeholder="e.g. 1.0.2"
                                                    className="w-full bg-transparent text-lg font-mono font-medium outline-none placeholder:text-muted-foreground/30"
                                                />
                                            </div>

                                            <div className="p-5 bg-card/50 backdrop-blur-sm rounded-2xl border border-white/5 space-y-2 focus-within:border-purple-500/40 transition-colors">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Support Link</label>
                                                <input
                                                    type="url"
                                                    value={settings.supportLink}
                                                    onChange={(e) => setSettings({ ...settings, supportLink: e.target.value })}
                                                    placeholder="https://wa.me/..."
                                                    className="w-full bg-transparent text-lg font-medium outline-none placeholder:text-muted-foreground/30"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            onClick={handleSaveSettings}
                                            disabled={saving}
                                            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                            Save Changes
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* --- Banner Management --- */}
                            {activeTab === 'banners' && (
                                <motion.div
                                    key="banners"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-pink-500/10 rounded-lg">
                                            <ImageIcon className="text-pink-500 w-5 h-5" />
                                        </div>
                                        <h2 className="text-xl font-bold font-heading">Banner Management</h2>
                                    </div>

                                    <div className="grid gap-4">
                                        {settings.bannerImages.map((banner, idx) => (
                                            <motion.div
                                                layout
                                                key={idx}
                                                className="group relative flex flex-col md:flex-row gap-4 p-4 bg-card/60 backdrop-blur-sm rounded-2xl border border-white/5 hover:border-pink-500/30 transition-all"
                                            >
                                                {/* Image Preview */}
                                                <div className="relative w-full md:w-48 h-28 shrink-0 rounded-xl overflow-hidden bg-muted">
                                                    {banner.url ? (
                                                        <img src={banner.url} alt="Banner" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                                            <ImageIcon size={32} />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-xs font-bold text-white bg-black/60 px-2 py-1 rounded-full backdrop-blur-md">Preview</span>
                                                    </div>
                                                </div>

                                                {/* Controls */}
                                                <div className="flex-1 space-y-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Image URL</label>
                                                        <input
                                                            type="text"
                                                            value={banner.url}
                                                            onChange={(e) => {
                                                                const newBanners = [...settings.bannerImages];
                                                                newBanners[idx].url = e.target.value;
                                                                setSettings({ ...settings, bannerImages: newBanners });
                                                            }}
                                                            placeholder="https://..."
                                                            className="w-full bg-muted/30 border border-white/5 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-pink-500/50 outline-none transition-all"
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-1 space-y-1">
                                                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Display Location</label>
                                                            <select
                                                                value={banner.location}
                                                                onChange={(e) => {
                                                                    const newBanners = [...settings.bannerImages];
                                                                    newBanners[idx].location = e.target.value as 'home' | 'shop' | 'both';
                                                                    setSettings({ ...settings, bannerImages: newBanners });
                                                                }}
                                                                className="w-full bg-muted/30 border border-white/5 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-pink-500/50 outline-none transition-all appearance-none cursor-pointer"
                                                            >
                                                                <option value="home">Home Only</option>
                                                                <option value="shop">Shop Only</option>
                                                                <option value="both">Both Sections</option>
                                                            </select>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const newBanners = settings.bannerImages.filter((_, i) => i !== idx);
                                                                setSettings({ ...settings, bannerImages: newBanners });
                                                            }}
                                                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all mt-auto"
                                                            title="Remove Banner"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}

                                        <button
                                            onClick={() => setSettings({ ...settings, bannerImages: [...settings.bannerImages, { url: '', location: 'both' }] })}
                                            className="group flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-white/10 hover:border-pink-500/50 hover:bg-pink-500/5 transition-all text-muted-foreground hover:text-pink-500"
                                        >
                                            <div className="p-3 bg-muted/50 group-hover:bg-pink-500/20 rounded-full transition-colors">
                                                <Plus size={24} />
                                            </div>
                                            <span className="font-bold text-sm">Add New Banner</span>
                                        </button>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            onClick={handleSaveSettings}
                                            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 transition-all hover:-translate-y-0.5"
                                        >
                                            <Save size={18} /> Save Banners
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* --- Payment Methods --- */}
                            {activeTab === 'payments' && (
                                <motion.div
                                    key="payments"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-8"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-green-500/10 rounded-lg">
                                            <CreditCard className="text-green-500 w-5 h-5" />
                                        </div>
                                        <h2 className="text-xl font-bold font-heading">Payment Gateways</h2>
                                    </div>

                                    {/* List Methods */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {paymentMethods.map((method) => (
                                            <div
                                                key={method._id}
                                                className={`relative p-5 rounded-2xl border transition-all duration-300 ${method.isActive
                                                    ? 'bg-gradient-to-br from-card to-green-500/5 border-green-500/30'
                                                    : 'bg-card/40 border-white/5 opacity-75 hover:opacity-100'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${method.isActive ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                                                        <span className={`text-xs font-bold uppercase tracking-wider ${method.isActive ? 'text-green-500' : 'text-muted-foreground'}`}>
                                                            {method.isActive ? 'Active' : 'Disabled'}
                                                        </span>
                                                    </div>

                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={method.isActive}
                                                            onChange={() => handleTogglePaymentMethod(method._id, method.isActive)}
                                                        />
                                                        <div className="w-10 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                                    </label>
                                                </div>

                                                <h3 className="text-lg font-bold text-foreground">{method.bankName}</h3>
                                                <p className="text-muted-foreground text-sm font-medium">{method.accountTitle}</p>

                                                <div className="mt-4 pt-4 border-t border-dashed border-white/10">
                                                    <p className="font-mono text-lg tracking-wider text-white/80">{method.accountNumber}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add New Method Form */}
                                    <div className="bg-card/30 rounded-2xl border border-white/5 overflow-hidden">
                                        <div className="p-4 bg-white/5 border-b border-white/5">
                                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                                <Plus size={16} className="text-green-500" /> Add New Gateway
                                            </h3>
                                        </div>
                                        <form onSubmit={handleAddPaymentMethod} className="p-6 grid gap-4 grid-cols-1 md:grid-cols-2">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Provider</label>
                                                <select
                                                    value={newMethod.bankName}
                                                    onChange={e => setNewMethod({ ...newMethod, bankName: e.target.value })}
                                                    className="w-full bg-muted/30 border border-white/5 rounded-xl px-4 py-3 text-foreground focus:ring-1 focus:ring-green-500/50 outline-none"
                                                >
                                                    {BANK_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Account Title</label>
                                                <input
                                                    type="text" required
                                                    value={newMethod.accountTitle} onChange={e => setNewMethod({ ...newMethod, accountTitle: e.target.value })}
                                                    className="w-full bg-muted/30 border border-white/5 rounded-xl px-4 py-3 text-foreground focus:ring-1 focus:ring-green-500/50 outline-none placeholder:text-muted-foreground/30"
                                                    placeholder="e.g. John Doe"
                                                />
                                            </div>

                                            <div className="space-y-1 md:col-span-2">
                                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Account Number / IBAN</label>
                                                <input
                                                    type="text" required
                                                    value={newMethod.accountNumber} onChange={e => setNewMethod({ ...newMethod, accountNumber: e.target.value })}
                                                    className="w-full bg-muted/30 border border-white/5 rounded-xl px-4 py-3 text-foreground focus:ring-1 focus:ring-green-500/50 outline-none placeholder:text-muted-foreground/30 font-mono"
                                                    placeholder="0300..."
                                                />
                                            </div>

                                            <div className="space-y-1 md:col-span-2">
                                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Proof Guide Image (Optional)</label>
                                                <div className="flex items-center gap-4">
                                                    <div className="relative flex-1">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleFileUpload}
                                                            className="w-full bg-muted/30 border border-white/5 rounded-xl px-4 py-3 text-foreground focus:ring-1 focus:ring-green-500/50 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition-all"
                                                        />
                                                    </div>
                                                    {uploadingGuide && <Loader2 className="animate-spin text-green-500" />}
                                                    {newMethod.proofGuideImageUrl && (
                                                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-green-500/30">
                                                            <img src={newMethod.proofGuideImageUrl} alt="Preview" className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="md:col-span-2 pt-2">
                                                <button
                                                    type="submit" disabled={saving}
                                                    className="w-full bg-green-600 hover:bg-green-500 text-white rounded-xl px-4 py-3 font-bold shadow-lg shadow-green-500/20 transition-all hover:-translate-y-0.5"
                                                >
                                                    {saving ? 'Adding...' : 'Add Payment Method'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            )}

                            {/* --- Notifications & Announcements --- */}
                            {activeTab === 'notifications' && (
                                <motion.div
                                    key="notifications"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-8"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-blue-500/10 rounded-lg">
                                            <Bell className="text-blue-500 w-5 h-5" />
                                        </div>
                                        <h2 className="text-xl font-bold font-heading">Communication Center</h2>
                                    </div>

                                    {/* Scrolling Announcement */}
                                    <div className="p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-white/5 hover:border-blue-500/20 transition-all shadow-sm space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Info className="text-blue-400" size={18} />
                                            <h3 className="font-bold text-foreground">Detail Marquee</h3>
                                        </div>
                                        <div className="relative">
                                            <textarea
                                                value={settings.announcement}
                                                onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
                                                placeholder="Enter text that will scroll on the user home page..."
                                                className="w-full h-24 bg-muted/30 border border-white/5 rounded-xl p-4 text-foreground focus:ring-1 focus:ring-blue-500/50 outline-none resize-none transition-all"
                                            />
                                            <div className="absolute bottom-3 right-3">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Live Preview on App</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                onClick={handleSaveSettings}
                                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                                            >
                                                Update Marquee
                                            </button>
                                        </div>
                                    </div>

                                    {/* Push Notification */}
                                    <div className="p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-white/5 hover:border-yellow-500/20 transition-all shadow-sm space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Bell className="text-yellow-400" size={18} />
                                            <h3 className="font-bold text-foreground">Global Push Notification</h3>
                                        </div>

                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                placeholder="Notification Title"
                                                value={notification.title}
                                                onChange={e => setNotification({ ...notification, title: e.target.value })}
                                                className="w-full bg-muted/30 border border-white/5 rounded-xl px-4 py-3 text-foreground focus:ring-1 focus:ring-yellow-500/50 outline-none font-bold"
                                            />
                                            <textarea
                                                placeholder="Message to all users..."
                                                value={notification.message}
                                                onChange={e => setNotification({ ...notification, message: e.target.value })}
                                                className="w-full h-28 bg-muted/30 border border-white/5 rounded-xl p-4 text-foreground focus:ring-1 focus:ring-yellow-500/50 outline-none resize-none"
                                            />
                                        </div>

                                        <div className="flex justify-end pt-2">
                                            <button
                                                onClick={() => setShowNotifyModal(true)}
                                                disabled={!notification.title || !notification.message}
                                                className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-yellow-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                <Bell size={18} /> Send to All Users
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>
                </div>
            </div >

            {/* Confirmation Modal */}
            {
                showNotifyModal && (
                    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-card p-6 rounded-2xl max-w-md w-full border border-border">
                            <h3 className="text-xl font-bold mb-2 text-foreground">Confirm Blast?</h3>
                            <p className="text-muted-foreground mb-6">This will send a notification to ALL registered users. This action cannot be undone.</p>
                            <div className="flex gap-4">
                                <button onClick={() => setShowNotifyModal(false)} className="flex-1 py-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors">Cancel</button>
                                <button onClick={handleSendNotification} className="flex-1 py-3 rounded-xl bg-yellow-600 hover:bg-yellow-500 font-bold text-white transition-colors">Yes, Send</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
