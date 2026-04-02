import { connect } from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function updateTournament() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("No MONGODB_URI");
        await connect(uri);

        // Using dynamic import or mongoose.connection.db so we don't have to compile TS models just for this.
        const mongoose = (await import('mongoose')).default;
        const db = mongoose.connection.db;
        if (!db) throw new Error("Database not connected");

        // We will just update the document in the 'tournaments' collection directly
        const result = await db.collection('tournaments').updateOne(
            { _id: new mongoose.Types.ObjectId("69a17950716ed3b654c7b289") },
            { $set: { status: "Open", maxSlots: 2 } }
        );

        console.log("Matched:", result.matchedCount, "Modified:", result.modifiedCount);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

updateTournament();
