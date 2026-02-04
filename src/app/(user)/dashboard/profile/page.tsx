import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { authOptions } from '@/lib/auth';
import ProfileClient from "@/components/user/ProfileClient";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect("/auth/signin");
    }

    await connectDB();
    // Using email as a reliable lookup, assuming emails are unique
    const dbUser = await User.findOne({ email: session.user.email }).lean();

    if (!dbUser) {
        redirect("/auth/signin");
    }

    // Transform to safe object compliant with ProfileClient interface
    const profileUser = {
        name: dbUser.name || "Unknown User",
        email: dbUser.email || "",
        inGameName: dbUser.inGameName || "",
        freeFireUid: dbUser.freeFireUid || "",
        avatarId: dbUser.avatarId || 1,
        bio: dbUser.bio || "",
    };

    return (
        <div className="min-h-screen bg-background pb-24 lg:pb-8 text-foreground">
            {/* Minimal Header */}
            <div className="pt-2 pb-3 px-4 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
                        {/* Icon is dynamically imported or just mapped */}
                        <span className="text-xl">👤</span>
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-foreground leading-none">
                            My Profile
                        </h1>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                            Manage identity
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-6 max-w-4xl mx-auto">
                <ProfileClient initialUser={profileUser} />
            </div>
        </div>
    );
}
