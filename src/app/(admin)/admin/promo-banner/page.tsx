'use client';

import React, { useState, useEffect } from 'react';
import { 
    Image as ImageIcon, 
    Link as LinkIcon, 
    Save, 
    Loader2, 
    CheckCircle, 
    AlertTriangle,
    Eye,
    EyeOff,
    ExternalLink,
    Plus,
    Trash2,
    Edit3,
    ArrowLeft,
    Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type PromoBanner = {
    _id?: string;
    imageUrl: string;
    redirectUrl: string;
    isActive: boolean;
    updatedAt: string;
};

export default function AdminPromoBannerPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [promos, setPromos] = useState<PromoBanner[]>([]);
    
    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [currentPromo, setCurrentPromo] = useState<PromoBanner>({
        imageUrl: '',
        redirectUrl: '',
        isActive: false,
        updatedAt: new Date().toISOString()
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/promo-banner');
            if (res.ok) {
                const data = await res.json();
                setPromos(data);
            }
        } catch (error) {
            console.error('Error loading promo banners:', error);
            showToast('error', 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showToast('error', 'Image too large (Max 5MB)');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (data.success) {
                setCurrentPromo({ 
                    ...currentPromo, 
                    imageUrl: data.url
                });
                showToast('success', 'Promo image uploaded');
            } else {
                showToast('error', data.error || 'Upload failed');
            }
        } catch (error) {
            showToast('error', 'Error uploading image');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const method = currentPromo._id ? 'PUT' : 'POST';
            const res = await fetch('/api/admin/promo-banner', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentPromo),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to update');
            }
            
            showToast('success', currentPromo._id ? 'Banner updated' : 'Banner created');
            setIsEditing(false);
            fetchData();
        } catch (error: any) {
            console.error('Error saving banner:', error);
            showToast('error', error.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this banner?')) return;
        
        try {
            const res = await fetch(`/api/admin/promo-banner?id=${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                showToast('success', 'Banner deleted');
                fetchData();
            }
        } catch (error) {
            showToast('error', 'Failed to delete banner');
        }
    };

    const startNew = () => {
        setCurrentPromo({
            imageUrl: '',
            redirectUrl: '',
            isActive: true,
            updatedAt: new Date().toISOString()
        });
        setIsEditing(true);
    };

    const startEdit = (promo: PromoBanner) => {
        setCurrentPromo(promo);
        setIsEditing(true);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center text-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-4 lg:p-8 pb-20 lg:pb-8">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/20">
                                <BentoIcon />
                            </div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                                App-Open Promo Banners
                            </h1>
                        </div>
                        <p className="text-muted-foreground">Manage high-performance interstitial banners for your users.</p>
                    </div>
                    
                    {!isEditing && (
                        <button 
                            onClick={startNew}
                            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-purple-500/25 transition-all transform hover:-translate-y-1 active:scale-[0.98]"
                        >
                            <Plus size={20} />
                            <span>Create New Banner</span>
                        </button>
                    )}
                </header>

                {message && (
                    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-right duration-300 ${
                        message.type === 'success' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                        <span className="font-medium">{message.text}</span>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {isEditing ? (
                        <motion.div 
                            key="edit"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="grid gap-8"
                        >
                            <div className="bg-card/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                                <div className="p-4 border-b border-white/5 flex items-center gap-4">
                                    <button 
                                        onClick={() => setIsEditing(false)}
                                        className="p-2 hover:bg-white/5 rounded-xl text-muted-foreground transition-colors"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <h2 className="font-bold">{currentPromo._id ? 'Edit Banner' : 'New Banner Configuration'}</h2>
                                </div>
                                
                                <div className="p-6 lg:p-8 space-y-8">
                                    <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-bold">Visibility Status</h3>
                                            <p className="text-sm text-muted-foreground">Toggle this banner's visibility globally</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={currentPromo.isActive}
                                                onChange={(e) => setCurrentPromo({ ...currentPromo, isActive: e.target.checked })}
                                            />
                                            <div className="w-14 h-8 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-lg peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-pink-600"></div>
                                        </label>
                                    </div>

                                    <div className="grid lg:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <label className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                                <ImageIcon size={14} className="text-purple-500" />
                                                Banner Image (4K Optimized)
                                            </label>
                                            
                                            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-white/5 border-2 border-dashed border-white/10 group hover:border-purple-500/50 transition-all duration-500">
                                                {currentPromo.imageUrl ? (
                                                    <>
                                                        <img 
                                                            src={currentPromo.imageUrl} 
                                                            alt="Promo Preview" 
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                        />
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                            <label className="cursor-pointer bg-white text-black px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-purple-500 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300">
                                                                Change Image
                                                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                                            </label>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group">
                                                        <div className="p-4 bg-purple-500/10 rounded-2xl mb-4 group-hover:bg-purple-500/20 transition-colors">
                                                            <Plus size={24} className="text-purple-500" />
                                                        </div>
                                                        <span className="text-sm font-bold text-muted-foreground">Upload High-Res Banner</span>
                                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                                    </label>
                                                )}
                                                {uploading && (
                                                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-md z-20">
                                                        <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
                                                        <span className="text-sm font-bold animate-pulse">Uploading to Cloudinary...</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <label className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                                    <LinkIcon size={14} className="text-pink-500" />
                                                    Redirect Link (Optional)
                                                </label>
                                                <div className="relative group">
                                                    <input 
                                                        type="url"
                                                        value={currentPromo.redirectUrl}
                                                        onChange={(e) => setCurrentPromo({ ...currentPromo, redirectUrl: e.target.value })}
                                                        placeholder="https://example.com/promo"
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-foreground focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none transition-all placeholder:text-muted-foreground/30 font-medium"
                                                    />
                                                </div>
                                            </div>

                                            <div className="p-6 bg-purple-500/5 rounded-2xl border border-purple-500/10 space-y-4">
                                                <h4 className="text-sm font-bold flex items-center gap-2 text-purple-400">
                                                    <CheckCircle size={16} /> 
                                                    Publishing Info
                                                </h4>
                                                <ul className="text-xs space-y-3 text-muted-foreground leading-relaxed">
                                                    <li>• New banners are instantly live if set to active.</li>
                                                    <li>• Users will see this banner based on the 12-hour smart logic.</li>
                                                </ul>
                                            </div>

                                            <div className="pt-4 flex gap-4">
                                                <button
                                                    onClick={() => setIsEditing(false)}
                                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-bold transition-all"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSave}
                                                    disabled={saving || uploading || !currentPromo.imageUrl}
                                                    className="flex-[2] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-4 rounded-2xl font-bold shadow-xl shadow-purple-500/25 transition-all transform hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                                >
                                                    {saving ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            <span>Saving...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save size={20} />
                                                            <span>{currentPromo._id ? 'Update Banner' : 'Publish Banner'}</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="list"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {promos.length > 0 ? (
                                promos.map((promo) => (
                                    <div 
                                        key={promo._id}
                                        className="group bg-card/40 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden hover:border-purple-500/30 transition-all duration-500 shadow-xl"
                                    >
                                        <div className="relative aspect-[4/5] overflow-hidden">
                                            <img 
                                                src={promo.imageUrl} 
                                                alt="Promo" 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute top-4 right-4 flex gap-2">
                                                {promo.isActive ? (
                                                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-widest border border-green-500/30 backdrop-blur-md">Active</span>
                                                ) : (
                                                    <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest border border-red-500/30 backdrop-blur-md">Inactive</span>
                                                )}
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                                <div className="flex w-full gap-3">
                                                    <button 
                                                        onClick={() => startEdit(promo)}
                                                        className="flex-1 bg-white text-black py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-purple-500 hover:text-white transition-all"
                                                    >
                                                        <Edit3 size={16} /> Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(promo._id!)}
                                                        className="p-3 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/30"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-5 flex items-center justify-between text-xs text-muted-foreground border-t border-white/5">
                                            <div className="flex items-center gap-2">
                                                <Clock size={12} />
                                                <span>Updated {new Date(promo.updatedAt).toLocaleDateString()}</span>
                                            </div>
                                            {promo.redirectUrl && (
                                                <a href={promo.redirectUrl} target="_blank" className="flex items-center gap-1 hover:text-purple-400 transition-colors">
                                                    <LinkIcon size={12} /> Link
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/5">
                                    <div className="p-6 bg-white/5 rounded-full mb-4">
                                        <ImageIcon size={48} className="text-muted-foreground/30" />
                                    </div>
                                    <h3 className="text-xl font-bold text-muted-foreground">No Promo Banners Found</h3>
                                    <p className="text-muted-foreground/60 mb-8 text-center max-w-xs">Create your first high-performance promotional banner to engage your users.</p>
                                    <button 
                                        onClick={startNew}
                                        className="bg-white text-black px-8 py-3 rounded-2xl font-bold hover:bg-purple-500 hover:text-white transition-all"
                                    >
                                        Create First Banner
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function BentoIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white w-6 h-6">
            <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
    );
}
