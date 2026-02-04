
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Find user first
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Ideally, check for pending withdrawals or active tournaments here
        // For MVP, we proceed with deletion.

        await User.deleteOne({ email: session.user.email });

        return NextResponse.json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("Delete account error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
