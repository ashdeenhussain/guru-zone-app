import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PaymentMethod from '@/models/PaymentMethod';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await req.json();

        // Ensure only allowed fields are updated if strictly needed, but for now specific toggle
        // The user specifically asked to toggle isActive.

        const method = await PaymentMethod.findByIdAndUpdate(
            id,
            { 
                bankName: body.bankName,
                accountTitle: body.accountTitle,
                accountNumber: body.accountNumber,
                isActive: body.isActive,
                instructions: body.instructions,
                proofGuideImageUrl: body.proofGuideImageUrl
            },
            { new: true, runValidators: true }
        );

        if (!method) {
            return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
        }

        return NextResponse.json(method);
    } catch (error) {
        console.error("Error updating payment method:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;

        const method = await PaymentMethod.findByIdAndDelete(id);

        if (!method) {
            return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Payment method deleted" });
    } catch (error) {
        console.error("Error deleting payment method:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
