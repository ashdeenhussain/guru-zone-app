import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import LandingPageContent from '@/models/LandingPageContent';

export async function GET() {
    try {
        await connectDB();

        const privacyContent = `Welcome to Guru Zone! Your privacy is of utmost importance to us. This Privacy Policy outlines how we collect, use, and protect your information.

1. Information We Collect
- Personal details: Name, Email Address, and Phone Number.
- Gaming details: Free Fire UID and in-game username.
- Financial data: JazzCash, EasyPaisa, or Bank Account numbers used for deposits and withdrawals.
- Usage data: IP address, device type, and app interaction logs.

2. How We Use Your Information
- To manage your tournament registrations and prize distributions.
- To detect and prevent fraudulent activities or cheating in tournaments.
- To process withdrawals securely to your defined payment methods.

3. Data Security
We implement strict security measures, including data encryption (like bcrypt for passwords) and secure API routes to protect your wallet and personal data. We do not sell or share your data with third parties unless required for payment processing.

If you have any questions, please contact our support team.`;

        const termsContent = `Welcome to Guru Zone. By using our platform, you agree to these Terms of Service.

1. Eligibility
- You must be a resident of Pakistan and use valid local payment methods (JazzCash, EasyPaisa, Bank Transfer) for financial transactions.
- You must have a valid Free Fire account to participate in tournaments.

2. User Accounts
- Each user is allowed only one account. Multiple accounts will lead to permanent bans.
- You are responsible for keeping your login credentials secure.

3. Tournaments & Fair Play
- All players must adhere to the tournament rules. Any use of hacks, scripts, or unfair advantages in Free Fire will result in immediate disqualification and account termination.
- Admin decisions regarding tournament disputes (via the Battle Zone report system) are final.

4. Virtual Currency (Coins & Diamonds)
- Coins and Diamonds purchased or earned on Guru Zone are virtual tokens used exclusively within the platform.
- Withdrawals are subject to verification and minimum balance requirements.

Violation of these terms may result in account suspension and forfeiture of platform balances.`;

        const refundContent = `At Guru Zone, we strive to ensure fairness in all our transactions and tournaments.

1. Tournament Entry Fees
- Full Refund: If a tournament is cancelled by the Guru Zone administration, the entry fee will be fully refunded to your platform wallet.
- No Refund: If you fail to join the custom room on time, leave the room early, or get disqualified for rule violations, your entry fee will not be refunded.

2. Wallet Deposits
- Once funds are successfully deposited into your Guru Zone wallet, they cannot be directly refunded to your bank/mobile account. They must be used for platform activities or withdrawn according to our standard withdrawal policies.
- In case of a failed transaction where funds were deducted but not added to your wallet, please raise a support ticket with your transaction proof.

3. Shop Purchases
- All purchases in the Guru Zone Shop (including lucky spins and virtual items) are final and non-refundable.

Please ensure you review all details before entering a tournament, depositing funds, or making a purchase.`;

        let content = await LandingPageContent.findOne();
        if (!content) {
            content = new LandingPageContent({});
        }

        content.privacyPolicy = {
            title: "Privacy Policy",
            content: privacyContent
        };
        content.termsOfService = {
            title: "Terms of Service",
            content: termsContent
        };
        content.refundPolicy = {
            title: "Refund Policy",
            content: refundContent
        };

        await content.save();
        return NextResponse.json({ success: true, message: "Policies updated successfully!" });
    } catch (error) {
        console.error("Error seeding policies:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
