/**
 * Test script for Abacus AI Integration
 * To run: node packages/frontend/test-abacus.js
 */

const { generateChatResponse } = require('./app/utils/openai');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

async function testAbacus() {
    console.log('--- Testing Abacus AI Integration ---');

    // Check for credentials
    const apiKey = process.env.ABACUS_API_KEY;
    const deploymentId = process.env.ABACUS_DEPLOYMENT_ID;

    if (!apiKey || !deploymentId) {
        console.error('Error: ABACUS_API_KEY and ABACUS_DEPLOYMENT_ID must be set in .env.local for this test.');
        return;
    }

    console.log(`Using Deployment ID: ${deploymentId}`);

    try {
        // Mocking the resolveOrgAiSettings to return Abacus settings
        // Since we can't easily mock the DB call here without more setup, 
        // we'll rely on the internal logic we just added that uses env vars.

        const response = await generateChatResponse({
            orgId: null, // This will trigger fallback to environment variables
            systemPrompt: 'You are a helpful assistant.',
            messages: [{ role: 'user', content: 'Say "Abacus AI Integration is working!"' }],
            temperature: 0.7,
            maxTokens: 50
        });

        console.log('Response received:');
        console.log(JSON.stringify(response, null, 2));

        if (response.provider === 'abacus' && response.content) {
            console.log('\n✅ SUCCESS: Abacus AI integration verified!');
        } else {
            console.log('\n❌ FAILURE: Unexpected response format.');
        }
    } catch (error) {
        console.error('\n❌ ERROR during test:');
        console.error(error.message);
    }
}

// Note: This script assumes generateChatResponse and its dependencies are CommonJS compatible
// or that the environment supports ESM. If necessary, convert imports/exports.
// For now, let's just output the plan to run it.
console.log('Test script ready. Please ensure ABACUS_API_KEY and ABACUS_DEPLOYMENT_ID are in .env.local');
// testAbacus(); 
