const mongoose = require('mongoose');

const uri = "mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority";

async function main() {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const TournamentSchema = new mongoose.Schema({}, { strict: false });
    const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema, 'tournaments');

    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', UserSchema, 'users');

    const ts = await Tournament.find({ title: { $regex: /CS/i } }).sort({ startTime: -1 }).limit(10);
    console.log("==== Recent CS Tournaments ====");
    for (const t of ts) {
        console.log(`ID: ${t._id}`);
        console.log(`Title: ${t.title}, Status: ${t.status}, Visible: ${t.isVisible}`);
        console.log(`StartTime: ${new Date(t.startTime).toLocaleString('en-US', { timeZone: 'Asia/Karachi' })}`);
        console.log(`JoinedCount: ${t.joinedCount}, Participants length: ${t.participants ? t.participants.length : 0}`);
        const creator = await User.findById(t.createdBy);
        console.log(`Creator: ${creator ? creator.name : 'Admin'}\n`);
    }

    const ts2 = await Tournament.find({}).sort({ startTime: -1 }).limit(5);
    console.log("==== Recent 5 Tournaments overall ====");
    for (const t of ts2) {
        console.log(`ID: ${t._id}, Title: ${t.title}, Status: ${t.status}, Visible: ${t.isVisible}, StartTime: ${new Date(t.startTime).toLocaleString('en-US', { timeZone: 'Asia/Karachi' })}`);
    }

    await mongoose.disconnect();
}

main().catch(console.error);
