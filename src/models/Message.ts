import { Schema, model, models } from 'mongoose';

const MessageSchema = new Schema(
    {
        tournamentId: {
            type: Schema.Types.ObjectId,
            ref: 'Tournament',
            required: true,
            index: true // Index for fast fetching by tournament
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false // Can be null for system messages
        },
        senderName: {
            type: String,
            required: false // Snapshot of name in case user is deleted/null
        },
        content: {
            type: String,
            required: true
        },
        isSystem: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

const Message = models.Message || model('Message', MessageSchema);

export default Message;
