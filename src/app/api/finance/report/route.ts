import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import FinancialLog from '@/models/FinancialLog';
import User from '@/models/User';
import Tournament from '@/models/Tournament';
import mongoose from 'mongoose';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasPermission(session, 'view_finance_visibility')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');
        const categoriesStr = searchParams.get('categories');
        const userIdStr = searchParams.get('userId');

        await connectToDatabase();

        // Calculate date range matching start/end dates
        const now = new Date();
        let start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // default 30 days ago
        let end = new Date(now);

        if (startDateStr) {
            start = new Date(startDateStr);
            start.setHours(0, 0, 0, 0);
        }
        if (endDateStr) {
            end = new Date(endDateStr);
            end.setHours(23, 59, 59, 999);
        }

        // Parse Categories
        let categories: string[] = [];
        if (categoriesStr && categoriesStr !== 'all') {
            categories = categoriesStr.split(',').map(c => c.trim()).filter(Boolean);
        }

        // 1. Shared aggregation pipeline for mapping subCategories
        const basePipeline: any[] = [
            {
                $lookup: {
                    from: 'tournaments',
                    localField: 'referenceId',
                    foreignField: '_id',
                    as: 'tournament'
                }
            },
            {
                $unwind: {
                    path: '$tournament',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    subCategory: {
                        $cond: [
                            { $regexMatch: { input: { $ifNull: ['$description', ''] }, regex: 'Lucky', options: 'i' } },
                            'lucky_spin',
                            {
                                $cond: [
                                    { $regexMatch: { input: { $ifNull: ['$description', ''] }, regex: 'Daily.*Spin', options: 'i' } },
                                    'free_spin_1k',
                                    {
                                        $cond: [
                                            { $eq: ['$type', 'deposit'] }, 'deposit',
                                            { $cond: [
                                                { $eq: ['$type', 'withdrawal'] }, 'withdrawal',
                                                { $cond: [
                                                    { $eq: ['$type', 'shop_purchase'] }, 'shop_purchase',
                                                    { $cond: [
                                                        { $eq: ['$type', 'prize_winnings'] }, 'prize_winnings',
                                                        { $cond: [
                                                            { $eq: ['$type', 'daily_collect'] }, 'daily_collect',
                                                            { $cond: [
                                                                { $eq: ['$type', 'free_spin'] }, 'free_spin_1k',
                                                                { $cond: [
                                                                    { $eq: ['$type', 'tournament_commission'] },
                                                                    {
                                                                        $cond: [
                                                                            { $eq: ['$tournament.isOfficial', true] },
                                                                            'tournament_commission_platform',
                                                                            'tournament_commission_user'
                                                                        ]
                                                                    },
                                                                    { $cond: [
                                                                        { $eq: ['$type', 'admin_adjustment'] },
                                                                        'admin_adjustment',
                                                                        '$type'
                                                                    ]}
                                                                ]}
                                                            ]}
                                                        ]}
                                                    ]}
                                                ]}
                                            ]}
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
        ];

        // Define match criteria for user filter
        const matchStage: any = {
            timestamp: { $gte: start, $lte: end }
        };
        if (userIdStr) {
            matchStage.userId = new mongoose.Types.ObjectId(userIdStr);
        }

        // Fetch completed official tournaments within the date range, sanitizing cancelled and test tournaments
        let platformTournamentsNetProfit = 0;
        const dailyPlatformProfit: Record<string, number> = {};

        if (!userIdStr) {
            const officialTournaments = await Tournament.find({
                status: { $in: ['completed', 'Completed'] },
                isTestData: { $ne: true },
                $or: [
                    { isOfficial: true },
                    { createdBy: null }
                ],
                updatedAt: { $gte: start, $lte: end }
            });

            for (const t of officialTournaments) {
                const revenue = (t.entryFee || 0) * (t.joinedCount || 0);
                let expenses = 0;

                if (t.prizeDistributed) {
                    if (t.isPerKill) {
                        const logs = await FinancialLog.find({
                            type: 'prize_winnings',
                            referenceId: t._id
                        });
                        expenses = logs.reduce((sum, log) => sum + (log.amount || 0), 0);
                    } else {
                        expenses = t.prizePayoutAmount > 0 ? t.prizePayoutAmount : (t.prizePool || 0);
                    }
                }

                const net = revenue - expenses;
                platformTournamentsNetProfit += net;

                // Group by date in local +05:00 timezone
                const updatedDate = t.updatedAt || t.createdAt || new Date();
                const dateStr = new Date(updatedDate.getTime() + 5 * 60 * 60 * 1000).toISOString().split('T')[0];
                dailyPlatformProfit[dateStr] = (dailyPlatformProfit[dateStr] || 0) + net;
            }
        }

        // Summary Stats Aggregation
        const summaryStats = await FinancialLog.aggregate([
            {
                $match: matchStage
            },
            ...basePipeline,
            {
                $group: {
                    _id: '$subCategory',
                    totalAmount: { $sum: '$amount' },
                    totalProfit: { $sum: { $ifNull: [ '$calculatedProfit', 0 ] } },
                    totalCost: { $sum: { $ifNull: [ '$purchaseCost', 0 ] } }
                }
            }
        ]);

        const totals: Record<string, number> = {
            deposit: 0,
            withdrawal: 0,
            shop_purchase: 0,
            tournament_commission_platform: 0,
            tournament_commission_user: 0,
            free_spin_1k: 0,
            daily_collect: 0,
            lucky_spin: 0,
            prize_winnings: 0,
            admin_adjustment: 0,
            rank_reward: 0
        };
        const profits: Record<string, number> = {
            shop_purchase: 0
        };
        const costs: Record<string, number> = {
            shop_purchase: 0
        };

        summaryStats.forEach(stat => {
            if (stat._id in totals) {
                totals[stat._id] = stat.totalAmount;
            }
            if (stat._id === 'shop_purchase') {
                profits.shop_purchase = stat.totalProfit || 0;
                costs.shop_purchase = stat.totalCost || 0;
            }
        });

        // Calculations strictly per requirements:
        // Actual Profit = (Sum of Shop Net Profit) + (Sum of Tournament Commissions) - (Sum of Freebies) - (Sum of Admin Adjustments)
        // Cash on Hand = Total Deposits - Total Withdrawals - Shop Expenses
        const totalDeposits = totals.deposit;
        const totalWithdrawals = totals.withdrawal;
        const totalPrizesPaid = totals.prize_winnings;
        const totalShopSales = totals.shop_purchase;
        const totalShopProfit = profits.shop_purchase;
        const totalShopExpenses = costs.shop_purchase;

        // Use the actual platform tournaments net profit calculated directly from completed official tournaments
        const totalCommissionsPlatform = platformTournamentsNetProfit;
        const totalCommissionsUser = totals.tournament_commission_user;
        const totalCommissions = totalCommissionsPlatform + totalCommissionsUser;

        const totalFreebies1k = totals.free_spin_1k;
        const totalFreebiesDaily = totals.daily_collect;
        const totalFreebiesLucky = totals.lucky_spin;
        const totalFreebiesRank = totals.rank_reward;
        const totalFreebies = totalFreebies1k + totalFreebiesDaily + totalFreebiesLucky + totalFreebiesRank;
        const totalAdminAdjustments = totals.admin_adjustment;

        // Strict Net Profit formula:
        const actualProfit = totalShopProfit + totalCommissionsPlatform + totalCommissionsUser - totalFreebies - totalAdminAdjustments;

        // Cash Flow Net:
        const cashOnHand = totalDeposits - totalWithdrawals - totalShopExpenses;

        // Chart data daily aggregation
        const chartStats = await FinancialLog.aggregate([
            {
                $match: matchStage
            },
            ...basePipeline,
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp', timezone: '+05:00' } },
                        subCategory: '$subCategory'
                    },
                    totalAmount: { $sum: '$amount' },
                    totalProfit: { $sum: { $ifNull: [ '$calculatedProfit', 0 ] } }
                }
            },
            {
                $group: {
                    _id: '$_id.date',
                    deposits: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.subCategory', 'deposit'] }, '$totalAmount', 0]
                        }
                    },
                    withdrawals: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.subCategory', 'withdrawal'] }, '$totalAmount', 0]
                        }
                    },
                    shopSales: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.subCategory', 'shop_purchase'] }, '$totalAmount', 0]
                        }
                    },
                    shopProfit: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.subCategory', 'shop_purchase'] }, '$totalProfit', 0]
                        }
                    },
                    tournamentProfitPlatform: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.subCategory', 'tournament_commission_platform'] }, '$totalAmount', 0]
                        }
                    },
                    tournamentProfitUser: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.subCategory', 'tournament_commission_user'] }, '$totalAmount', 0]
                        }
                    },
                    freebies1k: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.subCategory', 'free_spin_1k'] }, '$totalAmount', 0]
                        }
                    },
                    freebiesDaily: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.subCategory', 'daily_collect'] }, '$totalAmount', 0]
                        }
                    },
                    freebiesLucky: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.subCategory', 'lucky_spin'] }, '$totalAmount', 0]
                        }
                    },
                    freebiesRank: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.subCategory', 'rank_reward'] }, '$totalAmount', 0]
                        }
                    },
                    prizePayouts: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.subCategory', 'prize_winnings'] }, '$totalAmount', 0]
                        }
                    },
                    adminAdjustments: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.subCategory', 'admin_adjustment'] }, '$totalAmount', 0]
                        }
                    }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Get all unique dates in range (sorted)
        const dateSet = new Set<string>();
        chartStats.forEach(item => dateSet.add(item._id));
        Object.keys(dailyPlatformProfit).forEach(date => dateSet.add(date));
        
        const sortedDates = Array.from(dateSet).sort();
        const statsMap = new Map<string, any>();
        chartStats.forEach(item => statsMap.set(item._id, item));
        
        const chartData = sortedDates.map(date => {
            const item = statsMap.get(date) || {
                deposits: 0,
                withdrawals: 0,
                shopSales: 0,
                shopProfit: 0,
                tournamentProfitUser: 0,
                freebies1k: 0,
                freebiesDaily: 0,
                freebiesLucky: 0,
                freebiesRank: 0,
                prizePayouts: 0,
                adminAdjustments: 0
            };
            const platformProfit = dailyPlatformProfit[date] || 0;
            return {
                date,
                Deposits: item.deposits,
                Withdrawals: item.withdrawals,
                ShopSales: item.shopSales,
                ShopProfit: item.shopProfit,
                TournamentProfitPlatform: platformProfit,
                TournamentProfitUser: item.tournamentProfitUser,
                Freebies1k: item.freebies1k,
                FreebiesDaily: item.freebiesDaily,
                FreebiesLucky: item.freebiesLucky,
                FreebiesRank: item.freebiesRank,
                PrizePayouts: item.prizePayouts,
                AdminAdjustments: item.adminAdjustments
            };
        });

        // Detailed breakdown query with pagination
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));
        const skip = (page - 1) * limit;

        const listPipeline: any[] = [
            {
                $match: matchStage
            },
            ...basePipeline
        ];

        if (categories.length > 0) {
            listPipeline.push({
                $match: {
                    subCategory: { $in: categories }
                }
            });
        }

        // Count total matching logs
        const countPipeline = [...listPipeline, { $count: 'count' }];
        const countResult = await FinancialLog.aggregate(countPipeline);
        const totalLogs = countResult[0]?.count || 0;

        // Fetch paginated logs
        const logsPipeline: any[] = [
            ...listPipeline,
            { $sort: { timestamp: -1 } },
            { $skip: skip },
            { $limit: limit },
            // Populate user fields
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            // Lookup Admin who adjusted if type is admin_adjustment
            {
                $lookup: {
                    from: 'users',
                    localField: 'adminId',
                    foreignField: '_id',
                    as: 'adminUser'
                }
            },
            {
                $unwind: {
                    path: '$adminUser',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    type: 1,
                    subCategory: 1,
                    amount: 1,
                    currency: 1,
                    description: 1,
                    timestamp: 1,
                    userId: {
                        name: '$user.name',
                        email: '$user.email',
                        inGameName: '$user.inGameName'
                    },
                    adminId: {
                        name: '$adminUser.name',
                        email: '$adminUser.email'
                    }
                }
            }
        ];
        const logs = await FinancialLog.aggregate(logsPipeline);

        return NextResponse.json({
            success: true,
            summary: {
                actualProfit,
                cashOnHand,
                totalDeposits,
                totalWithdrawals,
                totalFreebies,
                totalFreebies1k,
                totalFreebiesDaily,
                totalFreebiesLucky,
                totalFreebiesRank,
                totalAdminAdjustments,
                totalCommissions,
                totalCommissionsPlatform,
                totalCommissionsUser,
                totalPrizesPaid,
                totalShopSales,
                totalShopProfit,
                totalShopExpenses
            },
            chartData,
            logs,
            pagination: {
                totalLogs,
                page,
                limit,
                totalPages: Math.ceil(totalLogs / limit)
            }
        });

    } catch (error: any) {
        console.error("Finance API Report Error:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
