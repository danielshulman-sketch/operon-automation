import { Worker } from 'bullmq';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

console.log('Starting worker with connection:', connection);

import { prisma } from './lib/prisma';
import { sendWorkflowFailureEmail } from './lib/email';
import { postToSocialMedia } from './lib/social';

const worker = new Worker('workflow-execution', async (job) => {
    console.log(`Processing job ${job.id} of type ${job.name}`);
    const { nodeType, nodeData, input, userId, executionId, workflowId } = job.data;

    try {
        // Handle Social Publishing Nodes
        if (['facebook-publisher', 'linkedin-publisher', 'instagram-publisher'].includes(nodeType)) {
            console.log(`Executing Publisher Node: ${nodeType}`);

            const accountId = nodeData.accountId;
            if (!accountId) throw new Error("No account selected for publisher node.");

            // Fetch credentials
            const connection = await prisma.externalConnection.findUnique({
                where: { id: accountId }
            });

            if (!connection) throw new Error(`Connection not found for account ID: ${accountId}`);

            const creds = JSON.parse(connection.credentials);
            const content = input?.content || nodeData.testContent || "Test Post from Social Feeds";
            const imageUrl = input?.imageUrl || nodeData.testImageUrl; // Or from previous step output

            const result: any = await postToSocialMedia({
                platform: connection.provider,
                accessToken: creds.accessToken,
                content: content,
                imageUrl: imageUrl,
                pageId: connection.provider === 'facebook' ? creds.username : undefined // We stored page ID as username
            });

            console.log("Post successful:", result);

            // Record success
            await prisma.publishResult.create({
                data: {
                    workflowId,
                    executionId,
                    platform: connection.provider,
                    postId: result.id,
                    postUrl: result.url || undefined,
                    status: 'success'
                }
            });

            return { status: 'success', result };
        }

        // Simulation for other nodes
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Determine if we should fail (for testing purposes, fail if data.fail is true)
        if (job.data.fail) {
            throw new Error("Simulated Workflow Failure");
        }

        console.log(`Job ${job.id} logic executed.`);
        return { status: 'success', result: 'Job processed successfully' };

    } catch (error: any) {
        console.error(`Job failed: ${error.message}`);

        if (['facebook-publisher', 'linkedin-publisher', 'instagram-publisher'].includes(nodeType)) {
            await prisma.publishResult.create({
                data: {
                    workflowId,
                    executionId,
                    platform: nodeType.split('-')[0],
                    status: 'failed',
                    error: error.message
                }
            });
        }

        throw error; // Re-throw to trigger BullMQ failure handling
    }
}, {
    connection,
});

worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed!`);
});

worker.on('failed', async (job, err) => {
    console.error(`Job ${job?.id} failed with ${err.message}`);

    if (job && job.data && job.data.userId && job.data.workflowName) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: job.data.userId }
            });

            if (user && user.email) {
                console.log(`Sending failure email to ${user.email}`);
                await sendWorkflowFailureEmail(user.email, job.data.workflowName, err.message);
            }
        } catch (emailErr) {
            console.error("Failed to send failure email:", emailErr);
        }
    }
});

console.log('Worker is running and listening for jobs...');
