import connectToDatabase from "@/lib/db";
import StoreProduct from "@/models/StoreProduct";
import User from "@/models/User";
import SpinItem from "@/models/SpinItem";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ShopContent from "./ShopContent";
import { redirect } from "next/navigation";

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
    const spinItems = await SpinItem.find({ isActive: true }).lean();

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
            if (typeof banner === 'string') return true;
            return banner.location === 'shop' || banner.location === 'both';
        })
        .map((banner: any) => typeof banner === 'string' ? banner : banner.url);

    const serializedProducts = JSON.parse(JSON.stringify(products));
    const serializedSpinItems = JSON.parse(JSON.stringify(spinItems));

    const serializedUser = {
        // @ts-ignore
        ...user,
        _id: user._id.toString()
    };

    return (
        <div>
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
        </div>
    );
}
