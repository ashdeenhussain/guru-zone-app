const mongoose = require('mongoose');

const uri = "mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority";

const TOURNAMENT_ID = "6a0dcb055d99eafbaa6e9894"; // CS Hidshot 4V4

async function main() {
    await mongoose.connect(uri);
    console.log("✅ MongoDB سے کنکشن ہو گیا۔");

    const TournamentSchema = new mongoose.Schema({
        title: String,
        status: String,
        cancellationReason: String,
        participants: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
        entryFee: Number
    }, { strict: false });
    const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema, 'tournaments');

    const UserSchema = new mongoose.Schema({ walletBalance: Number }, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', UserSchema, 'users');

    const TransactionSchema = new mongoose.Schema({}, { strict: false });
    const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema, 'transactions');

    // ٹورنامنٹ تلاش کریں
    const t = await Tournament.findById(TOURNAMENT_ID);
    if (!t) {
        console.log("❌ ٹورنامنٹ نہیں ملا! ID چیک کریں۔");
        await mongoose.disconnect();
        return;
    }

    console.log(`\n📋 ٹورنامنٹ مل گیا: "${t.title}"`);
    console.log(`   Status: ${t.status}`);
    console.log(`   Entry Fee: ${t.entryFee} coins`);
    console.log(`   Participants: ${t.participants.length}`);

    if (t.status === 'cancelled' || t.status === 'Cancelled') {
        console.log("⚠️  یہ ٹورنامنٹ پہلے سے کینسل ہے۔");
        await mongoose.disconnect();
        return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // ٹورنامنٹ کینسل کریں
        t.status = 'cancelled';
        t.cancellationReason = 'Tournament cancelled by admin. Entry fee has been fully refunded.';
        t.isVisible = false;
        t.cancelledAt = new Date();
        await t.save({ session });
        console.log(`\n🚫 ٹورنامنٹ "${t.title}" کینسل کر دیا گیا۔`);

        // ہر پارٹیسیپنٹ کو ریفنڈ کریں
        for (const p of t.participants) {
            const u = await User.findById(p.userId).session(session);
            if (u) {
                const oldBalance = u.walletBalance || 0;
                u.walletBalance = oldBalance + t.entryFee;
                await u.save({ session });

                await Transaction.create([{
                    user: u._id,
                    amount: t.entryFee,
                    type: 'refund',
                    description: `Refund for Cancelled Tournament: ${t.title}`,
                    status: 'completed',
                    referenceId: t._id,
                    createdAt: new Date()
                }], { session });

                console.log(`💰 ریفنڈ: User ${u._id}`);
                console.log(`   InGame Name: ${p.inGameName || 'N/A'}`);
                console.log(`   پہلا Balance: ${oldBalance} → نیا Balance: ${u.walletBalance}`);
                console.log(`   Refunded: ${t.entryFee} coins ✅`);
            } else {
                console.log(`⚠️  User ${p.userId} نہیں ملا، ریفنڈ skip کیا۔`);
            }
        }

        await session.commitTransaction();
        console.log("\n✅ کامیاب! ٹورنامنٹ کینسل اور ریفنڈ مکمل ہو گیا۔");
        console.log("   • Status: cancelled");
        console.log(`   • Total refunded: ${t.participants.length * t.entryFee} coins`);

    } catch (e) {
        await session.abortTransaction();
        console.error("❌ Error آ گئی، rollback کر دیا:", e.message);
    } finally {
        session.endSession();
    }

    await mongoose.disconnect();
    console.log("\n🔌 MongoDB کنکشن بند کر دیا۔");
}

main().catch(console.error);
