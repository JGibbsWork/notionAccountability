const NotionClient = require('../config/notion');

class WorkoutService extends NotionClient {
    constructor() {
        super();
    }

    async logWorkout(type, duration, source = 'Manual Entry', calories = null) {
        try {
            const title = `${type} - ${duration}min${calories ? ` (${calories} cal)` : ''}`;
            
            const properties = {
                'Date': {
                    date: {
                        start: this.getCurrentDate()
                    }
                },
                'Workout Type': {
                    select: {
                        name: type
                    }
                },
                'Duration/Calories': {
                    number: duration
                },
                'Source': {
                    select: {
                        name: source
                    }
                }
            };

            const response = await this.createPage(this.databases.workouts, properties, title);
            
            console.log(`💪 Workout logged: ${type} - ${duration} minutes`);
            return {
                id: response.id,
                type,
                duration,
                source,
                calories,
                message: `${type} workout logged: ${duration} minutes`
            };
        } catch (error) {
            console.error('❌ Error logging workout:', error);
            throw error;
        }
    }

    async getWorkoutsForWeek(weekStart = null) {
        try {
            const startDate = weekStart || this.getStartOfWeek();
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6);
            
            const filter = {
                and: [
                    {
                        property: 'Date',
                        date: {
                            on_or_after: startDate
                        }
                    },
                    {
                        property: 'Date',
                        date: {
                            on_or_before: endDate.toISOString().split('T')[0]
                        }
                    }
                ]
            };

            const sorts = [{
                property: 'Date',
                direction: 'ascending'
            }];

            const response = await this.queryDatabase(this.databases.workouts, filter, sorts);
            
            return response.results.map(page => ({
                id: page.id,
                name: page.properties.Name.title[0]?.text?.content || 'Unnamed',
                type: page.properties['Workout Type'].select?.name,
                duration: page.properties['Duration/Calories'].number,
                source: page.properties.Source.select?.name,
                date: page.properties.Date.date.start
            }));
        } catch (error) {
            console.error('❌ Error getting weekly workouts:', error);
            throw error;
        }
    }

    async getWorkoutsForToday() {
        try {
            const today = this.getCurrentDate();
            
            const filter = {
                property: 'Date',
                date: {
                    equals: today
                }
            };

            const response = await this.queryDatabase(this.databases.workouts, filter);
            
            return response.results.map(page => ({
                id: page.id,
                name: page.properties.Name.title[0]?.text?.content || 'Unnamed',
                type: page.properties['Workout Type'].select?.name,
                duration: page.properties['Duration/Calories'].number,
                source: page.properties.Source.select?.name,
                date: page.properties.Date.date.start
            }));
        } catch (error) {
            console.error('❌ Error getting today\'s workouts:', error);
            throw error;
        }
    }

    async calculateWeeklyEarnings(weekStart = null) {
        try {
            const workouts = await this.getWorkoutsForWeek(weekStart);
            
            const earnings = {
                liftingEarnings: 0,
                extraYogaEarnings: 0,
                totalEarnings: 0,
                workoutCounts: {
                    hotYoga: 0,
                    fitbodLifting: 0,
                    punishmentCardio: 0,
                    other: 0
                }
            };

            let yogaCount = 0;
            let liftingCount = 0;

            workouts.forEach(workout => {
                const type = workout.type;
                
                switch (type) {
                    case 'Hot Yoga':
                        yogaCount++;
                        earnings.workoutCounts.hotYoga++;
                        // Extra yoga beyond 3/week earns $5
                        if (yogaCount > 3) {
                            earnings.extraYogaEarnings += 5;
                        }
                        break;
                    case 'Fitbod Lifting':
                        liftingCount++;
                        earnings.workoutCounts.fitbodLifting++;
                        // Each lifting session earns $10
                        earnings.liftingEarnings += 10;
                        break;
                    case 'Punishment Cardio':
                        earnings.workoutCounts.punishmentCardio++;
                        break;
                    default:
                        earnings.workoutCounts.other++;
                        break;
                }
            });

            earnings.totalEarnings = earnings.liftingEarnings + earnings.extraYogaEarnings;
            
            // Check for perfect week bonus (3 yoga + 3 lifting)
            earnings.perfectWeekBonus = (yogaCount >= 3 && liftingCount >= 3) ? 50 : 0;
            earnings.totalWithBonus = earnings.totalEarnings + earnings.perfectWeekBonus;
            
            return earnings;
        } catch (error) {
            console.error('❌ Error calculating weekly earnings:', error);
            throw error;
        }
    }

    async getWorkoutStats(days = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            const filter = {
                property: 'Date',
                date: {
                    on_or_after: cutoffDate.toISOString().split('T')[0]
                }
            };

            const response = await this.queryDatabase(this.databases.workouts, filter);
            
            const stats = {
                totalWorkouts: response.results.length,
                totalDuration: 0,
                workoutTypes: {},
                averagePerDay: 0,
                sources: {}
            };

            response.results.forEach(page => {
                const type = page.properties['Workout Type'].select?.name || 'Unknown';
                const duration = page.properties['Duration/Calories'].number || 0;
                const source = page.properties.Source.select?.name || 'Unknown';
                
                stats.totalDuration += duration;
                
                stats.workoutTypes[type] = (stats.workoutTypes[type] || 0) + 1;
                stats.sources[source] = (stats.sources[source] || 0) + 1;
            });

            stats.averagePerDay = (stats.totalWorkouts / days).toFixed(1);
            stats.averageDuration = stats.totalWorkouts > 0 
                ? (stats.totalDuration / stats.totalWorkouts).toFixed(1) 
                : 0;

            return stats;
        } catch (error) {
            console.error('❌ Error getting workout stats:', error);
            throw error;
        }
    }

    async checkBaselineCompliance(weekStart = null) {
        try {
            const workouts = await this.getWorkoutsForWeek(weekStart);
            const yogaCount = workouts.filter(w => w.type === 'Hot Yoga').length;
            
            return {
                required: 3,
                completed: yogaCount,
                compliant: yogaCount >= 3,
                remaining: Math.max(0, 3 - yogaCount),
                message: yogaCount >= 3 
                    ? `✅ Baseline met: ${yogaCount}/3 yoga sessions`
                    : `⚠️  Baseline incomplete: ${yogaCount}/3 yoga sessions (${3 - yogaCount} remaining)`
            };
        } catch (error) {
            console.error('❌ Error checking baseline compliance:', error);
            throw error;
        }
    }
}

module.exports = WorkoutService;