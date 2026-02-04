import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { inGameName, freeFireUid, avatarId, bio, skipped } = body;

        await connectDB();

        const updateData: any = {
            hasCompletedOnboarding: true,
        };

        if (!skipped) {
            if (inGameName) updateData.inGameName = inGameName;
            if (freeFireUid) updateData.freeFireUid = freeFireUid;
            if (avatarId) updateData.avatarId = avatarId;
            if (bio) updateData.bio = bio;
        }

        const user = await User.findOneAndUpdate(
            { email: session.user?.email },
            updateData,
            { new: true }
        );

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error("Onboarding error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
