const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' }); // Try .env.local first, then .env

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
}

// Define Schemas (using strict: false to be flexible with existing data)
const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema);

const TournamentSchema = new mongoose.Schema({
    title: String,
    formattedDate: String, // Just in case
    prizePool: Number,
    winners: {
        rank1: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rank2: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rank3: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    status: String,
}, { strict: false, timestamps: true });
const Tournament = mongoose.model('Tournament', TournamentSchema);

const TransactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    type: String,
    description: String,
    referenceId: { type: mongoose.Schema.Types.Mixed }, // User mentioned this, so we include it to check
    details: { type: mongoose.Schema.Types.Mixed },
}, { strict: false, timestamps: true });
const Transaction = mongoose.model('Transaction', TransactionSchema);

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        // 1. Find Tournament (Yesterday or specific ID)
        // Check for command line argument for Tournament ID
        const tournamentId = process.argv[2];
        let tournament;

        if (tournamentId) {
            console.log(`Searching for Tournament ID: ${tournamentId}`);
            tournament = await Tournament.findById(tournamentId);
        } else {
            console.log('Searching for Tournament from YESTERDAY...');
            const yesterdayStart = new Date();
            yesterdayStart.setDate(yesterdayStart.getDate() - 1);
            yesterdayStart.setHours(0, 0, 0, 0);

            const yesterdayEnd = new Date();
            yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
            yesterdayEnd.setHours(23, 59, 59, 999);

            // Find one tournament completed yesterday. You might want to list all if multiple.
            const tournaments = await Tournament.find({
                // Looking for tournaments updated/completed yesterday
                updatedAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
                status: 'Completed'
            }).sort({ updatedAt: -1 });

            if (tournaments.length === 0) {
                console.log('No completed tournaments found for yesterday.');
                process.exit(0);
            }
            if (tournaments.length > 1) {
                console.log(`Found ${tournaments.length} tournaments from yesterday. checking the most recent one.`);
                tournaments.forEach(t => console.log(` - ID: ${t._id}, Title: ${t.title}, Prize: ${t.prizePool}`));
            }
            tournament = tournaments[0];
        }

        if (!tournament) {
            console.error('Tournament not found.');
            process.exit(1);
        }

        console.log(`\nAnalyzing Tournament: ${tournament.title} (ID: ${tournament._id})`);
        console.log(`Prize Pool: ${tournament.prizePool}`);
        console.log(`Winners:`, tournament.winners);

        // 2. Identify Winner (Rank 1)
        const winnerId = tournament.winners ? tournament.winners.rank1 : null;
        if (!winnerId) {
            console.log('No Rank 1 winner found in this tournament.');
            process.exit(0);
        }
        console.log(`Winner ID: ${winnerId}`);

        // 3. Query Transactions for Winner
        console.log('\nSearching for Transactions...');

        // Strategy: Look for transactions with 'prize_winnings' type for this user
        // We can also filter by description containing tournament title if referenceId is missing
        const transactions = await Transaction.find({
            user: winnerId,
            type: 'prize_winnings',
            // Optional: constrain by date range if checks are needed
        }).sort({ createdAt: -1 });

        console.log(`Found ${transactions.length} 'prize_winnings' transactions for user ${winnerId}.`);

        // 4. Check for duplicates / double payment
        const tournamentTransactions = transactions.filter(t => {
            const desc = t.description || '';
            const matchesTitle = desc.includes(tournament.title);
            // Check referenceId if it exists (schema strict:false allows finding it if in DB)
            const matchesRef = t.referenceId && t.referenceId.toString() === tournament._id.toString();

            return matchesTitle || matchesRef;
        });

        console.log(`\n--- Transactions Linked to Tournament "${tournament.title}" ---`);
        if (tournamentTransactions.length === 0) {
            console.log('No transactions found specifically linking to this tournament title or ID.');
            // Fallback: Show all recent prize_winnings
            console.log('Showing last 5 prize_winnings transactions for manual inspection:');
            transactions.slice(0, 5).forEach(t => {
                console.log(`[${t.createdAt.toISOString()}] Amount: ${t.amount}, Desc: ${t.description}, RefId: ${t.referenceId}, ID: ${t._id}`);
            });
        } else {
            tournamentTransactions.forEach(t => {
                console.log(`[${t.createdAt.toISOString()}] Amount: ${t.amount}, Desc: ${t.description}, RefId: ${t.referenceId}, ID: ${t._id}`);
            });

            const totalPaid = tournamentTransactions.reduce((acc, t) => acc + t.amount, 0);
            console.log(`\nTotal Paid for this tournament: ${totalPaid}`);

            if (tournamentTransactions.length > 1) {
                console.warn(`\n*** POTENTIAL DOUBLE PAYMENT DETECTED ***`);
                console.warn(`Found ${tournamentTransactions.length} records. Expected 1.`);
            } else {
                console.log(`\nPayment count seems normal (1 record).`);
            }
        }

    } catch (err) {
        console.error('Script Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB.');
    }
}

run();
