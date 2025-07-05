const NotionClient = require('../config/notion');

class CardioService extends NotionClient {
    constructor() {
        super();
    }

    async assignCardio(type, minutes, reason = null) {
        try {
            const title = `${minutes}min ${type}${reason ? ` - ${reason}` : ''}`;
            
            const properties = {
                'Date Assigned': {
                    date: {
                        start: this.getCurrentDate()
                    }
                },
                'Type': {
                    select: {
                        name: type
                    }
                },
                'Minutes Required': {
                    number: minutes
                },
                'Status': {
                    select: {
                        name: 'pending'
                    }
                }
            };

            const response = await this.createPage(this.databases.cardio, properties, title);
            
            console.log(`✅ Cardio punishment assigned: ${minutes} minutes of ${type}`);
            return {
                id: response.id,
                type,
                minutes,
                status: 'pending',
                message: `${minutes} minutes of ${type} assigned${reason ? ` for ${reason}` : ''}`
            };
        } catch (error) {
            console.error('❌ Error assigning cardio:', error);
            throw error;
        }
    }

    async completeCardio(cardioId) {
        try {
            const properties = {
                'Date Completed': {
                    date: {
                        start: this.getCurrentDate()
                    }
                },
                'Status': {
                    select: {
                        name: 'completed'
                    }
                }
            };

            const response = await this.updatePage(cardioId, properties);
            
            console.log('✅ Cardio marked as completed');
            return {
                id: cardioId,
                status: 'completed',
                message: 'Cardio punishment completed'
            };
        } catch (error) {
            console.error('❌ Error completing cardio:', error);
            throw error;
        }
    }

    async getOverdueCardio() {
        try {
            const filter = {
                and: [
                    {
                        property: 'Status',
                        select: {
                            equals: 'pending'
                        }
                    },
                    {
                        property: 'Date Assigned',
                        date: {
                            before: this.getCurrentDate()
                        }
                    }
                ]
            };

            const response = await this.queryDatabase(this.databases.cardio, filter);
            
            return response.results.map(page => ({
                id: page.id,
                name: page.properties.Name.title[0]?.text?.content || 'Unnamed',
                type: page.properties.Type.select?.name,
                minutes: page.properties['Minutes Required'].number,
                dateAssigned: page.properties['Date Assigned'].date.start,
                status: page.properties.Status.select?.name
            }));
        } catch (error) {
            console.error('❌ Error getting overdue cardio:', error);
            throw error;
        }
    }

    async getPendingCardio() {
        try {
            const filter = {
                property: 'Status',
                select: {
                    equals: 'pending'
                }
            };

            const sorts = [{
                property: 'Date Assigned',
                direction: 'ascending'
            }];

            const response = await this.queryDatabase(this.databases.cardio, filter, sorts);
            
            return response.results.map(page => ({
                id: page.id,
                name: page.properties.Name.title[0]?.text?.content || 'Unnamed',
                type: page.properties.Type.select?.name,
                minutes: page.properties['Minutes Required'].number,
                dateAssigned: page.properties['Date Assigned'].date.start,
                status: page.properties.Status.select?.name
            }));
        } catch (error) {
            console.error('❌ Error getting pending cardio:', error);
            throw error;
        }
    }

    async markCardioMissed(cardioId) {
        try {
            const properties = {
                'Status': {
                    select: {
                        name: 'missed'
                    }
                }
            };

            await this.updatePage(cardioId, properties);
            
            console.log(`⚠️  Cardio ${cardioId} marked as missed`);
            return {
                id: cardioId,
                status: 'missed',
                message: 'Cardio punishment marked as missed - debt will be assigned'
            };
        } catch (error) {
            console.error('❌ Error marking cardio as missed:', error);
            throw error;
        }
    }

    // Get cardio statistics
    async getCardioStats(days = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            const filter = {
                property: 'Date Assigned',
                date: {
                    on_or_after: cutoffDate.toISOString().split('T')[0]
                }
            };

            const response = await this.queryDatabase(this.databases.cardio, filter);
            
            const stats = {
                total: response.results.length,
                completed: 0,
                pending: 0,
                missed: 0,
                totalMinutes: 0,
                completedMinutes: 0
            };

            response.results.forEach(page => {
                const status = page.properties.Status.select?.name;
                const minutes = page.properties['Minutes Required'].number || 0;
                
                stats.totalMinutes += minutes;
                
                switch (status) {
                    case 'completed':
                        stats.completed++;
                        stats.completedMinutes += minutes;
                        break;
                    case 'pending':
                        stats.pending++;
                        break;
                    case 'missed':
                        stats.missed++;
                        break;
                }
            });

            stats.completionRate = stats.total > 0 ? (stats.completed / stats.total * 100).toFixed(1) : 0;
            
            return stats;
        } catch (error) {
            console.error('❌ Error getting cardio stats:', error);
            throw error;
        }
    }
}

module.exports = CardioService;