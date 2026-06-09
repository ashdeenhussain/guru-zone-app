const mongoose = require('mongoose');

async function main() {
    // 1. Compile model first time (simulating old version without kills)
    const Schema1 = new mongoose.Schema({
        participants: [{
            userId: String
        }]
    });
    let Tournament = mongoose.models.Tournament || mongoose.model('Tournament', Schema1);
    console.log("Compiled first version. Has kills path?", !!Tournament.schema.path('participants.kills'));

    // 2. Try to recompile with new version if it doesn't have kills
    if (mongoose.models.Tournament) {
        const hasKills = Tournament.schema.path('participants.kills');
        if (!hasKills) {
            console.log("Stale model detected. Deleting from cache...");
            delete mongoose.models.Tournament;
            if (mongoose.connection.models.Tournament) {
                delete mongoose.connection.models.Tournament;
            }
        }
    }

    const Schema2 = new mongoose.Schema({
        participants: [{
            userId: String,
            kills: Number
        }]
    });
    
    Tournament = mongoose.models.Tournament || mongoose.model('Tournament', Schema2);
    console.log("Compiled second version. Has kills path?", !!Tournament.schema.path('participants.kills'));

    process.exit(0);
}

main().catch(console.error);
