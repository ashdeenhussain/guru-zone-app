import { connect } from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function verify() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("No MONGODB_URI");
        await connect(uri);

        const mongoose = (await import('mongoose')).default;
        const db = mongoose.connection.db;
        if (!db) throw new Error("Database not connected");
        const doc = await db.collection('tournaments').findOne({ _id: new mongoose.Types.ObjectId("69a17950716ed3b654c7b289") });

        console.log("Found Tournament:", doc ? { id: doc._id, status: doc.status, maxSlots: doc.maxSlots, title: doc.title } : null);

        // forcefully exit
        setTimeout(() => process.exit(0), 100);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
verify();
