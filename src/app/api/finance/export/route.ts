import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import FinancialLog from '@/models/FinancialLog';
import User from '@/models/User';
import Tournament from '@/models/Tournament';
import mongoose from 'mongoose';
import { Parser } from 'json2csv';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasPermission(session, 'view_finance_visibility')) {
            return new Response('Unauthorized', { status: 401 });
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

        // Shared aggregation pipeline for mapping subCategories
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

        // Define match criteria
        const matchStage: any = {
            timestamp: { $gte: start, $lte: end }
        };
        if (userIdStr) {
            matchStage.userId = new mongoose.Types.ObjectId(userIdStr);
        }

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

        // Fetch logs with user details populated (similar to detailed logs lookup)
        const exportPipeline: any[] = [
            ...listPipeline,
            { $sort: { timestamp: -1 } },
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
            {
                $project: {
                    _id: 1,
                    type: 1,
                    subCategory: 1,
                    amount: 1,
                    currency: 1,
                    description: 1,
                    timestamp: 1,
                    purchaseCost: 1,
                    calculatedProfit: 1,
                    userId: {
                        _id: '$user._id',
                        name: '$user.name',
                        email: '$user.email',
                        inGameName: '$user.inGameName'
                    }
                }
            }
        ];

        const logs = await FinancialLog.aggregate(exportPipeline);

        // Format logs for CSV conversion
        const formattedData = logs.map(log => {
            const date = new Date(log.timestamp).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            const userId = log.userId?._id ? log.userId._id.toString() : 'System';
            const userName = log.userId?.name || '';
            const userEmail = log.userId?.email || '';
            const category = log.subCategory || log.type;
            const amount = log.amount || 0;
            const purchaseCost = log.purchaseCost !== undefined && log.purchaseCost !== null ? log.purchaseCost : '';
            
            // Profit calculation logic matching dashboard
            let actualProfit = 0;
            if (category === 'shop_purchase') {
                actualProfit = log.calculatedProfit !== undefined && log.calculatedProfit !== null 
                    ? log.calculatedProfit 
                    : (amount - (Number(purchaseCost) || 0));
            } else if (category === 'tournament_commission' || category === 'tournament_commission_platform' || category === 'tournament_commission_user') {
                actualProfit = amount;
            } else if (['free_spin', 'free_spin_1k', 'daily_collect', 'lucky_spin'].includes(category)) {
                actualProfit = -amount;
            } else if (category === 'admin_adjustment') {
                actualProfit = -amount;
            } else {
                actualProfit = log.calculatedProfit ?? 0;
            }

            return {
                date,
                userId,
                userName,
                userEmail,
                category,
                amount,
                purchaseCost,
                actualProfit,
                description: log.description || ''
            };
        });

        // Set up json2csv parser
        const fields = [
            { label: 'Date', value: 'date' },
            { label: 'User ID', value: 'userId' },
            { label: 'User Name', value: 'userName' },
            { label: 'User Email', value: 'userEmail' },
            { label: 'Category', value: 'category' },
            { label: 'Amount', value: 'amount' },
            { label: 'Purchase Cost', value: 'purchaseCost' },
            { label: 'Actual Profit', value: 'actualProfit' },
            { label: 'Description', value: 'description' }
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(formattedData);

        const filename = `finance_export_${new Date().toISOString().split('T')[0]}.csv`;

        return new Response(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error: any) {
        console.error("Finance API Export Error:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
