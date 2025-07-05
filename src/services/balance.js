const NotionClient = require('../config/notion');

class BalanceService extends NotionClient {
    constructor() {
        super();
    }

    async updateBalances(accountA, accountB, checking) {
        try {
            const title = `Balances ${this.getCurrentDate()}`;
            
            const properties = {
                'Date': {
                    date: {
                        start: this.getCurrentDate()
                    }
                },
                'Account A Balance': {
                    number: accountA
                },
                'Account B Balance': {
                    number: accountB
                },
                'Checking Balance': {
                    number: checking
                }
            };

            const response = await this.createPage(this.databases.balances, properties, title);
            
            console.log(`💳 Balances updated - A: ${this.formatCurrency(accountA)}, B: ${this.formatCurrency(accountB)}, Checking: ${this.formatCurrency(checking)}`);
            return {
                id: response.id,
                accountA,
                accountB,
                checking,
                availableTransfer: accountA, // Available transfer is just Account A balance
                message: 'Account balances updated'
            };
        } catch (error) {
            console.error('❌ Error updating balances:', error);
            throw error;
        }
    }

    async getLatestBalances() {
        try {
            const sorts = [{
                property: 'Date',
                direction: 'descending'
            }];

            const response = await this.queryDatabase(this.databases.balances, null, sorts);
            
            if (response.results.length === 0) {
                return null;
            }

            const latestBalance = response.results[0];
            return {
                id: latestBalance.id,
                date: latestBalance.properties.Date.date.start,
                accountA: latestBalance.properties['Account A Balance'].number,
                accountB: latestBalance.properties['Account B Balance'].number,
                checking: latestBalance.properties['Checking Balance'].number,
                availableTransfer: latestBalance.properties['Account A Balance'].number // Available transfer = Account A balance
            };
        } catch (error) {
            console.error('❌ Error getting latest balances:', error);
            throw error;
        }
    }

