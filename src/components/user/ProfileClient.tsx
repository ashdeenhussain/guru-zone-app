"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Save, X, Shield, Crosshair, User as UserIcon, FileText, Plus, ImageIcon, Users, Copy, Share2, UserPlus, Crown, CheckCircle2, Trophy } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

interface ProfileUser {
    name: string;
    email: string;
    inGameName: string;
    freeFireUid: string;
    avatarId: number;
    bio: string;
    image?: string;
    squad?: {
        squadName: string;
        members: { name: string; uid: string }[];
    };
    rankHistory?: {
        seasonName: string;
        points: number;
        rankName: string;
        achievedAt: string;
    }[];
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
        image: initialUser.image || "",
        squad: initialUser.squad || { squadName: "", members: [] }
    });
    const [isSquadModalOpen, setIsSquadModalOpen] = useState(false);
    const [squadFormData, setSquadFormData] = useState(initialUser.squad || { squadName: "", members: [] });
    const [copiedSquad, setCopiedSquad] = useState(false);
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
                                src={user.image || selectedAvatar.src}
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

                            <div className="mt-4">
                                <label className="text-muted-foreground text-sm font-medium mb-2 block">Create Custom Avatar</label>
                                <div className="relative w-full p-4 border-2 border-dashed border-border rounded-xl flex items-center justify-center bg-muted/20 group hover:border-primary/50 transition-colors">
                                    <button
                                        disabled
                                        className="flex items-center gap-2 text-muted-foreground font-bold cursor-not-allowed"
                                    >
                                        <div className="p-2 bg-primary/10 rounded-full text-primary">
                                            <ImageIcon size={20} />
                                        </div>
                                        Create Your Avatar
                                    </button>
                                    <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-lg shadow-primary/20">
                                        Coming Soon
                                    </span>
                                </div>
                            </div>
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
                <div className="space-y-6">
                    {/* About Section */}
                    <div className="bg-card backdrop-blur-md border border-border rounded-3xl p-8 text-center md:text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full pointer-events-none" />
                        <h3 className="text-xl font-bold text-foreground mb-4 relative z-10">About</h3>
                        <p className="text-muted-foreground leading-relaxed relative z-10">
                            {user.bio || "No bio set yet. Click 'Edit Profile' to add a one-liner about yourself!"}
                        </p>
                    </div>

                    {/* Rank History Section */}
                    {user.rankHistory && user.rankHistory.length > 0 && (
                        <div className="bg-card backdrop-blur-md border border-border rounded-3xl p-6 md:p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                            
                            <div className="flex items-center gap-3 mb-6 relative z-10 border-b border-border/50 pb-4">
                                <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl border border-purple-500/20">
                                    <Trophy size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">Season Standings</h3>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Historical Rank Achievements</p>
                                </div>
                            </div>

                            <div className="relative z-10 space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {user.rankHistory.map((history, idx) => (
                                    <div 
                                        key={idx} 
                                        className="flex items-center justify-between p-4 bg-muted/10 border border-border/50 rounded-2xl hover:bg-muted/20 hover:border-purple-500/20 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-black italic text-sm">
                                                S{idx + 1}
                                            </div>
                                            <div>
                                                <span className="font-bold text-foreground block text-sm sm:text-base">
                                                    {history.seasonName}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    Achieved on {new Date(history.achievedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className="font-black text-primary text-sm sm:text-base block tracking-tight">
                                                {history.rankName}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-medium">
                                                {history.points} Rank Points
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* My Squad Section */}
                    <div className="bg-card backdrop-blur-md border border-border rounded-3xl p-6 md:p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary/10 text-primary rounded-2xl border border-primary/20">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">My Squad</h3>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Persistent Team Management</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const text = `Squad: ${user.squad?.squadName || "Not Set"}\n${user.squad?.members?.map((m: any) => `${m.name}: ${m.uid}`).join("\n")}`;
                                        navigator.clipboard.writeText(text);
                                        setCopiedSquad(true);
                                        setTimeout(() => setCopiedSquad(false), 2000);
                                    }}
                                    className="p-2.5 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-primary rounded-xl border border-border transition-all flex items-center gap-2 text-xs font-bold"
                                >
                                    {copiedSquad ? <><CheckCircle2 size={16} className="text-emerald-500" /> Copied</> : <><Copy size={16} /> Copy Squad</>}
                                </button>
                                <button
                                    onClick={() => {
                                        setSquadFormData(user.squad || { squadName: "", members: [] });
                                        setIsSquadModalOpen(true);
                                    }}
                                    className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all flex items-center gap-2 text-xs"
                                >
                                    {user.squad?.squadName ? <><Edit2 size={16} /> Edit Squad</> : <><Plus size={16} /> Add Squad</>}
                                </button>
                            </div>
                        </div>

                        {(user.squad?.squadName || (user.squad?.members && user.squad.members.length > 0)) ? (
                            <div className="relative z-10">
                                <div className="mb-6 p-4 bg-muted/30 border border-border/50 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
                                        <span className="text-lg font-black text-foreground uppercase tracking-tight italic">{user.squad.squadName || "Unnamed Squad"}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em]">Verified Squad</span>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Leader (User) */}
                                    <div className="bg-muted/20 border border-primary/20 p-4 rounded-2xl relative group overflow-hidden shadow-sm">
                                        <div className="absolute top-0 right-0 p-1.5 bg-primary/20 text-primary rounded-bl-xl border-l border-b border-primary/10">
                                            <Crown size={12} />
                                        </div>
                                        <div className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Squad Leader</div>
                                        <div className="font-bold text-foreground truncate">{user.inGameName || user.name}</div>
                                        <div className="text-[10px] text-muted-foreground font-medium mt-1 truncate">UID: {user.freeFireUid || "—"}</div>
                                    </div>

                                    {/* Other Members */}
                                    {[0, 1, 2].map((i) => {
                                        const member = user.squad?.members?.[i];
                                        return (
                                            <div key={i} className={`p-4 rounded-2xl border transition-all relative group ${member ? 'bg-muted/20 border-border/50 hover:border-primary/30 shadow-sm' : 'bg-muted/5 border-dashed border-border/40 opacity-50'}`}>
                                                {member ? (
                                                    <>
                                                        <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Member {i + 2}</div>
                                                        <div className="font-bold text-foreground truncate">{member.name}</div>
                                                        <div className="text-[10px] text-muted-foreground font-medium mt-1 truncate">UID: {member.uid}</div>
                                                    </>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center py-2 text-muted-foreground gap-1">
                                                        <UserPlus size={16} className="opacity-30" />
                                                        <span className="text-[8px] font-bold uppercase tracking-widest">Empty Slot</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="relative z-10 py-12 text-center border-2 border-dashed border-border rounded-3xl bg-muted/20">
                                <Users size={48} className="mx-auto mb-4 opacity-10" />
                                <h4 className="text-lg font-bold text-foreground/80">No Squad Found</h4>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                                    Save your teammate's details once and auto-fill them in every tournament.
                                </p>
                                <button
                                    onClick={() => {
                                        setSquadFormData(user.squad || { squadName: "", members: [] });
                                        setIsSquadModalOpen(true);
                                    }}
                                    className="mt-6 px-6 py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 rounded-xl font-bold transition-all inline-flex items-center gap-2"
                                >
                                    <Plus size={18} /> Setup My Squad
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Squad Management Modal */}
            <AnimatePresence>
                {isSquadModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-8 border-b border-border bg-muted/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/20">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground">Squad Management</h2>
                                        <p className="text-xs text-muted-foreground font-medium">Configure your default tournament team</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsSquadModalOpen(false)} className="p-2 text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="space-y-8">
                                    {/* Squad Name */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-primary uppercase tracking-[0.2em] ml-1">Squad Name</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={squadFormData.squadName}
                                                onChange={(e) => setSquadFormData({ ...squadFormData, squadName: e.target.value })}
                                                className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-muted-foreground/40 font-bold"
                                                placeholder="Enter Awesome Squad Name..."
                                            />
                                            <Shield className="absolute right-5 top-4.5 text-muted-foreground/30" size={20} />
                                        </div>
                                    </div>

                                    {/* Members */}
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-primary uppercase tracking-[0.2em] ml-1">Squad Members (Max 3 + You)</label>
                                        
                                        <div className="grid grid-cols-1 gap-4">
                                            {/* Member 1 is the user (read-only info) */}
                                            <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-80">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black">1</div>
                                                    <div>
                                                        <div className="text-[10px] font-black text-primary/60 uppercase tracking-widest">You (Leader)</div>
                                                        <div className="font-bold text-foreground">{user.inGameName || user.name}</div>
                                                    </div>
                                                </div>
                                                <div className="text-xs font-medium text-muted-foreground bg-background/50 px-3 py-1.5 rounded-lg border border-border/50">
                                                    UID: {user.freeFireUid || "Not Set in Profile"}
                                                </div>
                                            </div>

                                            {[0, 1, 2].map((i) => (
                                                <div key={i} className="bg-muted/20 border border-border p-5 rounded-2xl space-y-4 relative group">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-black text-xs">{i + 2}</div>
                                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Teammate {i + 2}</span>
                                                        </div>
                                                        {(squadFormData.members?.[i]?.name || squadFormData.members?.[i]?.uid) && (
                                                            <button 
                                                                onClick={() => {
                                                                    const newMembers = [...(squadFormData.members || [])];
                                                                    newMembers[i] = { name: "", uid: "" };
                                                                    setSquadFormData({ ...squadFormData, members: newMembers });
                                                                }}
                                                                className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                                                title="Clear Member"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <input
                                                                type="text"
                                                                value={squadFormData.members?.[i]?.name || ""}
                                                                onChange={(e) => {
                                                                    const newMembers = [...(squadFormData.members || [])];
                                                                    if (!newMembers[i]) newMembers[i] = { name: "", uid: "" };
                                                                    newMembers[i].name = e.target.value;
                                                                    setSquadFormData({ ...squadFormData, members: newMembers });
                                                                }}
                                                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
                                                                placeholder="Teammate Name"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <input
                                                                type="text"
                                                                value={squadFormData.members?.[i]?.uid || ""}
                                                                onChange={(e) => {
                                                                    const newMembers = [...(squadFormData.members || [])];
                                                                    if (!newMembers[i]) newMembers[i] = { name: "", uid: "" };
                                                                    newMembers[i].uid = e.target.value;
                                                                    setSquadFormData({ ...squadFormData, members: newMembers });
                                                                }}
                                                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
                                                                placeholder="Teammate UID"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-muted/10 border-t border-border flex justify-end gap-4">
                                <button
                                    onClick={() => setIsSquadModalOpen(false)}
                                    className="px-6 py-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        setLoading(true);
                                        // Clean up empty members before saving
                                        const cleanMembers = squadFormData.members?.filter(m => m.name && m.uid) || [];
                                        const cleanSquad = { ...squadFormData, members: cleanMembers };
                                        
                                        try {
                                            const res = await fetch("/api/profile/update", {
                                                method: "PATCH",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ squad: cleanSquad }),
                                            });

                                            if (res.ok) {
                                                setUser({ ...user, squad: cleanSquad });
                                                setFormData({ ...formData, squad: cleanSquad });
                                                setIsSquadModalOpen(false);
                                                router.refresh();
                                            } else {
                                                alert("Failed to update squad");
                                            }
                                        } catch (error) {
                                            console.error("Error updating squad:", error);
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    disabled={loading}
                                    className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={18} /> Save Squad</>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


        </div>
    );
}
