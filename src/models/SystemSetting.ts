import { Schema, model, models } from 'mongoose';

const SystemSettingSchema = new Schema(
    {
        maintenanceMode: {
            type: Boolean,
            default: false,
        },
        minAppVersion: {
            type: String,
            default: "1.0.0",
        },
        supportLink: {
            type: String,
            default: "",
        },
        bannerImages: {
            type: [{
                storageUrl: { type: String, required: false }, // New format
                url: { type: String, required: false },        // Legacy format
                location: {
                    type: String,
                    enum: ['home', 'shop', 'both'],
                    default: 'both'
                },
                activeStatus: { type: Boolean, default: true }
            }],
            default: [],
        },
        announcement: {
            type: String,
            default: "", // Text scrolling on home
        },
        promoBanner: {
            imageUrl: { type: String, default: "" },
            redirectUrl: { type: String, default: "" },
            isActive: { type: Boolean, default: false },
            updatedAt: { type: Date, default: Date.now },
        },
        rankSeason: {
            currentSeasonName: { type: String, default: "Season 1" },
            startDate: { type: Date, default: Date.now },
            endDate: { type: Date, default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }, // Default 1 year
            durationDays: { type: Number, default: 365 }
        },
        rankRewards: {
            type: Map,
            of: Number,
            default: {}
        },
        rankRules: {
            tournamentParticipationPoints: { type: Number, default: 10 },
            tournamentFirstPlacePoints: { type: Number, default: 15 },
            tournamentPerKillBasePoints: { type: Number, default: 5 },
            tournamentPerKillMultiplier: { type: Number, default: 2 },
            bzDailyPointsCap: { type: Number, default: 50 },
            bzOpponentLimitPerDay: { type: Number, default: 2 },
            bzHostPoints: { type: Number, default: 5 },
            bzWinnerPoints: { type: Number, default: 5 },
            bzHostWinnerPoints: { type: Number, default: 10 }
        },
        seasonHistory: {
            type: [{
                seasonName: { type: String, required: true },
                startDate: { type: Date, required: true },
                endDate: { type: Date, required: true },
                totalUsers: { type: Number, default: 0 },
                totalClaimsPaid: { type: Number, default: 0 },
                topPlayer: {
                    name: String,
                    points: Number,
                    rank: String
                }
            }],
            default: []
        },
        whatsappAdmins: {
            type: [{
                name: { type: String, required: true },
                number: { type: String, required: true },
                isActive: { type: Boolean, default: true }
            }],
            default: []
        }
    },
    { timestamps: true }
);

// Force re-compile of the model during development hot-reloads to prevent schema caching
if (process.env.NODE_ENV === 'development' && models.SystemSetting) {
    delete models.SystemSetting;
}

const SystemSetting = models.SystemSetting || model('SystemSetting', SystemSettingSchema);

export default SystemSetting;
