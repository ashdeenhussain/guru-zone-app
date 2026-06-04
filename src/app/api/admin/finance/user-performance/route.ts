import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAuthorized = session.user.role === 'admin' || 
            hasPermission(session, 'manage_finance') || 
            hasPermission(session, 'view_finance_visibility');
            
        if (!isAuthorized) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectToDatabase();

        // MongoDB Aggregation to get user details and summarize transaction data
        const performanceData = await User.aggregate([
            { $match: { role: 'user' } },
            {
                $lookup: {
                    from: 'transactions',
                    localField: '_id',
                    foreignField: 'user',
                    as: 'txs'
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    totalDeposits: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$txs',
                                        as: 't',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$t.type', 'deposit'] },
                                                { $in: ['$$t.status', ['approved', 'Approved', 'completed', 'Completed']] }
                                            ]
                                        }
                                    }
                                },
                                as: 't',
                                in: '$$t.amount'
                            }
                        }
                    },
                    totalFreebies: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$txs',
                                        as: 't',
                                        cond: {
                                            $and: [
                                                { $in: ['$$t.type', ['daily_free_coins', 'daily_reward_spin', 'free_spin', 'spin_win', 'rank_reward', 'daily_collect']] },
                                                { $in: ['$$t.status', ['approved', 'Approved', 'completed', 'Completed']] }
                                            ]
                                        }
                                    }
                                },
                                as: 't',
                                in: '$$t.amount'
                            }
                        }
                    },
                    adminCredits: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$txs',
                                        as: 't',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$t.type', 'ADMIN_ADJUSTMENT'] },
                                                { $eq: ['$$t.details.adjustmentType', 'CREDIT'] },
                                                { $in: ['$$t.status', ['approved', 'Approved', 'completed', 'Completed']] }
                                            ]
                                        }
                                    }
                                },
                                as: 't',
                                in: '$$t.amount'
                            }
                        }
                    },
                    adminDebits: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$txs',
                                        as: 't',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$t.type', 'ADMIN_ADJUSTMENT'] },
                                                { $eq: ['$$t.details.adjustmentType', 'DEBIT'] },
                                                { $in: ['$$t.status', ['approved', 'Approved', 'completed', 'Completed']] }
                                            ]
                                        }
                                    }
                                },
                                as: 't',
                                in: '$$t.amount'
                            }
                        }
                    }
                }
            }
        ]);

        const formattedData = performanceData.map(user => {
            const totalDeposits = user.totalDeposits || 0;
            const totalFreebies = user.totalFreebies || 0;
            const adminAdjustments = (user.adminCredits || 0) - (user.adminDebits || 0);
            
            const denominator = totalFreebies + adminAdjustments;
            let ratio = 0;
            if (denominator <= 0) {
                ratio = totalDeposits > 0 ? 999.0 : 0.0;
            } else {
                ratio = totalDeposits / denominator;
            }

            return {
                _id: user._id.toString(),
                name: user.name,
                email: user.email,
                totalDeposits,
                totalFreebies,
                adminAdjustments,
                ratio: parseFloat(ratio.toFixed(2))
            };
        });

        return NextResponse.json({ success: true, data: formattedData });
    } catch (error: any) {
        console.error('Error fetching user performance stats:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
