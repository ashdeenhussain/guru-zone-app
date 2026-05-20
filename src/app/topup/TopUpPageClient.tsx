"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    ShoppingCart, Shield, Gem, Crown, CheckCircle2,
    ChevronLeft, ChevronRight, User, Hash, Smartphone, AlertCircle, X, Info
} from "lucide-react";

// --- Types ---
interface StoreProduct {
    _id: string;
    title: string;
    category: string;
    costPrice: number;
    emoji?: string;
    imageType?: string;
    imageUrl?: string;
    infoDescription?: string;
    bonusDescription?: string;
}

interface PaymentMethod {
    _id: string;
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    isActive: boolean;
}

const FALLBACK_WA_NUMBER = "923306414313";
const DEFAULT_BANNERS = [
    { url: "/banner1.png" },
    { url: "/banner2_new.png" },
    { url: "/banner3.png" },
    { url: "/banner4.png" },
];

function MiniSlider({ banners }: { banners: { url: string }[] }) {
    const [idx, setIdx] = useState(0);
    const displayBanners = banners?.length > 0 ? banners : DEFAULT_BANNERS;

    useEffect(() => {
        const t = setInterval(() => setIdx(p => (p + 1) % displayBanners.length), 5000);
        return () => clearInterval(t);
    }, [displayBanners.length]);

    return (
        <div className="relative w-full overflow-hidden rounded-xl shadow-lg mb-6" style={{ aspectRatio: '16/9', maxHeight: 340 }}>
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1, transition: { duration: 0.8 } }}
                    exit={{ opacity: 0, transition: { duration: 0.5 } }}
                    className="absolute inset-0"
                >
                    <Image
                        src={displayBanners[idx].url || '/banner1.png'}
                        alt={`Free Fire Promotional Banner ${idx + 1} - Guru Zone`}
                        fill
                        className="object-cover object-center"
                        priority={idx === 0}
                    />
                </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                {displayBanners.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIdx(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
                    />
                ))}
            </div>
            <button
                onClick={() => setIdx(p => (p - 1 + displayBanners.length) % displayBanners.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 border border-white/10 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            ><ChevronLeft className="w-4 h-4" /></button>
            <button
                onClick={() => setIdx(p => (p + 1) % displayBanners.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 border border-white/10 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            ><ChevronRight className="w-4 h-4" /></button>
        </div>
    );
}

function StepCard({ step, title, icon: Icon, children }: { step: number; title: string; icon: any; children: React.ReactNode; }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: step * 0.1 }}
            className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg h-full flex flex-col"
        >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-gradient-to-r from-card to-muted/30">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-black font-black text-xs shrink-0">{step}</div>
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <h2 className="font-bold text-sm text-foreground">{title}</h2>
            </div>
            <div className="p-3 md:p-4 flex-1">{children}</div>
        </motion.div>
    );
}

function PackageCard({ pkg, selected, onSelect, onShowInfo }: { pkg: StoreProduct; selected: boolean; onSelect: () => void; onShowInfo: (e: React.MouseEvent) => void }) {
    return (
        <button
            onClick={onSelect}
            className={`relative w-full flex flex-col items-center justify-center text-center p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer focus:outline-none h-full
                ${selected
                    ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(255,215,0,0.2)] scale-[1.02]"
                    : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                }`}
        >
            {pkg.infoDescription && (
                <div 
                    onClick={onShowInfo}
                    className="absolute top-2 left-2 p-1.5 rounded-full bg-background/80 backdrop-blur text-muted-foreground hover:text-primary transition-colors z-10 border border-white/5 shadow-sm"
                >
                    <Info className="w-3.5 h-3.5" />
                </div>
            )}
            {pkg.bonusDescription && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-black bg-cyan-500 whitespace-nowrap z-10">
                    {pkg.bonusDescription}
                </span>
            )}
            <span className="text-2xl mb-1.5 flex items-center justify-center h-8 w-8 mt-2">
                {pkg.imageType === 'Upload' && pkg.imageUrl ? (
                    <Image src={pkg.imageUrl} alt={`${pkg.title} Free Fire Top Up Package`} width={32} height={32} className="object-contain" />
                ) : (
                    pkg.emoji || '💎'
                )}
            </span>
            <p className="font-black text-xs md:text-sm text-foreground leading-tight px-1 mt-1">{pkg.title}</p>
            <p className={`mt-2 font-black text-sm ${selected ? "text-primary" : "text-foreground"}`}>
                Rs. {pkg.costPrice.toLocaleString()}
            </p>
            {selected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow-md z-10"
                >
                    <CheckCircle2 className="w-3 h-3 text-black" />
                </motion.div>
            )}
        </button>
    );
}

