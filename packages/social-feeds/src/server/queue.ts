import { Queue } from 'bullmq';

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

let queue: Queue;

export const getWorkflowQueue = () => {
    if (!queue) {
        queue = new Queue('workflow-execution', {
            connection,
        });
    }
    return queue;
};
