require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({
    auth: process.env.NOTION_API_KEY,
});

async function debugNotionDatabases() {
    console.log('🔍 Debugging Notion database structure...\n');

    const databases = {
        cardio: process.env.NOTION_CARDIO_DB_ID,
        debt: process.env.NOTION_DEBT_DB_ID,
        balances: process.env.NOTION_BALANCES_DB_ID,
        bonuses: process.env.NOTION_BONUSES_DB_ID,
        workouts: process.env.NOTION_WORKOUTS_DB_ID
    };

    for (const [name, databaseId] of Object.entries(databases)) {
        if (!databaseId) {
            console.log(`❌ ${name.toUpperCase()}: No database ID configured`);
            continue;
        }

        try {
            console.log(`🔎 Checking ${name.toUpperCase()} database...`);
            
            // Get database schema
            const database = await notion.databases.retrieve({
                database_id: databaseId
            });

            console.log(`✅ Database found: ${database.title[0]?.text?.content || 'Untitled'}`);
            console.log('📋 Properties:');
            
            Object.entries(database.properties).forEach(([propName, propConfig]) => {
                console.log(`   • ${propName} (${propConfig.type})`);
                
                // For select properties, show options
                if (propConfig.type === 'select' && propConfig.select?.options) {
                    const options = propConfig.select.options.map(opt => opt.name).join(', ');
                    console.log(`     Options: ${options}`);
                }
            });

            // Try to get a few entries to see the actual data
            console.log('\n📄 Sample entries:');
            const query = await notion.databases.query({
                database_id: databaseId,
                page_size: 3
            });

            if (query.results.length === 0) {
                console.log('   (No entries found)');
            } else {
                query.results.forEach((page, index) => {
                    const title = page.properties.Name?.title?.[0]?.text?.content || 
                                 page.properties.Title?.title?.[0]?.text?.content || 
                                 'Untitled';
                    console.log(`   ${index + 1}. ${title}`);
                });
            }

            console.log('\n' + '─'.repeat(50) + '\n');

        } catch (error) {
            console.log(`❌ Error accessing ${name} database:`, error.message);
            console.log('');
        }
    }
}

async function createTestEntries() {
    console.log('🧪 Creating test entries...\n');

    try {
        // Test cardio entry
        if (process.env.NOTION_CARDIO_DB_ID) {
            console.log('Creating test cardio assignment...');
            const cardioResult = await notion.pages.create({
                parent: { database_id: process.env.NOTION_CARDIO_DB_ID },
                properties: {
                    Name: {
                        title: [{ text: { content: 'Test 30min Treadmill - Missed Workout' } }]
                    },
                    'Date Assigned': {
                        date: { start: '2025-01-04' }
                    },
                    Type: {
                        select: { name: 'treadmill' }
                    },
                    'Minutes Required': {
                        number: 30
                    },
                    Status: {
                        select: { name: 'pending' }
                    }
                }
            });
            console.log(`✅ Cardio entry created: ${cardioResult.id}`);
        }

        // Test workout entry (using actual property names)
        if (process.env.NOTION_WORKOUTS_DB_ID) {
            console.log('Creating test workout...');
            const workoutResult = await notion.pages.create({
                parent: { database_id: process.env.NOTION_WORKOUTS_DB_ID },
                properties: {
                    Name: {
                        title: [{ text: { content: 'Morning Yoga Session' } }]
                    },
                    Date: {
                        date: { start: '2025-01-04' }
                    },
                    'Workout Type': {
                        select: { name: 'Yoga' }
                    },
                    Duration: {
                        number: 60
                    },
                    Calories: {
                        number: 250
                    },
                    Source: {
                        select: { name: 'manual' }
                    }
                }
            });
            console.log(`✅ Workout entry created: ${workoutResult.id}`);
        }

        // Test debt entry (note the extra space in "Date Assigned ")
        if (process.env.NOTION_DEBT_DB_ID) {
            console.log('Creating test debt...');
            const debtResult = await notion.pages.create({
                parent: { database_id: process.env.NOTION_DEBT_DB_ID },
                properties: {
                    Name: {
                        title: [{ text: { content: '$50.00 - Unauthorized Spending' } }]
                    },
                    'Date Assigned ': { // Note the extra space!
                        date: { start: '2025-01-04' }
                    },
                    'Original Amount': {
                        number: 50
                    },
                    'Current Amount': {
                        number: 50
                    },
                    'Interest Rate': {
                        number: 0.30
                    },
                    Status: {
                        select: { name: 'active' }
                    }
                }
            });
            console.log(`✅ Debt entry created: ${debtResult.id}`);
        }

        // Test bonus entry
        if (process.env.NOTION_BONUSES_DB_ID) {
            console.log('Creating test bonus...');
            const bonusResult = await notion.pages.create({
                parent: { database_id: process.env.NOTION_BONUSES_DB_ID },
                properties: {
                    Name: {
                        title: [{ text: { content: 'Perfect Week - $50.00 (Week of 2024-12-30)' } }]
                    },
                    'Week Of': {
                        date: { start: '2024-12-30' }
                    },
                    'Bonus Type': {
                        select: { name: 'Perfect Week' }
                    },
                    'Amount Earned': {
                        number: 50
                    },
                    Status: {
                        select: { name: 'pending' }
                    }
                }
            });
            console.log(`✅ Bonus entry created: ${bonusResult.id}`);
        }

        // Test balance entry
        if (process.env.NOTION_BALANCES_DB_ID) {
            console.log('Creating test balance...');
            const balanceResult = await notion.pages.create({
                parent: { database_id: process.env.NOTION_BALANCES_DB_ID },
                properties: {
                    Name: {
                        title: [{ text: { content: 'Balances 2025-01-04' } }]
                    },
                    Date: {
                        date: { start: '2025-01-04' }
                    },
                    'Account A Balance': {
                        number: 600
                    },
                    'Account B Balance': {
                        number: 150
                    },
                    'Checking Balance': {
                        number: 250
                    }
                }
            });
            console.log(`✅ Balance entry created: ${balanceResult.id}`);
        }

        console.log('\n✅ Test entries created successfully!');

    } catch (error) {
        console.error('❌ Error creating test entries:', error.message);
        
        // If it's a property error, show more details
        if (error.body?.message) {
            console.error('Detailed error:', error.body.message);
        }
        if (error.body?.details) {
            console.error('Error details:', JSON.stringify(error.body.details, null, 2));
        }
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--create-test-data')) {
        await createTestEntries();
    } else {
        await debugNotionDatabases();
        
        console.log('\n💡 To create test entries, run:');
        console.log('node src/debug/check-notion.js --create-test-data');
    }
}

main().catch(console.error);