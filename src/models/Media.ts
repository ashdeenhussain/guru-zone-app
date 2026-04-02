import { Schema, model, models } from 'mongoose';

const MediaSchema = new Schema(
    {
        type: {
            type: String,
            enum: ['image', 'video', 'folder'],
            default: 'image',
        },
        parent: {
            type: Schema.Types.ObjectId,
            ref: 'Media',
            default: null,
        },
        path: {
            type: String, // e.g., ",rootId,folderId," for efficient subtree search
            default: ',',
        },
        url: {
            type: String,
            // URL is optional for folders
        },
        publicId: {
            type: String,
            // publicId is optional for folders
        },
        fileName: {
            type: String,
            required: true,
        },
        mimeType: {
            type: String,
            // Optional for folders
        },
        size: {
            type: Number,
            // Optional for folders
        },
        isTrashed: {
            type: Boolean,
            default: false,
        },
        trashedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// Index for efficient trash cleanup and filtering
MediaSchema.index({ isTrashed: 1 });
MediaSchema.index({ trashedAt: 1 });
MediaSchema.index({ parent: 1 }); // Improve folder navigation performance

const Media = models.Media || model('Media', MediaSchema);

export default Media;
