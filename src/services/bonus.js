const NotionClient = require('../config/notion');

class BonusService extends NotionClient {
    constructor() {
        super();
    }

    async addWeeklyBonus(type, amount, weekOf = null, description = null) {
        try {
            const week = weekOf || this.getStartOfWeek();
            const title = `${type} - ${this.formatCurrency(amount)} (Week of ${week})`;
            
            const properties = {
                'Week Of': {
                    date: {
                        start: week
                    }
                },
                'Bonus Type': {
                    select: {
                        name: type
                    }
                },
                'Amount Earned': {
                    number: amount
                },
                'Status': {
                    select: {
                        name: 'pending'
                    }
                }
            };

            const response = await this.createPage(this.databases.bonuses, properties, title);
            
            console.log(`🎉 Bonus earned: ${type} - ${this.formatCurrency(amount)}`);
            return {
                id: response.id,
                type,
                amount,
                week,
                status: 'pending',
                message: `${type} bonus of ${this.formatCurrency(amount)} earned for week of ${week}`
            };
        } catch (error) {
            console.error('❌ Error adding bonus:', error);
            throw error;
        }
    }

    async markBonusPaid(bonusId) {
        try {
            const properties = {
                'Status': {
                    select: {
                        name: 'paid'
                    }
                }
            };

            await this.updatePage(bonusId, properties);
            
            console.log(`💰 Bonus ${bonusId} marked as paid`);
            return {
                id: bonusId,
                status: 'paid',
                message: 'Bonus marked as paid'
            };
        } catch (error) {
            console.error('❌ Error marking bonus as paid:', error);
            throw error;
        }
    }

    async getPendingBonuses(weekOf = null) {
        try {
            let filter = {
                property: 'Status',
                select: {
                    equals: 'pending'
                }
            };

            // If specific week requested, add date filter
            if (weekOf) {
                filter = {
                    and: [
                        filter,
                        {
                            property: 'Week Of',
                            date: {
                                equals: weekOf
                            }
                        }
                    ]
                };
            }

            const sorts = [{
                property: 'Week Of',
                direction: 'descending'
            }];

            const response = await this.queryDatabase(this.databases.bonuses, filter, sorts);
            
            return response.results.map(page => ({
                id: page.id,
                name: page.properties.Name.title[0]?.text?.content || 'Unnamed',
                type: page.properties['Bonus Type'].select?.name,
                amount: page.properties['Amount Earned'].number,
                weekOf: page.properties['Week Of'].date.start,
                status: page.properties.Status.select?.name
            }));
        } catch (error) {
            console.error('❌ Error getting pending bonuses:', error);
            throw error;
        }
    }

    async getBonusesForWeek(weekOf = null) {
        try {
            const week = weekOf || this.getStartOfWeek();
            
            const filter = {
                property: 'Week Of',
                date: {
                    equals: week
                }
            };

            const response = await this.queryDatabase(this.databases.bonuses, filter);
            
            return response.results.map(page => ({
                id: page.id,
                name: page.properties.Name.title[0]?.text?.content || 'Unnamed',
                type: page.properties['Bonus Type'].select?.name,
                amount: page.properties['Amount Earned'].number,
                weekOf: page.properties['Week Of'].date.start,
                status: page.properties.Status.select?.name
            }));
        } catch (error) {
            console.error('❌ Error getting weekly bonuses:', error);
            throw error;
        }
    }

    async calculateTotalPendingBonuses() {
        try {
            const pendingBonuses = await this.getPendingBonuses();
            const totalAmount = pendingBonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
            
            return {
                totalAmount,
                bonusCount: pendingBonuses.length,
                bonuses: pendingBonuses
            };
        } catch (error) {
            console.error('❌ Error calculating total pending bonuses:', error);
            throw error;
        }
    }

    // Helper methods for specific bonus types
    async addPerfectWeekBonus(weekOf = null) {
        return await this.addWeeklyBonus('Perfect Week', 50, weekOf, '3 yoga + 3 lifting sessions');
    }

    async addJobApplicationBonus(weekOf = null, applicationCount = 25) {
        return await this.addWeeklyBonus('Job Applications', 50, weekOf, `${applicationCount}+ applications submitted`);
    }

    async addAlgoExpertBonus(weekOf = null, problemCount = 7) {
        return await this.addWeeklyBonus('AlgoExpert', 25, weekOf, `${problemCount} problems completed`);
    }

    async addReadingBonus(weekOf = null, bookTitle = null) {
        const description = bookTitle ? `Finished: ${bookTitle}` : 'Book completed';
        return await this.addWeeklyBonus('Reading', 25, weekOf, description);
    }

    async addDatingBonus(weekOf = null, dateDetails = null) {
        const description = dateDetails || 'Actual date completed';
        return await this.addWeeklyBonus('Dating', 30, weekOf, description);
    }

    async addGoodBoyBonus(amount, reason = 'Exceptional effort') {
        return await this.addWeeklyBonus('Good Boy Bonus', amount, null, reason);
    }

    // Get bonus statistics
    async getBonusStats(days = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            const filter = {
                property: 'Week Of',
                date: {
                    on_or_after: cutoffDate.toISOString().split('T')[0]
                }
            };

            const response = await this.queryDatabase(this.databases.bonuses, filter);
            
            const stats = {
                totalBonuses: response.results.length,
                pendingBonuses: 0,
                paidBonuses: 0,
                totalEarned: 0,
                totalPending: 0,
                totalPaid: 0,
                bonusTypes: {}
            };

            response.results.forEach(page => {
                const status = page.properties.Status.select?.name;
                const amount = page.properties['Amount Earned'].number || 0;
                const type = page.properties['Bonus Type'].select?.name || 'Unknown';
                
                stats.totalEarned += amount;
                stats.bonusTypes[type] = (stats.bonusTypes[type] || 0) + amount;
                
                if (status === 'pending') {
                    stats.pendingBonuses++;
                    stats.totalPending += amount;
                } else if (status === 'paid') {
                    stats.paidBonuses++;
                    stats.totalPaid += amount;
                }
            });

            return stats;
        } catch (error) {
            console.error('❌ Error getting bonus stats:', error);
            throw error;
        }
    }
}

module.exports = BonusService;