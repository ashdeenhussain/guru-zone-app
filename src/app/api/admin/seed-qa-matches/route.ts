import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized. Admin only.' }, { status: 403 });
        }

        await connectToDatabase();
        const adminId = (session.user as any).id;

        // 1. Setup QA Tester User
        const qaEmail = 'qa_tester@test.com';
        let qaUser = await User.findOne({ email: qaEmail });
        if (!qaUser) {
            const hashedPassword = await bcrypt.hash('password123', 10);
            qaUser = await User.create({
                name: 'QA Tester',
                email: qaEmail,
                password: hashedPassword,
                role: 'user',
                trustScore: 75,
                walletBalance: 1000,
                hasCompletedOnboarding: true
            });
        } else {
            qaUser.trustScore = 75;
            await qaUser.save();
        }

        // 2. Clear previous QA matches to keep it clean
        await Tournament.deleteMany({ title: /^QA Test:/ });

        const matches = [
            {
                title: "QA Test: 1v1 Happy Path",
                format: "1v1",
                entryFee: 10,
                description: "Goal: Test normal agree and 10% fee deduction",
                teamSize: 1
            },
            {
                title: "QA Test: 2v2 Captain Logic",
                format: "2v2",
                entryFee: 20,
                description: "Goal: Test optional teammate IGNs",
                teamSize: 2
            },
            {
                title: "QA Test: 4v4 Asymmetric (1v4)",
                format: "4v4",
                entryFee: 50,
                description: "Goal: Test 4v4 without filling all teammate slots",
                teamSize: 4
            },
            {
                title: "QA Test: Auto-Cancel No-Show",
                format: "1v1",
                entryFee: 15,
                description: "Goal: I will NOT join this. Wait 2 hours past start time to see if the cron job refunds the host",
                teamSize: 1
            },
            {
                title: "QA Test: Fake Dispute Penalty",
                format: "1v1",
                entryFee: 10,
                description: "Goal: Test Admin Force Win Host -> Joiner gets -10 Trust Score",
                teamSize: 1
            },
            {
                title: "QA Test: Valid Dispute Reward",
                format: "1v1",
                entryFee: 10,
                description: "Goal: Test Admin Force Win Joiner -> Host gets -10 Trust Score",
                teamSize: 1
            },
            {
                title: "QA Test: Sore Loser Timeout",
                format: "1v1",
                entryFee: 10,
                description: "Goal: Host declares win, I will wait 30 mins to test the Host 'Claim Prize' button",
                teamSize: 1
            },
            {
                title: "QA Test: Draw / Full Refund",
                format: "1v1",
                entryFee: 30,
                description: "Goal: Admin cancels match, both get 100% refund, 0 score change",
                teamSize: 1
            },
            {
                title: "QA Test: Chat Abuse Report",
                format: "1v1",
                entryFee: 10,
                description: "Goal: Test the in-chat report flag and Admin manual -10 penalty",
                teamSize: 1
            }
        ];

        const seededMatches = [];

        for (const m of matches) {
            // Random start time between 24 and 72 hours from now
            const hoursToAdd = 24 + Math.floor(Math.random() * 48);
            const startTime = new Date();
            startTime.setHours(startTime.getHours() + hoursToAdd);

            // Infer maxSlots
            let maxSlots = 2; // Default for 1v1 team vs team
            if (m.format === '2v2') maxSlots = 4;
            if (m.format === '4v4') maxSlots = 8;

            const t = await Tournament.create({
                title: m.title,
                format: m.format,
                entryFee: m.entryFee,
                startTime: startTime,
                gameType: 'CS',
                maxSlots: maxSlots,
                prizePool: m.entryFee * maxSlots,
                createdBy: adminId,
                status: 'Open',
                isVisible: true,
                customRules: {
                    map: 'Bermuda',
                    mode: 'Classic',
                    glooWall: 'Limited',
                    gunProperties: false,
                    description: m.description
                },
                // Add Admin as Host Participant
                participants: [{
                    userId: adminId,
                    inGameName: "Admin_Tester",
                    uid: "123456789",
                    teamName: m.teamSize > 1 ? "Admin Team" : undefined
                }],
                joinedCount: 1
            });
            seededMatches.push(t.title);
        }

        return NextResponse.json({
            success: true,
            message: `Successfully seeded ${seededMatches.length} QA matches.`,
            qaUser: {
                email: qaEmail,
                trustScore: qaUser.trustScore
            },
            matches: seededMatches
        });

    } catch (error: any) {
        console.error('Seeding error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
