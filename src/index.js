require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const ReconciliationService = require('./services/reconciliation');
const CardioService = require('./services/cardio');
const DebtService = require('./services/debt');
const WorkoutService = require('./services/workout');
const BonusService = require('./services/bonus');
const BalanceService = require('./services/balance');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize services
const reconciliationService = new ReconciliationService();
const cardioService = new CardioService();
const debtService = new DebtService();
const workoutService = new WorkoutService();
const bonusService = new BonusService();
const balanceService = new BalanceService();

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Dashboard - get current status
app.get('/dashboard', async (req, res) => {
    try {
        const [
            pendingCardio,
            activeDebts,
            todayWorkouts,
            pendingBonuses,
            latestBalances
        ] = await Promise.all([
            cardioService.getPendingCardio(),
            debtService.getActiveDebts(),
            workoutService.getWorkoutsForToday(),
            bonusService.getPendingBonuses(),
            balanceService.getLatestBalances()
        ]);

        const totalDebt = activeDebts.reduce((sum, debt) => sum + debt.currentAmount, 0);
        const totalPendingBonuses = pendingBonuses.reduce((sum, bonus) => sum + bonus.amount, 0);

        res.json({
            status: 'success',
            data: {
                summary: {
                    totalDebt,
                    pendingCardioCount: pendingCardio.length,
                    todayWorkoutCount: todayWorkouts.length,
                    totalPendingBonuses,
                    hasOutstandingDebt: totalDebt > 0
                },
                pendingCardio,
                activeDebts,
                todayWorkouts,
                pendingBonuses,
                balances: latestBalances
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// CARDIO ROUTES
app.post('/cardio/assign', async (req, res) => {
    try {
        const { type, minutes, reason } = req.body;
        const result = await cardioService.assignCardio(type, minutes, reason);
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post('/cardio/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await cardioService.completeCardio(id);
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/cardio/pending', async (req, res) => {
    try {
        const result = await cardioService.getPendingCardio();
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/cardio/stats', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const result = await cardioService.getCardioStats(days);
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// DEBT ROUTES
app.post('/debt/create', async (req, res) => {
    try {
        const { amount, reason } = req.body;
        const result = await debtService.createDebt(amount, reason);
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post('/debt/:id/pay', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount } = req.body;
        const result = await debtService.payOffDebt(id, amount);
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/debt/active', async (req, res) => {
    try {
        const result = await debtService.getActiveDebts();
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/debt/total', async (req, res) => {
    try {
        const result = await debtService.getTotalDebtAmount();
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// WORKOUT ROUTES
app.post('/workout/log', async (req, res) => {
    try {
        const { type, duration, source, calories } = req.body;
        const result = await workoutService.logWorkout(type, duration, source, calories);
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/workout/today', async (req, res) => {
    try {
        const result = await workoutService.getWorkoutsForToday();
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/workout/week', async (req, res) => {
    try {
        const { weekStart } = req.query;
        const result = await workoutService.getWorkoutsForWeek(weekStart);
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/workout/earnings', async (req, res) => {
    try {
        const { weekStart } = req.query;
        const result = await workoutService.calculateWeeklyEarnings(weekStart);
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/workout/baseline', async (req, res) => {
    try {
        const { weekStart } = req.query;
        const result = await workoutService.checkBaselineCompliance(weekStart);
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// BONUS ROUTES
app.post('/bonus/add', async (req, res) => {
    try {
        const { type, amount, weekOf, description } = req.body;
        const result = await bonusService.addWeeklyBonus(type, amount, weekOf, description);
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post('/bonus/:id/pay', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await bonusService.markBonusPaid(id);
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/bonus/pending', async (req, res) => {
    try {
        const { weekOf } = req.query;
        const result = await bonusService.getPendingBonuses(weekOf);
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// BALANCE ROUTES
app.post('/balance/update', async (req, res) => {
    try {
        const { accountA, accountB, checking, availableTransfer } = req.body;
        const result = await balanceService.updateBalances(accountA, accountB, checking, availableTransfer);
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/balance/latest', async (req, res) => {
    try {
        const result = await balanceService.getLatestBalances();
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/balance/transfers', async (req, res) => {
    try {
        const { workoutEarnings = 0, bonusEarnings = 0, uberEarnings = 0 } = req.query;
        const result = await balanceService.calculateAvailableTransfers(
            parseFloat(workoutEarnings),
            parseFloat(bonusEarnings),
            parseFloat(uberEarnings)
        );
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// RECONCILIATION ROUTES
app.post('/reconciliation/run', async (req, res) => {
    try {
        const result = await reconciliationService.runNightlyReconciliation();
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post('/reconciliation/uber-earnings', async (req, res) => {
    try {
        const { amount } = req.body;
        const result = await reconciliationService.processUberEarnings(amount);
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// QUICK ACTION ROUTES (for Discord bot integration)
app.post('/quick/perfect-week-bonus', async (req, res) => {
    try {
        const { weekOf } = req.body;
        const result = await bonusService.addPerfectWeekBonus(weekOf);
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post('/quick/good-boy-bonus', async (req, res) => {
    try {
        const { amount, reason } = req.body;
        const result = await bonusService.addGoodBoyBonus(amount, reason);
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post('/quick/missed-checkin', async (req, res) => {
    try {
        const result = await cardioService.assignCardio('treadmill', 20, 'Missed check-in');
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Scheduled Tasks
// Run nightly reconciliation at 11:59 PM
cron.schedule('59 23 * * *', async () => {
    console.log('🕚 Running scheduled nightly reconciliation...');
    try {
        const result = await reconciliationService.runNightlyReconciliation();
        console.log('✅ Scheduled reconciliation completed');
        
        // Here you could send the summary to Discord webhook
        // await sendToDiscord(result.summary);
        
    } catch (error) {
        console.error('❌ Scheduled reconciliation failed:', error);
    }
});

// Apply interest to debts every day at 12:01 AM
cron.schedule('1 0 * * *', async () => {
    console.log('📈 Applying daily interest to debts...');
    try {
        await debtService.applyDailyInterest();
        console.log('✅ Daily interest applied');
    } catch (error) {
        console.error('❌ Daily interest application failed:', error);
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Accountability Coach API running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
    
    // Validate environment setup
    console.log('🔍 Checking configuration...');
    try {
        new ReconciliationService();
        console.log('✅ All services initialized successfully');
    } catch (error) {
        console.error('❌ Configuration error:', error.message);
        console.error('Please check your .env file and database IDs');
    }
});

module.exports = app;