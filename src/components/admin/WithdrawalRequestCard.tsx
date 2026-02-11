
"use client";

import React, { useState } from 'react';
import { CreditCard, Calendar, User as UserIcon, AlertCircle, Eye } from 'lucide-react';
import TransactionHistoryModal from './TransactionHistoryModal';

interface WithdrawalRequestCardProps {
    trx: any;
}

export default function WithdrawalRequestCard({ trx }: WithdrawalRequestCardProps) {
    const [isLedgerOpen, setIsLedgerOpen] = useState(false);

    return (
        <>
            <div
                className={`
                    relative p-6 rounded-2xl border transition-all
                    ${trx.status === 'pending' || trx.status === 'Pending'
                        ? 'bg-neutral-900/50 border-yellow-500/20 hover:border-yellow-500/40'
                        : 'bg-neutral-950 border-neutral-800 opacity-75'
                    }
                `}
            >
                {/* Status Badge */}
                <div className="absolute top-6 right-6">
                    <span className={`
                        px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                        ${(trx.status === 'pending' || trx.status === 'Pending') ? 'bg-yellow-500/10 text-yellow-500 ring-1 ring-yellow-500/20' : ''}
                        ${(trx.status === 'approved' || trx.status === 'Approved') ? 'bg-green-500/10 text-green-500 ring-1 ring-green-500/20' : ''}
                        ${(trx.status === 'rejected' || trx.status === 'Rejected') ? 'bg-red-500/10 text-red-500 ring-1 ring-red-500/20' : ''}
                    `}>
                        {trx.status}
                    </span>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
                    {/* User Info */}
                    <div className="flex items-center gap-4 min-w-[200px]">
                        <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
                            {trx.user?.image ? (
                                <img src={trx.user.image} alt={trx.user.name} className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-6 h-6 text-neutral-500" />
                            )}
                        </div>
                        <div>
                            <button
                                onClick={() => setIsLedgerOpen(true)}
                                className="font-bold text-white hover:text-indigo-400 hover:underline text-left transition-colors"
                            >
                                {trx.user?.name || "Unknown User"}
                            </button>
                            <p className="text-xs text-neutral-500">{trx.user?.email}</p>
                        </div>
                    </div>

                    {/* Amount & Method */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-neutral-800 rounded-lg">
                                <CreditCard className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-xs text-neutral-400">Amount & Method</p>
                                <p className="font-mono font-bold text-lg text-white">
                                    Rs. {trx.amount.toLocaleString()}
                                    <span className="text-sm font-normal text-neutral-500 ml-2">via {trx.method}</span>
                                </p>
                            </div>
                        </div>

                        {/* Bank Details */}
                        <div className="bg-neutral-950/50 p-3 rounded-lg border border-neutral-800 text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Bank Name:</span>
                                <span className="text-neutral-300">{trx.bankDetails?.bankName || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Account Title:</span>
                                <span className="text-neutral-300">{trx.bankDetails?.accountTitle || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Account No:</span>
                                <span className="font-mono text-neutral-300 select-all">{trx.bankDetails?.accountNumber || "N/A"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-neutral-500 text-sm min-w-[150px]">
                        <Calendar className="w-4 h-4" />
                        {new Date(trx.createdAt).toLocaleDateString()} at {new Date(trx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {/* Inspect Wallet Button */}
                    {(trx.status === 'pending' || trx.status === 'Pending') && (
                        <div className="min-w-[140px] flex flex-col gap-2 justify-end">
                            <button
                                onClick={() => setIsLedgerOpen(true)}
                                className="flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs px-3 py-2 rounded-lg transition-colors border border-indigo-500/20"
                            >
                                <Eye className="w-3 h-3" /> Inspect Wallet
                            </button>
                        </div>
                    )}
                </div>

                {/* Rejection Reason display if rejected */}
                {(trx.status === 'rejected' || trx.status === 'Rejected') && trx.rejectionReason && (
                    <div className="mt-4 p-3 bg-red-500/5 rounded-lg border border-red-500/10 flex gap-2 items-start">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-red-500">Rejection Reason:</p>
                            <p className="text-sm text-red-400">{trx.rejectionReason}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            <TransactionHistoryModal
                isOpen={isLedgerOpen}
                onClose={() => setIsLedgerOpen(false)}
                userId={trx.user?._id?.toString()}
                userName={trx.user?.name}
            />
        </>
    );
}
