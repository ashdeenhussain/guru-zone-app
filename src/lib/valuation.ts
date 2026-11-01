export type AccountTier = 'starter' | 'veteran' | 'elite' | 'legendary' | 'god_tier';

export interface EvoGunConfig {
    id: string;
    name: string;
    gunType: string;
    icon?: string;
    defaultLevel?: number;
}

export interface EvoGunSelection {
    id: string;
    name: string;
    level: number; // 1 to 7
}

export interface ValuationAnswers {
    // Step 1: Account Basics
    levelRange: '30-50' | '51-65' | '66-75' | '75+';
    exactLevel?: number;
    
    // Step 2: Account Age / History
    startSeason: 's1-5' | 's6-10' | 's11-20' | 'recent';
    
    // Step 3: Membership / VIP
    membership: 'none' | 'weekly' | 'monthly' | 'vip_prime';
    
    // Step 4: Evo Guns (Conditional)
    hasEvoGuns: boolean;
    evoGuns: EvoGunSelection[];
    
    // Step 5: Rare Bundles
    rareBundles: string[]; // e.g. ['sakura_hiphop', 'incubator_top', 'magic_cube', 'collab_exclusive']
    
    // Step 6: Gloo Wall Skins
    glooWallCount: '0-5' | '6-15' | '16-30' | '30+';
    
    // Step 7: Rare Emotes & Animations
    hasRareEmotes: boolean;
    rareEmotesList: string[]; // ['cobra', 'teleport', 'throne_teatime', 'pirate_flag', 'heart_propose', 'arrival_anim']
    
    // Step 8: Rank & Reputation
    highestRank: 'diamond' | 'heroic' | 'master' | 'grandmaster';
    server: 'pk' | 'bd' | 'ind' | 'mena' | 'other';
    likeCount: 'under_5k' | '5k_15k' | '15k_plus';
}

export interface ValueBreakdown {
    levelAndAge: number;
    evoGuns: number;
    rareBundles: number;
    collectionsAndEmotes: number;
    rankAndReputation: number;
}

export interface ValuationResult {
    minPrice: number;
    maxPrice: number;
    estimatedValue: number;
    estimatedDiamondsSpent: number;
    accountTier: AccountTier;
    tierTitle: string;
    tierBadge: string;
    confidenceScore: number;
    breakdown: ValueBreakdown;
    highlights: string[];
    summaryText: string;
}

export const POPULAR_EVO_GUNS: { id: string; name: string; tag: string }[] = [
    { id: 'mp40_cobra', name: 'MP40 - Predatory Cobra', tag: 'Top Pick' },
    { id: 'm1887_conqueror', name: 'M1887 - Sterling Conqueror', tag: 'Shotgun King' },
    { id: 'scar_megalodon', name: 'SCAR - Megalodon Alpha', tag: 'Classic' },
    { id: 'ak47_draco', name: 'AK47 - Blue Flame Draco', tag: 'OG Dragon' },
    { id: 'xm8_guardian', name: 'XM8 - Destiny Guardian', tag: 'Meta AR' },
    { id: 'm1014_draco', name: 'M1014 - Green Flame Draco', tag: 'Shotgun' },
    { id: 'ump_booyah', name: 'UMP - Booyah Day / Flying', tag: 'SMG Meta' },
    { id: 'famas_grin', name: 'FAMAS - Demonic Grin', tag: 'Burst Fire' },
    { id: 'thompson_carna', name: 'Thompson - Carna', tag: 'Rapid' },
    { id: 'groza_bang', name: 'Groza - AirDrop Beast', tag: 'Rare' },
    { id: 'mp5_platinum', name: 'MP5 - Platinum Divinity', tag: 'SMG' },
];

export const RARE_BUNDLE_OPTIONS = [
    {
        id: 'sakura_hiphop',
        title: 'Season 1-2 OG Passes (Sakura / Hip Hop)',
        description: 'Extremely rare early Elite Pass outfits (highest market resale multiplier)',
        multiplier: 'God Tier',
        badgeColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10'
    },
    {
        id: 'incubator_top',
        title: 'Top Incubator Bundles (Bandit, Slaughter, Galaxy)',
        description: 'First-slot blueprint incubator sets with unique VFX',
        multiplier: 'High Demand',
        badgeColor: 'text-purple-400 border-purple-500/30 bg-purple-500/10'
    },
    {
        id: 'collab_exclusive',
        title: 'Collab Outfits (Money Heist, Attack on Titan, OPM)',
        description: 'Time-limited anime & movie crossover collections that rarely return',
        multiplier: 'Exclusive',
        badgeColor: 'text-red-400 border-red-500/30 bg-red-500/10'
    },
    {
        id: 'magic_cube',
        title: 'Magic Cube & Legendary Outfits (Arctic Blue, Joker)',
        description: 'Store & cube redeemable iconic legendary sets',
        multiplier: 'Classic',
        badgeColor: 'text-blue-400 border-blue-500/30 bg-blue-500/10'
    },
    {
        id: 'old_elite_passes',
        title: 'Season 3-10 Elite Pass Bundles (Steampunk, Breakdance)',
        description: 'Vintage outfits from early Free Fire golden era',
        multiplier: 'Rare',
        badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    }
];

