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
                url: { type: String, required: true },
                location: {
                    type: String,
                    enum: ['home', 'shop', 'both'],
                    default: 'both'
                }
            }],
            default: [],
        },
        announcement: {
            type: String,
            default: "", // Text scrolling on home
        },
    },
    { timestamps: true }
);

// Singleton pattern helper: ensuring only one document exists is usually handled 
// by the application logic (always fetching the first one or upserting).
const SystemSetting = models.SystemSetting || model('SystemSetting', SystemSettingSchema);

export default SystemSetting;
