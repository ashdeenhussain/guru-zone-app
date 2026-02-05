import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import connectDB from "@/lib/db";
import SystemSetting from "@/models/SystemSetting";
import User from "@/models/User";
import { Hammer } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import MobileNavigation from "@/components/MobileNavigation";

export const dynamic = "force-dynamic";

async function getMaintenanceStatus() {
    try {
        await connectDB();
        const settings = await SystemSetting.findOne();
        return settings?.maintenanceMode ?? false;
    } catch (error) {
        console.error("Error checking maintenance mode", error);
        return false;
    }
}

async function getUserOnboardingStatus() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return null;

        await connectDB();
        const user = await User.findOne({ email: session.user.email }).select("hasCompletedOnboarding inGameName freeFireUid avatarId bio").lean();

        if (!user) return null;

        // Convert _id and dates to string for serialization
        return JSON.parse(JSON.stringify(user));
    } catch (error) {
        console.error("Error fetching user status", error);
        return null;
    }
}

export default async function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Check maintenance mode
    const isMaintenance = await getMaintenanceStatus();
    const user = await getUserOnboardingStatus();

    if (isMaintenance) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-purple-600/20 p-6 rounded-full mb-6 animate-pulse">
                    <Hammer size={64} className="text-purple-500" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-4">
                    Under Maintenance
                </h1>
                <p className="text-gray-400 text-lg max-w-md">
                    We are currently upgrading our systems to provide you with a better experience. Please check back shortly.
                </p>
                <div className="mt-8 text-sm text-gray-600">
                    Guru Zone Team
                </div>
            </div>
        );
    }

    const showOnboarding = user && user.hasCompletedOnboarding === false;

    return (
        <div className="min-h-screen flex bg-background">
            <DashboardSidebar />
            <MobileNavigation />

            <DashboardHeader />

            <main className="flex-1 overflow-x-hidden pb-16 lg:pb-0 lg:pl-20 pt-20">
                <div className="w-full">
                    {children}
                </div>
            </main>

            {showOnboarding && <OnboardingFlow user={user} />}
        </div>
    );
}
