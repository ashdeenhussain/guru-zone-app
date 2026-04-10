"use client";

import { useState, useEffect } from "react";
import { 
    Save, 
    Plus, 
    Trash2, 
    ChevronRight, 
    AlertCircle, 
    Globe, 
    Layout, 
    ShieldCheck, 
    HelpCircle, 
    Share2,
    Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function AdminLandingPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("hero");
    const [content, setContent] = useState<any>(null);

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const res = await fetch("/api/admin/landing-page");
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setContent(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load content");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/landing-page", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(content),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            toast.success("Landing page updated successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update landing page");
        } finally {
            setIsSaving(false);
        }
    };

    const updateNestedField = (section: string, field: string, value: any) => {
        setContent((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const updateSocialField = (field: string, value: any) => {
        setContent((prev: any) => ({
            ...prev,
            socialLinks: {
                ...prev.socialLinks,
                [field]: value
            }
        }));
    };

    const addFaq = () => {
        setContent((prev: any) => ({
            ...prev,
            faqs: [...prev.faqs, { question: "", answer: "", isActive: true }]
        }));
    };

    const updateFaq = (index: number, field: string, value: any) => {
        const newFaqs = [...content.faqs];
        newFaqs[index] = { ...newFaqs[index], [field]: value };
        setContent((prev: any) => ({ ...prev, faqs: newFaqs }));
    };

    const deleteFaq = (index: number) => {
        const newFaqs = content.faqs.filter((_: any, i: number) => i !== index);
        setContent((prev: any) => ({ ...prev, faqs: newFaqs }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const tabs = [
        { id: "hero", label: "Hero Section", icon: Layout },
        { id: "about", label: "About Us", icon: Info },
        { id: "policies", label: "Policies", icon: ShieldCheck },
        { id: "faqs", label: "FAQs", icon: HelpCircle },
        { id: "social", label: "Social & Contact", icon: Share2 },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Globe className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Landing Page Management</h1>
                        <p className="text-muted-foreground text-sm">Customize yours website's first impression</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-black font-bold rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg shadow-primary/20"
                >
                    {isSaving ? (
                        <div className="h-5 w-5 border-2 border-black/30 border-t-black animate-spin rounded-full" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    Save Changes
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Tabs Sidebar */}
                <div className="w-full md:w-64 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                                activeTab === tab.id
                                    ? "bg-primary text-black shadow-md shadow-primary/10"
                                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted border border-border"
                            }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-card rounded-2xl border border-border p-8 shadow-sm overflow-hidden min-h-[500px]">
                    <AnimatePresence mode="wait">
                        {activeTab === "hero" && (
                            <motion.div
                                key="hero"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                    <Layout className="w-5 h-5 text-primary" />
                                    Hero Section Configuration
                                </h3>
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Main Title</label>
                                        <input
                                            type="text"
                                            value={content.hero.title}
                                            onChange={(e) => updateNestedField("hero", "title", e.target.value)}
                                            className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Subtitle Description</label>
                                        <textarea
                                            value={content.hero.subtitle}
                                            onChange={(e) => updateNestedField("hero", "subtitle", e.target.value)}
                                            rows={3}
                                            className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none resize-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">Badge Text</label>
                                            <input
                                                type="text"
                                                value={content.hero.badgeText}
                                                onChange={(e) => updateNestedField("hero", "badgeText", e.target.value)}
                                                className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">Primary CTA Button</label>
                                            <input
                                                type="text"
                                                value={content.hero.primaryCtaText}
                                                onChange={(e) => updateNestedField("hero", "primaryCtaText", e.target.value)}
                                                className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "about" && (
                            <motion.div
                                key="about"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                    <Info className="w-5 h-5 text-primary" />
                                    About Us Content
                                </h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Section Title</label>
                                        <input
                                            type="text"
                                            value={content.about.title}
                                            onChange={(e) => updateNestedField("about", "title", e.target.value)}
                                            className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Main Content</label>
                                        <textarea
                                            value={content.about.content}
                                            onChange={(e) => updateNestedField("about", "content", e.target.value)}
                                            rows={8}
                                            className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none resize-y min-h-[200px]"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "policies" && (
                            <motion.div
                                key="policies"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-primary" />
                                    Legal Policies
                                </h3>
                                
                                <div className="space-y-6">
                                    {/* Privacy Policy */}
                                    <div className="p-4 border border-border rounded-xl bg-muted/20">
                                        <label className="text-lg font-bold text-foreground mb-2 block">Privacy Policy</label>
                                        <textarea
                                            value={content.privacyPolicy.content}
                                            onChange={(e) => updateNestedField("privacyPolicy", "content", e.target.value)}
                                            rows={5}
                                            placeholder="Write Privacy Policy content here..."
                                            className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none resize-y"
                                        />
                                    </div>

                                    {/* Terms of Service */}
                                    <div className="p-4 border border-border rounded-xl bg-muted/20">
                                        <label className="text-lg font-bold text-foreground mb-2 block">Terms of Service</label>
                                        <textarea
                                            value={content.termsOfService.content}
                                            onChange={(e) => updateNestedField("termsOfService", "content", e.target.value)}
                                            rows={5}
                                            placeholder="Write Terms of Service content here..."
                                            className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none resize-y"
                                        />
                                    </div>

                                    {/* Refund Policy */}
                                    <div className="p-4 border border-border rounded-xl bg-muted/20">
                                        <label className="text-lg font-bold text-foreground mb-2 block">Refund Policy</label>
                                        <textarea
                                            value={content.refundPolicy.content}
                                            onChange={(e) => updateNestedField("refundPolicy", "content", e.target.value)}
                                            rows={5}
                                            placeholder="Write Refund Policy content here..."
                                            className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none resize-y"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "faqs" && (
                            <motion.div
                                key="faqs"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                        <HelpCircle className="w-5 h-5 text-primary" />
                                        Frequently Asked Questions
                                    </h3>
                                    <button 
                                        onClick={addFaq}
                                        className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-sm font-bold rounded-lg border border-border transition-colors"
                                    >
                                        <Plus className="w-4 h-4 text-primary" />
                                        Add FAQ
                                    </button>
                                </div>

                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border">
                                    {content.faqs.map((faq: any, index: number) => (
                                        <div key={index} className="p-4 border border-border rounded-xl bg-muted/30 relative group">
                                            <button 
                                                onClick={() => deleteFaq(index)}
                                                className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    placeholder="Question"
                                                    value={faq.question}
                                                    onChange={(e) => updateFaq(index, "question", e.target.value)}
                                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm font-bold focus:ring-1 focus:ring-primary outline-none"
                                                />
                                                <textarea
                                                    placeholder="Answer"
                                                    value={faq.answer}
                                                    onChange={(e) => updateFaq(index, "answer", e.target.value)}
                                                    rows={2}
                                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none resize-none"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {content.faqs.length === 0 && (
                                        <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl text-muted-foreground">
                                            No FAQs added yet. Click 'Add FAQ' to start.
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "social" && (
                            <motion.div
                                key="social"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                    <Share2 className="w-5 h-5 text-primary" />
                                    Social Media & Contact
                                </h3>

                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* Social Links */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Social Channels</h4>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-muted-foreground">Twitter (URL)</label>
                                                <input
                                                    type="text"
                                                    value={content.socialLinks.twitter}
                                                    onChange={(e) => updateSocialField("twitter", e.target.value)}
                                                    className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-muted-foreground">Instagram (URL)</label>
                                                <input
                                                    type="text"
                                                    value={content.socialLinks.instagram}
                                                    onChange={(e) => updateSocialField("instagram", e.target.value)}
                                                    className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-muted-foreground">YouTube (Channel URL)</label>
                                                <input
                                                    type="text"
                                                    value={content.socialLinks.youtube}
                                                    onChange={(e) => updateSocialField("youtube", e.target.value)}
                                                    className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-muted-foreground">WhatsApp (Number with country code)</label>
                                                <input
                                                    type="text"
                                                    value={content.socialLinks.whatsapp}
                                                    onChange={(e) => updateSocialField("whatsapp", e.target.value)}
                                                    className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Support Contact</h4>
                                        <div className="space-y-4 p-6 border border-border rounded-2xl bg-muted/20">
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-muted-foreground">Official Email</label>
                                                <input
                                                    type="email"
                                                    value={content.contactInfo.email}
                                                    onChange={(e) => updateNestedField("contactInfo", "email", e.target.value)}
                                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-muted-foreground">Phone Number</label>
                                                <input
                                                    type="text"
                                                    value={content.contactInfo.phone}
                                                    onChange={(e) => updateNestedField("contactInfo", "phone", e.target.value)}
                                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-muted-foreground">Physical Address</label>
                                                <textarea
                                                    value={content.contactInfo.address}
                                                    onChange={(e) => updateNestedField("contactInfo", "address", e.target.value)}
                                                    rows={3}
                                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none resize-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
