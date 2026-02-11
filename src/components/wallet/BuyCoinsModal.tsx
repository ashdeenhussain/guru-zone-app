"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Upload, Copy, Check, CreditCard, Loader2 } from "lucide-react";

interface PaymentMethod {
    _id: string;
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    instructions?: string;
    proofGuideImageUrl?: string;
}

const ProofGuideModal = ({
    imageUrl,
    onClose,
    onConfirm
}: {
    imageUrl: string;
    onClose: () => void;
    onConfirm: () => void;
}) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
        <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-card border border-border shadow-2xl flex flex-col max-h-[90vh]"
        >
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-500 text-xs font-bold">!</span>
                    Proof Requirements
                </h3>
                <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-black/40">
                <div className="relative rounded-lg overflow-hidden border border-border/50">
                    <img src={imageUrl} alt="Proof Guide" className="w-full h-auto object-contain" />
                </div>
                <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 leading-relaxed">
                    Please upload a screenshot exactly like the sample above. Ensure <strong>Transaction ID</strong>, <strong>Time</strong>, and <strong>Status</strong> are clearly visible.
                </div>
            </div>

            <div className="p-4 border-t border-border bg-card">
                <button
                    onClick={onConfirm}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-white hover:opacity-90 transition-opacity"
                >
                    I Understand, Upload Proof
                </button>
            </div>
        </motion.div>
    </motion.div>
);

