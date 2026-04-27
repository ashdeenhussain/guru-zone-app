import { Schema, model, models } from 'mongoose';

const NotificationSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        type: {
            type: String,
            enum: ['info', 'success', 'warning', 'error', 'Tournament'],
            default: 'info',
        },
        link: {
            type: String,
            required: false,
        },
        data: {
            type: Schema.Types.Mixed,
            required: false,
        },
    },
    { timestamps: true }
);

const Notification = models.Notification || model('Notification', NotificationSchema);

export default Notification;
