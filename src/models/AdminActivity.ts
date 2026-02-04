import { Schema, model, models } from 'mongoose';

const AdminActivitySchema = new Schema(
    {
        adminId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        adminName: {
            type: String,
            required: true,
        },
        actionType: {
            type: String,
            required: true,
            enum: [
                'UPDATE_USER',
                'BAN_USER',
                'UNBAN_USER',
                'APPROVE_DEPOSIT',
                'REJECT_DEPOSIT',
                'APPROVE_WITHDRAWAL',
                'REJECT_WITHDRAWAL',
                'CREATE_TOURNAMENT',
                'UPDATE_TOURNAMENT',
                'REPLY_TICKET',
                'CLOSE_TICKET',
                'UPDATE_STORE_ITEM',
                'FULFILL_ORDER',
                'UPDATE_SETTINGS',
                'PROMOTE_ADMIN',
                'DEMOTE_ADMIN',
                'UPDATE_PERMISSIONS',
                'CREATE_PRODUCT',
                'UPDATE_PRODUCT',
                'DELETE_PRODUCT',
                'APPROVE_ORDER',
                'REJECT_ORDER',
                'CREATE_SPIN_ITEM',
                'UPDATE_SPIN_ITEM',
                'DELETE_SPIN_ITEM',
                'GLOBAL_NOTIFICATION'
            ]
        },
        targetId: { // ID of the user, transaction, tournament, etc. being acted upon
            type: String,
            required: false,
        },
        details: { // Human readable description or JSON string of changes
            type: String,
            required: true,
        },
        metadata: { // Flexible object for storing specific changed fields if needed
            type: Schema.Types.Mixed,
        }
    },
    { timestamps: true }
);

const AdminActivity = models.AdminActivity || model('AdminActivity', AdminActivitySchema);

export default AdminActivity;
