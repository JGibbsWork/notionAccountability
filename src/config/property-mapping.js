// Property mapping to handle differences between code expectations and actual Notion properties

const PROPERTY_MAPPINGS = {
    cardio: {
        'Date Assigned': 'Date Assigned',
        'Type': 'Type',
        'Minutes Required': 'Minutes Required', 
        'Date Completed': 'Date Completed',
        'Status': 'Status',
        'Name': 'Name'
    },
    debt: {
        'Date Assigned': 'Date Assigned ', // Note the extra space in your database!
        'Original Amount': 'Original Amount',
        'Current Amount': 'Current Amount',
        'Interest Rate': 'Interest Rate',
        'Status': 'Status',
        'Name': 'Name'
    },
    workouts: {
        'Date': 'Date',
        'Workout Type': 'Workout Type',
        'Duration/Calories': 'Duration', // Your DB has separate Duration and Calories
        'Calories': 'Calories',
        'Source': 'Source',
        'Name': 'Name'
    },
    bonuses: {
        'Week Of': 'Week Of',
        'Bonus Type': 'Bonus Type',
        'Amount Earned': 'Amount Earned',
        'Status': 'Status',
        'Name': 'Name'
    },
    balances: {
        'Date': 'Date',
        'Account A Balance': 'Account A Balance',
        'Account B Balance': 'Account B Balance', 
        'Checking Balance': 'Checking Balance',
        'Available Transfer Amount': null, // Missing from your DB
        'Name': 'Name'
    }
};

// Select option mappings
const SELECT_MAPPINGS = {
    cardio: {
        types: ['bike', 'treadmill', 'run', 'stairstepper'],
        statuses: ['pending', 'completed', 'missed']
    },
    debt: {
        statuses: ['active', 'paid']
    },
    workouts: {
        types: ['Yoga', 'Lifting', 'Cardio'], // Your DB uses different names
        sources: ['watch', 'manual'] // Your DB uses different names
    },
    bonuses: {
        types: ['Perfect Week', 'Job Applications', 'AlgoExpert', 'Reading', 'Dating', 'Lifting', 'Yoga', 'Good Boy'],
        statuses: ['paid', 'pending']
    }
};

module.exports = {
    PROPERTY_MAPPINGS,
    SELECT_MAPPINGS
};