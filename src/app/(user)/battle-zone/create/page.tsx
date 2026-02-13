'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PageHeader from '@/components/PageHeader';
import { Trophy, Loader2, Calendar, Users, DollarSign, Type } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateTournamentPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        format: '1v1',
        entryFee: 0,
        startTime: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'entryFee' ? parseFloat(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Infer gameType and maxSlots
            // For 1v1/2v2/4v4 custom rooms, usually it is CS (Clash Squad) or custom rules.
            // We default to 'CS' for these small formats as per plan.
            const gameType = 'CS';

            let maxSlots = 2;
            if (formData.format === '2v2') maxSlots = 4;
            if (formData.format === '4v4') maxSlots = 8;
            if (formData.format === 'Solo') maxSlots = 48; // Standard BR
            if (formData.format === 'Duo') maxSlots = 48;
            if (formData.format === 'Squad') maxSlots = 48;

            // If format is 1v1/2v2/4v4, we assume CS. If Solo/Duo/Squad we might assume BR?
            // The prompt specifically asked for 1v1, 2v2, 4v4. 
            // If the user selects these, we send gameType='CS'.

            const payload = {
                ...formData,
                gameType,
                maxSlots,
                // prizePool: 0, // Removed duplicate 
                // Wait, model requires prizePool.
                // For user-hosted, maybe prizePool is 0 or manual?
                // I'll set it to 0 for now or EntryFee * Slots.
                // Let's set it to valid number to check schema.
                prizePool: formData.entryFee * maxSlots,
                privacy: 'Public' // or 'Private'
            };

            const res = await fetch('/api/tournaments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create tournament');
            }

            toast.success('Tournament created successfully!');
            router.push('/battle-zone'); // Redirecting to Battle Zone

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <PageHeader
                title="Host a Tournament"
                description="Create your own custom room and invite players."
                icon={Trophy}
            />

            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Type className="w-4 h-4 text-primary" />
                                Tournament Title
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Ashi's 1v1 Challenge"
                                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            />
                        </div>

                        {/* Format */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" />
                                    Format
                                </label>
                                <select
                                    name="format"
                                    value={formData.format}
                                    onChange={handleChange}
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all appearance-none"
                                >
                                    <option value="1v1">1v1 (Duel)</option>
                                    <option value="2v2">2v2 (Duo)</option>
                                    <option value="4v4">4v4 (Squad)</option>
                                    <option value="Solo">Solo (Classic)</option>
                                    <option value="Duo">Duo (Classic)</option>
                                    <option value="Squad">Squad (Classic)</option>
                                </select>
                            </div>

                            {/* Entry Fee */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-primary" />
                                    Entry Fee (Coins)
                                </label>
                                <input
                                    type="number"
                                    name="entryFee"
                                    value={formData.entryFee}
                                    onChange={handleChange}
                                    min="0"
                                    required
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                Start Time
                            </label>
                            <input
                                type="datetime-local"
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleChange}
                                required
                                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all text-foreground"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Trophy className="w-5 h-5" />
                                        Create Tournament
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    By creating a tournament, you agree to host the room and manage the match responsibly.
                </p>
            </div>
        </div>
    );
}
