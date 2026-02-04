import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage {
    sender: 'user' | 'admin';
    message: string;
    timestamp: Date;
}

export interface ISupportTicket extends Document {
    userId: mongoose.Types.ObjectId;
    subject: string;
    category: "Payment Issues" | "Tournament Issues" | "Technical Support" | "Account Issues" | "Other";
    priority: "Low" | "Medium" | "High" | "Urgent";
    message: string; // The initial inquiry
    status: "Open" | "In Progress" | "Closed";
    conversation: IMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        subject: {
            type: String,
            required: [true, "Subject is required"],
        },
        category: {
            type: String,
            enum: ["Payment Issues", "Tournament Issues", "Technical Support", "Account Issues", "Other"],
            required: [true, "Category is required"],
        },
        priority: {
            type: String,
            enum: ["Low", "Medium", "High", "Urgent"],
            required: [true, "Priority is required"],
        },
        message: {
            type: String,
            required: [true, "Message is required"],
        },
        status: {
            type: String,
            enum: ["Open", "In Progress", "Closed"],
            default: "Open",
        },
        conversation: [
            {
                sender: { type: String, enum: ['user', 'admin'], required: true },
                message: { type: String, required: true },
                timestamp: { type: Date, default: Date.now }
            }
        ]
    },
    {
        timestamps: true,
    }
);

const SupportTicket: Model<ISupportTicket> =
    mongoose.models.SupportTicket || mongoose.model<ISupportTicket>("SupportTicket", SupportTicketSchema);

export default SupportTicket;

