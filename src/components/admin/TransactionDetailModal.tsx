"use client";

import React, { useState } from 'react';
import { X, Calendar, Clipboard, Check, Image as ImageIcon, AlertCircle } from 'lucide-react';
import ImageZoomModal from './ImageZoomModal';

interface TransactionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: any;
    user: {
        name: string;
        email: string;
    };
}

export default function TransactionDetailModal({ isOpen, onClose, transaction, user }: TransactionDetailModalProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isZoomOpen, setIsZoomOpen] = useState(false);

    if (!isOpen || !transaction) return null;

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'approved':
            case 'completed':
            case 'success':
                return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'rejected':
            case 'failed':
                return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'pending':
                return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            default:
                return 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20';
        }
    };

    const isCredit = ['deposit', 'prize_winnings', 'spin_win', 'refund'].includes(transaction.type);
    const isDebit = ['withdrawal', 'entry_fee', 'shop_purchase'].includes(transaction.type);

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div 
                    className="bg-neutral-900 border border-neutral-800 w-full max-w-lg rounded-3xl flex flex-col shadow-2xl overflow-hidden relative text-white"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900/50">
                        <div>
                            <h3 className="text-lg font-bold">Transaction Details</h3>
                            <p className="text-xs text-neutral-400 font-mono">ID: {transaction._id}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                        {/* User Summary Card */}
                        <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-1">
                            <p className="text-[10px] text-neutral-500 uppercase font-black tracking-wider">User Profile</p>
                            <h4 className="font-bold text-white text-base">{user.name}</h4>
                            <p className="text-xs text-neutral-400">{user.email}</p>
                        </div>

                        {/* Amount & Status Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800">
                                <span className="text-[10px] text-neutral-500 uppercase font-black tracking-wider block mb-1">Amount</span>
                                <span className={`text-2xl font-mono font-black ${isCredit ? 'text-green-500' : isDebit ? 'text-red-500' : 'text-white'}`}>
                                    {isCredit ? '+' : isDebit ? '-' : ''} {transaction.amount.toLocaleString()}
                                </span>
                            </div>
                            <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 flex flex-col justify-center">
                                <span className="text-[10px] text-neutral-500 uppercase font-black tracking-wider block mb-1">Status</span>
                                <span className={`text-center py-1 px-3 rounded-full text-xs font-black uppercase border w-fit ${getStatusColor(transaction.status)}`}>
                                    {transaction.status}
                                </span>
                            </div>
                        </div>

                        {/* Basic Details */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3.5 bg-neutral-950/50 border border-neutral-800/50 rounded-2xl text-sm">
                                <span className="text-neutral-400">Type</span>
                                <span className="font-bold capitalize">{transaction.type.replace('_', ' ').toUpperCase()}</span>
                            </div>
                            <div className="flex items-center justify-between p-3.5 bg-neutral-950/50 border border-neutral-800/50 rounded-2xl text-sm">
                                <span className="text-neutral-400">Date & Time</span>
                                <span className="font-semibold text-neutral-200">
                                    {new Date(transaction.createdAt).toLocaleString()}
                                </span>
                            </div>
                            {transaction.method && (
                                <div className="flex items-center justify-between p-3.5 bg-neutral-950/50 border border-neutral-800/50 rounded-2xl text-sm">
                                    <span className="text-neutral-400">Wallet / Bank</span>
                                    <span className="font-bold text-indigo-400">{transaction.method}</span>
                                </div>
                            )}
                            {transaction.trxID && (
                                <div className="flex items-center justify-between p-3.5 bg-neutral-950/50 border border-neutral-800/50 rounded-2xl text-sm">
                                    <span className="text-neutral-400">Transaction ID</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-neutral-200 select-all">{transaction.trxID}</span>
                                        <button 
                                            onClick={() => copyToClipboard(transaction.trxID, 'trxID')} 
                                            className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors"
                                            title="Copy ID"
                                        >
                                            {copiedField === 'trxID' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Clipboard className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {transaction.description && (
                            <div className="p-4 bg-neutral-950/30 border border-neutral-800/50 rounded-2xl space-y-1">
                                <p className="text-[10px] text-neutral-500 uppercase font-black tracking-wider">Description</p>
                                <p className="text-sm text-neutral-300">{transaction.description}</p>
                            </div>
                        )}

                        {/* Rejection Reason */}
                        {transaction.rejectionReason && (
                            <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex gap-2">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-red-500">Rejection Reason</p>
                                    <p className="text-sm text-red-400">{transaction.rejectionReason}</p>
                                </div>
                            </div>
                        )}

                        {/* Bank Details (For Withdrawals) */}
                        {transaction.type === 'withdrawal' && transaction.bankDetails && (
                            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
                                <p className="text-[10px] text-neutral-500 uppercase font-black tracking-wider border-b border-neutral-800 pb-1.5">Receiver Account Details</p>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-neutral-500 block text-xs">Bank / Wallet Name</span>
                                        <span className="text-neutral-200 font-bold">{transaction.bankDetails.bankName || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-neutral-500 block text-xs">Account Title</span>
                                        <span className="text-neutral-200 font-bold">{transaction.bankDetails.accountTitle || 'N/A'}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-neutral-500 block text-xs">Account Number</span>
                                        <div className="flex items-center justify-between mt-1 bg-neutral-900 px-3 py-2 rounded-xl border border-neutral-800">
                                            <span className="font-mono text-neutral-200 text-sm select-all">{transaction.bankDetails.accountNumber || 'N/A'}</span>
                                            {transaction.bankDetails.accountNumber && (
                                                <button 
                                                    onClick={() => copyToClipboard(transaction.bankDetails.accountNumber, 'accountNumber')}
                                                    className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors"
                                                >
                                                    {copiedField === 'accountNumber' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Clipboard className="w-3.5 h-3.5" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Proof Image Screenshot (For Deposits) */}
                        {transaction.proofImage && (
                            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
                                <p className="text-[10px] text-neutral-500 uppercase font-black tracking-wider border-b border-neutral-800 pb-1.5">Payment Screenshot</p>
                                <div 
                                    className="relative aspect-[9/16] max-h-[300px] w-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden cursor-zoom-in hover:brightness-95 transition-all group flex items-center justify-center"
                                    onClick={() => setIsZoomOpen(true)}
                                >
                                    <img 
                                        src={transaction.proofImage} 
                                        alt="Deposit Proof" 
                                        className="max-h-[300px] object-contain w-auto h-auto"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <ImageIcon className="w-5 h-5 text-white" />
                                        <span className="text-xs text-white font-semibold">Click to Zoom</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {transaction.proofImage && (
                <ImageZoomModal
                    src={transaction.proofImage}
                    alt="Deposit Proof Zoom"
                    isOpen={isZoomOpen}
                    onClose={() => setIsZoomOpen(false)}
                />
            )}
        </>
    );
}
