'use client';

import { useState, useEffect } from 'react';
import {
    Upload, X, Image as ImageIcon, Search, Trash2, Check, Loader2, Folder, FolderPlus, ChevronRight, Home
} from 'lucide-react';
import Image from 'next/image';

interface Media {
    _id: string;
    url?: string;
    fileName: string;
    mimeType?: string;
    createdAt: string;
    size?: number;
    type: 'image' | 'video' | 'folder';
    parent?: string;
    isTrashed?: boolean;
    trashedAt?: string;
}

interface FolderBreadcrumb {
    id: string | null;
    name: string;
}

interface MediaLibraryProps {
    onSelect?: (url: string) => void;
    selectionMode?: boolean; // If true, shows selection UI. If false, just management.
    enableUpload?: boolean;
    className?: string;
}

export default function MediaLibrary({
    onSelect,
    selectionMode = false,
    enableUpload = true,
    className = ""
}: MediaLibraryProps) {
    const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'trash'>('library');
    const [mediaList, setMediaList] = useState<Media[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Folder State
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<FolderBreadcrumb[]>([{ id: null, name: 'Home' }]);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Fetch on mount and when folder/tab changes
    useEffect(() => {
        fetchMedia();
    }, [activeTab, currentFolderId]);

    const fetchMedia = async () => {
        setLoading(true);
        try {
            let url = '/api/admin/media';
            if (activeTab === 'trash') {
                url += '?view=trash';
            } else if (activeTab === 'library') {
                const query = currentFolderId ? `?parentId=${currentFolderId}` : '';
                url += query;
            } else {
                setMediaList([]); // Upload tab doesn't need fetch, clear list
                setLoading(false);
                return;
            }

            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setMediaList(data.media);
            }
        } catch (error) {
            console.error('Failed to fetch media:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            const res = await fetch('/api/admin/media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newFolderName,
                    parent: currentFolderId
                })
            });
            const data = await res.json();
            if (data.success) {
                setMediaList(prev => [data.media, ...prev]);
                setIsCreatingFolder(false);
                setNewFolderName('');
            } else {
                alert(data.error || 'Failed to create folder');
            }
        } catch (error) {
            console.error('Create folder error:', error);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (file.size > 5 * 1024 * 1024) {
            alert('File too large (Max 5MB)');
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
            alert('Invalid file format. Only JPG, PNG, GIF, and WebP are allowed.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        if (currentFolderId) {
            formData.append('parentId', currentFolderId);
        }

        try {
            const res = await fetch('/api/admin/media', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                setMediaList(prev => [data.media, ...prev]);
                setActiveTab('library');
                if (selectionMode) setSelectedId(data.media._id);
            } else {
                alert(data.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Something went wrong during upload');
        } finally {
            setUploading(false);
        }
    };

    const handleRestore = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/api/admin/media/${id}/restore`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setMediaList(prev => prev.filter(m => m._id !== id));
            } else {
                alert(data.error || 'Restore failed');
            }
        } catch (error) {
            console.error('Restore error:', error);
        }
    };

    const handleForceDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('PERMANENTLY DELETE? This cannot be undone.')) return;

        try {
            const res = await fetch(`/api/admin/media/${id}/force`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setMediaList(prev => prev.filter(m => m._id !== id));
            } else {
                alert(data.error || 'Delete failed');
            }
        } catch (error) {
            console.error('Force delete error:', error);
        }
    };

    // Original handleDelete (Soft Delete)
    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        // if (!confirm('Move to trash?')) return; // Optional confirmation for soft delete

        try {
            const res = await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setMediaList(prev => prev.filter(m => m._id !== id));
                if (selectedId === id) setSelectedId(null);
            } else {
                alert(data.error || 'Move to trash failed');
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleFolderClick = (folder: Media) => {
        setCurrentFolderId(folder._id);
        setBreadcrumbs(prev => [...prev, { id: folder._id, name: folder.fileName }]);
        setSelectedId(null); // Deselect when changing folder
        setSearchTerm(''); // Clear search
    };

    const handleBreadcrumbClick = (index: number) => {
        const target = breadcrumbs[index];
        setCurrentFolderId(target.id);
        setBreadcrumbs(prev => prev.slice(0, index + 1));
    };

    const filteredMedia = mediaList.filter(m =>
        m.fileName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCardClick = (media: Media) => {
        if (activeTab === 'trash') return; // Cannot select or double click in trash

        if (media.type === 'folder') {
            handleFolderClick(media);
            return;
        }

        if (selectionMode) {
            setSelectedId(media._id);
        } else {
            setSelectedId(media._id === selectedId ? null : media._id);
        }
    };

    const formatBytes = (bytes: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Helper for trash countdown
    const getDaysLeft = (trashedAt?: string) => {
        if (!trashedAt) return 30;
        const deletedDate = new Date(trashedAt);
        const autoDeleteDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const diffTime = autoDeleteDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    return (
        <div className={`flex flex-col h-full bg-background ${className}`}>
            {/* Top Bar: Tabs, Breadcrumbs, Actions */}
            <div className="p-4 border-b border-border bg-background flex flex-col gap-4">

                {/* 1. Controls Row */}
                <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                    <div className="flex bg-muted p-1 rounded-lg self-start">
                        <button
                            onClick={() => { setActiveTab('library'); setCurrentFolderId(null); setBreadcrumbs([{ id: null, name: 'Home' }]); setSelectedId(null); setSearchTerm(''); }}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'library' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Library
                        </button>
                        {enableUpload && (
                            <button
                                onClick={() => setActiveTab('upload')}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'upload' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Upload New
                            </button>
                        )}
                        <button
                            onClick={() => { setActiveTab('trash'); setCurrentFolderId(null); setBreadcrumbs([{ id: null, name: 'Home' }]); setSelectedId(null); setSearchTerm(''); }}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'trash' ? 'bg-red-500/10 text-red-500 shadow' : 'text-muted-foreground hover:text-red-500'}`}
                        >
                            <Trash2 size={16} /> Trash
                        </button>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        {activeTab === 'library' && (
                            <>
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search current folder..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-transparent focus:border-primary/50 rounded-lg text-sm outline-none transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => setIsCreatingFolder(true)}
                                    className="p-2 bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                                    title="New Folder"
                                >
                                    <FolderPlus size={20} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* 2. Breadcrumbs Row */}
                {activeTab === 'library' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto pb-2">
                        {breadcrumbs.map((crumb, index) => (
                            <div key={crumb.id || 'root'} className="flex items-center">
                                {index > 0 && <ChevronRight size={14} className="mx-1" />}
                                <button
                                    onClick={() => handleBreadcrumbClick(index)}
                                    className={`hover:text-primary flex items-center gap-1 whitespace-nowrap ${index === breadcrumbs.length - 1 ? 'font-bold text-foreground' : ''}`}
                                >
                                    {index === 0 && <Home size={14} />}
                                    {crumb.name}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* 3. New Folder Input */}
                {isCreatingFolder && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <Folder size={20} className="text-yellow-500" />
                        <input
                            autoFocus
                            type="text"
                            className="bg-muted border border-border rounded px-2 py-1 text-sm outline-none focus:border-primary"
                            placeholder="Folder Name"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                        />
                        <button onClick={handleCreateFolder} className="text-xs bg-primary text-white px-3 py-1.5 rounded font-bold">Create</button>
                        <button onClick={() => setIsCreatingFolder(false)} className="text-xs bg-muted hover:bg-muted/80 px-2 py-1.5 rounded"><X size={14} /></button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
                {activeTab === 'library' ? (
                    loading ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : filteredMedia.length === 0 ? (
                        <div className="flex flex-col h-full items-center justify-center text-muted-foreground opacity-50">
                            <Folder size={48} className="mb-4 text-muted-foreground/30" />
                            <p>Empty folder.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {filteredMedia.map((media) => (
                                <div
                                    key={media._id}
                                    onDoubleClick={() => handleCardClick(media)}
                                    onClick={() => media.type !== 'folder' && handleCardClick(media)}
                                    className={`group relative aspect-square bg-muted rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${selectedId === media._id
                                        ? 'border-primary shadow-lg scale-95'
                                        : 'border-transparent hover:border-primary/50'
                                        }`}
                                >
                                    {media.type === 'folder' ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-yellow-500/10 text-yellow-500">
                                            <Folder size={48} fill="currentColor" className="opacity-80" />
                                            <span className="text-xs font-bold mt-2 px-2 text-center text-foreground truncate w-full">{media.fileName}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Image
                                                src={media.url || ''}
                                                alt={media.fileName}
                                                fill
                                                className="object-cover"
                                            />
                                            {selectedId === media._id && (
                                                <div className="absolute top-2 left-2 p-1 bg-primary text-white rounded-full shadow-lg z-10">
                                                    <Check size={12} strokeWidth={4} />
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Overlay Info (Common) */}
                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-2 transform translate-y-full group-hover:translate-y-0 transition-transform flex items-center justify-between">
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] text-white truncate font-bold">{media.fileName}</p>
                                            {media.size && <p className="text-[9px] text-white/70">{formatBytes(media.size)}</p>}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {activeTab === ('trash' as any) ? (
                                        <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleRestore(media._id, e)}
                                                className="p-1.5 bg-green-500/80 text-white rounded-lg hover:bg-green-600 transition-colors"
                                                title="Restore"
                                            >
                                                <Check size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => handleForceDelete(media._id, e)}
                                                className="p-1.5 bg-red-500/80 text-white rounded-lg hover:bg-red-600 transition-colors"
                                                title="Delete Permanently"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => handleDelete(media._id, e)}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all z-10"
                                            title="Move to Trash"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <div className="h-full flex flex-col items-center justify-center">
                        <label className="w-full max-w-lg aspect-video border-3 border-dashed border-muted-foreground/30 hover:border-primary/50 bg-muted/20 hover:bg-muted/30 rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all group">
                            {uploading ? (
                                <div className="text-center space-y-4">
                                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                                    <p className="font-bold text-muted-foreground">Uploading to {breadcrumbs[breadcrumbs.length - 1].name}...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 bg-background rounded-full mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                        <Upload className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">Click to Upload</h3>
                                    <p className="text-sm text-muted-foreground mt-2">SVG, PNG, JPG or GIF (Max 5MB)</p>
                                    <p className="text-xs text-primary mt-4 font-medium">Destination: {breadcrumbs.map(b => b.name).join(' > ')}</p>
                                </>
                            )}
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleUpload}
                                disabled={uploading}
                            />
                        </label>
                    </div>
                )}
            </div>

            {/* Footer Only in Selection Mode */}
            {selectionMode && onSelect && (
                <div className="p-4 border-t border-border bg-background flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                        {selectedId ? '1 item selected' : 'No item selected'}
                    </div>
                    <button
                        onClick={() => {
                            if (selectedId) {
                                const selected = mediaList.find(m => m._id === selectedId);
                                if (selected && selected.url) onSelect(selected.url);
                            }
                        }}
                        disabled={!selectedId}
                        className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-bold shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Select
                    </button>
                </div>
            )}
        </div>
    );
}