export const RARE_EMOTE_OPTIONS = [
    { id: 'cobra', label: 'Cobra Dance / Predator', tag: 'Legendary' },
    { id: 'teleport', label: 'Teleport / Time Warp', tag: 'Animation' },
    { id: 'throne_teatime', label: 'Throne / Tea Time / Pirate Flag', tag: 'OG Emote' },
    { id: 'heart_propose', label: 'Flowers of Love / Heart / Propose', tag: 'Romantic' },
    { id: 'arrival_anim', label: 'Lobby Arrival Animation (Dragon/Cyber/Pegasus)', tag: 'VIP Entry' },
    { id: 'evo_emotes', label: 'Exclusive Max Evo Gun Emotes', tag: 'Action' }
];

/**
 * Calculates Free Fire ID Valuation in PKR with detailed breakdown
 */
export function calculateIdValuation(answers: ValuationAnswers): ValuationResult {
    let basePrice = 1500; // Minimum price floor in PKR
    let estimatedDiamondsSpent = 2500;

    let levelAndAge = 0;
    let evoGunsVal = 0;
    let rareBundlesVal = 0;
    let collectionsVal = 0;
    let rankAndRepVal = 0;

    const highlights: string[] = [];

    // --- 1. Level Calculation ---
    switch (answers.levelRange) {
        case '30-50':
            levelAndAge += 500;
            estimatedDiamondsSpent += 2000;
            break;
        case '51-65':
            levelAndAge += 2000;
            estimatedDiamondsSpent += 8000;
            highlights.push('⭐ Veteran Account Level (51-65)');
            break;
        case '66-75':
            levelAndAge += 5000;
            estimatedDiamondsSpent += 20000;
            highlights.push('⭐ Elite High-Level Account (66-75)');
            break;
        case '75+':
            levelAndAge += 9500;
            estimatedDiamondsSpent += 45000;
            highlights.push('👑 Master Level (75+) with supreme profile status');
            break;
    }

    // --- 2. Season Age Calculation ---
    switch (answers.startSeason) {
        case 's1-5':
            levelAndAge += 15000;
            estimatedDiamondsSpent += 35000;
            highlights.push('🔥 Ultra-Rare Vintage Era (Season 1-5 Account)');
            break;
        case 's6-10':
            levelAndAge += 6000;
            estimatedDiamondsSpent += 15000;
            highlights.push('🏆 Golden Era Account (Season 6-10)');
            break;
        case 's11-20':
            levelAndAge += 2500;
            estimatedDiamondsSpent += 8000;
            break;
        case 'recent':
            levelAndAge += 500;
            break;
    }

    // --- 3. Membership & Top-Up Level ---
    switch (answers.membership) {
        case 'weekly':
            levelAndAge += 600;
            estimatedDiamondsSpent += 3000;
            break;
        case 'monthly':
            levelAndAge += 1500;
            estimatedDiamondsSpent += 7000;
            highlights.push('💎 Active Monthly Pass Subscriber');
            break;
        case 'vip_prime':
            levelAndAge += 3500;
            estimatedDiamondsSpent += 18000;
            highlights.push('💎 VIP / High Prime Level Account');
            break;
        case 'none':
        default:
            break;
    }

    // --- 4. Evo Guns Valuation ---
    if (answers.hasEvoGuns && answers.evoGuns && answers.evoGuns.length > 0) {
        let maxLevelCount = 0;
        let midLevelCount = 0;
        let baseLevelCount = 0;

        answers.evoGuns.forEach(gun => {
            if (gun.level === 7) {
                // Max level evo guns cost 14,000+ diamonds each (~Rs. 20,000+ in-game store cost)
                evoGunsVal += 8500;
                estimatedDiamondsSpent += 14500;
                maxLevelCount++;
            } else if (gun.level >= 4) {
                // Level 4-6 unlocks double damage attributes and firing sound
                evoGunsVal += 3800;
                estimatedDiamondsSpent += 7500;
                midLevelCount++;
            } else {
                // Level 1-3
                evoGunsVal += 1500;
                estimatedDiamondsSpent += 3000;
                baseLevelCount++;
            }
        });

        if (maxLevelCount > 0) {
            highlights.push(`⚡ ${maxLevelCount}x Max Level (Lv.7) Evo Gun${maxLevelCount > 1 ? 's' : ''} with exclusive Emote`);
            // Synergy bonus for multiple max evos
            if (maxLevelCount >= 3) {
                evoGunsVal += 4000;
                highlights.push('🔥 Multi-Max Evo Arsenal Synergy Multiplier');
            }
        } else if (midLevelCount > 0) {
            highlights.push(`🎯 ${midLevelCount}x Upgraded (Lv.4-6) Evo Gun${midLevelCount > 1 ? 's' : ''}`);
        } else {
            highlights.push(`🔫 ${answers.evoGuns.length}x Evo Gun Arsenal`);
        }
    }

    // --- 5. Rare Bundles Valuation ---
    if (answers.rareBundles && answers.rareBundles.length > 0) {
        if (answers.rareBundles.includes('sakura_hiphop')) {
            rareBundlesVal += 22000;
            estimatedDiamondsSpent += 40000;
            highlights.push('👑 Holy Grail: S1/S2 Sakura or Hip Hop Bundle');
        }
        if (answers.rareBundles.includes('incubator_top')) {
            rareBundlesVal += 5000;
            estimatedDiamondsSpent += 18000;
            highlights.push('✨ Top Incubator VFX Bundle Collection');
        }
        if (answers.rareBundles.includes('collab_exclusive')) {
            rareBundlesVal += 4500;
            estimatedDiamondsSpent += 15000;
            highlights.push('🎭 Limited Edition Collab Sets (Money Heist / AOT / OPM)');
        }
        if (answers.rareBundles.includes('old_elite_passes')) {
            rareBundlesVal += 3500;
            estimatedDiamondsSpent += 10000;
            highlights.push('👘 Vintage Early Elite Pass Bundles (S3-S10)');
        }
        if (answers.rareBundles.includes('magic_cube')) {
            rareBundlesVal += 1500;
            estimatedDiamondsSpent += 5000;
        }
    }

    // --- 6. Gloo Wall Skins ---
    switch (answers.glooWallCount) {
        case '0-5':
            collectionsVal += 300;
            estimatedDiamondsSpent += 1000;
            break;
        case '6-15':
            collectionsVal += 1800;
            estimatedDiamondsSpent += 6000;
            break;
        case '16-30':
            collectionsVal += 4200;
            estimatedDiamondsSpent += 15000;
            highlights.push('🛡️ Heavy Collector: 16-30 Gloo Wall Skins');
            break;
        case '30+':
            collectionsVal += 8000;
            estimatedDiamondsSpent += 30000;
            highlights.push('🛡️ Arsenal Master: 30+ Exclusive Gloo Wall Skins');
            break;
    }

    // --- 7. Rare Emotes & Animations ---
    if (answers.hasRareEmotes && answers.rareEmotesList && answers.rareEmotesList.length > 0) {
        const emoteCount = answers.rareEmotesList.length;
        collectionsVal += emoteCount * 1400;
        estimatedDiamondsSpent += emoteCount * 4500;

        if (answers.rareEmotesList.includes('arrival_anim')) {
            collectionsVal += 2500;
            estimatedDiamondsSpent += 8000;
            highlights.push('🚀 VIP Lobby Entrance / Arrival Animation');
        }
        if (answers.rareEmotesList.includes('throne_teatime') || answers.rareEmotesList.includes('pirate_flag')) {
            highlights.push('🏴‍☠️ OG Legendary Flex Emotes (Throne/Pirate Flag/Tea Time)');
        }
    }

    // --- 8. Rank, Likes & Server ---
    switch (answers.highestRank) {
        case 'grandmaster':
            rankAndRepVal += 4500;
            highlights.push('🏆 Grandmaster Tier Badge & Glory Points');
            break;
        case 'master':
            rankAndRepVal += 2000;
            highlights.push('🎖️ Master Rank Achievement');
            break;
        case 'heroic':
            rankAndRepVal += 800;
            break;
        case 'diamond':
        default:
            break;
    }

    switch (answers.likeCount) {
        case '15k_plus':
            rankAndRepVal += 2500;
            highlights.push('❤️ 15,000+ Verified Profile Likes');
            break;
        case '5k_15k':
            rankAndRepVal += 1000;
            break;
        case 'under_5k':
        default:
            break;
    }

    if (answers.server === 'pk') {
        rankAndRepVal += 500; // Local PK server high liquidity bonus
    }

    // Total raw valuation
    const totalRaw = basePrice + levelAndAge + evoGunsVal + rareBundlesVal + collectionsVal + rankAndRepVal;

    // Range calculation with rounding to clean thousands/five-hundreds
    const rawMin = totalRaw * 0.85;
    const rawMax = totalRaw * 1.18;

    // Rounding helper to nearest 250/500 PKR
    const roundPrice = (val: number) => {
        if (val < 5000) {
            return Math.round(val / 250) * 250;
        }
        return Math.round(val / 500) * 500;
    };

    const minPrice = Math.max(1500, roundPrice(rawMin));
    const maxPrice = Math.max(minPrice + 500, roundPrice(rawMax));
    const estimatedValue = roundPrice((minPrice + maxPrice) / 2);

    // Determine Account Tier
    let accountTier: AccountTier = 'starter';
    let tierTitle = 'Starter Pro Account';
    let tierBadge = '🥉 Tier 5: Starter';
    let confidenceScore = 92;

    if (estimatedValue >= 35000) {
        accountTier = 'god_tier';
        tierTitle = '👑 God-Tier Mythic ID';
        tierBadge = '👑 Tier 1: Mythic God-Tier';
        confidenceScore = 98;
    } else if (estimatedValue >= 18000) {
        accountTier = 'legendary';
        tierTitle = '🔥 Legendary Collector ID';
        tierBadge = '🔥 Tier 2: Legendary Collector';
        confidenceScore = 96;
    } else if (estimatedValue >= 8000) {
        accountTier = 'elite';
        tierTitle = '⚡ Elite Pro Account';
        tierBadge = '⚡ Tier 3: Elite Pro';
        confidenceScore = 94;
    } else if (estimatedValue >= 3500) {
        accountTier = 'veteran';
        tierTitle = '🛡️ Veteran Player ID';
        tierBadge = '🛡️ Tier 4: Veteran';
        confidenceScore = 93;
    }

    // Generate dynamic summary statement
    let summaryLead = `This account qualifies as a ${tierTitle}. `;
    if (rareBundlesVal > 15000 && evoGunsVal > 10000) {
        summaryLead += 'Its high valuation is primarily driven by legendary legacy items (OG Pass/Incubator sets) combined with a lethal Max-Evo Gun arsenal.';
    } else if (evoGunsVal > 12000) {
        summaryLead += 'The commanding market price is heavily driven by upgraded Evo Guns with unlocked level 7 kill effects and emotes.';
    } else if (rareBundlesVal > 10000) {
        summaryLead += 'The prime value driver is its rare vintage bundle collection that cannot easily be acquired today.';
    } else if (levelAndAge > 8000) {
        summaryLead += 'Its value stems from solid account seniority, high player level, and proven profile reputation.';
    } else {
        summaryLead += 'This account represents a solid competitive profile ready for daily tournament battles and custom matches.';
    }

    return {
        minPrice,
        maxPrice,
        estimatedValue,
        estimatedDiamondsSpent,
        accountTier,
        tierTitle,
        tierBadge,
        confidenceScore,
        breakdown: {
            levelAndAge,
            evoGuns: evoGunsVal,
            rareBundles: rareBundlesVal,
            collectionsAndEmotes: collectionsVal,
            rankAndReputation: rankAndRepVal
        },
        highlights: highlights.slice(0, 6),
        summaryText: summaryLead
    };
}