    async getBalanceHistory(days = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            const filter = {
                property: 'Date',
                date: {
                    on_or_after: cutoffDate.toISOString().split('T')[0]
                }
            };

            const sorts = [{
                property: 'Date',
                direction: 'descending'
            }];

            const response = await this.queryDatabase(this.databases.balances, filter, sorts);
            
            return response.results.map(page => ({
                id: page.id,
                date: page.properties.Date.date.start,
                accountA: page.properties['Account A Balance'].number,
                accountB: page.properties['Account B Balance'].number,
                checking: page.properties['Checking Balance'].number,
                availableTransfer: page.properties['Account A Balance'].number // Available transfer = Account A balance
            }));
        } catch (error) {
            console.error('❌ Error getting balance history:', error);
            throw error;
        }
    }

    async calculateUberEarnings(previousAccountB = null) {
        try {
            const latestBalances = await this.getLatestBalances();
            
            if (!latestBalances || previousAccountB === null) {
                return {
                    earnings: 0,
                    currentBalance: latestBalances?.accountB || 0,
                    message: 'Cannot calculate earnings without previous balance'
                };
            }

            const earnings = latestBalances.accountB - previousAccountB;
            
            return {
                earnings: Math.max(0, earnings), // Only positive earnings count
                currentBalance: latestBalances.accountB,
                previousBalance: previousAccountB,
                message: earnings > 0 
                    ? `${this.formatCurrency(earnings)} earned from Uber deliveries`
                    : 'No new Uber earnings detected'
            };
        } catch (error) {
            console.error('❌ Error calculating Uber earnings:', error);
            throw error;
        }
    }

    async calculateAvailableTransfers(workoutEarnings = 0, bonusEarnings = 0, uberEarnings = 0) {
        try {
            const latestBalances = await this.getLatestBalances();
            const baseAllowance = 50; // Weekly base allowance
            
            // Calculate total potential transfers
            const totalEarnings = baseAllowance + workoutEarnings + bonusEarnings + uberEarnings;
            
            // Check Account A balance to ensure funds are available
            const accountABalance = latestBalances?.accountA || 0;
            const maxTransferAllowed = Math.min(totalEarnings, accountABalance);
            
            return {
                baseAllowance,
                workoutEarnings,
                bonusEarnings,
                uberEarnings,
                totalEarnings,
                accountABalance,
                maxTransferAllowed,
                canTransferFull: totalEarnings <= accountABalance,
                message: maxTransferAllowed > 0 
                    ? `${this.formatCurrency(maxTransferAllowed)} available for transfer`
                    : 'No funds available for transfer'
            };
        } catch (error) {
            console.error('❌ Error calculating available transfers:', error);
            throw error;
        }
    }

    async getAccountAUsage(days = 30) {
        try {
            const balanceHistory = await this.getBalanceHistory(days);
            
            if (balanceHistory.length < 2) {
                return {
                    startingBalance: balanceHistory[0]?.accountA || 0,
                    currentBalance: balanceHistory[0]?.accountA || 0,
                    totalUsed: 0,
                    averageDailyUse: 0,
                    message: 'Insufficient data for usage calculation'
                };
            }

            const startingBalance = balanceHistory[balanceHistory.length - 1].accountA;
            const currentBalance = balanceHistory[0].accountA;
            const totalUsed = startingBalance - currentBalance;
            const averageDailyUse = totalUsed / days;

            return {
                startingBalance,
                currentBalance,
                totalUsed,
                averageDailyUse,
                daysOfData: days,
                projectedMonthlyUse: averageDailyUse * 30,
                message: `${this.formatCurrency(totalUsed)} used over ${days} days`
            };
        } catch (error) {
            console.error('❌ Error calculating Account A usage:', error);
            throw error;
        }
    }

    async checkAccountARefillNeeded() {
        try {
            const latestBalances = await this.getLatestBalances();
            const monthlyAllowance = 600;
            const lowBalanceThreshold = 150; // 25% of monthly allowance
            
            if (!latestBalances) {
                return {
                    refillNeeded: true,
                    currentBalance: 0,
                    threshold: lowBalanceThreshold,
                    message: 'No balance data found - refill needed'
                };
            }

            const refillNeeded = latestBalances.accountA < lowBalanceThreshold;
            
            return {
                refillNeeded,
                currentBalance: latestBalances.accountA,
                threshold: lowBalanceThreshold,
                suggestedRefill: monthlyAllowance,
                message: refillNeeded 
                    ? `Account A low: ${this.formatCurrency(latestBalances.accountA)} (below ${this.formatCurrency(lowBalanceThreshold)})`
                    : `Account A sufficient: ${this.formatCurrency(latestBalances.accountA)}`
            };
        } catch (error) {
            console.error('❌ Error checking refill status:', error);
            throw error;
        }
    }

    // Generate balance summary for nightly reconciliation
    async generateBalanceSummary() {
        try {
            const latestBalances = await this.getLatestBalances();
            const refillStatus = await this.checkAccountARefillNeeded();
            
            if (!latestBalances) {
                return {
                    summary: '⚠️ No balance data available',
                    balances: null,
                    refillNeeded: true
                };
            }

            const summary = [
                `💳 **Account Balances (${latestBalances.date})**`,
                `• Account A: ${this.formatCurrency(latestBalances.accountA)}`,
                `• Account B: ${this.formatCurrency(latestBalances.accountB)}`,
                `• Checking: ${this.formatCurrency(latestBalances.checking)}`,
                `• Available Transfer: ${this.formatCurrency(latestBalances.accountA)}`, // Available transfer = Account A balance
                '',
                refillStatus.refillNeeded 
                    ? `⚠️ ${refillStatus.message}`
                    : `✅ ${refillStatus.message}`
            ].join('\n');

            return {
                summary,
                balances: latestBalances,
                refillNeeded: refillStatus.refillNeeded,
                refillAmount: refillStatus.suggestedRefill
            };
        } catch (error) {
            console.error('❌ Error generating balance summary:', error);
            throw error;
        }
    }
}

module.exports = BalanceService;