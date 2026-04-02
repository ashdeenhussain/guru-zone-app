import { Schema, model, models } from 'mongoose';

const ChatReportSchema = new Schema(
    {
        matchId: {
            type: Schema.Types.ObjectId,
            ref: 'Tournament',
            required: true,
        },
        reporterId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        reportedUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        messageText: {
            type: String,
            required: true,
        },
        reason: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'resolved', 'dismissed'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

const ChatReport = models.ChatReport || model('ChatReport', ChatReportSchema);

export default ChatReport;
