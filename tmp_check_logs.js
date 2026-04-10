require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const AdminActivitySchema = new mongoose.Schema({ adminName: String, actionType: String, targetId: mongoose.Schema.Types.ObjectId, details: String, createdAt: Date });
const AdminActivity = mongoose.models.AdminActivity || mongoose.model('AdminActivity', AdminActivitySchema);

async function checkAdminActivity() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const start = new Date('2026-03-20T00:00:00Z');
        const end = new Date('2026-04-06T00:00:00Z');
        
        console.log('--- Admin Activities recently ---');
        const logs = await AdminActivity.find({ createdAt: { $gte: start, $lt: end } }).sort({ createdAt: -1 });
        console.log(JSON.stringify(logs, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkAdminActivity();
