import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDB from "@/lib/db";
import SpinItem from "@/models/SpinItem";
import AdminActivity from "@/models/AdminActivity";

export async function GET() {
    try {
        await connectToDB();
        const session = await getServerSession(authOptions);

        if (!session || !session.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const items = await SpinItem.find().sort({ probability: -1 });
        return NextResponse.json(items);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectToDB();
        const session = await getServerSession(authOptions);

        if (!session || !session.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const newItem = await SpinItem.create(body);

        // Log
        await AdminActivity.create({
            adminId: (session.user as any).id,
            adminName: session.user.name,
            actionType: 'CREATE_SPIN_ITEM',
            targetId: newItem._id,
            details: `Created Lucky Spin item: ${newItem.label} (${newItem.type})`
        });

        return NextResponse.json(newItem);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
