const { Client } = require('@notionhq/client');
require('dotenv').config();

class NotionClient {
    constructor() {
        if (!process.env.NOTION_API_KEY) {
            throw new Error('NOTION_API_KEY environment variable is required');
        }

        this.client = new Client({
            auth: process.env.NOTION_API_KEY,
        });

        this.databases = {
            cardio: process.env.NOTION_CARDIO_DB_ID,
            debt: process.env.NOTION_DEBT_DB_ID,
            balances: process.env.NOTION_BALANCES_DB_ID,
            bonuses: process.env.NOTION_BONUSES_DB_ID,
            workouts: process.env.NOTION_WORKOUTS_DB_ID
        };

        this.validateDatabaseIds();
    }

    validateDatabaseIds() {
        const missingDbs = Object.entries(this.databases)
            .filter(([key, value]) => !value)
            .map(([key]) => key);

        if (missingDbs.length > 0) {
            throw new Error(`Missing database IDs for: ${missingDbs.join(', ')}`);
        }
    }

    // Generic database operations
    async createPage(databaseId, properties, title = null) {
        const pageData = {
            parent: { database_id: databaseId },
            properties: {
                ...properties
            }
        };

        // Add title to Name property if provided
        if (title) {
            pageData.properties.Name = {
                title: [
                    {
                        text: {
                            content: title
                        }
                    }
                ]
            };
        }

        return await this.client.pages.create(pageData);
    }

    async updatePage(pageId, properties) {
        return await this.client.pages.update({
            page_id: pageId,
            properties
        });
    }

    async queryDatabase(databaseId, filter = null, sorts = null) {
        const query = { database_id: databaseId };
        
        if (filter) query.filter = filter;
        if (sorts) query.sorts = sorts;

        return await this.client.databases.query(query);
    }

    async retrievePage(pageId) {
        return await this.client.pages.retrieve({ page_id: pageId });
    }

    // Utility methods
    getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    }

    getStartOfWeek() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        return startOfWeek.toISOString().split('T')[0];
    }

    formatCurrency(amount) {
        return `$${amount.toFixed(2)}`;
    }
}

module.exports = NotionClient;