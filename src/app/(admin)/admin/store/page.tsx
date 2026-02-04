'use client';

import Link from 'next/link';
import { Package, ShoppingCart, Disc, ArrowRight } from 'lucide-react';

export default function AdminStoreDashboard() {
    const modules = [
        {
            title: 'Product Inventory',
            description: 'Add, edit, and organize diamond packs & special deals.',
            icon: Package,
            href: '/admin/store/products',
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20'
        },
        {
            title: 'Order Management',
            description: 'View pending orders, approve top-ups, and track sales.',
            icon: ShoppingCart,
            href: '/admin/store/orders',
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/20'
        },
        {
            title: 'Lucky Spin Configuration',
            description: 'Manage spin rewards, items, and winning probabilities.',
            icon: Disc,
            href: '/admin/store/spin',
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20'
        }
    ];

    return (
        <div className="space-y-8 pt-24 pb-12 px-6 max-w-7xl mx-auto">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Store Overview</h1>
                <p className="text-muted-foreground">Select a module to manage your in-game store.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {modules.map((module) => (
                    <Link
                        key={module.title}
                        href={module.href}
                        className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:border-primary/20"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`p-3 rounded-xl ${module.bgColor} ${module.color}`}>
                                <module.icon size={24} />
                            </div>
                            <h2 className="font-bold text-lg">{module.title}</h2>
                        </div>

                        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                            {module.description}
                        </p>

                        <div className="flex items-center text-sm font-bold text-primary opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                            Open Module <ArrowRight size={16} className="ml-2" />
                        </div>

                        {/* Hover Gradient Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
