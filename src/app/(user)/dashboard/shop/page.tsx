import connectToDatabase from "@/lib/db";
import StoreProduct from "@/models/StoreProduct";
import User from "@/models/User";
import SpinItem from "@/models/SpinItem";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ShopContent from "./ShopContent";
import ShopMaintenanceWrapper from "@/components/shop/ShopMaintenanceWrapper";
import { cookies } from "next/headers";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Free Fire Top Up Pakistan — Sasta Diamonds & Membership | Guru Zone",
  description: "Pakistan ka sabse sasta Free Fire Top Up Pakistan. Apni tournament wallet se seedha free fire diamonds jazzcash, free fire top up easypaisa aur free fire membership pakistan kharido sasti tareen rates pe. Instant player ID top up.",
  keywords: "free fire top up pakistan, free fire diamonds jazzcash, free fire top up easypaisa, free fire diamonds cheap pakistan, free fire membership pakistan, free fire player id top up, free fire diamonds easypaisa discount, garena top up pakistan",
  alternates: {
    canonical: "https://www.guru-zone.com/topup",
  },
};

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
    const session = await getServerSession(authOptions);
    const cookieStore = await cookies();
    const isGuest = cookieStore.get('isGuest')?.value === 'true';

    // Only redirect if NOT authenticated AND NOT a guest
    if (!session?.user && !isGuest) {
        const { redirect } = await import('next/navigation');
        redirect("/auth/signin");
    }

    await connectToDatabase();

    // Fetch Products & Spin Items (public data)
    const products = await StoreProduct.find({ isActive: true }).lean();
    const spinItems = await SpinItem.find({ isActive: true }).sort({ _id: 1 }).lean();

    // Fetch System Settings for Banners
    // @ts-ignore
    const SystemSettingRaw = (await import("@/models/SystemSetting")).default;
    // @ts-ignore
    const systemSettings = await SystemSettingRaw.findOne().lean();

    const allBanners = systemSettings?.bannerImages || [];
    const shopBanners = allBanners
        .filter((banner: any) => {
            if (typeof banner === 'string') return !!banner.trim();
            if (banner.activeStatus === false) return false;
            return banner && (banner.storageUrl || banner.url) && (banner.location === 'shop' || banner.location === 'both');
        })
        .map((banner: any) => typeof banner === 'string' ? banner : (banner.storageUrl || banner.url))
        .filter(Boolean);

    const serializedProducts = JSON.parse(JSON.stringify(products));
    const serializedSpinItems = JSON.parse(JSON.stringify(spinItems));

    // Default values for guests (no user data)
    let userBalance = 0;
    let userProfile = { inGameName: '', uid: '' };
    let loyaltyData = { progress: 0, spinsAvailable: 0 };

    if (session?.user) {
        // @ts-ignore
        const userId = session.user.id;
        const user = await User.findById(userId).select("walletBalance inGameName freeFireUid loyaltyProgress spinsAvailable").lean();
        if (user) {
            userBalance = (user as any).walletBalance || 0;
            userProfile = { inGameName: (user as any).inGameName || '', uid: (user as any).freeFireUid || '' };
            loyaltyData = { progress: (user as any).loyaltyProgress || 0, spinsAvailable: (user as any).spinsAvailable || 0 };
        }
    }

    return (
        <div>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Product",
                  "name": "Free Fire Diamond Top Up — Pakistan",
                  "description": "Sasta aur fast Free Fire Diamond Top Up Pakistan mein. JazzCash aur EasyPaisa se payment karo.",
                  "brand": {
                    "@type": "Brand",
                    "name": "Guru Zone"
                  },
                  "offers": {
                    "@type": "AggregateOffer",
                    "priceCurrency": "PKR",
                    "lowPrice": "150",
                    "highPrice": "5000",
                    "offerCount": "10",
                    "availability": "https://schema.org/InStock"
                  }
                })
              }}
            />
            <ShopMaintenanceWrapper isActive={false}>
                <ShopContent
                    products={serializedProducts}
                    spinItems={serializedSpinItems}
                    userBalance={userBalance}
                    userProfile={userProfile}
                    loyaltyData={loyaltyData}
                    bannerImages={shopBanners}
                    isGuest={isGuest}
                />
            </ShopMaintenanceWrapper>
        </div>
    );
}
