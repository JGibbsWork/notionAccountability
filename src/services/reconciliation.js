const CardioService = require('./cardio');
const DebtService = require('./debt');
const WorkoutService = require('./workout');
const BonusService = require('./bonus');
const BalanceService = require('./balance');

class ReconciliationService {
    constructor() {
        this.cardioService = new CardioService();
        this.debtService = new DebtService();
        this.workoutService = new WorkoutService();
        this.bonusService = new BonusService();
        this.balanceService = new BalanceService();
    }

    async runNightlyReconciliation() {
        console.log('🌙 Starting nightly reconciliation...');
        
        try {
            const results = {
                timestamp: new Date().toISOString(),
                cardioChecks: null,
                interestApplication: null,
                workoutEarnings: null,
                bonusCalculation: null,
                balanceSummary: null,
                transferApprovals: [],
                violations: [],
                summary: ''
            };

            // Step 1: Check for overdue cardio and create debt
            console.log('📋 Step 1: Checking overdue cardio assignments...');
            results.cardioChecks = await this.processOverdueCardio();

            // Step 2: Apply daily interest to all active debts
            console.log('📈 Step 2: Applying daily interest to debts...');
            results.interestApplication = await this.debtService.applyDailyInterest();

            // Step 3: Calculate workout earnings for today
            console.log('💪 Step 3: Calculating workout earnings...');
            results.workoutEarnings = await this.calculateDailyWorkoutEarnings();

            // Step 4: Check for weekly bonuses (if end of week)
            console.log('🎉 Step 4: Checking weekly bonuses...');
            results.bonusCalculation = await this.checkWeeklyBonuses();

            // Step 5: Calculate available transfers
            console.log('💰 Step 5: Calculating available transfers...');
            results.transferApprovals = await this.calculateTransferApprovals(
                results.workoutEarnings.totalEarnings,
                results.bonusCalculation.totalBonuses
            );

            // Step 6: Generate balance summary
            console.log('💳 Step 6: Generating balance summary...');
            results.balanceSummary = await this.balanceService.generateBalanceSummary();

            // Step 7: Generate summary message
            results.summary = this.generateReconciliationSummary(results);

            console.log('✅ Nightly reconciliation complete');
            return results;

        } catch (error) {
            console.error('❌ Error in nightly reconciliation:', error);
            throw error;
        }
    }

    async processOverdueCardio() {
        try {
            const overdueCardio = await this.cardioService.getOverdueCardio();
            const results = {
                overdueCount: overdueCardio.length,
                debtsCreated: [],
                cardioMarkedMissed: []
            };

            for (const cardio of overdueCardio) {
                // Create $50 debt for missed cardio
                const debt = await this.debtService.createDebt(50, `Missed cardio: ${cardio.type}`);
                results.debtsCreated.push(debt);

                // Mark cardio as missed
                const missedCardio = await this.cardioService.markCardioMissed(cardio.id);
                results.cardioMarkedMissed.push(missedCardio);
            }

            return results;
        } catch (error) {
            console.error('❌ Error processing overdue cardio:', error);
            throw error;
        }
    }

    async calculateDailyWorkoutEarnings() {
        try {
            const todayWorkouts = await this.workoutService.getWorkoutsForToday();
            
            const earnings = {
                liftingEarnings: 0,
                extraYogaEarnings: 0,
                totalEarnings: 0,
                workoutBreakdown: []
            };

            // Count yoga sessions for the week to determine if extras earn money
            const weeklyWorkouts = await this.workoutService.getWorkoutsForWeek();
            const weeklyYogaCount = weeklyWorkouts.filter(w => w.type === 'Yoga').length; // Updated for your DB
            const todayYogaCount = todayWorkouts.filter(w => w.type === 'Yoga').length;

            todayWorkouts.forEach(workout => {
                const workoutEarning = { ...workout, earnings: 0 };

                switch (workout.type) {
                    case 'Lifting': // Updated for your DB
                        workoutEarning.earnings = 10;
                        earnings.liftingEarnings += 10;
                        break;
                    case 'Yoga': // Updated for your DB
                        // Only count extra yoga beyond 3/week
                        if (weeklyYogaCount > 3) {
                            workoutEarning.earnings = 5;
                            earnings.extraYogaEarnings += 5;
                        }
                        break;
                    default:
                        workoutEarning.earnings = 0;
                        break;
                }

                earnings.workoutBreakdown.push(workoutEarning);
            });

            earnings.totalEarnings = earnings.liftingEarnings + earnings.extraYogaEarnings;

            return earnings;
        } catch (error) {
            console.error('❌ Error calculating daily workout earnings:', error);
            throw error;
        }
    }

    async checkWeeklyBonuses() {
        try {
            const results = {
                isEndOfWeek: this.isEndOfWeek(),
                weeklyEarnings: null,
                bonusesAdded: [],
                totalBonuses: 0
            };

            // If it's end of week, calculate and award bonuses
            if (results.isEndOfWeek) {
                results.weeklyEarnings = await this.workoutService.calculateWeeklyEarnings();
                
                // Award perfect week bonus if applicable
                if (results.weeklyEarnings.perfectWeekBonus > 0) {
                    const bonus = await this.bonusService.addPerfectWeekBonus();
                    results.bonusesAdded.push(bonus);
                    results.totalBonuses += bonus.amount;
                }
            }

            return results;
        } catch (error) {
            console.error('❌ Error checking weekly bonuses:', error);
            throw error;
        }
    }

