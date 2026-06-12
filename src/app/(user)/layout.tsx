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
import BackToTop from "@/components/BackToTop";

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
        const user = await User.findOne({ email: session.user.email }).select("hasCompletedOnboarding inGameName freeFireUid avatarId bio status banReason").lean();

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

    if (user?.status === 'banned') {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-red-600/20 p-6 rounded-full mb-6">
                    <svg className="w-16 h-16 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent mb-4">
                    Account Suspended
                </h1>
                <p className="text-gray-400 text-lg max-w-md mb-2">
                    Your account has been suspended.
                </p>
                {user.banReason && (
                    <p className="text-red-400 text-sm max-w-md bg-red-950/40 border border-red-900/50 px-4 py-2 rounded-lg mb-4">
                        <strong>Reason:</strong> {user.banReason}
                    </p>
                )}
                <div className="mt-8 text-sm text-gray-600">
                    If you believe this was an error, please contact Guru Zone support.
                </div>
            </div>
        );
    }

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
        <div className="min-h-screen flex w-full max-w-[100vw] overflow-x-hidden bg-background">
            <DashboardSidebar />
            <MobileNavigation />

            <DashboardHeader />

            <main className="flex-1 w-full max-w-full overflow-x-hidden pb-16 lg:pb-0 lg:pl-20 pt-16 lg:pt-20">
                <div className="w-full">
                    {children}
                </div>
            </main>

            {showOnboarding && <OnboardingFlow user={user} />}
            <BackToTop />
        </div>
    );
}
