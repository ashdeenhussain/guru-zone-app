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
    },
    { timestamps: true }
);

// Force re-compile of the model during development hot-reloads to prevent schema caching
if (process.env.NODE_ENV === 'development' && models.SystemSetting) {
    delete models.SystemSetting;
}

const SystemSetting = models.SystemSetting || model('SystemSetting', SystemSettingSchema);

export default SystemSetting;
