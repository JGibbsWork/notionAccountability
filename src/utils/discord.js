const fetch = require('node-fetch');

class DiscordBot {
    constructor(webhookUrl = null) {
        this.webhookUrl = webhookUrl || process.env.DISCORD_WEBHOOK_URL;
        
        if (!this.webhookUrl) {
            console.warn('⚠️  No Discord webhook URL configured');
        }
    }

    async sendMessage(content, channel = 'general') {
        if (!this.webhookUrl) {
            console.log('💭 Discord message (not sent):', content);
            return;
        }

        try {
            const payload = {
                content: content,
                username: 'Accountability Coach',
                avatar_url: 'https://cdn.discordapp.com/emojis/💪.png' // Optional
            };

            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}`);
            }

            console.log('📨 Message sent to Discord');
            return true;

        } catch (error) {
            console.error('❌ Failed to send Discord message:', error.message);
            return false;
        }
    }

    // Specific message types based on your system design

    async sendPunishment(type, amount, reason) {
        const message = `**PUNISHMENT ASSIGNED** ⚠️\n${type}: ${amount}\nReason: ${reason}`;
        return await this.sendMessage(message, 'punishments');
    }

    async sendDebtAssignment(amount, reason) {
        const message = `**DEBT ASSIGNED** 💸\nAmount: $${amount.toFixed(2)}\nReason: ${reason}\nInterest begins tomorrow.`;
        return await this.sendMessage(message, 'punishments');
    }

    async sendCardioAssignment(type, minutes, reason) {
        const message = `**CARDIO PUNISHMENT** 🏃\n${minutes} minutes ${type}\nReason: ${reason}\nDue by end of week.`;
        return await this.sendMessage(message, 'punishments');
    }

    async sendNightlyReconciliation(summary) {
        const message = `\`\`\`\n${summary}\n\`\`\``;
        return await this.sendMessage(message, 'reviews');
    }

    async sendGoodBoyBonus(amount, reason) {
        const condescendingMessages = [
            `Here's your $${amount}, don't spend it all in one place 💸`,
            `Look who finally earned something! $${amount} for ${reason} 🎉`,
            `Such a good boy! Here's $${amount} - try not to mess it up 😏`,
            `Amazing work! $${amount} earned. Keep this up and you might actually succeed 💪`,
            `Wow, actual effort! $${amount} bonus for ${reason}. Color me impressed 🌟`
        ];
        
        const message = condescendingMessages[Math.floor(Math.random() * condescendingMessages.length)];
        return await this.sendMessage(message, 'reviews');
    }

    async sendDebtEscalation(currentDebt, daysSinceAssigned) {
        const escalationMessages = [
            `Your debt is now $${currentDebt.toFixed(2)} and growing. Stop being lazy and get on that scooter. 🛵`,
            `Day ${daysSinceAssigned} of ignoring your $${currentDebt.toFixed(2)} debt. The interest keeps piling up while you procrastinate. 📈`,
            `$${currentDebt.toFixed(2)} in debt and counting. You can either work it off or watch it grow. Your choice. 💸`,
            `That $${currentDebt.toFixed(2)} debt isn't going to pay itself. Time to stop making excuses. 🚫`
        ];

        const message = escalationMessages[Math.floor(Math.random() * escalationMessages.length)];
        return await this.sendMessage(message, 'punishments');
    }

    async sendWorkoutEarning(type, amount) {
        const messages = [
            `💪 ${type} completed - $${amount} earned`,
            `Look who actually showed up to the gym! $${amount} for ${type}`,
            `${type} done. Here's your $${amount} - don't get too excited`,
            `About time! $${amount} earned for ${type}`
        ];

        const message = messages[Math.floor(Math.random() * messages.length)];
        return await this.sendMessage(message, 'reviews');
    }

    async sendChoicePresentation(debtAmount, options) {
        const message = [
            `**DEBT PAYMENT OPTIONS** 💰`,
            `Current debt: $${debtAmount.toFixed(2)}`,
            ``,
            `Choose your path:`,
            `• Sweat it off: 2 hours cardio = $50 forgiveness`,
            `• Work it off: Uber delivery (keep nothing earned)`,
            `• Let it grow: 30% daily interest compounds`,
            ``,
            `What's it gonna be? 🤔`
        ].join('\n');

        return await this.sendMessage(message, 'begging');
    }

    async sendWeeklyReview(workoutStats, financialSummary, nextWeekGoals) {
        const message = [
            `**WEEKLY REVIEW** 📊`,
            ``,
            `**Fitness Performance:**`,
            `• Workouts completed: ${workoutStats.completed}/${workoutStats.planned}`,
            `• Baseline compliance: ${workoutStats.baselineCompliant ? '✅' : '❌'}`,
            `• Punishment cardio: ${workoutStats.punishmentCardio}`,
            ``,
            `**Financial Summary:**`,
            `• Earnings: $${financialSummary.earnings.toFixed(2)}`,
            `• Debt: $${financialSummary.debt.toFixed(2)}`,
            `• Net position: $${(financialSummary.earnings - financialSummary.debt).toFixed(2)}`,
            ``,
            `**Next Week's Expectations:**`,
            nextWeekGoals.map(goal => `• ${goal}`).join('\n'),
            ``,
            `Time to step up or step aside. 💪`
        ].join('\n');

        return await this.sendMessage(message, 'reviews');
    }

    // Helper method to send code-formatted messages
    async sendCode(content) {
        return await this.sendMessage(`\`\`\`\n${content}\n\`\`\``);
    }

    // Helper method to send embedded-style messages  
    async sendEmbed(title, description, fields = []) {
        let message = `**${title}**\n${description}\n`;
        
        if (fields.length > 0) {
            message += '\n';
            fields.forEach(field => {
                message += `**${field.name}:** ${field.value}\n`;
            });
        }

        return await this.sendMessage(message);
    }

    // Test the webhook connection
    async testConnection() {
        const testMessage = `🔧 **Test Message**\nAccountability Coach system is online!\nTimestamp: ${new Date().toISOString()}`;
        
        try {
            await this.sendMessage(testMessage);
            console.log('✅ Discord webhook test successful');
            return true;
        } catch (error) {
            console.error('❌ Discord webhook test failed:', error.message);
            return false;
        }
    }
}

module.exports = DiscordBot;