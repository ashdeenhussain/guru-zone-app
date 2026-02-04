"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, X, CheckCircle, AlertCircle, Loader2, CreditCard, ShoppingBag, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import LuckyWheelGame from "./spin/LuckyWheelGame";
import BannerCarousel from "@/components/shop/BannerCarousel";

// Types
interface Product {
    _id: string;
    title: string;
    category: "TopUp" | "SpecialDeal";
    priceCoins: number;
    bonusDescription?: string;
    imageType: "Emoji" | "Upload";
    imageUrl?: string;
    emoji?: string;
}

interface SpinItem {
    _id: string;
    label: string;
    color: string;
    type: "coins" | "product";
}

interface UserProfile {
    inGameName: string;
    uid: string;
}


interface Order {
    _id: string;
    productId: Product;
    pricePaid: number;
    status: "Pending" | "Approved" | "Rejected";
    createdAt: string;
    description?: string;
    adminComment?: string;
}

interface ShopContentProps {
    products: Product[];
    spinItems: SpinItem[];
    userBalance: number;
    userProfile: UserProfile;
    loyaltyData: {
        progress: number;
        spinsAvailable: number;
    };
    bannerImages?: string[];
}

export default function ShopContent({ products, spinItems, userBalance, userProfile, loyaltyData, bannerImages = [] }: ShopContentProps) {
    const [activeTab, setActiveTab] = useState<"Shop" | "Orders">("Shop");
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [orderFilter, setOrderFilter] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Fetch Orders when tab changes
    useEffect(() => {
        if (activeTab === "Orders") {
            const fetchOrders = async () => {
                setLoadingOrders(true);
                try {
                    const res = await fetch("/api/shop/orders");
                    const data = await res.json();
                    if (data.orders) setOrders(data.orders);
                } catch (error) {
                    console.error("Failed to fetch orders", error);
                } finally {
                    setLoadingOrders(false);
                }
            };
            fetchOrders();
        }
    }, [activeTab]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isSpinModalOpen, setIsSpinModalOpen] = useState(false);
    const [infoProduct, setInfoProduct] = useState<Product | null>(null);

    // Purchase Form State
    const [formData, setFormData] = useState({
        inGameName: userProfile.inGameName || "",
        uid: userProfile.uid || "",
    });
    const [purchaseStatus, setPurchaseStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const router = useRouter();

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        setPurchaseStatus("idle");
        setMessage("");
        // Pre-fill form if available
        setFormData({
            inGameName: userProfile.inGameName || "",
            uid: userProfile.uid || "",
        });
        setIsPurchaseModalOpen(true);
    };

    const handlePurchase = async () => {
        if (!selectedProduct) return;

        // Client-side Validation
        if (Number(userBalance) < Number(selectedProduct.priceCoins)) {
            setPurchaseStatus("error");
            setMessage(`Insufficient Coins! You need ${selectedProduct.priceCoins - userBalance} more coins.`);
            return;
        }

        if (!formData.inGameName || !formData.uid) {
            setPurchaseStatus("error");
            setMessage("Please enter your Free Fire details.");
            return;
        }

        setPurchaseStatus("loading");

        try {
            const res = await fetch("/api/shop/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: selectedProduct._id,
                    userDetails: formData,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Purchase failed");
            }

            setPurchaseStatus("success");
            setMessage("Order Placed Successfully! Status: Pending.");

            // Refresh to update balance
            router.refresh();

            // Close modal after delay
            setTimeout(() => {
                setIsPurchaseModalOpen(false);
                setPurchaseStatus("idle");
            }, 2000);

        } catch (err: any) {
            setPurchaseStatus("error");
            setMessage(err.message || "Something went wrong.");
        }
    };



    return (
        <div className="space-y-8 text-foreground pb-24 lg:pb-8">
            {/* Minimal Header */}
            <div className="pt-2 pb-3 px-4 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
                            <ShoppingBag className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-foreground leading-none">
                                Diamond Shop
                            </h1>
                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                Instant Top-ups & Deals
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
                {/* Wallet & Lucky Spin Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Wallet Balance Card */}
                    <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden shadow-sm flex items-center justify-between">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                        <div className="relative z-10 flex gap-3 items-center">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Wallet size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Your Wallet</p>
                                <p className="text-xl font-bold text-primary tabular-nums leading-none mt-0.5">
                                    {userBalance.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">Coins</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Lucky Spin Banner */}
                    {/* Lucky Spin Banner - Enhanced */}
                    <div className="bg-gradient-to-r from-purple-900/10 to-pink-900/10 border border-purple-500/20 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

                        <div className="flex items-center justify-between mb-3 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 flex items-center justify-center shrink-0">
                                    <img
                                        src="/spin-icon-clean.png"
                                        alt="Spin"
                                        className="w-full h-full object-contain animate-spin"
                                        style={{ animationDuration: '3s' }}
                                    />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground leading-none">Lucky Spin</h3>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Win Exclusive Prizes</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsSpinModalOpen(true)}
                                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-purple-500/20 transition-all active:scale-95"
                            >
                                Free Spin
                            </button>
                        </div>

                        {/* Mini Progress */}
                        <div className="relative z-10 space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                                <span>Loyalty Progress</span>
                                <span className={loyaltyData.progress >= 2500 ? "text-green-500" : "text-purple-500"}>
                                    {Math.min(loyaltyData.progress, 2500).toLocaleString()}/2,500
                                </span>
                            </div>
                            <div className="h-2 w-full bg-background/50 rounded-full overflow-hidden border border-border/50">
                                <div
                                    className={`h-full transition-all duration-1000 ${loyaltyData.progress >= 2500
                                        ? "bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse"
                                        : "bg-gradient-to-r from-purple-500 to-pink-500"
                                        }`}
                                    style={{ width: `${Math.min((loyaltyData.progress / 2500) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Banner Carousel */}
                <BannerCarousel images={bannerImages} />

                {/* Tabs */}
                <div className="flex items-center justify-center">
                    <div className="flex p-1.5 bg-muted/40 rounded-2xl border border-border/50 backdrop-blur-sm">
                        {(["Shop", "Orders"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`relative px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === tab ? "text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-primary rounded-xl"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-2">
                                    {tab === "Shop" ? "🛒 Shop & Deals" : "📦 My Orders"}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    {activeTab === "Orders" ? (
                        <motion.div
                            key="orders"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {/* Filter Bar */}
                            <div className="flex gap-2 overflow-x-auto pb-2 noscrollbar">
                                {(["All", "Pending", "Approved", "Rejected"] as const).map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setOrderFilter(filter)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${orderFilter === filter
                                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                            : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                                            }`}
                                    >
                                        {filter === "Approved" ? "Completed" : filter}
                                    </button>
                                ))}
                            </div>

                            {/* Orders List */}
                            <div className="space-y-3">
                                {loadingOrders ? (
                                    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
                                ) : orders.filter(o => orderFilter === "All" || o.status === orderFilter).length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-muted/5 rounded-3xl border border-border/50 border-dashed">
                                        <div className="p-4 rounded-full bg-muted/50 mb-3">
                                            <ShoppingBag size={24} className="opacity-50" />
                                        </div>
                                        <p className="font-bold">No orders found</p>
                                        <p className="text-xs">Your purchase history will appear here.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {orders
                                            .filter(o => orderFilter === "All" || o.status === orderFilter)
                                            .map((order) => (
                                                <div
                                                    key={order._id}
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="cursor-pointer bg-card border border-border p-4 rounded-2xl flex items-center justify-between shadow-sm hover:border-primary/30 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${order.status === "Approved" ? "bg-green-500/10 text-green-500" :
                                                            order.status === "Rejected" ? "bg-red-500/10 text-red-500" :
                                                                "bg-yellow-500/10 text-yellow-500"
                                                            }`}>
                                                            {order.productId?.imageUrl ? (
                                                                <img src={order.productId.imageUrl} className="w-8 h-8 object-contain" alt="Product" />
                                                            ) : (
                                                                <ShoppingBag size={20} />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-sm text-foreground line-clamp-1">{order.productId?.title || "Unknown Product"}</h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border/50">
                                                                    ID: {order._id.slice(-6).toUpperCase()}
                                                                </span>
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-primary text-sm mb-1">🪙 {order.pricePaid?.toLocaleString()}</p>
                                                        <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${order.status === "Approved" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                            order.status === "Rejected" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                                "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 animate-pulse"
                                                            }`}>
                                                            {order.status === "Approved" ? "Completed" : order.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="shop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-transparent" // Wrapper
                        >
                            <div className="space-y-10">
                                {/* Section 1: Top-up Amount */}
                                {products.some(p => p.category === "TopUp") && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2.5">
                                            <h3 className="font-black text-xl text-foreground tracking-tight">Top-up Amount</h3>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                                            {products.filter(p => p.category === "TopUp").map((product) => (
                                                <motion.div
                                                    key={product._id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    whileHover={{ y: -5 }}
                                                    className="group bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-between text-center shadow-sm hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden aspect-[1.1/1]"
                                                    onClick={() => handleProductClick(product)}
                                                >
                                                    <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10">
                                                        <div className="w-10 h-10 md:w-14 md:h-14 mb-2 relative transition-transform duration-300 group-hover:scale-110">
                                                            {product.imageUrl ? (
                                                                <img src={product.imageUrl} alt={product.title} className="w-full h-full object-contain drop-shadow-md" />
                                                            ) : (
                                                                <span className="text-3xl">💎</span>
                                                            )}
                                                        </div>
                                                        <h3 className="font-bold text-lg leading-none">
                                                            💎 {product.title.replace(/\D/g, '')}
                                                        </h3>
                                                    </div>

                                                    <div className="w-full mt-3 pt-3 border-t border-border/50 relative z-10">
                                                        <p className="text-primary font-black text-base">
                                                            🪙 {product.priceCoins.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Section 2: Special Deals */}
                                {products.some(p => p.category === "SpecialDeal") && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2.5">
                                            <h3 className="font-black text-xl text-foreground tracking-tight">Special Deals</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {products.filter(p => p.category === "SpecialDeal").map((product) => (
                                                <motion.div
                                                    key={product._id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    whileHover={{ y: -5 }}
                                                    className="group bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer relative flex flex-col"
                                                    onClick={() => handleProductClick(product)}
                                                >
                                                    {product.bonusDescription && (
                                                        <div className="absolute top-2 right-2 z-20">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setInfoProduct(product);
                                                                }}
                                                                className="bg-background/60 backdrop-blur-md p-1.5 rounded-full hover:bg-background transition-colors text-foreground"
                                                            >
                                                                <Info size={16} />
                                                            </button>
                                                        </div>
                                                    )}

                                                    <div className="relative aspect-[2/1] w-full bg-muted/20 overflow-hidden">
                                                        <img
                                                            src={product.imageUrl || "/placeholder-diamond.png"}
                                                            alt={product.title}
                                                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                                                        <div className="absolute bottom-3 left-4 right-4 text-white">
                                                            <h3 className="font-bold text-lg leading-tight line-clamp-1 mb-0.5">{product.title}</h3>
                                                            <p className="text-[10px] opacity-80 line-clamp-1">{product.bonusDescription || "Special Limited Time Offer"}</p>
                                                        </div>
                                                    </div>

                                                    <div className="p-3 bg-card border-t border-border/50 flex items-center justify-between">
                                                        <span className="text-xs text-muted-foreground font-bold">Limited Offer</span>
                                                        <span className="text-primary font-black text-lg flex items-center gap-1">
                                                            🪙 {product.priceCoins.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {products.length === 0 && (
                                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/5 rounded-2xl border border-border border-dashed">
                                        <AlertCircle size={32} className="mb-2 opacity-50" />
                                        <p>No products available right now.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Lucky Spin Modal - Replaced Route with Modal */}
                <AnimatePresence>
                    {isSpinModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/20 to-transparent">
                                    <div><h3 className="text-white font-bold text-lg drop-shadow-md">Lucky Spin</h3></div>
                                    <button
                                        onClick={() => setIsSpinModalOpen(false)}
                                        className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors backdrop-blur-sm"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Background decoration */}
                                <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
                                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

                                <div className="p-6 md:p-8 pt-16">
                                    <LuckyWheelGame
                                        items={spinItems}
                                        spinsAvailable={loyaltyData.spinsAvailable}
                                        userProgress={loyaltyData.progress}
                                        onClose={() => setIsSpinModalOpen(false)}
                                    />
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Info Modal */}
                <AnimatePresence>
                    {infoProduct && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-card w-full max-w-sm rounded-2xl border border-border p-6 shadow-2xl relative text-card-foreground"
                            >
                                <button
                                    onClick={() => setInfoProduct(null)}
                                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                                >
                                    <X size={20} />
                                </button>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <Info size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold">Product Details</h3>
                                </div>

                                <div className="bg-muted/30 p-4 rounded-xl border border-border">
                                    <h4 className="font-bold text-sm mb-1 text-primary">{infoProduct.title}</h4>
                                    <p className="text-sm text-foreground/80 leading-relaxed">
                                        {infoProduct.bonusDescription}
                                    </p>
                                </div>

                                <button
                                    onClick={() => setInfoProduct(null)}
                                    className="w-full mt-4 py-3 bg-muted hover:bg-muted/80 rounded-xl font-bold transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    Close details
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Purchase Modal */}
                <AnimatePresence>
                    {isPurchaseModalOpen && selectedProduct && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 50 }}
                                className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden relative text-card-foreground max-h-[90vh] overflow-y-auto"
                            >
                                {/* Product Hero Header */}
                                <div className="relative h-32 w-full overflow-hidden">
                                    <img
                                        src={selectedProduct.imageUrl || "/placeholder-diamond.png"}
                                        className="w-full h-full object-cover"
                                        alt=""
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                                    <button
                                        onClick={() => setIsPurchaseModalOpen(false)}
                                        className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full backdrop-blur-md transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                    <div className="absolute bottom-4 left-6">
                                        <h2 className="text-2xl font-black text-white drop-shadow-md">{selectedProduct.title}</h2>
                                        <p className="text-primary font-bold drop-shadow-md flex items-center gap-1">
                                            💰 {selectedProduct.priceCoins.toLocaleString()} Coins
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6 pt-2">
                                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 mb-6 flex items-start gap-3">
                                        <Info className="text-primary shrink-0 mt-0.5" size={16} />
                                        <p className="text-xs text-muted-foreground">
                                            Ensure your Player ID is correct. Diamonds will be credited within 5-10 minutes.
                                        </p>
                                    </div>

                                    {/* Form */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-1.5 block ml-1">In-Game Name (IGN)</label>
                                            <input
                                                type="text"
                                                value={formData.inGameName}
                                                onChange={e => setFormData({ ...formData, inGameName: e.target.value })}
                                                className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50 text-foreground font-medium"
                                                placeholder="e.g. SK_SABIR"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-1.5 block ml-1">Player ID (UID)</label>
                                            <input
                                                type="text"
                                                value={formData.uid}
                                                onChange={e => setFormData({ ...formData, uid: e.target.value })}
                                                className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50 text-foreground font-medium font-mono"
                                                placeholder="e.g. 1234567890"
                                            />
                                        </div>
                                    </div>

                                    {/* Error/Success Messages */}
                                    <AnimatePresence>
                                        {message && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className={`mt-4 p-3 rounded-xl flex items-start gap-3 text-sm border ${purchaseStatus === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                    purchaseStatus === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''
                                                    }`}
                                            >
                                                {purchaseStatus === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle size={18} className="shrink-0 mt-0.5" />}
                                                <p>{message}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Actions */}
                                    <div className="mt-8 flex gap-3">
                                        <button
                                            onClick={() => setIsPurchaseModalOpen(false)}
                                            className="flex-1 py-3.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold transition-colors"
                                            disabled={purchaseStatus === 'loading'}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handlePurchase}
                                            disabled={purchaseStatus === 'loading' || purchaseStatus === 'success'}
                                            className={`flex-[1.5] py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${purchaseStatus === 'loading' ? 'bg-primary/50 cursor-not-allowed' :
                                                purchaseStatus === 'success' ? 'bg-green-500 text-white' :
                                                    'bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_15px_rgba(var(--primary),0.3)]'
                                                }`}
                                        >
                                            {purchaseStatus === 'loading' ? <Loader2 className="animate-spin" /> :
                                                purchaseStatus === 'success' ? 'Purchase Successful' : 'Confirm Purchase'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
                {/* Order Details Modal */}
                <AnimatePresence>
                    {selectedOrder && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-card w-full max-w-sm rounded-2xl border border-border overflow-hidden shadow-2xl relative"
                            >
                                {/* Header */}
                                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                                    <h3 className="font-bold text-lg">Order Details</h3>
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Status Section */}
                                    <div className="flex flex-col items-center justify-center text-center space-y-2">
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${selectedOrder.status === "Approved" ? "bg-green-500/10 text-green-500" :
                                            selectedOrder.status === "Rejected" ? "bg-red-500/10 text-red-500" :
                                                "bg-yellow-500/10 text-yellow-500"
                                            }`}>
                                            {selectedOrder.status === "Approved" ? <CheckCircle size={32} /> :
                                                selectedOrder.status === "Rejected" ? <X size={32} /> :
                                                    <Loader2 size={32} className="animate-spin" />}
                                        </div>
                                        <div>
                                            <h4 className={`text-xl font-black ${selectedOrder.status === "Approved" ? "text-green-500" :
                                                selectedOrder.status === "Rejected" ? "text-red-500" :
                                                    "text-yellow-500"
                                                }`}>
                                                {selectedOrder.status === "Approved" ? "Order Completed" :
                                                    selectedOrder.status === "Rejected" ? "Order Rejected" :
                                                        "Order Pending"}
                                            </h4>
                                            <p className="text-xs text-muted-foreground font-mono mt-1">
                                                ID: {selectedOrder._id.toUpperCase()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Rejection Reason - Only if Rejected */}
                                    {selectedOrder.status === "Rejected" && selectedOrder.adminComment && (
                                        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-center">
                                            <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Reason for Rejection</p>
                                            <p className="text-sm text-foreground/90 font-medium">
                                                "{selectedOrder.adminComment}"
                                            </p>
                                        </div>
                                    )}

                                    {/* Product Info */}
                                    <div className="bg-muted/30 rounded-xl p-4 border border-border space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
                                                {selectedOrder.productId?.imageUrl ? (
                                                    <img src={selectedOrder.productId.imageUrl} className="w-6 h-6 object-contain" alt="" />
                                                ) : (
                                                    <ShoppingBag size={18} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground font-bold uppercase">Product</p>
                                                <p className="font-bold text-sm text-foreground line-clamp-1">{selectedOrder.productId?.title || "Unknown Item"}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t border-border/50">
                                            <div>
                                                <p className="text-xs text-muted-foreground font-bold uppercase">Amount Paid</p>
                                                <p className="font-bold text-primary">🪙 {selectedOrder.pricePaid?.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground font-bold uppercase">Date</p>
                                                <p className="font-medium text-sm">
                                                    {new Date(selectedOrder.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border-t border-border bg-muted/20">
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                                    >
                                        Close Details
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div >
    );
}
