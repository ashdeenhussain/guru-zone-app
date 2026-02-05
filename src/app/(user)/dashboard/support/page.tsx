"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Plus, ArrowLeft, Loader2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import PageHeader from "@/components/PageHeader";

type Ticket = {
    _id: string;
    subject: string;
    category: string;
    priority: string;
    message: string;
    status: string;
    createdAt: string;
    adminReply?: string;
};

export default function SupportPage() {
    const [view, setView] = useState<"list" | "create">("list");
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        subject: "",
        category: "Payment Issues", // Default
        priority: "Medium", // Default
        message: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // State for Custom Dropdowns
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isPriorityOpen, setIsPriorityOpen] = useState(false);

    const categories = [
        "Payment Issues",
        "Tournament Issues",
        "Technical Support",
        "Account Issues",
        "Other"
    ];

    const priorities = [
        "Low",
        "Medium",
        "High",
        "Urgent"
    ];

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await fetch("/api/support");
            if (res.ok) {
                const data = await res.json();
                setTickets(data);
            }
        } catch (err) {
            console.error("Failed to fetch tickets", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                throw new Error("Failed to create ticket");
            }

            await fetchTickets();
            setView("list");
            setFormData({
                subject: "",
                category: "Payment Issues",
                priority: "Medium",
                message: "",
            });
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Open": return "bg-green-500/20 text-green-400 border-green-500/30";
            case "In Progress": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
            case "Closed": return "bg-gray-500/20 text-gray-400 border-gray-500/30";
            default: return "bg-gray-500/20 text-gray-400";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "Urgent": return "text-red-400";
            case "High": return "text-orange-400";
            case "Medium": return "text-yellow-400";
            case "Low": return "text-green-400";
            default: return "text-gray-400";
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="p-4 pt-16 lg:pt-4 max-w-4xl mx-auto min-h-screen">
            <AnimatePresence mode="wait">
                {view === "list" ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Page Title Header */}
                        <PageHeader
                            title="Support"
                            description="Help & Tickets"
                            icon={MessageCircle}
                            className="-mx-4 lg:mx-0 lg:rounded-xl"
                        />

                        {tickets.length > 0 && (
                            <button
                                onClick={() => setView("create")}
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,215,0,0.2)]"
                            >
                                <Plus size={20} />
                                <span>New Request</span>
                            </button>
                        )}


                        {/* Empty State */}
                        {tickets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-3xl border border-border mt-8 text-center">
                                <div className="p-6 bg-muted/20 rounded-full mb-6 relative">
                                    <MessageCircle size={64} className="text-muted-foreground" />
                                    <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-2">No support requests yet</h3>
                                <p className="text-muted-foreground mb-8 max-w-sm">
                                    Facing an issue? Create a ticket and our team will help you resolve it quickly.
                                </p>
                                <button
                                    onClick={() => setView("create")}
                                    className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,215,0,0.2)]"
                                >
                                    Start Your First Request
                                </button>
                            </div>
                        ) : (
                            /* Ticket List */
                            <div className="grid gap-4">
                                {tickets.map((ticket) => (
                                    <motion.div
                                        key={ticket._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-5 bg-card rounded-2xl border border-border hover:border-primary/50 transition-colors group"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                                                    {ticket.status}
                                                </span>
                                                <span className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.priority} Priority
                                                </span>
                                            </div>
                                            <span className="text-sm text-muted-foreground">
                                                {format(new Date(ticket.createdAt), "MMM d, yyyy • h:mm a")}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-card-foreground mb-2 group-hover:text-primary transition-colors">
                                            {ticket.subject}
                                        </h3>
                                        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                                            {ticket.message}
                                        </p>

                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                                {ticket.category}
                                            </span>
                                            {ticket.adminReply && (
                                                <span className="flex items-center gap-1.5 text-xs text-green-400">
                                                    <MessageCircle size={12} />
                                                    Admin Replied
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    /* Create Form */
                    <motion.div
                        key="create"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-xl mx-auto"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <button
                                onClick={() => setView("list")}
                                className="p-2 hover:bg-muted/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <h2 className="text-2xl font-bold text-primary">Create New Support Request</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-3xl border border-border">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm text-muted-foreground ml-1">Subject <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Brief description of your issue"
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Custom Category Dropdown */}
                                <div className="space-y-2 relative">
                                    <label className="text-sm text-muted-foreground ml-1">Category <span className="text-red-400">*</span></label>
                                    <div
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground cursor-pointer hover:border-primary/30 transition-colors flex justify-between items-center"
                                        onClick={() => { setIsCategoryOpen(!isCategoryOpen); setIsPriorityOpen(false); }}
                                    >
                                        <span>{formData.category}</span>
                                        <motion.span animate={{ rotate: isCategoryOpen ? 180 : 0 }}>▼</motion.span>
                                    </div>

                                    <AnimatePresence>
                                        {isCategoryOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute top-full left-0 w-full z-10 mt-2 bg-card border border-border rounded-xl overflow-hidden shadow-xl"
                                            >
                                                {categories.map((cat) => (
                                                    <div
                                                        key={cat}
                                                        onClick={() => {
                                                            setFormData({ ...formData, category: cat });
                                                            setIsCategoryOpen(false);
                                                        }}
                                                        className={`px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${formData.category === cat ? "text-primary bg-muted/50" : "text-muted-foreground"}`}
                                                    >
                                                        {cat}
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Custom Priority Dropdown */}
                                <div className="space-y-2 relative">
                                    <label className="text-sm text-muted-foreground ml-1">Priority</label>
                                    <div
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground cursor-pointer hover:border-primary/30 transition-colors flex justify-between items-center"
                                        onClick={() => { setIsPriorityOpen(!isPriorityOpen); setIsCategoryOpen(false); }}
                                    >
                                        <span>{formData.priority}</span>
                                        <motion.span animate={{ rotate: isPriorityOpen ? 180 : 0 }}>▼</motion.span>
                                    </div>

                                    <AnimatePresence>
                                        {isPriorityOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute top-full left-0 w-full z-10 mt-2 bg-card border border-border rounded-xl overflow-hidden shadow-xl"
                                            >
                                                {priorities.map((prio) => (
                                                    <div
                                                        key={prio}
                                                        onClick={() => {
                                                            setFormData({ ...formData, priority: prio });
                                                            setIsPriorityOpen(false);
                                                        }}
                                                        className={`px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${formData.priority === prio ? "text-primary bg-muted/50" : "text-muted-foreground"}`}
                                                    >
                                                        {prio}
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-muted-foreground ml-1">Message <span className="text-red-400">*</span></label>
                                <textarea
                                    required
                                    rows={5}
                                    placeholder="Describe your issue in detail..."
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors resize-none"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setView("list")}
                                    className="flex-1 py-3.5 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-[2] py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,215,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                >
                                    {submitting ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        "Create Request"
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
