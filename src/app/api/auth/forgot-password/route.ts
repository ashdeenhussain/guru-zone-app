import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        await connectToDatabase();

        const user = await User.findOne({ email });

        if (!user) {
            // Return success even if user not found to prevent email enumeration
            return NextResponse.json({ message: 'If an account exists, email sent.' }, { status: 200 });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Save token and expiry (1 hour)
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 3600000; // 1 hour

        await user.save();

        // Create reset URL
        const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

        // Send email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const message = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset Request',
            text: `You are receiving this email because you (or someone else) has requested the reset of a password.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.`,
        };

        await transporter.sendMail(message);

        return NextResponse.json({ message: 'Email sent' }, { status: 200 });

    } catch (error: any) {
        console.error('Forgot Password Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
