'use client';

import React, { useEffect, useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, Trophy } from 'lucide-react';

export default function ActivityItemClient({ transaction }: any) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isCredit = ['deposit', 'prize_winnings'].includes(transaction.type);

    let icon = Wallet;
    let colorClass = "text-muted-foreground";
    let bgClass = "bg-muted";

    if (transaction.type === 'deposit') {
        icon = ArrowUpRight;
        colorClass = "text-green-500";
        bgClass = "bg-green-500/10";
    } else if (transaction.type === 'withdrawal') {
        icon = ArrowDownLeft;
        colorClass = "text-red-500";
        bgClass = "bg-red-500/10";
    } else if (transaction.type === 'entry_fee') {
        icon = Trophy;
        colorClass = "text-yellow-600 dark:text-yellow-400";
        bgClass = "bg-yellow-500/10";
    }

    const fixDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        // If date is more than 1 minute in the future, it's likely a double offset (+5 hours)
        if (date.getTime() > now.getTime() + 60000) {
            return new Date(date.getTime() - 5 * 60 * 60 * 1000);
        }
        return date;
    };

    const IconComp = icon;

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
            <div className={`p-2 rounded-lg ${bgClass}`}>
                <IconComp className={`w-4 h-4 ${colorClass}`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                    <span className="font-semibold">{transaction.user?.name || "Unknown User"}</span>
                    {" "}
                    <span className="text-muted-foreground font-normal">
                        {transaction.type === 'entry_fee' ? 'joined contest' :
                            transaction.type === 'prize_winnings' ? 'won prize' :
                                transaction.type}
                    </span>
                </p>
                <p className="text-xs text-muted-foreground">
                    {mounted ? fixDate(transaction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                </p>
            </div>
            <div className={`text-sm font-bold ${isCredit ? 'text-green-500' : 'text-foreground'}`}>
                {isCredit ? '+' : '-'} {transaction.amount}
            </div>
        </div>
    );
}
