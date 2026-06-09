const mongoose = require('mongoose');

async function check() {
    await mongoose.connect('mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority');

    const TournamentSchema = new mongoose.Schema({
        title: String,
        status: String,
        prizeDistributed: Boolean,
        winners: Object,
        participants: Array
    }, { collection: 'tournaments' });

    const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);

    const tournament = await Tournament.findById('6a21cb22efb38eb23e1408d8');
    console.log("Tournament Details:", {
        id: tournament._id,
        title: tournament.title,
        status: tournament.status,
        prizeDistributed: tournament.prizeDistributed,
        winners: tournament.winners,
        participantsCount: tournament.participants?.length
    });

    process.exit(0);
}

check().catch(console.error);