export const VALUATION_FAQS = [
    {
        q: "How is the Free Fire ID valuation calculated?",
        a: "Our algorithm calculates estimated market prices based on thousands of real Free Fire ID sales in Pakistan and South Asia. We weight critical assets such as player level, account seniority (Season 1-5 OG status), number of Max-Level (Lv. 7) Evo Guns, rare Incubator & Collab outfits, Gloo Wall skin count, and profile rank."
    },
    {
        q: "Why are Season 1 & 2 (Sakura / Hip Hop) accounts worth so much?",
        a: "Season 1 (Sakura) and Season 2 (Hip Hop) Elite Passes were released in 2018 when the player base was very small. Because these original items cannot be purchased again directly from the in-game store, they have become supreme collector status symbols and command the highest market resale multiplier in Pakistan (often Rs. 20,000+ to Rs. 50,000+ depending on other items)."
    },
    {
        q: "Does spending money on diamonds equal the account resale price?",
        a: "No. In digital gaming markets, accounts typically resell at 20% to 35% of the total in-game diamonds purchased. However, Max-Level Evo Guns (like MP40 Cobra and M1887) and limited collaboration bundles retain the highest percentage of resale value."
    },
    {
        q: "How can I increase the value of my Free Fire ID?",
        a: "To maximize your account valuation: (1) Upgrade your Evo Guns to Level 7 to unlock kill emotes and announcement effects, (2) Acquire limited-time Incubator or Anime Collab sets, (3) Maintain high profile rank (Master / Grandmaster) and active Monthly Memberships, and (4) Collect unique Gloo Wall skins."
    },
    {
        q: "How can I safely buy or sell a Free Fire account without getting scammed?",
        a: "Never make direct payments or send account credentials first. Always use a verified community middleman or trusted escrow service who verifies the Gmail / Facebook / VK bind change before releasing funds. Guru Zone provides community verification groups to help players avoid scams."
    }
];
