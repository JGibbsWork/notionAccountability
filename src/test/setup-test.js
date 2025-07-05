require('dotenv').config();
const CardioService = require('../services/cardio');
const DebtService = require('../services/debt');
const WorkoutService = require('../services/workout');
const BonusService = require('../services/bonus');
const BalanceService = require('../services/balance');

async function setupTestData() {
    console.log('🧪 Setting up test data for accountability system...');
    
    try {
        const cardioService = new CardioService();
        const debtService = new DebtService();
        const workoutService = new WorkoutService();
        const bonusService = new BonusService();
        const balanceService = new BalanceService();

        console.log('📋 Creating sample cardio assignments...');
        await cardioService.assignCardio('treadmill', 30, 'Test missed workout');
        await cardioService.assignCardio('bike', 20, 'Test late checkin');

        console.log('💸 Creating sample debt...');
        await debtService.createDebt(50, 'Test unauthorized spending');
        await debtService.createDebt(25, 'Test missed cardio');

        console.log('💪 Logging sample workouts...');
        await workoutService.logWorkout('Hot Yoga', 60, 'Apple Watch');
        await workoutService.logWorkout('Fitbod Lifting', 45, 'Manual Entry');
        await workoutService.logWorkout('Hot Yoga', 60, 'Apple Watch');

        console.log('🎉 Adding sample bonuses...');
        await bonusService.addPerfectWeekBonus();
        await bonusService.addJobApplicationBonus();

        console.log('💳 Setting up initial balances...');
        await balanceService.updateBalances(600, 150, 75, 100);

        console.log('✅ Test data setup complete!');
        console.log('');
        console.log('🔗 Test your API endpoints:');
        console.log('GET  http://localhost:3000/dashboard');
        console.log('GET  http://localhost:3000/cardio/pending');
        console.log('GET  http://localhost:3000/debt/active');
        console.log('GET  http://localhost:3000/workout/today');
        console.log('POST http://localhost:3000/reconciliation/run');
        
    } catch (error) {
        console.error('❌ Error setting up test data:', error);
        throw error;
    }
}

// Command line usage
if (require.main === module) {
    setupTestData()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { setupTestData };