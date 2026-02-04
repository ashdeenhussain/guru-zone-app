import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDB from "@/lib/db";
import SpinItem from "@/models/SpinItem";
import AdminActivity from "@/models/AdminActivity";

export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDB();
        const session = await getServerSession(authOptions);

        if (!session || !session.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const params = await context.params;

        const body = await request.json();
        const updatedItem = await SpinItem.findByIdAndUpdate(params.id, body, {
            new: true,
            runValidators: true,
        });

        if (!updatedItem) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        // Log
        await AdminActivity.create({
            adminId: (session.user as any).id,
            adminName: session.user.name,
            actionType: 'UPDATE_SPIN_ITEM',
            targetId: updatedItem._id,
            details: `Updated Lucky Spin item: ${updatedItem.label}`
        });

        return NextResponse.json(updatedItem);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDB();
        const session = await getServerSession(authOptions);

        if (!session || !session.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const params = await context.params;

        const deletedItem = await SpinItem.findByIdAndDelete(params.id);

        if (!deletedItem) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        // Log
        await AdminActivity.create({
            adminId: (session.user as any).id,
            adminName: session.user.name,
            actionType: 'DELETE_SPIN_ITEM',
            targetId: params.id,
            details: `Deleted Lucky Spin item: ${deletedItem.label}`
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
