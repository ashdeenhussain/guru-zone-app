import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDB from "@/lib/db";
import SpinItem from "@/models/SpinItem";
import AdminActivity from "@/models/AdminActivity";
import { z } from "zod";

const spinItemSchema = z.object({
    label: z.string().min(1, "Label is required"),
    type: z.enum(['coins', 'product', 'empty', 'Product', 'Coin']),
    value: z.string().optional().or(z.number()),
    probability: z.number().min(0).max(100),
    isActive: z.boolean().optional().default(true),
    color: z.string().optional(),
    product: z.string().optional(),
    imageUrl: z.string().optional(), // Added imageUrl
    icon: z.string().optional()
});

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
        const validation = spinItemSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ 
                error: "Invalid item data", 
                details: validation.error.format() 
            }, { status: 400 });
        }

        const newItem = await SpinItem.create(validation.data);

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
