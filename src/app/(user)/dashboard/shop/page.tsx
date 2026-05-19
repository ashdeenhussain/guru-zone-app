import connectToDatabase from "@/lib/db";
import StoreProduct from "@/models/StoreProduct";
import User from "@/models/User";
import SpinItem from "@/models/SpinItem";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ShopContent from "./ShopContent";
import ShopMaintenanceWrapper from "@/components/shop/ShopMaintenanceWrapper";
import { redirect } from "next/navigation";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Free Fire Top Up Pakistan — Sasta aur Fast | Guru Zone",
  description: "Pakistan mein sabse sasta Free Fire Diamond Top Up. Apni gaming earnings se seedha FF diamonds kharido. JazzCash aur EasyPaisa accepted.",
  keywords: "free fire top up pakistan, FF diamonds cheap pakistan, free fire top up jazzcash, free fire membership pakistan, garena top up pakistan, free fire diamonds buy online pakistan",
  alternates: {
    canonical: "https://www.guru-zone.com/topup",
  },
};

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect("/auth/signin");
    }

    await connectToDatabase();

    // @ts-ignore
    const userId = session.user.id;
    // Fetch user loyalty fields
    const user = await User.findById(userId).select("walletBalance inGameName freeFireUid loyaltyProgress spinsAvailable").lean();

    if (!user) {
        return <div>User not found</div>;
    }

    // Fetch Products & Spin Items
    const products = await StoreProduct.find({ isActive: true }).lean();
    const spinItems = await SpinItem.find({ isActive: true }).sort({ _id: 1 }).lean();

    // Fetch System Settings for Banners
    // @ts-ignore
    // @ts-ignore
    const SystemSettingRaw = (await import("@/models/SystemSetting")).default;
    // @ts-ignore
    const systemSettings = await SystemSettingRaw.findOne().lean();

    // Filter banners for Shop
    const allBanners = systemSettings?.bannerImages || [];
    const shopBanners = allBanners
        .filter((banner: any) => {
            if (typeof banner === 'string') return !!banner.trim(); // Legacy: show everywhere
            if (banner.activeStatus === false) return false;
            return banner && (banner.storageUrl || banner.url) && (banner.location === 'shop' || banner.location === 'both');
        })
        .map((banner: any) => typeof banner === 'string' ? banner : (banner.storageUrl || banner.url))
        .filter(Boolean);

    const serializedProducts = JSON.parse(JSON.stringify(products));
    const serializedSpinItems = JSON.parse(JSON.stringify(spinItems));

    const serializedUser = {
        // @ts-ignore
        ...user,
        _id: user._id.toString()
    };

    return (
        <div>
            <ShopMaintenanceWrapper isActive={false}>
                <ShopContent
                    products={serializedProducts}
                    spinItems={serializedSpinItems}
                    userBalance={user.walletBalance || 0}
                    userProfile={{
                        inGameName: user.inGameName,
                        uid: user.freeFireUid
                    }}
                    loyaltyData={{
                        progress: user.loyaltyProgress || 0,
                        spinsAvailable: user.spinsAvailable || 0
                    }}
                    bannerImages={shopBanners}
                />
            </ShopMaintenanceWrapper>
        </div>
    );
}
