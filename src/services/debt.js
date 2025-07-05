const NotionClient = require('../config/notion');

class DebtService extends NotionClient {
    constructor() {
        super();
    }

    async createDebt(amount, reason = 'Violation') {
        try {
            const title = `${this.formatCurrency(amount)} - ${reason}`;
            
            const properties = {
                'Date Assigned ': { // Note the extra space in your DB
                    date: {
                        start: this.getCurrentDate()
                    }
                },
                'Original Amount': {
                    number: amount
                },
                'Current Amount': {
                    number: amount
                },
                'Interest Rate': {
                    number: 0.30
                },
                'Status': {
                    select: {
                        name: 'active'
                    }
                }
            };

            const response = await this.createPage(this.databases.debt, properties, title);
            
            console.log(`💸 Debt assigned: ${this.formatCurrency(amount)} for ${reason}`);
            return {
                id: response.id,
                amount,
                reason,
                status: 'active',
                message: `Debt of ${this.formatCurrency(amount)} assigned for ${reason}`
            };
        } catch (error) {
            console.error('❌ Error creating debt:', error);
            throw error;
        }
    }

    async getActiveDebts() {
        try {
            const filter = {
                property: 'Status',
                select: {
                    equals: 'active'
                }
            };

            const sorts = [{
                property: 'Date Assigned ', // Note the extra space
                direction: 'ascending'
            }];

            const response = await this.queryDatabase(this.databases.debt, filter, sorts);
            
            return response.results.map(page => ({
                id: page.id,
                name: page.properties.Name.title[0]?.text?.content || 'Unnamed',
                originalAmount: page.properties['Original Amount'].number,
                currentAmount: page.properties['Current Amount'].number,
                interestRate: page.properties['Interest Rate'].number,
                dateAssigned: page.properties['Date Assigned '].date.start, // Note the extra space
                status: page.properties.Status.select?.name
            }));
        } catch (error) {
            console.error('❌ Error getting active debts:', error);
            throw error;
        }
    }

    async applyDailyInterest() {
        try {
            const activeDebts = await this.getActiveDebts();
            const results = [];

            for (const debt of activeDebts) {
                const currentAmount = debt.currentAmount;
                const interestRate = debt.interestRate;
                const newAmount = Math.round(currentAmount * (1 + interestRate) * 100) / 100;
                
                const properties = {
                    'Current Amount': {
                        number: newAmount
                    }
                };

                await this.updatePage(debt.id, properties);
                
                console.log(`📈 Interest applied to debt ${debt.id}: ${this.formatCurrency(currentAmount)} → ${this.formatCurrency(newAmount)}`);
                
                results.push({
                    id: debt.id,
                    oldAmount: currentAmount,
                    newAmount: newAmount,
                    interestCharged: newAmount - currentAmount
                });
            }

            return results;
        } catch (error) {
            console.error('❌ Error applying daily interest:', error);
            throw error;
        }
    }

    async payOffDebt(debtId, paymentAmount) {
        try {
            const debt = await this.retrievePage(debtId);
            const currentAmount = debt.properties['Current Amount'].number;
            const remainingAmount = Math.max(0, currentAmount - paymentAmount);
            
            const properties = {
                'Current Amount': {
                    number: remainingAmount
                }
            };
            
            // If fully paid off, mark as paid
            if (remainingAmount === 0) {
                properties['Status'] = {
                    select: {
                        name: 'paid'
                    }
                };
            }
            
            await this.updatePage(debtId, properties);
            
            const status = remainingAmount === 0 ? 'paid' : 'active';
            console.log(`💰 Payment applied to debt ${debtId}: ${this.formatCurrency(paymentAmount)}. Remaining: ${this.formatCurrency(remainingAmount)}`);
            
            return {
                id: debtId,
                paymentAmount,
                remainingAmount,
                status,
                fullyPaid: remainingAmount === 0,
                message: remainingAmount === 0 
                    ? `Debt fully paid off with ${this.formatCurrency(paymentAmount)}`
                    : `${this.formatCurrency(paymentAmount)} applied. ${this.formatCurrency(remainingAmount)} remaining`
            };
        } catch (error) {
            console.error('❌ Error paying debt:', error);
            throw error;
        }
    }

    async getTotalDebtAmount() {
        try {
            const activeDebts = await this.getActiveDebts();
            const totalDebt = activeDebts.reduce((sum, debt) => sum + debt.currentAmount, 0);
            
            return {
                totalDebt,
                debtCount: activeDebts.length,
                debts: activeDebts
            };
        } catch (error) {
            console.error('❌ Error getting total debt:', error);
            throw error;
        }
    }

    async payOffOldestDebt(paymentAmount) {
        try {
            const activeDebts = await this.getActiveDebts();
            
            if (activeDebts.length === 0) {
                return {
                    message: 'No active debts to pay off',
                    remainingPayment: paymentAmount
                };
            }

            // Sort by date assigned (oldest first)
            const oldestDebt = activeDebts[0];
            const result = await this.payOffDebt(oldestDebt.id, paymentAmount);
            
            return {
                ...result,
                remainingPayment: Math.max(0, paymentAmount - oldestDebt.currentAmount)
            };
        } catch (error) {
            console.error('❌ Error paying oldest debt:', error);
            throw error;
        }
    }

    // Get debt statistics
    async getDebtStats(days = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            const filter = {
                property: 'Date Assigned ',
                date: {
                    on_or_after: cutoffDate.toISOString().split('T')[0]
                }
            };

            const response = await this.queryDatabase(this.databases.debt, filter);
            
            const stats = {
                totalDebts: response.results.length,
                activeDebts: 0,
                paidDebts: 0,
                totalOriginalAmount: 0,
                totalCurrentAmount: 0,
                totalInterestAccrued: 0
            };

            response.results.forEach(page => {
                const status = page.properties.Status.select?.name;
                const originalAmount = page.properties['Original Amount'].number || 0;
                const currentAmount = page.properties['Current Amount'].number || 0;
                
                stats.totalOriginalAmount += originalAmount;
                stats.totalCurrentAmount += currentAmount;
                stats.totalInterestAccrued += (currentAmount - originalAmount);
                
                if (status === 'active') {
                    stats.activeDebts++;
                } else if (status === 'paid') {
                    stats.paidDebts++;
                }
            });

            return stats;
        } catch (error) {
            console.error('❌ Error getting debt stats:', error);
            throw error;
        }
    }
}

module.exports = DebtService;