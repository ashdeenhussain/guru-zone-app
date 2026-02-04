"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Save, X, Shield, Crosshair, User as UserIcon, FileText, Plus } from "lucide-react";

interface ProfileUser {
    name: string;
    email: string;
    inGameName: string;
    freeFireUid: string;
    avatarId: number;
    bio: string;
}

import { AVATARS } from "@/lib/avatars";

export default function ProfileClient({ initialUser }: { initialUser: ProfileUser }) {
    const [isEditing, setIsEditing] = useState(false);
    const [showFeatureAlert, setShowFeatureAlert] = useState(false);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(initialUser);
    const [formData, setFormData] = useState({
        inGameName: initialUser.inGameName || "",
        freeFireUid: initialUser.freeFireUid || "",
        avatarId: initialUser.avatarId || 1,
        bio: initialUser.bio || "",
    });
    const router = useRouter();

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/profile/update", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const data = await res.json();
                setUser({ ...user, ...formData }); // Optimistic update or use returned data
                setIsEditing(false);
                router.refresh();
                router.push('/dashboard'); // Redirect to dashboard after save
            } else {
                alert("Failed to update profile");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const selectedAvatar = AVATARS.find((a) => a.id === (isEditing ? formData.avatarId : user.avatarId)) || AVATARS[0];

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 p-4">
            {/* Header Card */}
            <div className="relative overflow-hidden rounded-3xl bg-card backdrop-blur-3xl border border-border shadow-2xl">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -ml-32 -mb-32 pointer-events-none" />

                <div className="relative z-10 p-8 flex flex-col md:flex-row items-center gap-8">
                    {/* Avatar Display */}
                    <div className="relative group">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-primary/50 shadow-[0_0_50px_rgba(234,179,8,0.2)] overflow-hidden bg-muted/50 relative backdrop-blur-sm">
                            <Image
                                src={selectedAvatar.src}
                                alt={selectedAvatar.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                        {isEditing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                                <span className="text-white text-sm font-bold">Change</span>
                            </div>
                        )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <h1 className="text-3xl font-bold text-foreground tracking-tight drop-shadow-sm">{user.name}</h1>
                        <p className="text-muted-foreground font-medium">{user.email}</p>

                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                            {user.inGameName && (
                                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-semibold border border-blue-500/20 flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.1)] backdrop-blur-sm">
                                    <Crosshair size={14} /> {user.inGameName}
                                </span>
                            )}
                            {user.freeFireUid && (
                                <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm font-semibold border border-purple-500/20 flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.1)] backdrop-blur-sm">
                                    <Shield size={14} /> UID: {user.freeFireUid}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Edit Toggle */}
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${isEditing
                            ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/50 backdrop-blur-sm"
                            : "bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:scale-105 shadow-lg shadow-primary/20"
                            }`}
                    >
                        {isEditing ? <><X size={18} /> Cancel</> : <><Edit2 size={18} /> Edit Profile</>}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-card backdrop-blur-3xl border border-border rounded-3xl p-6 md:p-8 space-y-8 shadow-xl"
                    >
                        {/* Avatar Selection */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <UserIcon className="text-primary" /> Choose Avatar
                            </h3>
                            <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
                                {AVATARS.map((avatar) => (
                                    <button
                                        key={avatar.id}
                                        onClick={() => setFormData({ ...formData, avatarId: avatar.id })}
                                        className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all duration-300 group ${formData.avatarId === avatar.id
                                            ? "border-primary shadow-[0_0_20px_rgba(234,179,8,0.5)] scale-110 ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
                                            : "border-border hover:border-primary/50 hover:scale-105"
                                            }`}
                                    >
                                        <Image
                                            src={avatar.src}
                                            alt={avatar.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowFeatureAlert(true);
                                    setTimeout(() => setShowFeatureAlert(false), 3000);
                                }}
                                className="w-full mt-4 py-4 border-2 border-dashed border-border hover:border-primary/50 rounded-2xl flex items-center justify-center gap-3 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300 group"
                            >
                                <div className="p-2 rounded-full bg-secondary/50 group-hover:bg-primary/10 transition-colors">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <span className="font-semibold">Create Custom Avatar</span>
                            </button>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-muted-foreground text-sm font-medium ml-1">Free Fire IGN (In-Game Name)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.inGameName}
                                        onChange={(e) => setFormData({ ...formData, inGameName: e.target.value })}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder-muted-foreground backdrop-blur-sm"
                                        placeholder="e.g. PRO_GAMER"
                                    />
                                    <Crosshair className="absolute right-4 top-3.5 text-muted-foreground" size={18} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-muted-foreground text-sm font-medium ml-1">Free Fire UID</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.freeFireUid}
                                        onChange={(e) => setFormData({ ...formData, freeFireUid: e.target.value })}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder-muted-foreground backdrop-blur-sm"
                                        placeholder="e.g. 123456789"
                                    />
                                    <Shield className="absolute right-4 top-3.5 text-muted-foreground" size={18} />
                                </div>
                            </div>

                            <div className="span-full md:col-span-2 space-y-2">
                                <label className="text-muted-foreground text-sm font-medium ml-1">Bio / Slogan</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder-muted-foreground backdrop-blur-sm"
                                        placeholder="e.g. Born to Win!"
                                        maxLength={100}
                                    />
                                    <FileText className="absolute right-4 top-3.5 text-muted-foreground" size={18} />
                                </div>
                                <p className="text-xs text-right text-muted-foreground">{formData.bio.length}/100</p>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-4">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Saving..." : <><Save size={20} /> Save Changes</>}
                            </button>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>

            {!isEditing && (
                <div className="bg-card backdrop-blur-md border border-border rounded-3xl p-8 text-center md:text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full pointer-events-none" />
                    <h3 className="text-xl font-bold text-foreground mb-4 relative z-10">About</h3>
                    <p className="text-muted-foreground leading-relaxed relative z-10">
                        {user.bio || "No bio set yet. Click 'Edit Profile' to add a one-liner about yourself!"}
                    </p>
                </div>
            )}

            {/* Custom "Coming Soon" Toast */}
            <AnimatePresence>
                {showFeatureAlert && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: 20 }}
                        className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50"
                    >
                        <div className="bg-[#1a1f3c] border border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.3)] text-white px-6 py-4 rounded-2xl flex items-center gap-4 backdrop-blur-xl">
                            <div className="bg-yellow-500/20 p-2 rounded-full">
                                <Shield className="text-yellow-500 w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-yellow-500">Feature Locked</h4>
                                <p className="text-sm text-gray-300">Avatar Creator is coming soon!</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
