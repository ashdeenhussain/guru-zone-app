
// Mock Data based on User's Scenario
const transactions = [
    { _id: '1', type: 'deposit', amount: 5000, status: 'approved', createdAt: '2026-02-01T10:00:00Z' },
    { _id: '2', type: 'withdrawal', amount: 50, status: 'Rejected', createdAt: '2026-02-01T12:00:00Z' }, // The Bug: Capital 'R'
    { _id: '3', type: 'withdrawal', amount: 290, status: 'pending', createdAt: '2026-02-01T14:00:00Z' },
    { _id: '4', type: 'entry_fee', amount: 100, status: 'approved', createdAt: '2026-02-01T15:00:00Z' }
];

// Current Logic from UserLedgerModal.tsx (Simulated)
const getSignedAmount = (trx) => {
    // 1. Filter out transactions that have no net effect on balance
    // BUG HERE: checking strictly against lowercase 'rejected'
    if (trx.status === 'rejected' || trx.status === 'failed' || trx.status === 'cancelled') {
        return 0;
    }

    // 2. Pending Deposits don't add to balance yet
    if (trx.type === 'deposit' && trx.status === 'pending') {
        return 0;
    }

    const absAmount = Math.abs(trx.amount || 0);

    // 3. Calculate impact
    switch (trx.type) {
        case 'deposit':
        case 'prize_winnings':
        case 'spin_win':
        case 'refund':
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

const calculateRunningBalances = (transactions) => {
    // Calculate Chronologically (Oldest to Newest) starting from 0
    // Note: Input 'transactions' is usually Newest-First in the app, so we reverse it.
    // However, my mock data is Oldest-First for readability. Let's assume the API returns Newest-First.
    const chronological = [...transactions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    let current = 0;
    console.log("Starting Balance: 0");

    chronological.forEach(trx => {
        const amount = getSignedAmount(trx);
        current += amount;
        console.log(`Trx: ${trx.type} (${trx.status}) | Amount: ${trx.amount} | Effect: ${amount} | Running: ${current}`);

        if (trx.status === 'Rejected' && amount !== 0) {
            console.log("   ^^^ BUG DETECTED: 'Rejected' transaction reduced balance!");
        }
    });

    console.log("------------------------------------------------");
    console.log(`Final Calculated Balance: ${current}`);

    // In the user's case:
    // 5000 (Dep) - 50 (Rejected, Should be 0) - 290 (Pending Withdraw) - 100 (Entry) = 4560
    // Correct: 5000 - 0 - 290 - 100 = 4610
};

calculateRunningBalances(transactions);
