"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Lock,
    Bell,
    Shield,
    LogOut,
    ChevronRight,
    Smartphone,
    Mail,
    HelpCircle,
    FileText,
    Trash2,
    X,
    Loader2,
    CheckCircle,
    AlertCircle,
    AlertTriangle,
    Settings
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState({
        email: true,
        tournaments: true,
    });

    // Loading State for Notifications
    const [loadingNotifications, setLoadingNotifications] = useState(true);

    // Password Change State
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [passwordStatus, setPasswordStatus] = useState<{
        loading: boolean;
        error: string | null;
        success: string | null;
    }>({
        loading: false,
        error: null,
        success: null
    });

    // Delete Account State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteStatus, setDeleteStatus] = useState<{
        loading: boolean;
        error: string | null;
    }>({
        loading: false,
        error: null
    });

    // Fetch Notification Settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings/notifications');
                if (res.ok) {
                    const data = await res.json();
                    if (data.notifications) {
                        setNotifications(data.notifications);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch notification settings");
            } finally {
                setLoadingNotifications(false);
            }
        };

        fetchSettings();
    }, []);

    const toggleNotification = async (key: keyof typeof notifications) => {
        const newState = { ...notifications, [key]: !notifications[key] };
        setNotifications(newState); // Optimistic update

        try {
            await fetch('/api/settings/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newState)
            });
        } catch (error) {
            console.error("Failed to update notification settings");
            // Revert on error if needed, but for now we keep it simple
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordStatus({ loading: true, error: null, success: null });

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordStatus({ loading: false, error: "New passwords do not match", success: null });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordStatus({ loading: false, error: "Password must be at least 6 characters", success: null });
            return;
        }

        try {
            const res = await fetch("/api/auth/change-password", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to update password");
            }

            setPasswordStatus({ loading: false, error: null, success: "Password updated successfully!" });
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });

            // Close modal after delay
            setTimeout(() => {
                setIsPasswordModalOpen(false);
                setPasswordStatus(prev => ({ ...prev, success: null }));
            }, 2000);

        } catch (error: any) {
            setPasswordStatus({ loading: false, error: error.message, success: null });
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteStatus({ loading: true, error: null });
        try {
            const res = await fetch("/api/auth/delete-account", {
                method: "DELETE"
            });

            if (res.ok) {
                // Determine if we should redirect or sign out immediately.
                // Usually sign out handles the redirect.
                await signOut({ callbackUrl: '/' });
            } else {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete account");
            }
        } catch (error: any) {
            setDeleteStatus({ loading: false, error: error.message });
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <div className="space-y-8 pb-24 lg:pb-8">
            {/* Minimal Header */}
            <div className="pt-2 pb-3 px-4 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
                        <Settings className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-foreground leading-none">
                            Settings
                        </h1>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                            Preferences & Security
                        </p>
                    </div>
                </div>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-6 max-w-4xl mx-auto p-4 md:p-6"
            >
                {/* Account Security Section */}
                <motion.div variants={itemVariants} className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Shield className="text-yellow-500" size={24} /> Security
                    </h2>
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <button
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                                    <Lock size={20} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-foreground font-semibold">Change Password</h3>
                                    <p className="text-sm text-muted-foreground">Update your password to keep your account secure</p>
                                </div>
                            </div>
                            <ChevronRight className="text-muted-foreground group-hover:text-foreground transition-colors" />
                        </button>

                        <div className="h-[1px] bg-border mx-4" />

                        <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                                    <Smartphone size={20} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-foreground font-semibold">Two-Factor Authentication</h3>
                                    <p className="text-sm text-muted-foreground">Add an extra layer of security (Coming Soon)</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold px-2 py-1 rounded bg-muted text-muted-foreground">SOON</span>
                        </button>
                    </div>
                </motion.div>

                {/* Notifications Section */}
                <motion.div variants={itemVariants} className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Bell className="text-yellow-500" size={24} /> Notifications
                    </h2>
                    <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                        {loadingNotifications ? (
                            <div className="text-center text-muted-foreground py-4">Loading preferences...</div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                                            <Mail size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-foreground font-semibold">Email Notifications</h3>
                                            <p className="text-sm text-muted-foreground">Receive updates about your account</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleNotification('email')}
                                        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${notifications.email ? 'bg-green-500' : 'bg-input'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${notifications.email ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="h-[1px] bg-border" />

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400">
                                            <Bell size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-foreground font-semibold">Tournament Alerts</h3>
                                            <p className="text-sm text-muted-foreground"> get notified when tournaments start</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleNotification('tournaments')}
                                        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${notifications.tournaments ? 'bg-green-500' : 'bg-input'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${notifications.tournaments ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>

                {/* Support & Legal */}
                <motion.div variants={itemVariants} className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <HelpCircle className="text-yellow-500" size={24} /> Support & Legal
                    </h2>
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <Link href="/terms" className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <FileText size={20} className="text-muted-foreground" />
                                <span className="text-foreground font-medium">Terms of Service</span>
                            </div>
                            <ChevronRight className="text-muted-foreground group-hover:text-foreground transition-colors" />
                        </Link>
                        <div className="h-[1px] bg-border mx-4" />
                        <Link href="/privacy" className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <Shield size={20} className="text-muted-foreground" />
                                <span className="text-foreground font-medium">Privacy Policy</span>
                            </div>
                            <ChevronRight className="text-muted-foreground group-hover:text-foreground transition-colors" />
                        </Link>
                    </div>
                </motion.div>

                {/* Danger Zone */}
                <motion.div variants={itemVariants} className="pt-4">
                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl overflow-hidden">
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="w-full flex items-center justify-between p-4 hover:bg-red-500/10 transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                                    <LogOut size={20} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-foreground font-semibold">Log Out</h3>
                                    <p className="text-sm text-muted-foreground">Sign out of your account on this device</p>
                                </div>
                            </div>
                        </button>
                        <div className="h-[1px] bg-red-500/20 mx-4" />
                        <button
                            className="w-full flex items-center justify-between p-4 hover:bg-red-500/10 transition-colors group cursor-not-allowed opacity-60"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                                    <Trash2 size={20} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-red-500 font-semibold">Delete Account</h3>
                                    <p className="text-sm text-red-400/70">Permanently delete your account and data</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold px-2 py-1 rounded bg-red-500/20 text-red-400">SOON</span>
                        </button>
                    </div>
                </motion.div>

                <div className="text-center text-muted-foreground text-sm mt-4">
                    Guru Zone v1.0.0
                </div>

            </motion.div>

            {/* Password Change Modal */}
            <AnimatePresence>
                {isPasswordModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-card border border-border rounded-3xl w-full max-w-md p-6 md:p-8 space-y-6 relative shadow-2xl"
                        >
                            <button
                                onClick={() => setIsPasswordModalOpen(false)}
                                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold text-foreground">Change Password</h2>
                                <p className="text-muted-foreground">Enter your current password and a new one.</p>
                            </div>

                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground ml-1">Current Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all placeholder-muted-foreground"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground ml-1">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all placeholder-muted-foreground"
                                        placeholder="Min 6 characters"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground ml-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all placeholder-muted-foreground"
                                        placeholder="Re-enter new password"
                                    />
                                </div>

                                {/* Status Messages */}
                                {passwordStatus.error && (
                                    <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg text-sm">
                                        <AlertCircle size={16} /> {passwordStatus.error}
                                    </div>
                                )}

                                {passwordStatus.success && (
                                    <div className="flex items-center gap-2 text-green-400 bg-green-400/10 p-3 rounded-lg text-sm">
                                        <CheckCircle size={16} /> {passwordStatus.success}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={passwordStatus.loading}
                                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {passwordStatus.loading ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" /> Saving...
                                        </>
                                    ) : (
                                        "Update Password"
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Account Modal */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-card border border-red-500/30 rounded-3xl w-full max-w-md p-6 md:p-8 space-y-6 relative shadow-2xl shadow-red-900/20"
                        >
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="p-4 rounded-full bg-red-500/10 text-red-500">
                                    <AlertTriangle size={48} />
                                </div>
                                <h2 className="text-2xl font-bold text-foreground">Delete Account?</h2>
                                <p className="text-muted-foreground">
                                    This action is <span className="text-red-400 font-bold">irreversible</span>. All your data, tournament history, and wallet balance will be permanently erased.
                                </p>
                            </div>

                            {deleteStatus.error && (
                                <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg text-sm">
                                    <AlertCircle size={16} /> {deleteStatus.error}
                                </div>
                            )}

                            <div className="flex gap-4 pt-2">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-bold py-3 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteStatus.loading}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                                >
                                    {deleteStatus.loading ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" /> Deleting...
                                        </>
                                    ) : (
                                        "Delete Permanently"
                                    )}
                                </button>
                            </div>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
