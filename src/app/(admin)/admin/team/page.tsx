"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield,
    UserPlus,
    CheckCircle,
    X,
    Loader2,
    Lock,
    Activity,
    Edit,
    Trash2,
    Eye,
    ChevronDown
} from 'lucide-react';

interface TeamMember {
    _id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
    lastLogin: string;
    image?: string;
}

interface ActivityLog {
    _id: string;
    actionType: string;
    details: string;
    createdAt: string;
}

const PERMISSION_OPTIONS = [
    { id: 'manage_tournaments', label: 'Tournament Manager', description: 'Can create and edit tournaments, set results.' },
    { id: 'manage_finance', label: 'Finance Manager', description: 'Can approve deposits and withdrawals.' },
    { id: 'manage_store', label: 'Store Manager', description: 'Can manage products, orders, and lucky spin.' },
    { id: 'manage_support', label: 'Support Agent', description: 'Can reply to support tickets and view user details.' },
    { id: 'manage_system', label: 'System Admin', description: 'Can manage settings and team members.' },
];

export default function TeamManagementPage() {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modals
    const [isPromoteOpen, setIsPromoteOpen] = useState(false);
    const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
    const [isActivityOpen, setIsActivityOpen] = useState(false);

    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

    // Form States
    const [promoteEmail, setPromoteEmail] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/team');
            const data = await res.json();
            if (res.ok) {
                setTeam(data.team);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchActivity = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/team/${id}/activity`);
            const data = await res.json();
            if (res.ok) {
                setActivityLogs(data.logs);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handlePromote = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: promoteEmail, permissions: selectedPermissions })
            });

            if (res.ok) {
                setIsPromoteOpen(false);
                setPromoteEmail('');
                setSelectedPermissions([]);
                fetchTeam();
            } else {
                const err = await res.json();
                alert(err.error);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdatePermissions = async () => {
        if (!selectedMember) return;
        try {
            const res = await fetch(`/api/admin/team/${selectedMember._id}/permissions`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ permissions: selectedPermissions })
            });

            if (res.ok) {
                setIsPermissionsOpen(false);
                fetchTeam();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const togglePermission = (permId: string) => {
        if (selectedPermissions.includes(permId)) {
            setSelectedPermissions(selectedPermissions.filter(p => p !== permId));
        } else {
            setSelectedPermissions([...selectedPermissions, permId]);
        }
    };

    const openPermissionsModal = (member: TeamMember) => {
        setSelectedMember(member);
        setSelectedPermissions(member.permissions || []);
        setIsPermissionsOpen(true);
    };

    const openActivityModal = async (member: TeamMember) => {
        setSelectedMember(member);
        setIsActivityOpen(true);
        setActivityLogs([]); // clear prev
        await fetchActivity(member._id);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                        Team Management
                    </h1>
                    <p className="text-muted-foreground mt-1">Assign roles, delegate tasks, and track staff performance.</p>
                </div>
                <button
                    onClick={() => { setSelectedPermissions([]); setIsPromoteOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                >
                    <UserPlus className="w-5 h-5" />
                    <span>Add New Staff</span>
                </button>
            </div>

            {/* Team Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                ) : (
                    team.map((member) => (
                        <div key={member._id} className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button onClick={() => openPermissionsModal(member)} className="p-2 bg-muted/50 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground">
                                    <Edit className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-inner">
                                    {member.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-foreground">{member.name}</h3>
                                    <p className="text-sm text-muted-foreground">{member.email}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {member.permissions && member.permissions.length > 0 ? (
                                            member.permissions.slice(0, 3).map(p => (
                                                <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 capitalize">
                                                    {p.replace('manage_', '')}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                                                No Permissions
                                            </span>
                                        )}
                                        {member.permissions && member.permissions.length > 3 && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                +{member.permissions.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-border mt-auto pt-4 flex gap-3">
                                <button
                                    onClick={() => openActivityModal(member)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-muted/30 hover:bg-muted rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Activity className="w-4 h-4 text-cyan-500" />
                                    View Activity
                                </button>
                                <button
                                    onClick={() => openPermissionsModal(member)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Lock className="w-4 h-4" />
                                    Access
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Promote Modal */}
            <Modal isOpen={isPromoteOpen} onClose={() => setIsPromoteOpen(false)} title="Add New Staff Member">
                <form onSubmit={handlePromote} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">User Email Address</label>
                        <input
                            type="email"
                            required
                            placeholder="user@example.com"
                            value={promoteEmail}
                            onChange={(e) => setPromoteEmail(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                        <p className="text-xs text-muted-foreground mt-2">Enter the email of an existing registered user to promote them.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-3">Assign Responsibilities</label>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {PERMISSION_OPTIONS.map((option) => (
                                <div
                                    key={option.id}
                                    onClick={() => togglePermission(option.id)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${selectedPermissions.includes(option.id)
                                            ? 'bg-indigo-500/10 border-indigo-500/50'
                                            : 'bg-card border-border hover:bg-muted'
                                        }`}
                                >
                                    <div className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedPermissions.includes(option.id) ? 'bg-indigo-500 border-indigo-500' : 'border-muted-foreground'
                                        }`}>
                                        {selectedPermissions.includes(option.id) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-bold ${selectedPermissions.includes(option.id) ? 'text-indigo-400' : 'text-foreground'}`}>
                                            {option.label}
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsPromoteOpen(false)} className="px-5 py-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 font-medium">Add Member</button>
                    </div>
                </form>
            </Modal>

            {/* Permissions Modal */}
            <Modal isOpen={isPermissionsOpen} onClose={() => setIsPermissionsOpen(false)} title={`Manage Access: ${selectedMember?.name}`}>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-3">Update Responsibilities</label>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {PERMISSION_OPTIONS.map((option) => (
                                <div
                                    key={option.id}
                                    onClick={() => togglePermission(option.id)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${selectedPermissions.includes(option.id)
                                            ? 'bg-indigo-500/10 border-indigo-500/50'
                                            : 'bg-card border-border hover:bg-muted'
                                        }`}
                                >
                                    <div className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedPermissions.includes(option.id) ? 'bg-indigo-500 border-indigo-500' : 'border-muted-foreground'
                                        }`}>
                                        {selectedPermissions.includes(option.id) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-bold ${selectedPermissions.includes(option.id) ? 'text-indigo-400' : 'text-foreground'}`}>
                                            {option.label}
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsPermissionsOpen(false)} className="px-5 py-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                        <button onClick={handleUpdatePermissions} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 font-medium">Save Changes</button>
                    </div>
                </div>
            </Modal>

            {/* Activity Modal */}
            <Modal isOpen={isActivityOpen} onClose={() => setIsActivityOpen(false)} title={`Activity Log: ${selectedMember?.name}`}>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {activityLogs.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No activity recorded yet.</p>
                    ) : (
                        activityLogs.map((log) => (
                            <div key={log._id} className="p-4 rounded-xl bg-card border border-border">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold px-2 py-1 rounded bg-muted text-foreground uppercase tracking-wider">
                                        {log.actionType.replace('_', ' ')}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-sm text-foreground">{log.details}</p>
                            </div>
                        ))
                    )}
                </div>
                <div className="flex justify-end pt-4">
                    <button type="button" onClick={() => setIsActivityOpen(false)} className="px-5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors">Close</button>
                </div>
            </Modal>
        </div>
    );
}

// Simple Modal Wrapper
function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 m-auto max-w-lg h-fit bg-background border border-border rounded-2xl z-[70] p-0 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                    >
                        <div className="p-5 border-b border-border flex justify-between items-center bg-card">
                            <h2 className="text-lg font-bold text-foreground">{title}</h2>
                            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
