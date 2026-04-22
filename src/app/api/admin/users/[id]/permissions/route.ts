
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions, hasPermission } from "@/lib/auth";
import AdminActivity from "@/models/AdminActivity";

export async function PATCH(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        // Security check: Only admins with manage_system permission can assign permissions
        if (!hasPermission(session, 'manage_system')) {
            return NextResponse.json({ error: "Unauthorized. Requires manage_system permission." }, { status: 401 });
        }

        const params = await context.params;
        const { id } = params;
        const { role, permissions } = await req.json();

        await connectToDatabase();

        const updatedUser = await User.findByIdAndUpdate(
            id,
            {
                role,
                permissions: role === 'user' ? [] : permissions 
            },
            { new: true }
        ).select("-password");

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Log Activity
        await AdminActivity.create({
            adminId: session.user.id,
            adminName: session.user.name,
            actionType: 'UPDATE_PERMISSIONS',
            targetId: updatedUser._id,
            details: `Updated permissions for ${updatedUser.email}. Role: ${role}, Perms: ${permissions?.join(', ')}`
        });

        return NextResponse.json(updatedUser);

    } catch (error) {
        console.error("Error updating permissions:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
