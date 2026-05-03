import { Schema, model, models } from 'mongoose';

const PromoBannerSchema = new Schema(
    {
        imageUrl: {
            type: String,
            required: false,
            default: "",
        },
        redirectUrl: {
            type: String,
            default: "",
        },
        isActive: {
            type: Boolean,
            default: false,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Force re-compile of the model during development hot-reloads
if (process.env.NODE_ENV === 'development' && models.PromoBanner) {
    delete models.PromoBanner;
}

const PromoBanner = models.PromoBanner || model('PromoBanner', PromoBannerSchema);

export default PromoBanner;
