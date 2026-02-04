
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PATCH(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        // Security check: Only admins can assign permissions
        // For now, we assume only 'admin' role can assign permissions to others.
        // We could also allow someone with 'manage_system' permission to do this.
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const params = await context.params;
        const { id } = params;
        const { role, permissions } = await req.json();

        await connectToDatabase();

        const updatedUser = await User.findByIdAndUpdate(
            id,
            {
                role,
                permissions: role === 'admin' ? [] : permissions // If admin, clear specific permissions (implied full access) or keep them? 
                // My logic says role === 'admin' OR permissions.includes. So empty permissions for admin is fine.
            },
            { new: true }
        ).select("-password");

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Error updating permissions:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