const METHOD_COLORS: Record<string, { bg: string; text: string; abbr: string }> = {
    JazzCash:       { bg: "bg-red-600/20 border-red-600/40",   text: "text-red-400",   abbr: "JC" },
    Easypaisa:      { bg: "bg-green-600/20 border-green-600/40", text: "text-green-400", abbr: "EP" },
    Sadapay:        { bg: "bg-purple-600/20 border-purple-600/40", text: "text-purple-400", abbr: "SP" },
    Nayapay:        { bg: "bg-blue-600/20 border-blue-600/40", text: "text-blue-400", abbr: "NP" },
    "Bank Transfer":{ bg: "bg-amber-600/20 border-amber-600/40", text: "text-amber-400", abbr: "BT" },
    "U-Paisa":      { bg: "bg-orange-600/20 border-orange-600/40", text: "text-orange-400", abbr: "UP" },
};

function PaymentCard({ method, selected, onSelect }: { method: PaymentMethod; selected: boolean; onSelect: () => void; }) {
    const style = METHOD_COLORS[method.bankName] || METHOD_COLORS["Bank Transfer"];
    return (
        <button
            onClick={onSelect}
            aria-label={`Pay for Free Fire Top Up with ${method.bankName}`}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer focus:outline-none text-left
                ${selected
                    ? "border-primary bg-primary/10 shadow-[0_0_14px_rgba(255,215,0,0.2)]"
                    : "border-border bg-card hover:border-primary/40"
                }`}
        >
            <img src="/payment-icon.png" alt={`Pay for Free Fire Top Up with ${method.bankName}`} className="hidden" />
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${style.bg} ${style.text}`}>
                {style.abbr}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground">{method.bankName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{method.accountTitle} • {method.accountNumber}</p>
            </div>
            {selected && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
        </button>
    );
}

