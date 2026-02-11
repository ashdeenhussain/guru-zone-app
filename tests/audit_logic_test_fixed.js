
// Mock Data based on User's Scenario
const transactions = [
    { _id: '1', type: 'deposit', amount: 5000, status: 'approved', createdAt: '2026-02-01T10:00:00Z' },
    { _id: '2', type: 'withdrawal', amount: 50, status: 'Rejected', createdAt: '2026-02-01T12:00:00Z' }, // Capital 'R'
    { _id: '3', type: 'withdrawal', amount: 290, status: 'pending', createdAt: '2026-02-01T14:00:00Z' },
    { _id: '4', type: 'entry_fee', amount: 100, status: 'approved', createdAt: '2026-02-01T15:00:00Z' }
];

// Mock User Data with a manual adjustment (e.g., someone manually added 1000 coins in DB)
// Expected Balance from Trx: 5000 - 0 - 290 - 100 = 4610
// Actual Balance in DB: 5610 (manual +1000)
const userData = {
    walletBalance: 5610
};

// FIXED Logic from UserLedgerModal.tsx
const getSignedAmount = (trx) => {
    const status = trx.status?.toLowerCase() || 'pending';
    const type = trx.type;

    // 1. Filter out transactions that have no net effect on balance
    if (['rejected', 'failed', 'cancelled'].includes(status)) {
        return 0;
    }

    // 2. Pending Deposits don't add to balance yet
    if (type === 'deposit' && status === 'pending') {
        return 0;
    }

    const absAmount = Math.abs(trx.amount || 0);

    // 3. Calculate impact
    switch (type) {
        case 'deposit':
        case 'prize_winnings':
        case 'spin_win':
        case 'refund':
        case 'MANUAL_ADJUSTMENT':
            return absAmount;
        case 'withdrawal':
        case 'entry_fee': // Entry fee is a deduction
        case 'admin_deduction':
        case 'shop_purchase':
            return -absAmount;
        case 'ADMIN_ADJUSTMENT':
            return (trx.details?.adjustmentType === 'CREDIT') ? absAmount : -absAmount;
        default:
            return 0;
    }
};

const calculateRunningBalances = (transactions, user) => {
    // Calculate Chronologically (Oldest to Newest)
    const chronological = [...transactions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    let current = 0;
    console.log("--- Initial Calculation Loop ---");
    chronological.forEach(trx => {
        const amount = getSignedAmount(trx);
        current += amount;
        console.log(`Trx: ${trx.type} (${trx.status}) | Amount: ${trx.amount} | Effect: ${amount} | Running: ${current}`);
    });

    console.log(`Calculated from Trx: ${current}`);
    console.log(`Actual User Balance: ${user.walletBalance}`);

    // Detect Discrepancy
    const discrepancy = user.walletBalance - current;
    if (Math.abs(discrepancy) > 1) {
        console.log(`\n!!! Discrepancy Detected: ${discrepancy}. Adding Ghost Transaction...`);

        const ghostTrx = {
            _id: 'manual-adjustment-ghost',
            type: 'MANUAL_ADJUSTMENT',
            amount: discrepancy,
            status: 'completed',
            description: 'Detected Manual Adjustment / Database Edit',
            createdAt: new Date(0).toISOString(),
            isGhost: true
        };

        // Re-calculate
        current = discrepancy; // Start with discrepancy
        console.log(`\n--- Re-Calculation with Ghost (${discrepancy}) ---`);

        chronological.forEach(trx => {
            const amount = getSignedAmount(trx);
            current += amount;
            console.log(`Trx: ${trx.type} (${trx.status}) | Final Running: ${current}`);
        });

        transactions.push(ghostTrx);
    }

    console.log("\n------------------------------------------------");
    console.log(`Final Display Balance: ${current}`);
    if (current === user.walletBalance) {
        console.log("SUCCESS: Display Balance matches User Balance!");
    } else {
        console.log("FAILURE: Mismatch persists.");
    }
};

calculateRunningBalances(transactions, userData);
