import { Schema, model, models } from 'mongoose';

const AdminNotificationSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        isRead: {
            // We can make this an array of user IDs who have read it
            type: [Schema.Types.ObjectId],
            ref: 'User',
            default: [],
        },
        type: {
            type: String,
            enum: ['deposit', 'withdraw', 'order', 'request', 'ticket', 'system'],
            default: 'system',
        },
        link: {
            type: String,
            required: false,
        },
    },
    { timestamps: true }
);

const AdminNotification = models.AdminNotification || model('AdminNotification', AdminNotificationSchema);

export default AdminNotification;