export default function TopUpPageClient() {
    const [gameName, setGameName] = useState("");
    const [uid, setUid] = useState("");
    const [selectedPkg, setSelectedPkg] = useState<StoreProduct | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    
    const [products, setProducts] = useState<StoreProduct[]>([]);
    const [banners, setBanners] = useState<{ url: string }[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [whatsappNumber, setWhatsappNumber] = useState(FALLBACK_WA_NUMBER);
    
    const [loadingCatalog, setLoadingCatalog] = useState(true);
    const [loadingMethods, setLoadingMethods] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [infoModalPkg, setInfoModalPkg] = useState<StoreProduct | null>(null);

    useEffect(() => {
        fetch("/api/topup/catalog")
            .then(r => r.json())
            .then(data => {
                if (data.products) setProducts(data.products);
                if (data.banners) setBanners(data.banners);
                if (data.supportLink) {
                    const cleaned = data.supportLink.replace(/\D/g, "");
                    if (cleaned.length >= 10) setWhatsappNumber(cleaned);
                }
            })
            .catch(() => {})
            .finally(() => setLoadingCatalog(false));

        fetch("/api/admin/settings/payment-methods")
            .then(r => r.json())
            .then((data: PaymentMethod[]) => {
                setPaymentMethods(Array.isArray(data) ? data.filter(m => m.isActive) : []);
            })
            .catch(() => setPaymentMethods([]))
            .finally(() => setLoadingMethods(false));
    }, []);

    const diamonds = products.filter(p => p.category === "TopUp" || !p.category.includes("Deal"));
    const memberships = products.filter(p => p.category === "SpecialDeal" || p.category.includes("Deal"));

    const total = selectedPkg?.costPrice ?? 0;

    const buildWhatsAppMsg = () => {
        const lines = [
            "🌟 *Guru Zone Official Top Up* 🌟",
            "_(Trusted Gaming Platform Since 2023)_",
            "",
            `👤 *Player Name:* ${gameName}`,
            `🆔 *Player UID:* ${uid}`,
            `💎 *Selected Package:* ${selectedPkg?.title ?? ""}`,
            `💰 *Total Amount:* Rs. ${total.toLocaleString()} PKR`,
            `🏦 *Payment Method:* ${selectedMethod?.bankName ?? ""}`,
            "",
            "👇 *Please complete your payment to:*",
            `📞 *Account Number:* *${selectedMethod?.accountNumber ?? ""}*`,
            `👤 *Account Title:* *${selectedMethod?.accountTitle ?? ""}*`,
            "",
            "📸 *Next Step:* Kindly send the payment and share the screenshot right here. Your top-up will be processed instantly! ✨",
        ];
        return encodeURIComponent(lines.join("\n"));
    };

    const handleBuyClick = () => {
        if (!gameName.trim()) {
            toast.error("Please enter your In-Game Name", { icon: "👤" });
            document.getElementById("game-name")?.focus();
            return;
        }
        if (!uid.trim()) {
            toast.error("Please enter your Player UID", { icon: "🆔" });
            document.getElementById("player-uid")?.focus();
            return;
        }
        if (!/^\d{6,15}$/.test(uid.trim())) {
            toast.error("Invalid Player UID", { description: "UID must be 6–15 digits.", icon: "❌" });
            document.getElementById("player-uid")?.focus();
            return;
        }
        if (!selectedPkg) {
            toast.error("Please select a package", { icon: "💎" });
            return;
        }
        if (!selectedMethod) {
            toast.error("Please select a payment method", { icon: "💳" });
            return;
        }
        
        setShowModal(true);
    };

    const confirmAndProceed = () => {
        const url = `https://wa.me/${whatsappNumber}?text=${buildWhatsAppMsg()}`;
        window.open(url, "_blank", "noopener,noreferrer");
        setShowModal(false);
        toast.success("Opening WhatsApp…", { description: "Complete payment & send proof.", icon: "✅" });
    };

    const canSubmit = !!(gameName.trim() && uid.trim() && selectedPkg && selectedMethod);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative">
            {/* --- Sticky Header --- */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-lg border border-white/10">
                            <Image src="/logo.jpg" alt="Guru Zone Official Free Fire Top Up Logo" fill className="object-cover" />
                        </div>
                        <span className="font-black text-lg tracking-tighter">
                            GURU <span className="text-primary">ZONE</span>
                        </span>
                    </Link>
                    
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-[10px] sm:text-xs tracking-wide">
                        <ShoppingCart className="w-3.5 h-3.5" /> OFFICIAL TOP UP
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 md:py-8 pb-32 space-y-6 md:space-y-8">
                <h1 className="sr-only">Free Fire Top Up Pakistan - Instant Diamonds via JazzCash & EasyPaisa</h1>
                <nav aria-label="Breadcrumb" className="mb-2">
                    <ol className="flex items-center space-x-2 text-xs md:text-sm text-muted-foreground">
                        <li>
                            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                        </li>
                        <li>
                            <ChevronRight className="w-3 h-3" />
                        </li>
                        <li>
                            <span className="text-foreground font-semibold" aria-current="page">Free Fire Top Up Pakistan</span>
                        </li>
                    </ol>
                </nav>
                <MiniSlider banners={banners} />
                
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-900/60 via-emerald-900/50 to-green-900/60 border border-green-500/20 rounded-xl shadow-lg shadow-green-900/20"
                >
                    <Shield className="w-5 h-5 text-green-400 shrink-0" />
                    <span className="text-sm font-bold text-green-300 tracking-wide text-center">
                        100% Secure &amp; Official Free Fire Top Up
                    </span>
                </motion.div>

                <StepCard step={1} title="Player Info" icon={User}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="game-name" className="block text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">In-Game Name</label>
                            <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-xl px-3 py-2.5 focus-within:border-primary/60 transition-colors shadow-inner">
                                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                                <input id="game-name" type="text" value={gameName} onChange={e => setGameName(e.target.value)} placeholder="e.g. PK_Legend" className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="player-uid" className="block text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Player UID</label>
                            <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-xl px-3 py-2.5 focus-within:border-primary/60 transition-colors shadow-inner">
                                <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
                                <input id="player-uid" type="number" value={uid} onChange={e => setUid(e.target.value)} placeholder="e.g. 5493821038" className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                            </div>
                            <p className="text-[9px] text-muted-foreground mt-1.5 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Find UID: Profile → top-left number
                            </p>
                        </div>
                    </div>
                </StepCard>

                <StepCard step={2} title="Select Your Free Fire Diamond Package" icon={Gem}>
                    {loadingCatalog ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 animate-pulse">
                            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-28 rounded-xl bg-muted/40" />)}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {diamonds.length > 0 && (
                                <div>
                                    <h3 className="flex items-center gap-2 font-bold text-foreground mb-3 text-sm">
                                        <Gem className="w-4 h-4 text-cyan-400" /> Free Fire Diamonds
                                    </h3>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 md:gap-3">
                                        {diamonds.map(pkg => (
                                            <PackageCard 
                                                key={pkg._id} 
                                                pkg={pkg} 
                                                selected={selectedPkg?._id === pkg._id} 
                                                onSelect={() => setSelectedPkg(pkg)}
                                                onShowInfo={(e) => { e.stopPropagation(); setInfoModalPkg(pkg); }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {memberships.length > 0 && (
                                <div>
                                    <h3 className="flex items-center gap-2 font-bold text-foreground mb-3 text-sm">
                                        <Crown className="w-4 h-4 text-amber-400" /> Weekly & Monthly Memberships
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
                                        {memberships.map(pkg => (
                                            <PackageCard 
                                                key={pkg._id} 
                                                pkg={pkg} 
                                                selected={selectedPkg?._id === pkg._id} 
                                                onSelect={() => setSelectedPkg(pkg)}
                                                onShowInfo={(e) => { e.stopPropagation(); setInfoModalPkg(pkg); }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </StepCard>

                <StepCard step={3} title="Secure Payment Methods in Pakistan" icon={Smartphone}>
                    {loadingMethods ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">
                            {[1, 2].map(i => <div key={i} className="h-14 rounded-xl bg-muted/40" />)}
                        </div>
                    ) : paymentMethods.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-sm bg-muted/20 rounded-xl">
                            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No payment methods available.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {paymentMethods.map(m => (
                                <PaymentCard key={m._id} method={m} selected={selectedMethod?._id === m._id} onSelect={() => setSelectedMethod(m)} />
                            ))}
                        </div>
                    )}
                </StepCard>

                <section className="mt-8 space-y-4">
                    <h2 className="text-xl md:text-2xl font-black text-foreground">Frequently Asked Questions (FAQs)</h2>
                    <div className="grid gap-3">
                        <div className="bg-card border border-border rounded-xl p-4">
                            <h3 className="font-bold text-sm text-foreground">How fast is the Free Fire Top Up delivery?</h3>
                            <p className="text-xs text-muted-foreground mt-1">Our system processes top-ups instantly. Diamonds will appear in your account immediately after payment verification.</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4">
                            <h3 className="font-bold text-sm text-foreground">What is the Level Up Pass?</h3>
                            <p className="text-xs text-muted-foreground mt-1">The Level Up Pass gives you up to 800% bonus diamonds based on your in-game level. It can only be purchased once per account.</p>
                        </div>
                    </div>
                </section>
            </main>

            {/* --- Fixed Bottom Action Bar (All Views) --- */}
            <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-lg shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <div className="max-w-3xl mx-auto px-4 py-3 pb-safe flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Total</p>
                        <p className="font-black text-lg text-foreground">
                            {total > 0 ? <span>Rs. <span className="text-primary">{total.toLocaleString()}</span></span> : <span className="text-muted-foreground text-sm">Select package</span>}
                        </p>
                    </div>
                    <button
                        onClick={handleBuyClick}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all shadow-lg shrink-0
                            ${canSubmit ? "bg-[#25D366] hover:bg-[#1ebe5d] active:scale-95 text-white shadow-green-500/30" : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"}`}
                    >
                        <ShoppingCart className="w-4 h-4 shrink-0" />
                        Buy Now
                    </button>
                </div>
            </div>

            {/* --- Order Summary Modal --- */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="w-full max-w-sm bg-card border border-border rounded-2xl overflow-hidden shadow-2xl relative flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center p-4 border-b border-border bg-gradient-to-r from-muted/50 to-transparent">
                                <h3 className="font-black text-lg flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-primary" /> Order Summary
                                </h3>
                                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                                    <X className="w-5 h-5"/>
                                </button>
                            </div>
                            
                            {/* Body */}
                            <div className="p-5 space-y-4 text-sm bg-card/50">
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Player Info</p>
                                    <p className="font-bold text-foreground">{gameName} <span className="text-muted-foreground font-normal">(UID: {uid})</span></p>
                                </div>
                                
                                <div className="space-y-1 pt-3 border-t border-border/50">
                                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Selected Package</p>
                                    <p className="font-bold text-foreground flex items-center gap-1.5">
                                        <Gem className="w-4 h-4 text-cyan-400" /> {selectedPkg?.title}
                                    </p>
                                </div>

                                <div className="space-y-1 pt-3 border-t border-border/50">
                                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Payment Method</p>
                                    <p className="font-bold text-foreground">{selectedMethod?.bankName}</p>
                                    <p className="text-xs text-muted-foreground">{selectedMethod?.accountTitle} ({selectedMethod?.accountNumber})</p>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-border font-black text-lg">
                                    <span>Total Amount:</span>
                                    <span className="text-primary">Rs. {total.toLocaleString()}</span>
                                </div>
                            </div>
                            
                            {/* Footer */}
                            <div className="p-4 border-t border-border bg-muted/20 space-y-3">
                                <div className="flex items-start gap-2 p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                                    <Shield className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                                    <p className="text-[11px] text-cyan-300 leading-tight">By confirming, you will be redirected to WhatsApp to complete your payment.</p>
                                </div>
                                <button onClick={confirmAndProceed} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm bg-[#25D366] hover:bg-[#1ebe5d] text-white transition-all shadow-lg hover:shadow-green-500/30 active:scale-95">
                                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                    Confirm & Send via WhatsApp
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- Info Modal for Package Details --- */}
            <AnimatePresence>
                {infoModalPkg && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setInfoModalPkg(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-xs bg-card border border-border rounded-2xl overflow-hidden shadow-2xl relative flex flex-col"
                        >
                            <div className="flex justify-between items-center p-4 border-b border-border bg-gradient-to-r from-muted/50 to-transparent">
                                <h3 className="font-black text-base flex items-center gap-2">
                                    <span className="text-xl">
                                        {infoModalPkg.imageType === 'Upload' && infoModalPkg.imageUrl ? (
                                            <Image src={infoModalPkg.imageUrl} alt={`${infoModalPkg.title} Package Info`} width={24} height={24} className="object-contain inline-block" />
                                        ) : (
                                            infoModalPkg.emoji || '💎'
                                        )}
                                    </span>
                                    {infoModalPkg.title}
                                </h3>
                                <button onClick={() => setInfoModalPkg(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                                    <X className="w-5 h-5"/>
                                </button>
                            </div>
                            <div className="p-5 text-sm text-foreground/90 leading-relaxed bg-card/50 whitespace-pre-wrap">
                                {infoModalPkg.infoDescription}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