interface BuyCoinsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BuyCoinsModal({ isOpen, onClose }: BuyCoinsModalProps) {
    const [step, setStep] = useState(1);
    const [amount, setAmount] = useState<number | "">("");
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loadingMethods, setLoadingMethods] = useState(false);

    // Form Data
    const [senderName, setSenderName] = useState("");
    const [senderNumber, setSenderNumber] = useState("");
    const [trxId, setTrxId] = useState("");
    const [proofUrl, setProofUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showGuideModal, setShowGuideModal] = useState(false);

    // Helper to open file dialog safely
    const openFileDialog = () => {
        const fileInput = document.getElementById('screenshot-input') as HTMLInputElement;
        if (fileInput) fileInput.click();
    };

    const handleUploadClick = () => {
        if (selectedMethod?.proofGuideImageUrl) {
            setShowGuideModal(true);
        } else {
            openFileDialog();
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side validation 1: File size check (2MB limit)
        const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
        if (file.size > MAX_FILE_SIZE) {
            alert('File too large!\n\nMaximum size: 2MB\nYour file: ' + (file.size / (1024 * 1024)).toFixed(2) + 'MB\n\nPlease compress or choose a smaller screenshot.');
            e.target.value = ''; // Reset file input
            return;
        }

        // Client-side validation 2: File type check
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type!\n\nAllowed formats: JPEG, PNG, GIF, WebP\nYour file type: ' + (file.type || 'Unknown') + '\n\nPlease upload an image file.');
            e.target.value = ''; // Reset file input
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const uploadData = await uploadRes.json();
            if (uploadData.success) {
                setProofUrl(uploadData.url);
            } else {
                // Display specific error message from backend
                alert('Upload Failed!\n\n' + uploadData.error + '\n\nPlease try again.');
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Network Error!\n\nCouldn't connect to the server. Please check your internet connection and try again.");
        } finally {
            setIsUploading(false);
            e.target.value = ''; // Reset file input for retry
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchMethods();
        } else {
            // Reset state on close
            setTimeout(() => {
                setStep(1);
                setAmount("");
                setSelectedMethod(null);
                setSenderName("");
                setSenderNumber("");
                setTrxId("");
                setProofUrl(null);
                setIsUploading(false);
            }, 300);
        }
    }, [isOpen]);

    const fetchMethods = async () => {
        setLoadingMethods(true);
        try {
            const res = await fetch("/api/finance/methods");
            const data = await res.json();
            if (Array.isArray(data)) {
                setPaymentMethods(data);
            }
        } catch (error) {
            console.error("Failed to fetch payment methods", error);
        } finally {
            setLoadingMethods(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        // You could add a toast here
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!selectedMethod || !amount) return;

        if (!proofUrl) {
            alert('Please upload a screenshot proof first.');
            return;
        }

        setIsSubmitting(true);

        try {
            // 2. Submit Deposit Request
            const payload = {
                amount: Number(amount),
                method: selectedMethod.bankName, // Use bankName as method identifier
                senderName,
                senderNumber,
                trxId,
                screenshot: proofUrl,
            };

            const res = await fetch('/api/finance/deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                alert('Deposit request submitted! Please wait for approval.');
                onClose();
                window.location.reload();
            } else {
                alert('Error: ' + data.message);
            }

        } catch (error) {
            console.error('Deposit error:', error);
            alert('Something went wrong.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md overflow-hidden rounded-2xl bg-card border border-border shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border p-4">
                    <h2 className="text-xl font-bold text-foreground">Buy Coins</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <p className="text-sm text-muted-foreground">Step 1: Select Amount</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {[50, 100, 500, 1000, 2000, 5000].map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => setAmount(val)}
                                            className={`rounded-xl border p-3 text-center text-sm font-medium transition-all ${amount === val
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                                                }`}
                                        >
                                            {val} Coins (Rs. {val})
                                        </button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="Enter custom amount"
                                        value={amount}
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        className="w-full rounded-xl border border-border bg-muted/30 p-4 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                        Coins
                                    </span>
                                </div>
                                <button
                                    onClick={() => amount && setStep(2)}
                                    disabled={!amount}
                                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary p-4 font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
                                >
                                    Next <ChevronRight size={18} />
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <button onClick={() => setStep(1)} className="hover:text-foreground">
                                        Amount
                                    </button>
                                    <ChevronRight size={14} />
                                    <span className="text-primary">Method</span>
                                </div>

                                <p className="text-lg font-semibold text-foreground">
                                    Select Payment Method
                                </p>

                                {loadingMethods ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="animate-spin text-yellow-500" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {paymentMethods.map((method) => (
                                            <button
                                                key={method._id}
                                                onClick={() => setSelectedMethod(method)}
                                                className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border p-4 transition-all hover:scale-[1.02] active:scale-95 text-center h-28 ${selectedMethod?._id === method._id
                                                    ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]"
                                                    : "border-border bg-muted/30 hover:bg-muted hover:border-primary/30"
                                                    }`}
                                            >
                                                {selectedMethod?._id === method._id && (
                                                    <div className="absolute top-2 right-2">
                                                        <div className="bg-primary text-primary-foreground rounded-full p-0.5">
                                                            <Check size={10} strokeWidth={4} />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${selectedMethod?._id === method._id ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground"}`}>
                                                    <CreditCard size={24} />
                                                </div>

                                                <div className="w-full">
                                                    <p className="font-bold text-xs truncate w-full text-foreground/90">
                                                        {method.bankName}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={() => selectedMethod && setStep(3)}
                                    disabled={!selectedMethod}
                                    className="mt-4 w-full rounded-xl bg-primary p-4 font-bold text-primary-foreground disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </motion.div>
                        )}

                        {step === 3 && selectedMethod && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <button onClick={() => setStep(2)} className="hover:text-foreground">
                                        Method
                                    </button>
                                    <ChevronRight size={14} />
                                    <span className="text-primary">Transfer</span>
                                </div>

                                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
                                    <p className="text-sm text-muted-foreground mb-1">Send <strong>Rs. {amount}</strong> to</p>
                                    <p className="text-xl font-bold text-primary">
                                        {selectedMethod.bankName}
                                    </p>

                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-center justify-between rounded-lg bg-black/40 p-3">
                                            <span className="text-sm text-muted-foreground">Account Title</span>
                                            <span className="font-medium text-white">{selectedMethod.accountTitle}</span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg bg-black/40 p-3">
                                            <span className="text-sm text-muted-foreground">Account No.</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-white">{selectedMethod.accountNumber}</span>
                                                <button onClick={() => handleCopy(selectedMethod.accountNumber)} className="text-muted-foreground hover:text-white"><Copy size={16} /></button>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedMethod.instructions && (
                                        <p className="mt-3 text-xs text-primary/80 bg-primary/10 p-2 rounded">
                                            Make sure to follow: {selectedMethod.instructions}
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={() => setStep(4)}
                                    className="w-full rounded-xl bg-primary p-4 font-bold text-primary-foreground"
                                >
                                    I Have Paid
                                </button>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <button onClick={() => setStep(3)} className="hover:text-foreground">
                                        Details
                                    </button>
                                    <ChevronRight size={14} />
                                    <span className="text-primary">Confirm</span>
                                </div>

                                <p className="text-lg font-semibold text-foreground">Payment Details</p>

                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Sender Name"
                                        value={senderName}
                                        onChange={(e) => setSenderName(e.target.value)}
                                        className="w-full rounded-lg border border-border bg-muted/30 p-3 text-foreground focus:border-primary focus:outline-none"
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Sender Mobile Number"
                                        value={senderNumber}
                                        onChange={(e) => setSenderNumber(e.target.value)}
                                        className="w-full rounded-lg border border-border bg-muted/30 p-3 text-foreground focus:border-primary focus:outline-none"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Transaction ID (Optional)"
                                        value={trxId}
                                        onChange={(e) => setTrxId(e.target.value)}
                                        className="w-full rounded-lg border border-border bg-muted/30 p-3 text-foreground focus:border-primary focus:outline-none"
                                    />

                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="screenshot-input"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                        <button
                                            onClick={handleUploadClick}
                                            disabled={isUploading}
                                            className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-6 transition-all relative overflow-hidden ${proofUrl
                                                ? 'border-green-500/50 bg-green-500/10'
                                                : 'border-border bg-muted/20 hover:border-primary hover:bg-primary/5'}`}
                                        >
                                            {isUploading && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 backdrop-blur-[1px]">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Loader2 className="animate-spin text-primary" size={24} />
                                                        <span className="text-xs font-bold text-white">Uploading Proof...</span>
                                                    </div>
                                                </div>
                                            )}

                                            <Upload size={20} className={proofUrl ? "text-green-500" : "text-muted-foreground"} />
                                            <span className={`text-sm font-medium ${proofUrl ? "text-green-500" : "text-muted-foreground"}`}>
                                                {proofUrl ? "Screenshot Uploaded!" : "Upload Payment Screenshot"}
                                            </span>
                                        </button>
                                    </div>

                                    {/* Guide Modal Overlay */}
                                    <AnimatePresence>
                                        {showGuideModal && selectedMethod?.proofGuideImageUrl && (
                                            <ProofGuideModal
                                                imageUrl={selectedMethod.proofGuideImageUrl}
                                                onClose={() => setShowGuideModal(false)}
                                                onConfirm={() => {
                                                    setShowGuideModal(false);
                                                    openFileDialog(); // Trigger upload after confirmation
                                                }}
                                            />
                                        )}
                                    </AnimatePresence>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={!senderName || !senderNumber || isSubmitting}
                                    className="w-full rounded-xl bg-green-500 p-4 font-bold text-white disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="animate-spin" /> Submitting...
                                        </div>
                                    ) : "Submit Request"}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