    async calculateTransferApprovals(workoutEarnings = 0, bonusEarnings = 0) {
        try {
            // Get any Uber earnings (would need integration with banking API)
            // For now, assuming 0 - this would be replaced with actual bank integration
            const uberEarnings = 0;

            const transferCalc = await this.balanceService.calculateAvailableTransfers(
                workoutEarnings,
                bonusEarnings,
                uberEarnings
            );

            // Check if user has any debt that would prevent Uber earnings from being available
            const debtInfo = await this.debtService.getTotalDebtAmount();
            const hasDebt = debtInfo.totalDebt > 0;

            return {
                ...transferCalc,
                hasDebt,
                debtAmount: debtInfo.totalDebt,
                uberEarningsBlocked: hasDebt && uberEarnings > 0,
                approvedTransfers: [
                    ...(workoutEarnings > 0 ? [`Workout earnings: ${this.formatCurrency(workoutEarnings)}`] : []),
                    ...(bonusEarnings > 0 ? [`Bonus earnings: ${this.formatCurrency(bonusEarnings)}`] : []),
                    ...(uberEarnings > 0 && !hasDebt ? [`Uber earnings: ${this.formatCurrency(uberEarnings)}`] : [])
                ]
            };
        } catch (error) {
            console.error('❌ Error calculating transfer approvals:', error);
            throw error;
        }
    }

    generateReconciliationSummary(results) {
        const lines = [
            '🌙 **Nightly Reconciliation Summary**',
            `📅 ${new Date().toLocaleDateString()}`,
            ''
        ];

        // Cardio violations
        if (results.cardioChecks.overdueCount > 0) {
            lines.push(`⚠️ **Violations:**`);
            lines.push(`• ${results.cardioChecks.overdueCount} missed cardio assignments`);
            lines.push(`• ${this.formatCurrency(results.cardioChecks.debtsCreated.length * 50)} in new debt assigned`);
            lines.push('');
        }

        // Interest charges
        if (results.interestApplication.length > 0) {
            const totalInterest = results.interestApplication.reduce((sum, debt) => sum + debt.interestCharged, 0);
            lines.push(`📈 **Interest Applied:**`);
            lines.push(`• ${this.formatCurrency(totalInterest)} interest charged on ${results.interestApplication.length} debts`);
            lines.push('');
        }

        // Workout earnings
        if (results.workoutEarnings.totalEarnings > 0) {
            lines.push(`💪 **Today's Workout Earnings:**`);
            if (results.workoutEarnings.liftingEarnings > 0) {
                lines.push(`• Lifting: ${this.formatCurrency(results.workoutEarnings.liftingEarnings)}`);
            }
            if (results.workoutEarnings.extraYogaEarnings > 0) {
                lines.push(`• Extra Yoga: ${this.formatCurrency(results.workoutEarnings.extraYogaEarnings)}`);
            }
            lines.push(`• **Total: ${this.formatCurrency(results.workoutEarnings.totalEarnings)}**`);
            lines.push('');
        }

        // Weekly bonuses
        if (results.bonusCalculation.bonusesAdded.length > 0) {
            lines.push(`🎉 **Weekly Bonuses Earned:**`);
            results.bonusCalculation.bonusesAdded.forEach(bonus => {
                lines.push(`• ${bonus.type}: ${this.formatCurrency(bonus.amount)}`);
            });
            lines.push('');
        }

        // Transfer approvals
        if (results.transferApprovals.approvedTransfers.length > 0) {
            lines.push(`💰 **Approved Transfers:**`);
            results.transferApprovals.approvedTransfers.forEach(transfer => {
                lines.push(`• ${transfer}`);
            });
            lines.push(`• **Total Available: ${this.formatCurrency(results.transferApprovals.maxTransferAllowed)}**`);
            lines.push('');
        }

        // Debt status
        if (results.transferApprovals.hasDebt) {
            lines.push(`⚠️ **Outstanding Debt: ${this.formatCurrency(results.transferApprovals.debtAmount)}**`);
            if (results.transferApprovals.uberEarningsBlocked) {
                lines.push(`• Uber earnings blocked until debt is paid`);
            }
            lines.push('');
        }

        // Balance summary
        if (results.balanceSummary.refillNeeded) {
            lines.push(`⚠️ **Account A Refill Needed**`);
            lines.push(`• Current balance: ${this.formatCurrency(results.balanceSummary.balances?.accountA || 0)}`);
            lines.push(`• Suggested refill: ${this.formatCurrency(results.balanceSummary.refillAmount || 600)}`);
        }

        return lines.join('\n');
    }

    // Utility methods
    isEndOfWeek() {
        return new Date().getDay() === 0; // Sunday
    }

    formatCurrency(amount) {
        return `$${amount.toFixed(2)}`;
    }

    // Manual reconciliation triggers
    async processUberEarnings(earningsAmount) {
        try {
            const debtInfo = await this.debtService.getTotalDebtAmount();
            
            if (debtInfo.totalDebt > 0) {
                // Apply earnings to oldest debt first
                const paymentResult = await this.debtService.payOffOldestDebt(earningsAmount);
                return {
                    action: 'debt_payment',
                    amountApplied: earningsAmount,
                    remainingDebt: paymentResult.remainingAmount,
                    message: `${this.formatCurrency(earningsAmount)} Uber earnings applied to debt`
                };
            } else {
                // No debt - earnings can unlock Account A funds
                return {
                    action: 'earnings_unlock',
                    earningsAmount,
                    unlockedAmount: earningsAmount,
                    message: `${this.formatCurrency(earningsAmount)} Uber earnings unlock equal amount from Account A`
                };
            }
        } catch (error) {
            console.error('❌ Error processing Uber earnings:', error);
            throw error;
        }
    }

    async manualCardioCompletion(cardioId) {
        return await this.cardioService.completeCardio(cardioId);
    }

    async manualBonusAward(type, amount, reason) {
        return await this.bonusService.addGoodBoyBonus(amount, reason);
    }
}

module.exports = ReconciliationService;