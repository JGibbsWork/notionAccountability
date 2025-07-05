#!/usr/bin/env node

require('dotenv').config();
const ReconciliationService = require('../services/reconciliation');

async function runNightlyReconciliation() {
    console.log('🌙 Manual nightly reconciliation started...');
    console.log(`📅 ${new Date().toLocaleString()}`);
    console.log('');

    try {
        const reconciliationService = new ReconciliationService();
        const result = await reconciliationService.runNightlyReconciliation();
        
        console.log('');
        console.log('📋 RECONCILIATION SUMMARY:');
        console.log('═'.repeat(50));
        console.log(result.summary);
        console.log('═'.repeat(50));
        console.log('');
        
        // If there's a Discord webhook configured, send the summary
        if (process.env.DISCORD_WEBHOOK_URL) {
            await sendToDiscord(result.summary);
            console.log('📨 Summary sent to Discord');
        }
        
        console.log('✅ Manual reconciliation completed successfully');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Reconciliation failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

async function sendToDiscord(summary) {
    if (!process.env.DISCORD_WEBHOOK_URL) {
        console.log('⚠️  No Discord webhook configured');
        return;
    }

    try {
        const fetch = require('node-fetch');
        
        const payload = {
            content: `\`\`\`\n${summary}\n\`\`\``
        };

        const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Discord webhook failed: ${response.status}`);
        }

    } catch (error) {
        console.error('❌ Failed to send to Discord:', error.message);
    }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Accountability Coach - Nightly Reconciliation

Usage: node src/scripts/nightly-reconciliation.js [options]

Options:
  --help, -h     Show this help message
  --dry-run      Show what would be done without making changes
  --verbose      Show detailed output

Examples:
  node src/scripts/nightly-reconciliation.js
  npm run reconcile
    `);
    process.exit(0);
}

if (args.includes('--dry-run')) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
    // TODO: Implement dry run mode
}

if (args.includes('--verbose')) {
    console.log('🔊 Verbose mode enabled');
    // TODO: Add more detailed logging
}

// Run the reconciliation
runNightlyReconciliation();